import MicroLabel from "@/components/MicroLabel";
import { padNumber } from "@/lib/format";

function Row({ label, value, mono = true }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 py-2 last:border-0">
      <MicroLabel className="pt-0.5">{label}</MicroLabel>
      <span
        className={`max-w-[62%] break-words text-right text-xs ${
          mono ? "font-mono tracking-[0.06em] text-foreground/85" : "text-foreground/85"
        }`}
      >
        {value || "—"}
      </span>
    </div>
  );
}

export default function ReleaseMeta({ release }) {
  return (
    <div className="hud-panel rounded-sm px-4 py-3">
      <Row label="Catalog" value={`NO. ${padNumber(release.num)}`} />
      <Row label="Artist" value={release.artist} />
      <Row label="Format" value={release.type} />
      <Row label="Date" value={release.date} />
      <Row label="UPC" value={release.upc} />
      <Row label="Release ID" value={release.release_id} />
      <Row label="Tracks" value={String(release.track_count ?? "—")} />
    </div>
  );
}