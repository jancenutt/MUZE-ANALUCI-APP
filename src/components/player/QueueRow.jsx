import { Shuffle, Trash2 } from "lucide-react";
import CoverImage from "@/components/CoverImage";
import EqualizerBars from "@/components/player/EqualizerBars";

// One line of Up Next. The playing track shows the equalizer instead of a number, and
// carries no drag handle because it always stays at the top.
export default function QueueRow({
  track,
  position,
  isCurrent,
  isPlaying,
  shuffleOn,
  onPlay,
  onRemove,
  dragHandle,
}) {
  return (
    <div
      className={`flex items-center gap-2.5 border-b border-white/5 px-2 py-2.5 transition-colors ${
        isCurrent ? "bg-amber/[0.07]" : "hover:bg-white/[0.03]"
      }`}
    >
      <span className="flex w-4 shrink-0 items-center justify-center">
        {isCurrent ? (
          <EqualizerBars paused={!isPlaying} />
        ) : (
          <span className="font-mono text-[10px] text-muted-foreground">{position}</span>
        )}
      </span>

      <button
        onClick={onPlay}
        aria-label={`Play ${track.title}`}
        className="h-10 w-10 shrink-0 overflow-hidden rounded-sm border border-white/10 bg-panel"
      >
        {track.cover_url ? <CoverImage src={track.cover_url} alt="" className="h-full w-full" /> : null}
      </button>

      <button onClick={onPlay} className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-1.5">
          {shuffleOn && !isCurrent ? (
            <Shuffle className="h-2.5 w-2.5 shrink-0 text-amber/50" />
          ) : null}
          <span className={`truncate text-sm ${isCurrent ? "text-amber" : "text-foreground"}`}>
            {track.title}
          </span>
        </span>
        <span className="block truncate font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
          {track.artist}
          {track.release_title ? ` · ${track.release_title}` : ""}
        </span>
        {isCurrent ? (
          <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[0.18em] text-amber/60">
            {isPlaying ? "Playing now" : "Paused"}
          </span>
        ) : null}
      </button>

      <span className="shrink-0 font-mono text-[9px] text-muted-foreground">
        {track.duration || ""}
      </span>

      {dragHandle}

      {onRemove ? (
        <button
          onClick={onRemove}
          aria-label={`Remove ${track.title} from the list`}
          className="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground/50 transition-colors hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : (
        <span className="w-9 shrink-0" />
      )}
    </div>
  );
}