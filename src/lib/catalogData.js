// The AnaLuci catalog lives on Cloudflare. The live catalog.json sits in the
// R2 bucket "analuci-media" next to every cover and audio file, and the admin
// intake tools update it in place through the intake Worker, so new filings
// show up without a redeploy. The copy bundled with the site is a fallback.
// Base44 is no longer the catalog's home; it only remains for accounts,
// memberships and playlists until those move too.
const R2_CATALOG_URL = "https://pub-6e59983935cf4f11b25dd91baef8a586.r2.dev/catalog.json";

let catalogPromise = null;

async function fetchCatalog() {
  try {
    const r = await fetch(R2_CATALOG_URL);
    if (!r.ok) throw new Error("catalog " + r.status);
    return await r.json();
  } catch {
    const r = await fetch("/catalog.json");
    if (!r.ok) throw new Error("catalog " + r.status);
    return r.json();
  }
}

export function loadCatalog() {
  if (!catalogPromise) {
    catalogPromise = fetchCatalog().catch((err) => {
      catalogPromise = null;
      throw err;
    });
  }
  return catalogPromise;
}

// After an intake write the catalog has changed: the next read must refetch.
export function invalidateCatalogCache() {
  catalogPromise = null;
}

export async function getReleases() {
  const catalog = await loadCatalog();
  return catalog.releases || [];
}

export async function getTracks() {
  const catalog = await loadCatalog();
  return catalog.tracks || [];
}
