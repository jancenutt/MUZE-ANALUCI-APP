import { useEffect, useState } from "react";
import { getReleases } from "@/lib/catalogData";

// Clean release URLs: /<artistSlug>/<titleSlug>
// - artistSlug: the artist name as ONE joined word — lowercase, every
//   non-alphanumeric character removed (apostrophes, dots, spaces, all of it).
//   "J'ance Nutt" -> "jancenutt", "Jay.XYE" -> "jayxye".
// - titleSlug: the release title lowercased, apostrophes removed, every other
//   run of symbols collapsed to a single hyphen, spaces as hyphens.
//   "ON GOD'S TIMING" -> "on-gods-timing", "57.26" -> "57-26".
export function artistSlug(name) {
  return String(name ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function titleSlug(title) {
  return String(title ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Builds id<->slug maps for a full release list. Collisions are resolved
// deterministically in catalog order (num, then id): the first release keeps
// the plain slug, the next takes "<slug>-<year>", then "<slug>-<num>", then a
// counter. Link generation and slug resolution both use this map, so they can
// never disagree.
export function buildSlugMap(releases) {
  const sorted = [...(releases || [])].sort(
    (a, b) =>
      (a.num ?? Number.MAX_SAFE_INTEGER) - (b.num ?? Number.MAX_SAFE_INTEGER) ||
      String(a.id).localeCompare(String(b.id))
  );
  const byId = new Map();
  const bySlug = new Map();
  for (const release of sorted) {
    const base = titleSlug(release.title) || "release";
    let slug = base;
    if (bySlug.has(slug)) {
      const year = Number(release.year);
      const yearSlug = Number.isFinite(year) && year > 0 ? `${base}-${Math.trunc(year)}` : null;
      const numSlug = release.num != null ? `${base}-${Math.trunc(release.num)}` : null;
      if (yearSlug && !bySlug.has(yearSlug)) {
        slug = yearSlug;
      } else if (numSlug && !bySlug.has(numSlug)) {
        slug = numSlug;
      } else {
        let n = 2;
        while (bySlug.has(`${base}-${n}`)) n += 1;
        slug = `${base}-${n}`;
      }
    }
    byId.set(release.id, slug);
    bySlug.set(slug, release.id);
  }
  return { byId, bySlug };
}

export function releasePath(release, map) {
  if (!release) return "/archive";
  const slug = map?.byId.get(release.id) || titleSlug(release.title) || "release";
  const artist = artistSlug(release.artist) || "jancenutt";
  return `/${artist}/${slug}`;
}

let slugMapPromise = null;

// Loads the full catalog once and shares the resulting slug map.
export function loadSlugMap() {
  if (!slugMapPromise) {
    slugMapPromise = getReleases()
      .then((releases) => buildSlugMap(releases || []))
      .catch(() => {
        slugMapPromise = null;
        return { byId: new Map(), bySlug: new Map() };
      });
  }
  return slugMapPromise;
}

export function useReleaseSlugMap() {
  const [map, setMap] = useState(null);
  useEffect(() => {
    let alive = true;
    loadSlugMap().then((loaded) => {
      if (alive) setMap(loaded);
    });
    return () => {
      alive = false;
    };
  }, []);
  return map;
}
