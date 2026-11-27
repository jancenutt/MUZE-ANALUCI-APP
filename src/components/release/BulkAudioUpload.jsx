import { useState } from "react";
import { uploadIntakeFile } from "@/lib/intake";
import MicroLabel from "@/components/MicroLabel";

// Tracks are matched to files by name, so a folder of tagged exports can be dropped in at once.
const normalize = (value) =>
  value
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/^\s*\d{1,3}[\s._-]+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

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

export default function BulkAudioUpload({ tracks, onUpdated }) {
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]);

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setBusy(true);
    const results = [];
    for (const file of files) {
      const key = normalize(file.name);
      const track = tracks.find((t) => normalize(t.title) === key);
      if (!track) {
        results.push(`${file.name} — no track matches`);
        continue;
      }
      try {
        const duration = await readDuration(file);
        await uploadIntakeFile({
          file,
          kind: "audio",
          releaseId: track.release_id,
          trackId: track.id,
          duration,
        });
        results.push(`${file.name} → ${track.title}`);
      } catch (err) {
        results.push(`${file.name} — upload failed`);
      }
    }
    setLog(results);
    setBusy(false);
    await onUpdated?.();
  };

  return (
    <div className="hud-panel rounded-sm">
      <div className="flex items-center justify-between border-b border-amber/10 px-4 py-2.5">
        <MicroLabel>Batch intake · by filename</MicroLabel>
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
          {busy ? "Matching…" : "Private"}
        </span>
      </div>
      <div className="px-4 py-4">
        <p className="text-[11px] leading-relaxed text-foreground/55">
          Drop the files you tagged in Picard. Each one is matched to a track by its filename —
          track numbers and punctuation are ignored.
        </p>
        <label className="mt-3 flex cursor-pointer items-center justify-center rounded-sm border border-dashed border-amber/25 px-3 py-3 font-mono text-[9px] uppercase tracking-[0.2em] text-amber/80 transition-colors hover:bg-amber/[0.06]">
          Select audio files
          <input
            type="file"
            accept="audio/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {log.length ? (
        <div className="max-h-40 space-y-1 overflow-y-auto border-t border-amber/10 px-4 py-2.5 font-mono text-[9px] leading-relaxed text-muted-foreground">
          {log.map((line, i) => (
            <p key={i} className={line.includes("→") ? "text-amber/75" : "text-destructive/80"}>
              {line}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}