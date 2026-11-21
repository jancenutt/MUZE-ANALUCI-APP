import { useEffect, useState } from "react";
import { ListMusic, Loader2, Plus, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MicroLabel from "@/components/MicroLabel";
import CloseButton from "@/components/CloseButton";
import PlaylistDetail from "@/components/playlists/PlaylistDetail";
import PullToRefresh from "@/components/PullToRefresh";
import { usePageMeta } from "@/lib/seo";

export default function Playlists() {
  usePageMeta({
    title: "My Playlists — ANA.LUCI Player | AnaLuci.app",
    description:
      "Personal playlists built from the J'ance Nutt archive, playable in the ANA.LUCI Player.",
    path: "/playlists",
  });

  const [playlists, setPlaylists] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const page = await base44.entities.Playlist.filter({}, { sort: "-created_date", limit: 60 });
    setPlaylists(page.items);
    setSelectedId((prev) => prev ?? page.items[0]?.id ?? null);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async () => {
    const name = title.trim();
    if (!name) return;
    setBusy(true);
    try {
      const created = await base44.entities.Playlist.create({
        title: name,
        track_ids: [],
        track_count: 0,
      });
      setPlaylists((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setTitle("");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (playlist) => {
    await base44.entities.Playlist.delete(playlist.id);
    setPlaylists((prev) => prev.filter((item) => item.id !== playlist.id));
    setSelectedId((prev) => (prev === playlist.id ? null : prev));
  };

  const selected = playlists.find((item) => item.id === selectedId) || null;

  return (
    <PullToRefresh onRefresh={load}>
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <MicroLabel>ANA.LUCI Player</MicroLabel>
          <h1 className="mt-3 font-display text-3xl font-light tracking-[0.06em] text-foreground sm:text-5xl">
            My playlists
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/60">
          Personal lists of songs from the archive. They play back in the ANA.LUCI Player, and
            anything you queue stays in the up-next list while you listen.
          </p>
        </div>
        <CloseButton label="Close playlists" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-amber" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="New playlist name"
                className="min-w-0 flex-1 rounded-sm border border-white/10 bg-panel/60 px-3 py-2.5 font-mono text-[11px] text-foreground placeholder:text-muted-foreground/70 focus:border-amber/40 focus:outline-none"
              />
              <button
                onClick={create}
                disabled={!title.trim() || busy}
                aria-label="Create playlist"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-amber text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </button>
            </div>

            <div className="hud-panel overflow-hidden rounded-sm">
              {playlists.length === 0 ? (
                <p className="px-4 py-10 text-center font-mono text-[9px] uppercase leading-relaxed tracking-[0.18em] text-muted-foreground">
                  No playlists yet
                </p>
              ) : (
                playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className={`flex items-center gap-2 border-b border-white/5 px-3 py-2.5 last:border-0 ${
                      playlist.id === selectedId ? "bg-amber/[0.06]" : "hover:bg-white/[0.025]"
                    }`}
                  >
                    <button
                      onClick={() => setSelectedId(playlist.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span
                        className={`block truncate text-sm ${
                          playlist.id === selectedId ? "text-amber" : "text-foreground"
                        }`}
                      >
                        {playlist.title}
                      </span>
                      <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
                        {playlist.track_count ?? playlist.track_ids?.length ?? 0} tracks
                      </span>
                    </button>
                    <button
                      onClick={() => remove(playlist)}
                      aria-label={`Delete ${playlist.title}`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-muted-foreground/50 transition-colors hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="rounded-sm border border-amber/10 px-4 py-4">
              <div className="flex items-center gap-2 text-amber/70">
                <ListMusic className="h-3.5 w-3.5" />
                <span className="font-mono text-[9px] uppercase tracking-[0.2em]">Add songs</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-foreground/55">
                Open any album or switch the archive to song view, then use the playlist icon on a
                track to file it here.
              </p>
            </div>
          </div>

          <div>
            {selected ? (
              <PlaylistDetail
                playlist={selected}
                onChanged={() =>
                  setPlaylists((prev) =>
                    prev.map((item) =>
                      item.id === selected.id
                        ? { ...item, track_count: item.track_ids?.length ?? item.track_count }
                        : item
                    )
                  )
                }
              />
            ) : (
              <div className="hud-panel rounded-sm px-6 py-20 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber/60">
                  Pick a playlist
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Create one on the left, then add songs from the archive.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}