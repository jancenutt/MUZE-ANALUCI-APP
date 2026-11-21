import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import MicroLabel from "@/components/MicroLabel";

function Row({ label, value, note, href, internal }) {
  const body = (
    <>
      <span className="min-w-0">
        <span className="block font-mono text-[11px] uppercase tracking-[0.18em] text-foreground">
          {label}
        </span>
        {note || value ? (
          <span className="mt-1 block truncate text-xs text-foreground/45">{note || value}</span>
        ) : null}
      </span>
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-amber/50 transition-colors group-hover:text-amber" />
    </>
  );

  const classes =
    "group flex items-center justify-between gap-4 border-b border-amber/10 px-4 py-3.5 transition-colors last:border-b-0 hover:bg-amber/[0.05]";

  if (internal) {
    return (
      <Link to={href} className={classes}>
        {body}
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
      {body}
    </a>
  );
}

export default function ProfileLinks({ title, links = [], internal = false }) {
  const visible = links.filter((link) => link.url);

  return (
    <div>
      <MicroLabel>{title}</MicroLabel>
      <div className="hud-panel mt-3 overflow-hidden rounded-sm">
        {visible.length ? (
          visible.map((link) => (
            <Row
              key={link.label}
              label={link.label}
              value={link.value}
              note={link.note}
              href={link.url}
              internal={internal}
            />
          ))
        ) : (
          <p className="px-4 py-8 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            No links added yet
          </p>
        )}
      </div>
    </div>
  );
}