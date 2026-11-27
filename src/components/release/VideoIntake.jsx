import { useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { uploadIntakeFile, updateCatalogRecord } from "@/lib/intake";
import MicroLabel from "@/components/MicroLabel";
import { padNumber } from "@/lib/format";

// Owner-only: attach a music video to a track. The file goes to private storage and
// nothing on the public side links it until the track is flipped to public.
export default function VideoIntake({ tracks, onUpdated }) {
  const [busyId, setBusyId] = useState(null);
  const [status, setStatus] = useState("");

  const attach = async (track, file) => {
    if (!file) return;
    setBusyId(track.id);
    setStatus("");
    try {
      await uploadIntakeFile({ file, kind: "video", releaseId: track.release_id, trackId: track.id });
      setStatus(`Video attached to ${track.title} — kept private`);
      await onUpdated?.();
    } catch (err) {
      setStatus("Upload failed — try again");
    } finally {
      setBusyId(null);
    }
  };

  const toggle = async (track) => {
    setBusyId(track.id);
    try {
      const next = !track.video_public;
      await updateCatalogRecord({ target: "track", id: track.id, fields: { video_public: next } });
      setStatus(`${track.title} video is now ${next ? "public" : "private"}`);
      await onUpdated?.();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="hud-panel rounded-sm">
      <div className="flex items-center justify-between border-b border-amber/10 px-4 py-2.5">
        <MicroLabel>Music videos · owner</MicroLabel>
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
          Private storage
        </span>
      </div>
      <div className="max-h-72 overflow-y-auto px-2 py-2">
        {tracks.map((track) => {
          const hasVideo = Boolean(track.video_uri);
          const state = busyId === track.id
            ? "Working…"
            : !hasVideo
              ? "No video"
              : track.video_public
                ? "Public"
                : "Private";
          return (
            <div key={track.id} className="flex items-center gap-2 px-2 py-1.5">
              <span className="w-5 font-mono text-[9px] text-muted-foreground">
                {padNumber(track.no)}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-foreground/85">
                {track.title}
              </span>
              <span
                className={`font-mono text-[8px] uppercase tracking-[0.16em] ${
                  hasVideo && track.video_public ? "text-amber" : "text-muted-foreground/70"
                }`}
              >
                {state}
              </span>
              {hasVideo ? (
                <button
                  onClick={() => toggle(track)}
                  aria-label={track.video_public ? "Make private" : "Make public"}
                  title={track.video_public ? "Make private" : "Make public"}
                  className="text-muted-foreground/70 transition-colors hover:text-amber"
                >
                  {track.video_public ? (
                    <Unlock className="h-3 w-3" />
                  ) : (
                    <Lock className="h-3 w-3" />
                  )}
                </button>
              ) : null}
              <label className="cursor-pointer rounded-sm border border-amber/25 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.16em] text-amber/80 hover:bg-amber/10">
                {hasVideo ? "Replace" : "Add"}
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => attach(track, e.target.files?.[0])}
                />
              </label>
            </div>
          );
        })}
      </div>
      {status ? (
        <p className="border-t border-amber/10 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-amber/70">
          {status}
        </p>
      ) : null}
    </div>
  );
}