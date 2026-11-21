import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { readAudioDuration } from "@/lib/audioMeta";

// Owner-only shortcut that sits exactly where the "Coming soon" marker shows on the public
// side: attach a master to this track and it becomes playable everywhere.
export default function TrackAudioUpload({ track, onUpdated, label = "Attach audio", className = "" }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const attach = async (file) => {
    if (!file) return;
    setBusy(true);
    setFailed(false);
    try {
      const duration = await readAudioDuration(file);
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      await base44.entities.Track.update(track.id, {
        audio_uri: file_uri,
        has_audio: true,
        is_demo: false,
        duration,
      });
      await onUpdated?.();
    } catch (err) {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <label
      title={`Attach an audio file to ${track.title}`}
      className={`flex shrink-0 cursor-pointer items-center gap-1.5 border border-amber/30 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.16em] text-amber/85 transition-colors hover:bg-amber/10 ${className}`}
    >
      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
      {busy ? "Uploading" : failed ? "Retry" : label}
      <input
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          attach(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </label>
  );
}