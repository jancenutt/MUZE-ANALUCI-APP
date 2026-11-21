import { useState } from "react";
import { ListMusic, Loader2, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AddToPlaylistButton({ trackIds = [], label, className = "" }) {
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("");
  const ids = [...new Set(trackIds.filter(Boolean))];

  const load = async () => {
    setLoading(true);
    try {
      const page = await base44.entities.Playlist.filter({}, { sort: "-created_date", limit: 60 });
      setPlaylists(page.items);
    } finally {
      setLoading(false);
    }
  };

  const openDialog = async () => {
    const me = await base44.auth.me().catch(() => null);
    if (!me) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    setStatus("");
    setOpen(true);
    load();
  };

  const save = async (playlist) => {
    const merged = [...new Set([...(playlist.track_ids || []), ...ids])];
    setStatus("Saving…");
    await base44.entities.Playlist.update(playlist.id, {
      track_ids: merged,
      track_count: merged.length,
    });
    setPlaylists((prev) =>
      prev.map((item) =>
        item.id === playlist.id
          ? { ...item, track_ids: merged, track_count: merged.length }
          : item
      )
    );
    setStatus(`Added to ${playlist.title}`);
  };

  const createPlaylist = async () => {
    const name = title.trim();
    if (!name) return;
    setStatus("Saving…");
    const created = await base44.entities.Playlist.create({
      title: name,
      track_ids: ids,
      track_count: ids.length,
    });
    setPlaylists((prev) => [created, ...prev]);
    setTitle("");
    setStatus(`Added to ${created.title}`);
  };

  if (!ids.length) return null;

  return (
    <>
      <button
        onClick={openDialog}
        aria-label={label || "Add to a playlist"}
        title={label || "Add to a playlist"}
        className={className}
      >
        <ListMusic className="h-3.5 w-3.5" />
        {label ? <span>{label}</span> : null}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-sm border-amber/15 bg-background">
          <DialogHeader>
            <DialogTitle className="font-mono text-[10px] uppercase tracking-[0.26em] text-amber/80">
              Add {ids.length === 1 ? "song" : `${ids.length} songs`} to a playlist
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-amber" />
            </div>
          ) : (
            <div className="max-h-64 space-y-1.5 overflow-y-auto">
              {playlists.length === 0 ? (
                <p className="py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                  No playlists yet — name one below
                </p>
              ) : (
                playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => save(playlist)}
                    className="flex w-full items-center justify-between gap-3 rounded-sm border border-white/10 px-3 py-2.5 text-left transition-colors hover:border-amber/35 hover:bg-amber/[0.05]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-foreground">{playlist.title}</span>
                      <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
                        {playlist.track_count ?? playlist.track_ids?.length ?? 0} tracks
                      </span>
                    </span>
                    <Plus className="h-3.5 w-3.5 shrink-0 text-amber/70" />
                  </button>
                ))
              )}
            </div>
          )}

          <div className="flex items-center gap-2 border-t border-amber/10 pt-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="New playlist name"
              className="min-w-0 flex-1 rounded-sm border border-white/10 bg-panel/60 px-3 py-2 font-mono text-[11px] text-foreground placeholder:text-muted-foreground/70 focus:border-amber/40 focus:outline-none"
            />
            <button
              onClick={createPlaylist}
              disabled={!title.trim()}
              className="rounded-sm bg-amber px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              Create
            </button>
          </div>

          {status ? (
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-amber/70">{status}</p>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}