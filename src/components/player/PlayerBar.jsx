import { Image } from "@/components/ui/image";
import { Loader2, Pause, Play, SkipForward } from "lucide-react";
import { usePlayer } from "@/lib/player";

// The mini player that stays pinned above the bottom nav on every screen. It never stops
// the audio — it only opens and closes the full player.
export default function PlayerBar() {
  const {
    current,
    playing,
    loading,
    time,
    duration,
    notice,
    toggle,
    next,
    openNowPlaying,
  } = usePlayer();

  if (!current) return null;

  const progress = duration ? Math.min(100, (time / duration) * 100) : 0;

  return (
    <div className="above-tabs fixed inset-x-0 z-50 border-t border-amber/20 bg-background/95 backdrop-blur-xl">
      <div className="h-[2px] w-full bg-white/10">
        <div
          className="h-full bg-amber transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-2 px-2 py-2 sm:gap-3 sm:px-8">
        <button
          onClick={openNowPlaying}
          aria-label="Open the full player"
          className="flex min-w-0 flex-1 items-center gap-3 rounded-sm py-0.5 text-left"
        >
          <span className="h-11 w-11 shrink-0 overflow-hidden rounded-sm border border-amber/20 bg-panel">
            {current.cover_url ? (
              <Image
                src={current.cover_url}
                alt=""
                fittingType="fill"
                className="h-full w-full object-cover"
              />
            ) : null}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display text-sm text-foreground">
              {current.title}
            </span>
            <span className="block truncate font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              {notice || current.artist}
            </span>
          </span>
        </button>

        <button
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber text-primary-foreground"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : playing ? (
            <Pause className="h-4 w-4" fill="currentColor" />
          ) : (
            <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
          )}
        </button>

        <button
          onClick={next}
          aria-label="Next track"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <SkipForward className="h-4 w-4" fill="currentColor" />
        </button>
      </div>
    </div>
  );
}