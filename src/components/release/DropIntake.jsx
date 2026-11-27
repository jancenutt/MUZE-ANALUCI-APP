import { useState } from "react";
import { Loader2, Package } from "lucide-react";
import { uploadIntakeFile } from "@/lib/intake";
import MicroLabel from "@/components/MicroLabel";

// The drop package is the ZIP that emails go out with. Uploaded privately, never served
// from the site: the delivery function signs a one-hour link for each member's email.
export default function DropIntake({ release, onUpdated }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file) => {
    if (!file || !release) return;
    setBusy(true);
    setError("");
    try {
      await uploadIntakeFile({ file, kind: "drop", releaseId: release.id });
      await onUpdated();
    } catch (err) {
      setError("Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="hud-panel rounded-sm px-4 py-4">
      <MicroLabel>Drop package</MicroLabel>
      <p className="mt-2 text-xs leading-relaxed text-foreground/55">
        {release?.drop_uri
          ? "Package attached. Drop emails link straight to it."
          : "No package yet. Drop emails fall back to the release's first stored file."}
      </p>
      <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-sm border border-amber/30 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-amber/90 transition-colors hover:bg-amber/10">
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Package className="h-3 w-3" />}
        {busy ? "Uploading…" : release?.drop_uri ? "Replace package" : "Upload ZIP"}
        <input
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={(event) => upload(event.target.files?.[0])}
        />
      </label>
      {error ? (
        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}