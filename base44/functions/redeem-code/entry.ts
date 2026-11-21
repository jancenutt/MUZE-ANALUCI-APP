// Redeems an access code for the signed-in customer.
// The code is validated entirely server-side against the admin-only AccessCode records;
// a successful redemption records a zero-amount paid purchase so the existing entitlement
// path (paid Base44Purchase) unlocks the archive for that account.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";

export default async function (req: Request) {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth
      .me()
      .catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) {
      return Response.json({ error: "Sign in to redeem a code" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const termsVersion = typeof body.termsVersion === "string" ? body.termsVersion.trim() : "";
    const raw = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    if (!raw || raw.length > 64) {
      return Response.json({ error: "Enter a valid code" }, { status: 400 });
    }

    const { items } = await base44.asServiceRole.entities.AccessCode.filter(
      { code: raw },
      { limit: 5 }
    );
    const record = items?.[0];
    if (!record || record.active === false) {
      return Response.json({ error: "That code is not valid" }, { status: 400 });
    }

    const uses = Number(record.uses) || 0;
    const maxUses = Number(record.maxUses) || 1;
    if (uses >= maxUses) {
      return Response.json({ error: "That code has already been used" }, { status: 400 });
    }
    if (record.expires_at && new Date(record.expires_at).getTime() < Date.now()) {
      return Response.json({ error: "That code has expired" }, { status: 400 });
    }

    // Full-access (100K / beta) grants unlock everything, so they require the consent log to
    // already hold this account's acceptance of the current Terms (Sections 14 and 21).
    if (record.productId === "lifetime_transfer" || record.productId === "beta_100k") {
      const accepted = termsVersion
        ? await base44.asServiceRole.entities.TermsAcceptance.filter(
            { email: user.email, terms_version: termsVersion },
            { limit: 1 }
          )
        : null;
      if (!accepted?.items?.length) {
        return Response.json(
          {
            error: "Accept the Membership Terms to activate beta access",
            code: "terms_required",
          },
          { status: 400 }
        );
      }
    }

    // Count the redemption before granting, so a single-use code can't be spent twice.
    await base44.asServiceRole.entities.AccessCode.update(record.id, { uses: uses + 1 });

    const productName = record.productName || record.label || "Access pass";
    try {
      await base44.asServiceRole.entities.Base44Purchase.create({
        checkoutSessionId: `code_${record.id}_${user.id}_${Date.now()}`,
        status: "paid",
        appUserId: user.id,
        buyerEmail: user.email,
        productId: record.productId || "access_code",
        productName,
        quantity: 1,
        amount: "0",
        currency: "USD",
        paidAt: new Date().toISOString(),
      });
    } catch (grantErr) {
      // Give the use back so a failed grant doesn't burn the customer's code.
      await base44.asServiceRole.entities.AccessCode.update(record.id, { uses }).catch(() => {});
      throw grantErr;
    }

    return Response.json({ ok: true, productName });
  } catch (error) {
    console.error("redeem-code failed", error);
    return Response.json({ error: "Could not redeem that code" }, { status: 500 });
  }
}