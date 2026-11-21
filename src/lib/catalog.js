import { base44 } from "@/api/base44Client";

export const PAGE_SIZE = 24;
export const TYPES = ["Album", "EP", "Single", "Mixtape", "Film", "Book", "Artwork", "Not shown"];

export async function fetchReleases({ q = "", type = "", artist = "", cursor = null } = {}) {
  const base = {};
  if (type) base.type = type;
  if (artist) base.artist = artist;

  if (!q) {
    return base44.entities.Release.filter(base, {
      sort: "num",
      limit: PAGE_SIZE,
      ...(cursor ? { cursor } : {}),
    });
  }

  // Text hits across release names and track titles, resolved on the server.
  const [byTitle, byTrack] = await Promise.all([
    base44.entities.Release.filter({ ...base, title: { $regex: q, $options: "i" } }, { limit: 100 }),
    base44.entities.Track.filter({ title: { $regex: q, $options: "i" } }, { limit: 200 }),
  ]);
  const ids = [
    ...new Set([
      ...byTitle.items.map((r) => r.id),
      ...byTrack.items.map((t) => t.release_id).filter(Boolean),
    ]),
  ];
  if (!ids.length) return { items: [], has_more: false, next_cursor: null };
  return base44.entities.Release.filter({ ...base, id: { $in: ids } }, { sort: "num", limit: 100 });
}

export async function fetchArtists() {
  const page = await base44.entities.Release.list({ distinct: "artist" });
  const values = page?.items ?? [];
  return values.filter((v) => v && v !== "Not shown").sort();
}

// Song view: the flat track index.
export async function fetchTracks({ q = "", artist = "" } = {}) {
  const query = {};
  if (artist) query.artist = artist;
  if (q) query.title = { $regex: q, $options: "i" };
  const page = await base44.entities.Track.filter(query, { sort: "release_num", limit: 300 });
  return [...page.items].sort(
    (a, b) => (a.release_num ?? 0) - (b.release_num ?? 0) || (a.no ?? 0) - (b.no ?? 0)
  );
}

// Artist view: every alias in the catalog with its release count.
export async function fetchArtistIndex() {
  const page = await base44.entities.Release.filter({}, { sort: "num", limit: 300 });
  const map = new Map();
  page.items.forEach((release) => {
    const key = release.artist || "Unlisted";
    const entry = map.get(key) || { artist: key, releases: [], cover_url: release.cover_url };
    entry.releases.push(release);
    if (!entry.cover_url) entry.cover_url = release.cover_url;
    map.set(key, entry);
  });
  return [...map.values()].sort((a, b) => b.releases.length - a.releases.length);
}