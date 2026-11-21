import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { Image } from "@/components/ui/image";
import UpNextList from "@/components/player/UpNextList";
import { usePlayer } from "@/lib/player";
import { formatTime } from "@/lib/format";

// Full-screen player. The artwork doubles as the grab area: pulling it down drags the
// whole sheet with the finger, shrinking the cover slightly, and a release past a quarter
// of the screen (or a fast flick) hands the track back to the mini player.
export default function NowPlaying() {
  const {
    current,
    playing,
    loading,
    time,
    duration,
    notice,
    nowPlaying,
    closeNowPlaying,
    toggle,
    next,
    prev,
    seek,
    shuffle,
    toggleShuffle,
    repeat,
    cycleRepeat,
    queue,
    queueIndex,
  } = usePlayer();
  const [queueOpen, setQueueOpen] = useState(false);

  const dragY = useMotionValue(0);
  const artworkScale = useTransform(dragY, [0, 340], [1, 0.82]);

  // Keep the page behind still while the sheet covers it.
  useEffect(() => {
    if (!nowPlaying) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [nowPlaying]);

  // A closed sheet always starts flat again for the next open.
  useEffect(() => {
    if (!nowPlaying) dragY.set(0);
  }, [nowPlaying, dragY]);

  const dismissOnRelease = (_event, info) => {
    const threshold = Math.min(window.innerHeight * 0.25, 260);
    if (info.offset.y > threshold || info.velocity.y > 900) closeNowPlaying();
  };

  const upcoming = queue[queueIndex + 1];
  const progressMax = duration || 0;
  const repeatLabel =
    repeat === "one" ? "Repeat one" : repeat === "all" ? "Repeat all" : "Repeat off";

  return (
    <AnimatePresence>
      {nowPlaying && current ? (
        <motion.div
          key="now-playing"
          role="dialog"
          aria-modal="true"
          aria-label="Now playing"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 320, damping: 34 }}
          className="fixed inset-0 z-[55] bg-background"
        >
          <motion.div
            style={{ y: dragY }}
            className="safe-top safe-bottom flex h-full flex-col bg-gradient-to-b from-panel via-background to-background"
          >
            <div className="flex items-center justify-between px-3 pb-1 pt-2">
              <button
                onClick={closeNowPlaying}
                aria-label="Minimise the player"
                className="flex h-11 w-11 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber/60">
                ANA.LUCI Player
              </p>
              <button
                onClick={closeNowPlaying}
                aria-label="Close now playing"
                className="flex h-11 w-11 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-10">
              <div className="mx-auto mt-2 w-full max-w-sm">
                <motion.div
                  style={{ scale: artworkScale }}
                  className="hud-glow relative aspect-square w-full overflow-hidden rounded-sm border border-amber/20 bg-panel"
                >
                  {current.cover_url ? (
                    <Image
                      src={current.cover_url}
                      alt={current.title || "Artwork"}
                      fittingType="fill"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                  <motion.div
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={{ top: 0, bottom: 1 }}
                    dragMomentum={false}
                    onDragEnd={dismissOnRelease}
                    style={{ y: dragY, touchAction: "none" }}
                    className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
                    aria-hidden="true"
                  />
                </motion.div>
              </div>

              <div className="mx-auto mt-6 max-w-sm text-center">
                <h2 className="truncate font-display text-2xl font-light tracking-[0.02em] text-foreground">
                  {current.title}
                </h2>
                <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.24em] text-amber/70">
                  {current.artist}
                </p>
                {current.release_title ? (
                  <p className="mt-1 truncate font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    {current.release_title}
                  </p>
                ) : null}
                {notice ? (
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-amber/60">
                    {notice}
                  </p>
                ) : null}
              </div>

              <div className="mx-auto mt-6 max-w-sm">
                <input
                  type="range"
                  min={0}
                  max={progressMax}
                  step={0.1}
                  value={Math.min(time, progressMax)}
                  onChange={(event) => seek(Number(event.target.value))}
                  aria-label="Seek"
                  className="block h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-amber"
                />
                <div className="mt-1 flex justify-between font-mono text-[9px] text-muted-foreground">
                  <span>{formatTime(time)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="mx-auto mt-4 flex max-w-sm items-center justify-between">
                <button
                  onClick={toggleShuffle}
                  aria-pressed={shuffle}
                  aria-label={shuffle ? "Turn shuffle off" : "Shuffle the list"}
                  className={`flex h-11 w-11 items-center justify-center rounded-sm transition-colors ${
                    shuffle ? "text-amber" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Shuffle className="h-4 w-4" />
                </button>
                <button
                  onClick={prev}
                  aria-label="Previous track"
                  className="flex h-12 w-12 items-center justify-center rounded-sm text-foreground/80 transition-colors hover:text-foreground"
                >
                  <SkipBack className="h-5 w-5" fill="currentColor" />
                </button>
                <button
                  onClick={toggle}
                  aria-label={playing ? "Pause" : "Play"}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-amber text-primary-foreground transition-transform hover:scale-105"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : playing ? (
                    <Pause className="h-5 w-5" fill="currentColor" />
                  ) : (
                    <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
                  )}
                </button>
                <button
                  onClick={next}
                  aria-label="Next track"
                  className="flex h-12 w-12 items-center justify-center rounded-sm text-foreground/80 transition-colors hover:text-foreground"
                >
                  <SkipForward className="h-5 w-5" fill="currentColor" />
                </button>
                <button
                  onClick={cycleRepeat}
                  aria-label={repeatLabel}
                  title={repeatLabel}
                  className={`flex h-11 w-11 items-center justify-center rounded-sm transition-colors ${
                    repeat !== "off" ? "text-amber" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {repeat === "one" ? (
                    <Repeat1 className="h-4 w-4" />
                  ) : (
                    <Repeat className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="mx-auto mt-6 max-w-sm border-t border-amber/10 pt-1">
                <button
                  onClick={() => setQueueOpen((open) => !open)}
                  aria-expanded={queueOpen}
                  className="flex w-full items-center justify-between gap-3 py-3"
                >
                  <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-amber/70">
                    Up next
                  </span>
                  <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                    {queue.length} track{queue.length === 1 ? "" : "s"}
                    {queueOpen ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronUp className="h-3.5 w-3.5" />
                    )}
                  </span>
                </button>

                {queueOpen ? (
                  <UpNextList />
                ) : upcoming ? (
                  <p className="pb-3 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                    Next · {upcoming.title}
                  </p>
                ) : null}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}