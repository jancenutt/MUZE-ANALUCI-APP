import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import MicroLabel from "@/components/MicroLabel";
import { CHAIN } from "@/lib/brand";

function ChainLink({ link }) {
  const className =
    "mt-4 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-amber/80 transition-colors hover:text-amber";
  if (link.href) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
        {link.label} <ArrowUpRight className="h-3 w-3" />
      </a>
    );
  }
  return (
    <Link to={link.to} className={className}>
      {link.label} <ArrowUpRight className="h-3 w-3" />
    </Link>
  );
}

export default function BrandChain() {
  return (
    <section>
      <MicroLabel>The connection</MicroLabel>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {CHAIN.map((node) => (
          <article key={node.no} className="hud-panel flex flex-col rounded-sm p-5">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[9px] tracking-[0.24em] text-amber/50">{node.no}</span>
              <span className="h-px w-8 bg-amber/25" />
            </div>
            <h3 className="mt-3 font-display text-xl font-light tracking-[0.03em] text-foreground">
              {node.name}
            </h3>
            <p className="mt-1.5 font-mono text-[8px] uppercase leading-relaxed tracking-[0.2em] text-amber/60">
              {node.role}
            </p>
            <p className="mt-4 flex-1 text-xs leading-relaxed text-foreground/60">{node.body}</p>
            <ChainLink link={node.link} />
          </article>
        ))}
      </div>
    </section>
  );
}