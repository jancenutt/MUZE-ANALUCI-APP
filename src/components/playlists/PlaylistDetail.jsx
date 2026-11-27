import { useEffect, useState } from "react";
import { ListPlus, Loader2, Play, Trash2 } from "lucide-react";
import CoverImage from "@/components/CoverImage";
import { base44 } from "@/api/base44Client";
import { usePlayer } from "@/lib/player";
import { getTracks } from "@/lib/catalogData";

export default function PlaylistDetail({ playlist, onChanged }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playFrom, addToQueue, current, playing } = usePlayer();

  useEffect(() => {
    let alive = true;
    const ids = playlist?.track_ids ?? [];
    if (!ids.length) {
      setTracks([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    getTracks()
      .then((allTracks) => {
        if (!alive) return;
        const wanted = new Set(ids);
        const byId = new Map(
          allTracks.filter((track) => wanted.has(track.id)).map((track) => [track.id, track])
        );
        setTracks(ids.map((id) => byId.get(id)).filter(Boolean));
      })
      .catch(() => alive && setTracks([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [playlist]);

  const playable = tracks.filter((track) => track.has_audio && track.audio_uri);

  const removeTrack = async (track) => {
    const ids = (playlist.track_ids || []).filter((id) => id !== track.id);
    await base44.entities.Playlist.update(playlist.id, {
      track_ids: ids,
      track_count: ids.length,
    });
    setTracks((prev) => prev.filter((item) => item.id !== track.id));
    if (onChanged) onChanged();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-amber" />
      </div>
    );
  }

  return (
    <div className="hud-panel overflow-hidden rounded-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber/10 px-4 py-3">
        <div>
          <h2 className="font-display text-lg font-light text-foreground">{playlist.title}</h2>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            {tracks.length} track{tracks.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => playable.length && playFrom(playable, 0)}
            disabled={!playable.length}
            className="flex min-h-[44px] items-center gap-2 rounded-sm bg-amber px-4 font-mono text-[9px] uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-amber/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Play className="h-3 w-3" fill="currentColor" /> Play
          </button>
          <button
            onClick={() => addToQueue(playable)}
            disabled={!playable.length}
            className="flex min-h-[44px] items-center gap-2 rounded-sm border border-amber/30 px-4 font-mono text-[9px] uppercase tracking-[0.2em] text-amber/90 transition-colors hover:bg-amber/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ListPlus className="h-3 w-3" /> Queue
          </button>
        </div>
      </div>

      {tracks.length === 0 ? (
        <p className="px-4 py-14 text-center font-mono text-[10px] uppercase leading-relaxed tracking-[0.2em] text-muted-foreground">
          Empty playlist — add songs from the archive
        </p>
      ) : (
        tracks.map((track) => {
          const isCurrent = current?.id === track.id;
          const index = playable.findIndex((item) => item.id === track.id);
          return (
            <div
              key={track.id}
              className={`flex items-center gap-3 border-b border-white/5 px-3 py-2.5 last:border-0 sm:px-4 ${
                isCurrent ? "bg-amber/[0.06]" : "hover:bg-white/[0.025]"
              }`}
            >
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-sm border border-white/10 bg-panel">
                {track.cover_url ? (
                  <CoverImage src={track.cover_url} alt="" className="h-full w-full" />
                ) : null}
              </div>
              <button
                onClick={() => index >= 0 && playFrom(playable, index)}
                disabled={index < 0}
                aria-label={`Play ${track.title}`}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-30 ${
                  isCurrent
                    ? "border-amber/60 bg-amber/15 text-amber"
                    : "border-white/10 text-muted-foreground hover:border-amber/40 hover:text-amber"
                }`}
              >
                <Play className="ml-0.5 h-3 w-3" fill="currentColor" />
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={`selectable truncate text-sm ${isCurrent ? "text-amber" : "text-foreground"}`}
                >
                  {track.title}
                </p>
                <p className="truncate font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                  {track.artist} · {track.release_title}
                </p>
              </div>
              {isCurrent && playing ? (
                <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.16em] text-amber/60">
                  Playing
                </span>
              ) : null}
              <button
                onClick={() => removeTrack(track)}
                aria-label={`Remove ${track.title} from this playlist`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-muted-foreground/60 transition-colors hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}