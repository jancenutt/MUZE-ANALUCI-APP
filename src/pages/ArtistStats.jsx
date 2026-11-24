import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MicroLabel from "@/components/MicroLabel";
import { usePageMeta } from "@/lib/seo";
import { fetchTrackPlays, summarizePlays, PRIMARY_ARTIST } from "@/lib/playTracking";
import { STREAMING_STATS } from "@/lib/streamingStats";

const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-US") : "—");

function StatBlock({ label, value, sub }) {
  return (
    <div className="hud-panel rounded-sm p-5">
      <MicroLabel>{label}</MicroLabel>
      <div className="mt-2 font-display text-3xl font-light text-foreground">{value}</div>
      {sub ? <div className="mt-1 text-xs text-foreground/50">{sub}</div> : null}
    </div>
  );
}

export default function ArtistStats() {
  usePageMeta({
    title: "Artist stats | AnaLuci.app",
    description: "Private artist stats — owner login only.",
    path: "/artist",
  });

  const [playsState, setPlaysState] = useState({ loading: true, error: false, summary: null });
  const [artists, setArtists] = useState(null);
  const [claims, setClaims] = useState(null);
  const [directoryError, setDirectoryError] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    fetchTrackPlays()
      .then((plays) => alive && setPlaysState({ loading: false, error: false, summary: summarizePlays(plays) }))
      .catch(() => alive && setPlaysState({ loading: false, error: true, summary: null }));
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const loadDirectory = useCallback(async () => {
    try {
      const [artistPage, claimPage] = await Promise.all([
        base44.entities.Artist.filter({}, { sort: "name", limit: 200 }),
        base44.entities.ArtistClaim.filter({}, { sort: "-created_date", limit: 200 }),
      ]);
      setArtists(artistPage?.items ?? []);
      setClaims(claimPage?.items ?? []);
      setDirectoryError(false);
    } catch (err) {
      setDirectoryError(true);
    }
  }, []);

  useEffect(() => {
    loadDirectory();
  }, [loadDirectory, reloadKey]);

  const seedPrimaryArtist = async () => {
    setBusyId("seed");
    try {
      await base44.entities.Artist.create({ ...PRIMARY_ARTIST });
      setReloadKey((k) => k + 1);
    } catch (err) {
      // Entity may not be live in the backend yet — the section note covers it.
    } finally {
      setBusyId("");
    }
  };

  const decideClaim = async (claim, decision) => {
    setBusyId(claim.id);
    try {
      if (decision === "approved") {
        const slug =
          claim.slug ||
          (claim.artist_name || "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        const exists = (artists || []).some((a) => a.slug === slug);
        if (!exists) {
          await base44.entities.Artist.create({
            name: claim.artist_name,
            slug,
            status: "verified",
          });
        }
      }
      await base44.entities.ArtistClaim.update(claim.id, { status: decision });
      setReloadKey((k) => k + 1);
    } catch (err) {
      // Leave the row untouched on failure; admin can retry.
    } finally {
      setBusyId("");
    }
  };

  const summary = playsState.summary;
  const pendingClaims = (claims || []).filter((c) => c.status === "pending");
  const hasPrimary = (artists || []).some((a) => a.slug === PRIMARY_ARTIST.slug);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <MicroLabel>Private · artist stats</MicroLabel>
      <h1 className="mt-3 font-display text-3xl font-light tracking-[0.06em] text-foreground sm:text-4xl">
        Plays per song
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/60">
        Only visible on the owner login. Site plays are counted by this website
        itself; the streaming numbers below them come from UnitedMasters and
        only change when a fresh snapshot is filed.
      </p>

      {/* ——— Plays on this site ——— */}
      <div className="mt-10">
        <MicroLabel>On AnaLuci.app</MicroLabel>
        {playsState.loading ? (
          <div className="mt-6 flex items-center gap-3 text-sm text-foreground/60">
            <Loader2 className="h-4 w-4 animate-spin text-amber" /> Loading play counts…
          </div>
        ) : playsState.error ? (
          <p className="mt-4 text-sm leading-relaxed text-foreground/60">
            Play counting isn't live in the backend yet — the TrackPlay store
            needs to be synced before counts can be read. Plays are still being
            recorded from the player in the meantime.
          </p>
        ) : (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <StatBlock label="Total site plays" value={fmt(summary.total)} />
              <StatBlock label="Last 7 days" value={fmt(summary.last7)} />
              <StatBlock label="Last 28 days" value={fmt(summary.last28)} />
            </div>
            <div className="hud-panel mt-4 rounded-sm p-5">
              {summary.songs.length === 0 ? (
                <p className="text-sm text-foreground/60">
                  No plays recorded yet. The first time a visitor presses play
                  on a song in the archive, it lands here.
                </p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="font-mono text-[9px] uppercase tracking-[0.22em] text-foreground/40">
                      <th className="pb-3 pr-3 font-normal">Song</th>
                      <th className="pb-3 pr-3 font-normal">Release</th>
                      <th className="pb-3 text-right font-normal">Plays</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.songs.map((song) => (
                      <tr key={song.track_id || song.track_title} className="border-t border-white/5">
                        <td className="py-2.5 pr-3 text-foreground/90">{song.track_title}</td>
                        <td className="py-2.5 pr-3 text-foreground/50">{song.release_title || "—"}</td>
                        <td className="py-2.5 text-right font-mono text-amber/90">{fmt(song.plays)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {/* ——— Streaming platforms (UnitedMasters snapshot) ——— */}
      <div className="mt-12">
        <MicroLabel>Streaming platforms — updated {STREAMING_STATS.updatedLabel}</MicroLabel>
        <p className="mt-2 text-xs text-foreground/50">
          {STREAMING_STATS.source} · all time since {STREAMING_STATS.allTime.since} · filed
          snapshot, not a live feed.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatBlock label="All-time streams" value={fmt(STREAMING_STATS.allTime.total)} />
          <StatBlock
            label="Last 28 days"
            value={fmt(STREAMING_STATS.last28Days.total)}
            sub={STREAMING_STATS.last28Days.label}
          />
          <StatBlock
            label="Last 7 days"
            value={fmt(STREAMING_STATS.last7Days.total)}
            sub={STREAMING_STATS.last7Days.label}
          />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="hud-panel rounded-sm p-5">
            <MicroLabel>By platform</MicroLabel>
            <table className="mt-3 w-full text-left text-sm">
              <tbody>
                {STREAMING_STATS.allTime.platforms.map((p) => (
                  <tr key={p.name} className="border-t border-white/5 first:border-t-0">
                    <td className="py-2.5 pr-3 text-foreground/90">{p.name}</td>
                    <td className="py-2.5 text-right font-mono text-amber/90">{fmt(p.streams)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="hud-panel rounded-sm p-5">
            <MicroLabel>Top tracks — all time</MicroLabel>
            <table className="mt-3 w-full text-left text-sm">
              <tbody>
                {STREAMING_STATS.topTracksAllTime.map((t, i) => (
                  <tr key={t.title} className="border-t border-white/5 first:border-t-0">
                    <td className="py-2 pr-3 font-mono text-xs text-foreground/40">{i + 1}</td>
                    <td className="py-2 pr-3 text-foreground/90">{t.title}</td>
                    <td className="py-2 text-right font-mono text-amber/90">{fmt(t.streams)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ——— Artists & verification ——— */}
      <div className="mt-12">
        <MicroLabel>Artists &amp; verification</MicroLabel>
        {directoryError ? (
          <p className="mt-4 text-sm leading-relaxed text-foreground/60">
            The artist directory isn't live in the backend yet — the Artist and
            ArtistClaim stores need to be synced before this section can read
            them.
          </p>
        ) : artists === null ? (
          <div className="mt-6 flex items-center gap-3 text-sm text-foreground/60">
            <Loader2 className="h-4 w-4 animate-spin text-amber" /> Loading artists…
          </div>
        ) : (
          <>
            <div className="hud-panel mt-4 rounded-sm p-5">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="font-mono text-[9px] uppercase tracking-[0.22em] text-foreground/40">
                      <th className="pb-3 pr-3 font-normal">Artist</th>
                      <th className="pb-3 pr-3 font-normal">Slug</th>
                      <th className="pb-3 text-right font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!hasPrimary && (
                      <tr className="border-t border-white/5">
                        <td className="py-2.5 pr-3 text-foreground/90">{PRIMARY_ARTIST.name}</td>
                        <td className="py-2.5 pr-3 font-mono text-xs text-foreground/50">{PRIMARY_ARTIST.slug}</td>
                        <td className="py-2.5 text-right font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300/90">
                          Verified
                        </td>
                      </tr>
                    )}
                    {artists.map((a) => (
                      <tr key={a.id} className="border-t border-white/5">
                        <td className="py-2.5 pr-3 text-foreground/90">{a.name}</td>
                        <td className="py-2.5 pr-3 font-mono text-xs text-foreground/50">{a.slug}</td>
                        <td
                          className={`py-2.5 text-right font-mono text-[10px] uppercase tracking-[0.2em] ${
                            a.status === "verified" ? "text-emerald-300/90" : "text-amber/90"
                          }`}
                        >
                          {a.status || "pending"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              {!hasPrimary && (
                <button
                  type="button"
                  onClick={seedPrimaryArtist}
                  disabled={busyId === "seed"}
                  className="mt-4 rounded-sm border border-amber/30 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.22em] text-amber/90 hover:bg-amber/[0.08] disabled:opacity-50"
                >
                  {busyId === "seed" ? "Adding…" : `Add ${PRIMARY_ARTIST.name} as verified`}
                </button>
              )}
            </div>

            <div className="hud-panel mt-4 rounded-sm p-5">
              <MicroLabel>Verification requests</MicroLabel>
              {pendingClaims.length === 0 ? (
                <p className="mt-3 text-sm text-foreground/60">
                  No pending requests. New artists ask through the claim page;
                  nothing is approved automatically.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {pendingClaims.map((claim) => (
                    <div
                      key={claim.id}
                      className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3 first:border-t-0 first:pt-0"
                    >
                      <div className="text-sm">
                        <div className="text-foreground/90">{claim.artist_name}</div>
                        <div className="text-xs text-foreground/50">
                          {claim.contact_email}
                          {claim.slug ? ` · slug: ${claim.slug}` : ""}
                        </div>
                        {claim.note ? (
                          <div className="mt-1 max-w-md text-xs text-foreground/50">{claim.note}</div>
                        ) : null}
                      </div>
                      <div className="flex gap-2 font-mono text-[9px] uppercase tracking-[0.22em]">
                        <button
                          type="button"
                          onClick={() => decideClaim(claim, "approved")}
                          disabled={busyId === claim.id}
                          className="rounded-sm border border-emerald-300/30 px-3 py-1.5 text-emerald-300/90 hover:bg-emerald-300/10 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => decideClaim(claim, "rejected")}
                          disabled={busyId === claim.id}
                          className="rounded-sm border border-white/15 px-3 py-1.5 text-foreground/60 hover:bg-white/5 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
