import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// While the app is in beta, every signed-in account streams full-length masters. The archive
// is invite-only at this stage, so no tester can land on a snippet because their grant record
// is missing, still pending, or because a strict browser (Brave, Safari) dropped a request.
// Set to false when the shop opens and only paid plans should stream.
const BETA_OPEN_PLAYBACK = true;

// Membership level per checkout product key. Mirrors src/lib/tiers.js.
// 1 stream · 2 enthusiast · 3 muzikclik · 4 10K · 5 100K (beta holds the 100K feature set)
const LEVELS: Record<string, number> = {
  stream_weekly: 1,
  stream_monthly: 2,
  stream_yearly: 2,
  archive_monthly: 3,
  archive_yearly: 3,
  lifetime: 4,
  lifetime_transfer: 5,
  beta_100k: 5,
};

// Server-side entitlement read: the signed-in member's paid purchases are resolved with the
// service role, so a browser read can never be the thing that silently drops their access.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth
      .me()
      .catch((e: any) => (e?.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // The owner account holds the full set, resolved from the role on the server so it holds
    // in every browser — no client-side check stands between an admin and a full master.
    if (user.role === 'admin') {
      return Response.json({
        level: 5,
        isAdmin: true,
        productId: 'admin',
        productName: 'Owner access',
        paidAt: null,
      });
    }

    const byId = await base44.asServiceRole.entities.Base44Purchase.filter(
      { appUserId: user.id, status: 'paid' },
      { sort: '-created_date', limit: 25 }
    );
    let byEmail: any = { items: [] };
    if (user.email) {
      byEmail = await base44.asServiceRole.entities.Base44Purchase.filter(
        { buyerEmail: user.email, status: 'paid' },
        { sort: '-created_date', limit: 25 }
      );
    }

    const rows = [...(byId.items || []), ...(byEmail.items || [])];
    let best: { level: number; productId: string | null; productName: string | null; paidAt: string | null } | null = null;
    for (const row of rows) {
      const level = LEVELS[row.productId] ?? 1;
      if (!best || level > best.level) {
        best = {
          level,
          productId: row.productId ?? null,
          productName: row.productName ?? null,
          paidAt: row.paidAt ?? row.updated_date ?? null,
        };
      }
    }

    console.log('my-entitlement', { userId: user.id, rows: rows.length, level: best?.level ?? 0, productId: best?.productId ?? null });

    // No membership on file while the beta is open: let the account stream the full masters
    // rather than showing a preview it shouldn't have. Paid drops and rights stay gated.
    if (!best && BETA_OPEN_PLAYBACK) {
      return Response.json({
        level: 1,
        isAdmin: false,
        beta: true,
        productId: null,
        productName: 'Beta access',
        paidAt: null,
      });
    }

    return Response.json({
      level: best?.level ?? 0,
      isAdmin: false,
      productId: best?.productId ?? null,
      productName: best?.productName ?? null,
      paidAt: best?.paidAt ?? null,
    });
  } catch (error: any) {
    console.log('my-entitlement failed', error?.message);
    return Response.json({ error: error?.message ?? 'Could not read entitlement' }, { status: 500 });
  }
}