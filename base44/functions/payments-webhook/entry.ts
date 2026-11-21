// Base44 Payments fulfillment webhook — base44/functions/payments-webhook/entry.ts
//
// Provided by the platform. Do NOT rewrite the plumbing (JWT verification, envelope parsing,
// purchase resolution, idempotency). Only edit the region marked
// `// ===== APP-SPECIFIC =====` to define what "grant access" means for this app.
//
// It receives Wix `ORDER_APPROVED` events (and optional subscription lifecycle events),
// verifies the RS256 JWT, resolves the buyer's pending Purchase by checkout id, and marks
// it paid exactly once. It pairs with `create-checkout`, which MUST persist
// `checkoutSession.id` on the Purchase — Wix has no custom-metadata field, so the checkout
// id correlates the first payment. Renewal orders resolve by the stored subscription contract id.

import { createClientFromRequest } from "npm:@base44/sdk";
import { importSPKI, jwtVerify } from "npm:jose@5.9.6";

// Wix event types (verbatim from Wix docs).
const ORDER_APPROVED = "wix.ecom.v1.order_approved";
const SUBSCRIPTION_CANCELED = "wix.ecom.subscription_contracts.v1.subscription_contract_canceled";
const SUBSCRIPTION_EXPIRED = "wix.ecom.subscription_contracts.v1.subscription_contract_expired";

// Unwrap Wix's triple-nested envelope: the request body is a JWT whose verified
// payload has a `data` JSON string; that parses to an envelope with `eventType` and
// another `data` JSON string; that parses to the event data, which for these events
// wraps the entity in a per-action wrapper (see extractOrder).
function parseWixEnvelope(payload: Record<string, unknown>): { eventType: string; eventData: any } {
  const outer = typeof payload.data === "string" ? JSON.parse(payload.data) : payload.data;
  // eventType lives on the parsed envelope; newer DomainEvent envelopes may also carry it as a
  // top-level JWT claim — fall back to that so the event isn't misrouted to the ignore branch.
  const eventType: string = outer?.eventType ?? (payload.eventType as string) ?? "";
  const eventData = typeof outer?.data === "string" ? JSON.parse(outer.data) : outer?.data;
  return { eventType, eventData };
}

// order_approved is an ACTION event: the order is at `actionEvent.body.order`
// (per the Wix docs' sample payload, where `order.checkoutId === checkoutSession.id`).
// The flat `order` / `entity` forms are fallbacks for the other envelope variants Wix emits.
function extractOrder(eventData: any): any | null {
  return eventData?.actionEvent?.body?.order ?? eventData?.order ?? eventData?.entity ?? null;
}

// The buyer's email, as entered on Wix's hosted checkout page. This is the ONLY identity for an
// anonymous buyer (one who wasn't signed in when create-checkout ran, so appUserId is null). Wix
// exposes it in a few places depending on the flow; check the common ones.
function extractBuyerEmail(order: any): string | null {
  return (
    order?.buyerInfo?.email ??
    order?.billingInfo?.contactDetails?.email ??
    order?.billingInfo?.email ??
    null
  );
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Read per request, never at module scope: the key is stored when the webhook is registered, so
    // a warm isolate that captured it at startup would stay keyless and 500 every ORDER_APPROVED.
    const WEBHOOK_PUBLIC_KEY = Deno.env.get("WIX_CHECKOUT_WEBHOOK_PUBLIC_KEY");
    if (!WEBHOOK_PUBLIC_KEY) {
      // Never process an unverifiable event. Missing key = misconfiguration, not a retry case.
      console.error("payments-webhook: WIX_CHECKOUT_WEBHOOK_PUBLIC_KEY is not set");
      return new Response("Webhook not configured", { status: 500 });
    }

    // The raw body IS the JWT (Wix signs the whole payload, RS256).
    const token = await req.text();

    let payload: Record<string, unknown>;
    try {
      const key = await importSPKI(WEBHOOK_PUBLIC_KEY, "RS256");
      const verified = await jwtVerify(token, key);
      payload = verified.payload as Record<string, unknown>;
    } catch (err) {
      // Signature invalid / malformed. Reject — do NOT grant anything.
      console.error("payments-webhook: JWT verification failed", err);
      return new Response("Invalid signature", { status: 401 });
    }

    const { eventType, eventData } = parseWixEnvelope(payload);
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole; // No end user is authenticated on a webhook call.

    if (eventType === ORDER_APPROVED) {
      return await handleOrderApproved(db, eventData);
    }

    if (eventType === SUBSCRIPTION_CANCELED || eventType === SUBSCRIPTION_EXPIRED) {
      return await handleSubscriptionEnded(db, eventData);
    }

    // Unknown/irrelevant event — acknowledge so Wix stops retrying.
    console.log(`payments-webhook: ignoring event ${eventType}`);
    return new Response("OK", { status: 200 });
  } catch (err) {
    // Unexpected failure: 500 tells Wix to retry later (the handler is idempotent, so a
    // retry after a partial failure is safe).
    console.error("payments-webhook: unhandled error", err);
    return new Response("Internal error", { status: 500 });
  }
});

// Compare provider decimal strings exactly, allowing harmless differences such as 19.9/19.90.
function normalizeAmount(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d+(?:\.\d+)?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  return `${BigInt(whole)}.${fraction.replace(/0+$/, "")}`;
}

function subscriptionInfo(order: any): any {
  return (order?.lineItems ?? []).find((li: any) => li?.subscriptionInfo?.id)?.subscriptionInfo;
}

async function fetchOrder(orderId: string): Promise<any | null> {
  const current = await fetch(`https://www.wixapis.com/ecom/v1/orders/${encodeURIComponent(orderId)}`, {
    headers: {
      "Authorization": Deno.env.get("WIX_CHECKOUT_API_KEY") ?? "",
      "wix-site-id": Deno.env.get("WIX_CHECKOUT_SITE_ID") ?? "",
    },
    signal: AbortSignal.timeout(5000),
  });
  const order = current.ok ? (await current.json()).order : null;
  return order?.id === orderId ? order : null;
}

async function handleOrderApproved(db: any, eventData: any): Promise<Response> {
  let order = extractOrder(eventData);
  const checkoutId: string | undefined = order?.checkoutId;
  const orderId: string | undefined = order?.id;

  const contractId: string | undefined = subscriptionInfo(order)?.id;

  if (!checkoutId && !contractId) {
    // Nothing to correlate on. Acknowledge to stop retries; log for investigation.
    console.error("payments-webhook: ORDER_APPROVED missing checkout and subscription ids", { orderId });
    return new Response("OK", { status: 200 });
  }

  // Resolve the pending purchase created by `create-checkout` (join key: checkoutSessionId).
  const matches = checkoutId
    ? await db.entities.Base44Purchase.filter({ checkoutSessionId: checkoutId })
    : await db.entities.Base44Purchase.filter({ subscriptionId: contractId });
  const purchase = matches?.[0] ?? (checkoutId && contractId
    ? (await db.entities.Base44Purchase.filter({ subscriptionId: contractId }))?.[0]
    : undefined);

  if (!purchase) {
    // The pending Base44Purchase is written by create-checkout before the buyer pays, so a miss
    // here is a transient race (entity not yet visible) — return 500 so Wix retries, rather
    // than ACKing a paid order we can't fulfill. (Wix stops after its retry window.)
    console.warn("payments-webhook: no Base44Purchase for checkoutId yet, asking Wix to retry", { checkoutId, orderId });
    return new Response("Purchase not found yet", { status: 500 });
  }

  // Skip duplicate orders and canceled purchases; a new paid subscription cycle continues below.
  if (purchase.status === "canceled" || (purchase.status === "paid" && (!orderId || orderId === purchase.orderId || !purchase.subscriptionId))) {
    console.log("payments-webhook: purchase already terminal, skipping", { checkoutId, status: purchase.status });
    return new Response("OK", { status: 200 });
  }

  const isRenewal = purchase.status === "paid";
  if (!isRenewal && (!checkoutId || !matches?.length)) {
    return new Response("Initial checkout not confirmed yet", { status: 503 });
  }
  if (isRenewal && (!contractId || contractId !== purchase.subscriptionId)) {
    return new Response("Subscription does not match purchase", { status: 400 });
  }
  const freeTrial = !isRenewal && purchase.freeTrial === true && normalizeAmount(purchase.amount) === "0.";
  // Retried events contain the original snapshot. Refresh it to observe later settlement.
  const trialMissingLink = freeTrial && !(order.lineItems ?? []).some((li: any) => li?.subscriptionInfo?.id);
  if (order.status !== "APPROVED" || (!freeTrial && order.paymentStatus !== "PAID") || trialMissingLink) {
    if (!orderId) return new Response("Payment not confirmed yet", { status: 503 });
    const refreshed = await fetchOrder(orderId);
    if (!refreshed) return new Response("Payment not confirmed yet", { status: 503 });
    if (isRenewal ? subscriptionInfo(refreshed)?.id !== contractId : refreshed.checkoutId !== checkoutId) {
      return new Response("Order does not match purchase", { status: 400 });
    }
    order = refreshed;
    if (order.status !== "APPROVED" || (!freeTrial && order.paymentStatus !== "PAID")) {
      return new Response("Payment not confirmed yet", { status: 503 });
    }
  }
  if (isRenewal && purchase.freeTrial === true && purchase.recurringAmount == null) {
    console.error("payments-webhook: renewal missing recurringAmount", { purchaseId: purchase.id, orderId });
    return new Response("Payment does not match purchase", { status: 400 });
  }
  const paidAmount = normalizeAmount(order.priceSummary?.total?.amount);
  const expectedAmount = normalizeAmount(isRenewal ? (purchase.recurringAmount ?? (purchase.freeTrial ? undefined : purchase.amount)) : purchase.amount);
  if (!paidAmount || !expectedAmount || paidAmount !== expectedAmount || !purchase.currency || order.currency !== purchase.currency) {
    console.error("payments-webhook: payment does not match purchase", { checkoutId, orderId });
    return new Response("Payment does not match purchase", { status: 400 });
  }

  const subscription = subscriptionInfo(order);
  const subscriptionId: string | undefined = subscription?.id;
  const cycleNumber = subscription?.cycleNumber;
  if (isRenewal) {
    if (!Number.isSafeInteger(cycleNumber) || cycleNumber < 0) {
      console.error("payments-webhook: renewal cycle not confirmed", { purchaseId: purchase.id, orderId });
      return new Response("Renewal cycle not confirmed yet", { status: 503 });
    }
    let lastCycleNumber = purchase.lastCycleNumber;
    if (!Number.isSafeInteger(lastCycleNumber)) {
      // Older purchases predate the cycle marker; recover it from the last fulfilled order.
      const previous = purchase.orderId ? await fetchOrder(purchase.orderId) : null;
      const previousSubscription = subscriptionInfo(previous);
      if (previousSubscription?.id !== subscriptionId || !Number.isSafeInteger(previousSubscription?.cycleNumber)) {
        console.error("payments-webhook: previous renewal cycle not confirmed", { purchaseId: purchase.id, orderId });
        return new Response("Previous cycle not confirmed yet", { status: 503 });
      }
      lastCycleNumber = previousSubscription.cycleNumber;
    }
    if (cycleNumber <= lastCycleNumber) return new Response("OK", { status: 200 });
  }

  if (freeTrial) {
    if (!subscriptionId) return new Response("Trial subscription not confirmed yet", { status: 503 });
    const current = await fetch(`https://www.wixapis.com/payments/base44/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
      headers: {
        "Authorization": Deno.env.get("WIX_CHECKOUT_API_KEY") ?? "",
        "wix-site-id": Deno.env.get("WIX_CHECKOUT_SITE_ID") ?? "",
      },
      signal: AbortSignal.timeout(5000),
    });
    const subscription = current.ok ? (await current.json()).subscription : null;
    if (subscription?.id !== subscriptionId || subscription?.status !== "ACTIVE") {
      return new Response("Trial subscription not confirmed yet", { status: 503 });
    }
  }

  // The buyer's email: from create-checkout if they were signed in, otherwise from the Wix order
  // (the only identity an anonymous buyer has). Persisted below and used by the grant block.
  const buyerEmail: string | null = purchase.buyerEmail ?? extractBuyerEmail(order);

  // ===== APP-SPECIFIC =====
  // For renewals, set access through the end of cycleNumber's period without shortening
  // existing access; never add a period per delivery. Older cycles may arrive after newer ones.
  // Per-cycle credits/rewards need a separate ledger; this marker tracks only the latest cycle.
  // This runs BEFORE we mark the purchase paid: if it
  // throws or times out, the initial status or renewal cycle marker stays unchanged, so
  // Wix's retry re-runs the grant.
  //
  // It MUST therefore be idempotent — Wix can also deliver duplicates CONCURRENTLY, so the
  // "pending" check above is NOT a lock: two invocations can both reach this block. Make every
  // effect safe to run twice by keying it on a stable id (purchase.id / checkoutId), never
  // blind-create/blind-send:
  //   - Default: authorize paid access using Base44Purchase.status + appUserId + productId.
  //     Its writes MUST remain admin-only; browser return URLs never prove payment.
  //   - Custom passes/Entitlement rows: create/update/delete MUST be admin-only in their RLS.
  //     Grant only from this verified handler, keyed by purchase.id; never increment on retries.
  //   - Never authorize from custom User.plan / has_paid fields: users can edit their profile.
  //     Never use is_verified either: it is platform-protected and cannot be set here.
  //   - Award purchase.quantity, the validated count charged at checkout.
  //   - Use purchase.appUserId when set. Guest purchases remain bound to buyerEmail until a
  //     server-side claim verifies the signed-in user's email; a typed email is not identity.
  //     Do not create User records here or open entitlement reads to make guest checkout work.
  // AnaLuci.app: access is read straight from this Base44Purchase row (status === "paid", admin-only
  // writes), so the grant IS the paid status set below. Logged for reconciliation.
  console.log("payments-webhook: granting AnaLuci.app access", {
    purchaseId: purchase.id,
    productId: purchase.productId,
    appUserId: purchase.appUserId,
  });
  // ===== END APP-SPECIFIC =====

  // Mark paid LAST, after settlement or a verified free trial AND completion of the grant.
  // Initial status and the renewal cycle marker are committed only after fulfillment.
  // subscriptionId is stored here so SUBSCRIPTION_CANCELED/EXPIRED can resolve this purchase.
  const cycleState = Number.isSafeInteger(cycleNumber) && cycleNumber >= 0 ? { lastCycleNumber: cycleNumber } : {};
  await db.entities.Base44Purchase.update(purchase.id, isRenewal ? {
    orderId,
    ...cycleState,
  } : {
    status: "paid",
    orderId: orderId ?? purchase.orderId ?? null,
    subscriptionId: subscriptionId ?? purchase.subscriptionId ?? null,
    // Persist the buyer email (backfilled from the Wix order for anonymous buyers) so the record
    // always shows who paid, even when create-checkout had no signed-in user.
    buyerEmail: buyerEmail ?? purchase.buyerEmail ?? null,
    paidAt: new Date().toISOString(),
    ...cycleState,
  });

  console.log("payments-webhook: fulfilled purchase", { purchaseId: purchase.id, checkoutId, orderId });
  return new Response("OK", { status: 200 });
}

async function handleSubscriptionEnded(db: any, eventData: any): Promise<Response> {
  // Canceled = ended early; Expired = ran all billing cycles. Both revoke access.
  // Mirrors the order path (actionEvent.body.<entity> first); keep the flat fallbacks since
  // the subscription contract webhook body isn't as tightly documented as order_approved.
  const contract =
    eventData?.actionEvent?.body?.subscriptionContract ??
    eventData?.subscriptionContract ??
    eventData?.entity ??
    null;
  const subscriptionId: string | undefined = contract?.id;

  if (!subscriptionId) {
    console.error("payments-webhook: subscription event missing contract id");
    return new Response("OK", { status: 200 });
  }

  const matches = await db.entities.Base44Purchase.filter({ subscriptionId });
  const purchase = matches?.[0];
  if (!purchase) {
    // The subscriptionId is written on the Purchase by the ORDER_APPROVED handler. If a
    // cancel/expire arrives before (or racing) that approval, no Purchase matches yet —
    // return 500 so Wix retries until the approval has linked it, instead of losing the
    // revoke by acking a not-yet-linkable event.
    console.warn("payments-webhook: no Purchase for subscription yet, asking Wix to retry", { subscriptionId });
    return new Response("Purchase not linkable yet", { status: 500 });
  }

  if (purchase.status === "canceled") {
    return new Response("OK", { status: 200 }); // Idempotent.
  }

  // ===== APP-SPECIFIC =====
  // Revoke whatever access the subscription granted (mirror of the grant). Runs BEFORE we
  // mark the purchase canceled: if it throws, the status stays as-is so Wix's retry re-runs
  // the revoke rather than hitting the "already canceled" short-circuit and leaving access on.
  // Must be idempotent.
  // AnaLuci.app: nothing to revoke separately — access derives from the purchase status set below.
  console.log("payments-webhook: revoking AnaLuci.app access", {
    purchaseId: purchase.id,
    subscriptionId,
  });
  // ===== END APP-SPECIFIC =====

  // Mark canceled LAST, so "canceled" always implies access was actually revoked.
  await db.entities.Base44Purchase.update(purchase.id, {
    status: "canceled",
    canceledAt: new Date().toISOString(),
  });

  console.log("payments-webhook: revoked subscription", { purchaseId: purchase.id, subscriptionId });
  return new Response("OK", { status: 200 });
}