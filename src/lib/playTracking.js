import { base44 } from "@/api/base44Client";

// The first artist on the platform — verified. Every play recorded today is
// stamped with his slug so the data is already split per artist when more
// artists are added later (see the Artist / ArtistClaim entities).
export const PRIMARY_ARTIST = {
  name: "J'ance Nutt",
  slug: "jance-nutt",
  status: "verified",
};

// Guard against a double-tap (or a deferred Safari play) counting one press
// as two plays: the same track starting again inside this window is one play.
const DEDUPE_MS = 5000;
const lastRecorded = new Map();

// Fire-and-forget: recording a play must never block or break playback, so
// every failure — offline, entity not live yet, anything — is swallowed.
export function recordTrackPlay(track) {
  if (!track?.id) return;
  const now = Date.now();
  const last = lastRecorded.get(track.id) || 0;
  if (now - last < DEDUPE_MS) return;
  lastRecorded.set(track.id, now);
  try {
    const result = base44.entities.TrackPlay.create({
      track_id: track.id,
      track_title: track.title || "Untitled",
      release_title: track.release_title || "",
      artist_slug: PRIMARY_ARTIST.slug,
      played_at: new Date(now).toISOString(),
    });
    if (result && typeof result.catch === "function") result.catch(() => {});
  } catch (err) {
    // Playback comes first; a lost count is acceptable, a stuck player is not.
  }
}

// Admin-only read (the TrackPlay entity is RLS-locked to the admin role).
// Returns the raw play rows, newest first, capped for sanity.
export async function fetchTrackPlays(limit = 5000) {
  const page = await base44.entities.TrackPlay.filter(
    {},
    { sort: "-played_at", limit }
  );
  return page?.items ?? [];
}

// Roll raw play rows up into a ranked per-song table plus headline totals.
export function summarizePlays(plays) {
  const byTrack = new Map();
  const now = Date.now();
  let last7 = 0;
  let last28 = 0;
  plays.forEach((play) => {
    const key = play.track_id || play.track_title || "unknown";
    const entry =
      byTrack.get(key) ||
      {
        track_id: play.track_id || "",
        track_title: play.track_title || "Untitled",
        release_title: play.release_title || "",
        plays: 0,
        last_played_at: play.played_at || null,
      };
    entry.plays += 1;
    if (play.played_at && (!entry.last_played_at || play.played_at > entry.last_played_at)) {
      entry.last_played_at = play.played_at;
    }
    byTrack.set(key, entry);
    const at = play.played_at ? Date.parse(play.played_at) : NaN;
    if (Number.isFinite(at)) {
      if (now - at <= 7 * 24 * 3600 * 1000) last7 += 1;
      if (now - at <= 28 * 24 * 3600 * 1000) last28 += 1;
    }
  });
  return {
    total: plays.length,
    last7,
    last28,
    songs: [...byTrack.values()].sort((a, b) => b.plays - a.plays),
  };
}
