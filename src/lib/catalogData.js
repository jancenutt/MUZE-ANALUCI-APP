// The AnaLuci catalog lives on Cloudflare now. The app ships a static
// catalog.json snapshot (built from the full archive), and every cover and
// audio file is served from the Cloudflare R2 bucket "analuci-media".
// Base44 is no longer the catalog's home; it only remains for accounts,
// memberships and playlists until those move too.
let catalogPromise = null;

export function loadCatalog() {
  if (!catalogPromise) {
    catalogPromise = fetch("/catalog.json")
      .then((r) => {
        if (!r.ok) throw new Error("catalog " + r.status);
        return r.json();
      })
      .catch((err) => {
        catalogPromise = null;
        throw err;
      });
  }
  return catalogPromise;
}

export async function getReleases() {
  const catalog = await loadCatalog();
  return catalog.releases || [];
}

export async function getTracks() {
  const catalog = await loadCatalog();
  return catalog.tracks || [];
}
