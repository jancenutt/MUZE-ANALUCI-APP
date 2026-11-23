import { useEffect, useState } from "react";
import ArchiveFilters from "@/components/archive/ArchiveFilters";
import ArchiveViewToggle from "@/components/archive/ArchiveViewToggle";
import ReleaseCard from "@/components/archive/ReleaseCard";
import SongList from "@/components/archive/SongList";
import ArtistGrid from "@/components/archive/ArtistGrid";
import MicroLabel from "@/components/MicroLabel";
import PullToRefresh from "@/components/PullToRefresh";
import {
  fetchReleases,
  fetchArtists,
  fetchTracks,
  fetchArtistIndex,
} from "@/lib/catalog";
import { usePageMeta } from "@/lib/seo";

export default function Archive() {
  usePageMeta({
    title: "Archive — All 41 Releases by J'ance Nutt | AnaLuci.app",
    description:
      "Browse and stream the full J'ance Nutt archive on AnaLuci.app — 41 releases and 272 tracks: albums, EPs, singles and mixtapes by J'ance Nutt, free full songs, no account needed.",
    path: "/archive",
  });

  const [view, setView] = useState("albums");
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [artist, setArtist] = useState("");
  const [artists, setArtists] = useState([]);
  const [releases, setReleases] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [songs, setSongs] = useState([]);
  const [songsLoading, setSongsLoading] = useState(false);
  const [artistIndex, setArtistIndex] = useState([]);

  useEffect(() => {
    fetchArtists().then(setArtists).catch(() => setArtists([]));
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const handle = setTimeout(() => {
      fetchReleases({ q: q.trim(), type, artist })
        .then((page) => {
          if (!alive) return;
          setReleases(page.items);
          setCursor(page.next_cursor ?? null);
          setHasMore(Boolean(page.has_more));
        })
        .catch(() => alive && setReleases([]))
        .finally(() => alive && setLoading(false));
    }, q ? 260 : 0);
    return () => {
      alive = false;
      clearTimeout(handle);
    };
  }, [q, type, artist]);

  // Song view re-reads the flat track index with the same search and alias filters.
  useEffect(() => {
    if (view !== "songs") return undefined;
    let alive = true;
    setSongsLoading(true);
    const handle = setTimeout(() => {
      fetchTracks({ q: q.trim(), artist })
        .then((items) => alive && setSongs(items))
        .catch(() => alive && setSongs([]))
        .finally(() => alive && setSongsLoading(false));
    }, q ? 260 : 0);
    return () => {
      alive = false;
      clearTimeout(handle);
    };
  }, [view, q, artist]);

  useEffect(() => {
    if (view !== "artists" || artistIndex.length) return;
    fetchArtistIndex()
      .then(setArtistIndex)
      .catch(() => setArtistIndex([]));
  }, [view, artistIndex.length]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const page = await fetchReleases({ q: q.trim(), type, artist, cursor });
      setReleases((prev) => [...prev, ...page.items]);
      setCursor(page.next_cursor ?? null);
      setHasMore(Boolean(page.has_more));
    } finally {
      setLoadingMore(false);
    }
  };

  const reloadSongs = async () => {
    const items = await fetchTracks({ q: q.trim(), artist });
    setSongs(items);
  };

  const pickArtist = (name) => {
    setArtist(name);
    setView("albums");
  };

  // Pull-to-refresh re-reads the catalog with the filters currently applied.
  const refresh = async () => {
    const page = await fetchReleases({ q: q.trim(), type, artist });
    setReleases(page.items);
    setCursor(page.next_cursor ?? null);
    setHasMore(Boolean(page.has_more));
    if (view === "songs") await reloadSongs();
  };

  const count =
    view === "songs"
      ? `${songs.length} song${songs.length === 1 ? "" : "s"}`
      : view === "artists"
        ? `${artistIndex.length} artist${artistIndex.length === 1 ? "" : "s"}`
        : `${releases.length} release${releases.length === 1 ? "" : "s"}`;

  return (
    <PullToRefresh onRefresh={refresh}>
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="mb-10">
        <MicroLabel>Archive index</MicroLabel>
        <h1 className="mt-3 font-display text-3xl font-light tracking-[0.08em] text-foreground sm:text-5xl">
          The catalog
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/60">
          Every release reconstructed from the source record — titles, aliases and statuses kept
          exactly as found. Audio streams one track at a time.
        </p>
      </div>

      <div className="mb-6">
        <ArchiveViewToggle view={view} onChange={setView} />
      </div>

      <ArchiveFilters
        q={q}
        onQ={setQ}
        type={type}
        onType={setType}
        artist={artist}
        onArtist={setArtist}
        artists={artists}
        showType={view === "albums"}
      />

      <div className="mb-5 mt-8 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
        <span>
          {(view === "songs" ? songsLoading : loading) ? "Scanning…" : count}
        </span>
        <span className="text-amber/50">
          {view === "albums" ? "Sorted by catalog no." : view === "songs" ? "Grouped by release" : "Most releases first"}
        </span>
      </div>

      {view === "songs" ? (
        <SongList songs={songs} loading={songsLoading} onUpdated={reloadSongs} />
      ) : view === "artists" ? (
        <ArtistGrid artists={artistIndex} onPick={pickArtist} />
      ) : loading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="hud-panel animate-pulse overflow-hidden rounded-sm">
              <div className="aspect-square bg-white/[0.03]" />
              <div className="space-y-2 p-3.5">
                <div className="h-3 w-3/4 rounded bg-white/5" />
                <div className="h-2 w-1/2 rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      ) : releases.length === 0 ? (
        <div className="hud-panel rounded-sm px-6 py-16 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-amber/60">No matches</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Nothing in the archive answers to that. Try another title or alias.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {releases.map((release) => (
              <ReleaseCard key={release.id} release={release} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-sm border border-amber/30 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.24em] text-amber/90 transition-colors hover:bg-amber/[0.07] disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : "Load more releases"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
    </PullToRefresh>
  );
}