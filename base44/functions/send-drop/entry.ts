// Email-only delivery. Nothing here serves a file: the member's signup address receives a
// secure, time-limited signed link (or one per drop), and every delivery is recorded so it
// can be re-sent from the library page.
import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";

// Membership level per server-owned product key. Mirrors src/lib/tiers.js.
const LEVELS: Record<string, number> = {
  stream_weekly: 1,
  stream_monthly: 2,
  stream_yearly: 2,
  archive_monthly: 3,
  archive_yearly: 3,
  lifetime: 4,
  lifetime_transfer: 5,
  // Beta grant: full 100K access, email delivery withheld during the beta.
  beta_100k: 5,
};

const MAX_ITEMS = 40;
const FULL_LIBRARY_BATCH = 12;

function monthOf(release: any): string {
  if (release?.release_month) return release.release_month;
  if (typeof release?.date === "string" && release.date.length >= 7) return release.date.slice(0, 7);
  if (release?.year) return `${release.year}-01`;
  return "";
}

// Private storage caps a signed link at one hour. That is the delivery window: the member
// opens it from their inbox, or re-sends the drop from the library for a fresh link.
const LINK_SECONDS = 3600;

async function signFile(base44: any, fileUri: string): Promise<string> {
  try {
    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri: fileUri,
      expires_in: LINK_SECONDS,
    });
    return signed_url || "";
  } catch (error: any) {
    console.error("send-drop: sign failed", error?.message);
    return "";
  }
}

async function deliver(base44: any, user: any, release: any, productId: string) {
  const tracks = await base44.asServiceRole.entities.Track.filter(
    { release_id: release.id },
    { sort: "no", limit: MAX_ITEMS }
  );
  const rows = tracks.items ?? [];
  const fileUris = [
    ...(release.drop_uri ? [release.drop_uri] : []),
    ...rows.flatMap((track: any) => [track.audio_uri, track.video_uri].filter(Boolean)),
  ].slice(0, MAX_ITEMS);

  if (!fileUris.length) {
    return { delivered: false, reason: "no-files" as const };
  }

  const deliveryUrl = await signFile(base44, fileUris[0]);
  if (!deliveryUrl) {
    return { delivered: false, reason: "sign-failed" as const };
  }

  const itemTitles = rows.map((track: any) => track.title).filter(Boolean);
  const itemCount = release.drop_uri ? Math.max(itemTitles.length, 1) : fileUris.length;
  const month = monthOf(release);

  await base44.asServiceRole.integrations.Core.SendEmail({
    to: user.email,
    template_name: "DropDelivery",
    category: "transactional",
    variables: {
      first_name: (user.full_name || "").split(" ")[0] || "member",
      drop_title: release.title,
      release_month: release.release_month || month || "this month",
      item_count: String(itemCount),
      item_lines: itemTitles.slice(0, 12).join(" · ") || release.title,
      delivery_url: deliveryUrl,
      expiry_note: "one hour",
    },
  });

  const payload = {
    app_user_id: user.id,
    user_email: user.email,
    release_id: release.id,
    release_title: release.title,
    release_month: month,
    content_type: release.content_type || "audio",
    product_id: productId,
    delivery_kind: "drop",
    delivered_at: new Date().toISOString(),
  };

  const existing = await base44.asServiceRole.entities.LibraryItem.filter(
    { app_user_id: user.id, release_id: release.id },
    { limit: 1 }
  );
  const owned = existing.items?.[0];
  if (owned) {
    await base44.asServiceRole.entities.LibraryItem.update(owned.id, payload);
  } else {
    await base44.asServiceRole.entities.LibraryItem.create(payload);
  }

  return { delivered: true, title: release.title };
}

export default async function (req: Request) {
  try {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) =>
      e.status === 401 ? null : Promise.reject(e)
    );
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const scope =
      body?.scope === "full-library"
        ? "full-library"
        : body?.scope === "transfer"
          ? "transfer"
          : "drop";
    const releaseId = typeof body?.releaseId === "string" ? body.releaseId : "";
    if (scope === "drop" && !releaseId) {
      return Response.json({ error: "releaseId is required" }, { status: 400 });
    }

    const isAdmin = user.role === "admin";

    // Entitlement is read from the protected purchase records only.
    const [byUser, byEmail] = await Promise.all([
      base44.asServiceRole.entities.Base44Purchase.filter(
        { status: "paid", appUserId: user.id },
        { sort: "-created_date", limit: 25 }
      ),
      base44.asServiceRole.entities.Base44Purchase.filter(
        { status: "paid", buyerEmail: user.email },
        { sort: "-created_date", limit: 25 }
      ),
    ]);
    const purchases = [...(byUser.items ?? []), ...(byEmail.items ?? [])];
    let level = 0;
    let productId = "";
    for (const purchase of purchases) {
      const value = LEVELS[purchase.productId] ?? 1;
      if (value > level) {
        level = value;
        productId = purchase.productId;
      }
    }
    if (isAdmin) level = 5;

    // Beta testers hold 100K access without email delivery until the beta ends.
    const betaOnly = productId === "beta_100k";
    const betaNotice = () =>
      Response.json(
        { error: "Email delivery opens once the beta ends — streaming is fully open." },
        { status: 403 }
      );

    if (scope === "transfer") {
      if (level < 5) {
        return Response.json({ error: "Ownership transfer is a 100K Club benefit" }, { status: 403 });
      }
      const users = await base44.asServiceRole.entities.User.list();
      const admins = (users ?? []).filter((row: any) => row.role === "admin" && row.email);
      if (!admins.length) {
        return Response.json({ error: "No admin recipient found" }, { status: 409 });
      }
      await Promise.allSettled(
        admins.map((admin: any) =>
          base44.asServiceRole.integrations.Core.SendEmail({
            to: admin.email,
            subject: "100K Club ownership transfer requested",
            body: `${user.full_name || "A member"} (${user.email}) has requested a transfer of 100K Club ownership. Contact them to complete the transfer of the person, entity, or trust receiving it.`,
            category: "transactional",
          })
        )
      );
      return Response.json({ ok: true, notified: admins.length });
    }

    if (scope === "full-library") {
      if (betaOnly) return betaNotice();
      if (level < 3) {
        return Response.json(
          { error: "The full-library request is a JN Muzik Clik and club benefit" },
          { status: 403 }
        );
      }
      const page = await base44.asServiceRole.entities.Release.filter(
        {},
        { sort: "-year", limit: FULL_LIBRARY_BATCH }
      );
      const releases = page.items ?? [];
      const results = [];
      for (const release of releases) {
        results.push(await deliver(base44, user, release, productId));
      }
      const sent = results.filter((row: any) => row.delivered).length;
      return Response.json({
        ok: true,
        sent,
        skipped: results.length - sent,
        remaining: releases.length === FULL_LIBRARY_BATCH,
      });
    }

    const release = await base44.asServiceRole.entities.Release.get(releaseId).catch((e: any) =>
      e.status === 404 ? null : Promise.reject(e)
    );
    if (!release) return Response.json({ error: "Release not found" }, { status: 404 });

    // A member below Enthusiast may still re-send a drop they already earned.
    let allowed = level >= 2;
    if (!allowed) {
      const owned = await base44.asServiceRole.entities.LibraryItem.filter(
        { app_user_id: user.id, release_id: release.id },
        { limit: 1 }
      );
      allowed = Boolean(owned.items?.length);
    }
    if (!allowed) {
      return Response.json(
        { error: "Drop deliveries start at the Enthusiast Club" },
        { status: 403 }
      );
    }
    if (betaOnly) return betaNotice();

    const result = await deliver(base44, user, release, productId);
    if (!result.delivered) {
      return Response.json(
        { error: "This drop has no files in storage yet, so nothing was sent." },
        { status: 409 }
      );
    }
    return Response.json({ ok: true, sent: 1 });
  } catch (error: any) {
    console.error("send-drop: unhandled error", error?.message);
    return Response.json({ error: "Could not send this drop" }, { status: 500 });
  }
}