import { useState } from "react";
import { base44 } from "@/api/base44Client";
import MicroLabel from "@/components/MicroLabel";
import { padNumber } from "@/lib/format";

// Owner-only: attach a master to a track. The file is stored privately and
// only served through a signed link when somebody presses play.
export default function AudioIntake({ tracks, onUpdated }) {
  const [busyId, setBusyId] = useState(null);
  const [status, setStatus] = useState("");

  const readDuration = (file) =>
    new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const audio = new Audio();
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        const d = audio.duration;
        URL.revokeObjectURL(url);
        resolve(
          Number.isFinite(d)
            ? `${Math.floor(d / 60)}:${Math.floor(d % 60).toString().padStart(2, "0")}`
            : ""
        );
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve("");
      };
      audio.src = url;
    });

  const attach = async (track, file) => {
    if (!file) return;
    setBusyId(track.id);
    setStatus("");
    try {
      const duration = await readDuration(file);
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      await base44.entities.Track.update(track.id, {
        audio_uri: file_uri,
        has_audio: true,
        is_demo: false,
        duration,
      });
      setStatus(`Attached to ${track.title}`);
      await onUpdated?.();
    } catch (err) {
      setStatus("Upload failed — try again");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="hud-panel rounded-sm">
      <div className="flex items-center justify-between border-b border-amber/10 px-4 py-2.5">
        <MicroLabel>Signal intake · owner</MicroLabel>
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
          Private storage
        </span>
      </div>
      <div className="max-h-72 overflow-y-auto px-2 py-2">
        {tracks.map((track) => (
          <div key={track.id} className="flex items-center gap-3 px-2 py-1.5">
            <span className="w-5 font-mono text-[9px] text-muted-foreground">{padNumber(track.no)}</span>
            <span className="min-w-0 flex-1 truncate text-xs text-foreground/85">{track.title}</span>
            <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground/70">
              {busyId === track.id ? "Uploading…" : track.has_audio ? "Loaded" : "Empty"}
            </span>
            <label className="cursor-pointer rounded-sm border border-amber/25 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.16em] text-amber/80 hover:bg-amber/10">
              Attach
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => attach(track, e.target.files?.[0])}
              />
            </label>
          </div>
        ))}
      </div>
      {status ? (
        <p className="border-t border-amber/10 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-amber/70">
          {status}
        </p>
      ) : null}
    </div>
  );
}