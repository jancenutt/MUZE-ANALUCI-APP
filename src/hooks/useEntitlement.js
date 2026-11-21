import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { BETA_PRODUCT, LEVEL, levelOf } from "@/lib/tiers";
import { readCachedAccess, writeCachedAccess } from "@/lib/entitlementCache";

const ENTITLEMENT_EVENT = "entitlement:changed";

// Called right after access is granted so the player stops serving the preview snippet.
export function refreshEntitlement() {
  window.dispatchEvent(new Event(ENTITLEMENT_EVENT));
}

// Primary path: the server decides, so a browser-side query can never drop paid access.
async function serverAccess() {
  const res = await base44.functions.invoke("my-entitlement", {});
  const data = res?.data || {};
  const level = Number(data.level) || 0;
  return {
    level,
    verified: true,
    purchase:
      level > 0
        ? { productId: data.productId, productName: data.productName, paidAt: data.paidAt }
        : null,
  };
}

// Second path: read the member's own protected purchase record directly. Brave Shields and
// Safari tracking prevention sometimes block the function call, which used to look like
// "no membership" and cut the member down to the preview.
async function clientAccess(me) {
  const page = await base44.entities.Base44Purchase.filter(
    { appUserId: me.id, status: "paid" },
    { sort: "-paidAt", limit: 5 }
  );
  const rows = page?.items || [];
  let best = null;
  rows.forEach((row) => {
    if (!best || levelOf(row) > levelOf(best)) best = row;
  });
  const level = best ? levelOf(best) : LEVEL.none;
  return {
    level,
    // A filtered read that comes back empty can mean "no membership" or "the browser dropped
    // the query" — only a found purchase is proof enough to change what plays.
    verified: level > 0,
    purchase:
      level > 0
        ? { productId: best.productId, productName: best.productName, paidAt: best.paidAt }
        : null,
  };
}

// Access comes from the protected Base44Purchase record the payment webhook marks "paid".
// Owners (admins) always keep the highest level. Each flag is the minimum level it needs:
// drop emails start at Enthusiast, the full-library request at JN Muzik Clik, ownership
// and transfer at the 100K Club.
export default function useEntitlement() {
  const [state, setState] = useState({
    loading: true,
    purchase: null,
    isAdmin: false,
    level: LEVEL.none,
    // Only a server answer that actually reached the browser counts as proof of no
    // membership. Anything else is "unknown", and unknown never restricts playback.
    verified: false,
  });

  const load = useCallback(async () => {
    const me = await base44.auth.me().catch(() => null);
    if (!me) {
      // A blocked session read isn't proof of no membership — Fall back to what this
      // device verified last, so a stricter browser doesn't demote a paying member.
      const remembered = readCachedAccess(null);
      setState({
        loading: false,
        purchase: remembered.purchase,
        isAdmin: false,
        level: remembered.level || LEVEL.stream,
        verified: false,
      });
      return;
    }
    const isAdmin = me.role === "admin";
    if (isAdmin) {
      setState({ loading: false, purchase: null, isAdmin, level: LEVEL.club100k, verified: true });
      return;
    }

    // Show what this device already verified while the fresh check runs.
    const cached = readCachedAccess(me.email);
    if (cached.level > 0) {
      setState({ loading: true, purchase: cached.purchase, isAdmin, level: cached.level });
    }

    let resolved = null;
    try {
      resolved = await serverAccess();
    } catch (err) {
      resolved = await clientAccess(me).catch(() => null);
    }

    if (!resolved) {
      // Both checks were blocked. Keep the last level this device verified, and never let a
      // blocked request stand in for "not a member" — a paying member keeps the full master.
      setState({
        loading: false,
        purchase: cached.purchase,
        isAdmin,
        level: cached.level || LEVEL.stream,
        verified: false,
      });
      return;
    }

    const verified = resolved.verified !== false;
    if (verified || resolved.level > 0) {
      writeCachedAccess(me.email, resolved.level, resolved.purchase);
    }
    setState({
      loading: false,
      purchase: resolved.purchase,
      isAdmin,
      level: resolved.level,
      verified,
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Access can be granted while the app is already open (beta link, access code). Every
  // mounted copy — the player included — re-reads it so the full master plays, not a snippet.
  useEffect(() => {
    const handler = () => {
      load();
    };
    window.addEventListener(ENTITLEMENT_EVENT, handler);
    return () => window.removeEventListener(ENTITLEMENT_EVENT, handler);
  }, [load]);

  // A payment confirmed in another tab can land after this tab loaded — re-read on return.
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") load();
    };
    window.addEventListener("focus", handler);
    document.addEventListener("visibilitychange", handler);
    return () => {
      window.removeEventListener("focus", handler);
      document.removeEventListener("visibilitychange", handler);
    };
  }, [load]);

  const level = state.isAdmin ? LEVEL.club100k : state.level ?? levelOf(state.purchase);

  return {
    loading: state.loading,
    purchase: state.purchase,
    isAdmin: state.isAdmin,
    level,
    // Playback is trimmed to a snippet only when the server positively confirmed that this
    // signed-in member has no membership. Anything unknown plays whole, so a stricter browser
    // can never demote a beta tester or a paying member to a 30-second preview.
    restricted: !state.isAdmin && state.verified === true && level < LEVEL.stream,
    hasAccess: level >= LEVEL.stream,
    hasDrops: level >= LEVEL.enthusiast,
    hasFullLibrary: level >= LEVEL.muzikclik,
    hasVideos: level >= LEVEL.stream,
    hasOwnership: level >= LEVEL.club100k,
    // Beta grants hold the 100K feature set, but email delivery waits until the beta ends.
    isBeta: !state.isAdmin && state.purchase?.productId === BETA_PRODUCT,
    refresh: load,
  };
}