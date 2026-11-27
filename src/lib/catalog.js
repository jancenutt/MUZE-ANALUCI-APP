import { getReleases, getTracks } from "@/lib/catalogData";

export const PAGE_SIZE = 24;
export const TYPES = ["Album", "EP", "Single", "Mixtape", "Film", "Book", "Artwork", "Not shown"];

function matches(release, { type = "", artist = "" } = {}) {
  if (type && release.type !== type) return false;
  if (artist && release.artist !== artist) return false;
  return true;
}

export async function fetchReleases({ q = "", type = "", artist = "", cursor = null } = {}) {
  const releases = await getReleases();
  let pool;
  if (!q) {
    pool = releases.filter((r) => matches(r, { type, artist }));
  } else {
    const needle = q.toLowerCase();
    const byTitle = releases.filter((r) => (r.title || "").toLowerCase().includes(needle));
    const tracks = await getTracks();
    const hitIds = new Set(
      tracks
        .filter((t) => (t.title || "").toLowerCase().includes(needle))
        .map((t) => t.release_id)
        .filter(Boolean)
    );
    const seen = new Set();
    pool = [...byTitle, ...releases.filter((r) => hitIds.has(r.id))].filter((r) => {
      if (seen.has(r.id) || !matches(r, { type, artist })) return false;
      seen.add(r.id);
      return true;
    });
  }
  pool = [...pool].sort((a, b) => (a.num ?? 0) - (b.num ?? 0));
  if (q) return { items: pool.slice(0, 100), has_more: false, next_cursor: null };
  const offset = cursor ? Number(cursor) || 0 : 0;
  const items = pool.slice(offset, offset + PAGE_SIZE);
  const next = offset + items.length;
  return {
    items,
    has_more: next < pool.length,
    next_cursor: next < pool.length ? String(next) : null,
  };
}

export async function fetchArtists() {
  const releases = await getReleases();
  const values = [...new Set(releases.map((r) => r.artist).filter(Boolean))];
  return values.filter((v) => v !== "Not shown").sort();
}

// Song view: the flat track index.
export async function fetchTracks({ q = "", artist = "" } = {}) {
  const tracks = await getTracks();
  return tracks
    .filter((t) => {
      if (artist && t.artist !== artist) return false;
      if (q && !(t.title || "").toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => (a.release_num ?? 0) - (b.release_num ?? 0) || (a.no ?? 0) - (b.no ?? 0));
}

// Artist view: every alias in the catalog with its release count.
export async function fetchArtistIndex() {
  const releases = await getReleases();
  const map = new Map();
  [...releases]
    .sort((a, b) => (a.num ?? 0) - (b.num ?? 0))
    .forEach((release) => {
      const key = release.artist || "Unlisted";
      const entry = map.get(key) || { artist: key, releases: [], cover_url: release.cover_url };
      entry.releases.push(release);
      if (!entry.cover_url) entry.cover_url = release.cover_url;
      map.set(key, entry);
    });
  return [...map.values()].sort((a, b) => b.releases.length - a.releases.length);
}
