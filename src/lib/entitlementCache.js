// Last access level this device verified for a member. Browsers with strict shields
// (Brave, Safari) can drop the entitlement request entirely — the stored value keeps a
// verified member on the full master instead of falling back to the 30-second snippet.
const CACHE_KEY = "analuci.access.v1";

// With an email, only that member's own verification counts. Without one (the browser
// blocked the session read too), the level this device last verified is the best evidence
// there is — otherwise a shield-blocked member drops to the preview.
export function readCachedAccess(email) {
  const empty = { level: 0, purchase: null };
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return empty;
    const cached = JSON.parse(raw);
    if (!cached) return empty;
    if (email && cached.email && cached.email !== email) return empty;
    return { level: Number(cached.level) || 0, purchase: cached.purchase || null };
  } catch (err) {
    return empty;
  }
}

export function writeCachedAccess(email, level, purchase) {
  if (!email) return;
  try {
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ email, level: Number(level) || 0, purchase: purchase || null })
    );
  } catch (err) {
    // Private mode / storage blocked — access still works, it just isn't remembered.
  }
}