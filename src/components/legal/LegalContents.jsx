import { useEffect, useState } from "react";

const LINK_CLASS =
  "flex gap-2 border-l border-transparent py-1 pl-3 text-[11px] leading-snug text-muted-foreground transition-colors hover:text-amber";

const ACTIVE_CLASS =
  "flex gap-2 border-l border-amber bg-amber/[0.05] py-1 pl-3 text-[11px] leading-snug text-amber";

// Grouped index of the document, with the section you are reading kept highlighted.
export default function LegalContents({ groups, className = "" }) {
  const [active, setActive] = useState(groups[0]?.items?.[0]?.id || "");

  useEffect(() => {
    const nodes = groups
      .flatMap((group) => group.items.map((item) => item.id))
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!nodes.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-100px 0px -65% 0px", threshold: 0 }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [groups]);

  return (
    <nav aria-label="Contents" className={className}>
      <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.28em] text-amber/60">Contents</p>
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 pl-3 font-mono text-[8px] uppercase tracking-[0.2em] text-foreground/40">
              {group.label}
            </p>
            <ul>
              {group.items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={active === item.id ? ACTIVE_CLASS : LINK_CLASS}
                  >
                    <span className="w-5 shrink-0 font-mono text-[9px] tracking-[0.08em] text-amber/45">
                      {item.marker}
                    </span>
                    <span className="min-w-0">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}