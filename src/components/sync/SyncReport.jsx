import { useMemo } from "react";
import MicroLabel from "@/components/MicroLabel";

function Stat({ label, value, accent = false }) {
  return (
    <div className="rounded-sm border border-amber/10 bg-background/40 px-3 py-2.5">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p
        className={`mt-1 font-display text-xl font-light ${
          accent && value ? "text-amber" : "text-foreground/80"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function SyncReport({ report }) {
  const changeRows = useMemo(() => {
    const rel = (report.samples?.releaseUpdates || []).map((r) => ({
      key: `rel-${r.id}`,
      scope: `Release ${r.num}`,
      current: r.title,
      next: Object.entries(r.patch)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · "),
    }));
    const trk = (report.samples?.trackUpdates || []).map((t) => ({
      key: `trk-${t.id}`,
      scope: `Track · Rel ${t.release_num ?? "—"}`,
      current: t.title,
      next: Object.entries(t.patch)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · "),
    }));
    return [...rel, ...trk];
  }, [report]);

  const unmatched = report.samples?.unmatched || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Releases · update" value={report.releases.updates} accent />
        <Stat label="Releases · new" value={report.releases.creates} accent />
        <Stat label="Tracks · update" value={report.tracks.updates} accent />
        <Stat label="Tracks · new" value={report.tracks.creates} accent />
      </div>

      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        Notion reading {report.counts.notionReleases} releases / {report.counts.notionTracks} tracks ·
        catalog holds {report.counts.catalogReleases} / {report.counts.catalogTracks}
      </p>

      {changeRows.length ? (
        <div className="overflow-hidden rounded-sm border border-amber/10">
          <div className="border-b border-amber/10 px-3 py-2">
            <MicroLabel>{report.dryRun ? "Pending changes" : "Applied changes"}</MicroLabel>
          </div>
          <div className="max-h-72 divide-y divide-white/[0.04] overflow-y-auto">
            {changeRows.map((row) => (
              <div key={row.key} className="px-3 py-2">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-amber/60">
                  {row.scope}
                </p>
                <p className="mt-0.5 truncate text-xs text-foreground/45 line-through">{row.current}</p>
                <p className="truncate text-xs text-foreground/85">{row.next}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="rounded-sm border border-amber/10 px-3 py-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Catalog already matches Notion
        </p>
      )}

      {unmatched.length ? (
        <div className="rounded-sm border border-amber/10 px-3 py-3">
          <MicroLabel>Needs a link in Notion</MicroLabel>
          <ul className="mt-2 space-y-1">
            {unmatched.map((item, i) => (
              <li key={`${item.row}-${i}`} className="text-xs text-foreground/55">
                <span className="text-foreground/80">{item.row}</span> — {item.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}