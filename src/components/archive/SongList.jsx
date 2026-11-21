import { ListPlus, Loader2, Play } from "lucide-react";
import CoverImage from "@/components/CoverImage";
import AddToPlaylistButton from "@/components/playlists/AddToPlaylistButton";
import TrackAudioUpload from "@/components/release/TrackAudioUpload";
import useIsAdmin from "@/hooks/useIsAdmin";
import { usePlayer } from "@/lib/player";
import { padNumber } from "@/lib/format";

export default function SongList({ songs, loading, onUpdated }) {
  const { current, playing, playFrom, addToQueue } = usePlayer();
  const isAdmin = useIsAdmin();
  const playable = songs.filter((track) => track.has_audio && track.audio_uri);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-amber" />
      </div>
    );
  }

  if (!songs.length) {
    return (
      <div className="hud-panel rounded-sm px-6 py-16 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-amber/60">No matches</p>
        <p className="mt-3 text-sm text-muted-foreground">
          No song in the archive answers to that. Try another title.
        </p>
      </div>
    );
  }

  return (
    <div className="hud-panel overflow-hidden rounded-sm">
      <div className="flex items-center justify-between gap-3 border-b border-amber/10 px-4 py-3">
        <button
          onClick={() => playable.length && playFrom(playable, 0)}
          disabled={!playable.length}
          className="flex min-h-[44px] items-center gap-2 rounded-sm bg-amber px-4 font-mono text-[9px] uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-amber/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Play className="h-3 w-3" fill="currentColor" /> Play all songs
        </button>
        <button
          onClick={() => addToQueue(playable)}
          disabled={!playable.length}
          className="flex min-h-[44px] items-center gap-2 rounded-sm border border-amber/30 px-4 font-mono text-[9px] uppercase tracking-[0.2em] text-amber/90 transition-colors hover:bg-amber/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ListPlus className="h-3 w-3" /> Queue all
        </button>
      </div>

      <div>
        {songs.map((track) => {
          const isCurrent = current?.id === track.id;
          const isPlaying = isCurrent && playing;
          const index = playable.findIndex((item) => item.id === track.id);
          return (
            <div
              key={track.id}
              className={`group flex items-center gap-3 border-b border-white/5 px-3 py-2.5 transition-colors last:border-0 sm:px-4 ${
                isCurrent ? "bg-amber/[0.06]" : "hover:bg-white/[0.025]"
              }`}
            >
              <span className="w-5 shrink-0 text-center font-mono text-[10px] text-muted-foreground">
                {isCurrent ? <span className="text-amber">▸</span> : padNumber(track.no)}
              </span>

              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-sm border border-white/10 bg-panel">
                {track.cover_url ? (
                  <CoverImage src={track.cover_url} alt="" className="h-full w-full" />
                ) : null}
              </div>

              <button
                onClick={() => index >= 0 && playFrom(playable, index)}
                disabled={index < 0}
                aria-label={index >= 0 ? `Play ${track.title}` : `${track.title} — coming soon`}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
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

              {track.has_audio && track.audio_uri ? (
                <span className="hidden shrink-0 font-mono text-[10px] text-muted-foreground sm:block">
                  {track.duration || "—"}
                </span>
              ) : isAdmin && onUpdated ? (
                <TrackAudioUpload track={track} onUpdated={onUpdated} label="Attach" />
              ) : (
                <span className="hidden shrink-0 font-mono text-[10px] text-muted-foreground sm:block">
                  Coming soon
                </span>
              )}

              <button
                onClick={() => addToQueue(track)}
                aria-label={`Add ${track.title} to up next`}
                title="Add to up next"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-muted-foreground/70 transition-colors hover:text-amber"
              >
                <ListPlus className="h-3.5 w-3.5" />
              </button>

              <AddToPlaylistButton
                trackIds={[track.id]}
                className="shrink-0 text-muted-foreground/70 transition-colors hover:text-amber"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}