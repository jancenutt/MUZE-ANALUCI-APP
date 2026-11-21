import { Link } from "react-router-dom";
import CloseButton from "@/components/CloseButton";
import MicroLabel from "@/components/MicroLabel";
import LegalContents from "@/components/legal/LegalContents";
import { DATA_RATES_NOTICE, LEGAL_DOCS } from "@/lib/legalDocs";

// Shared frame for the three legal documents: title block, document switcher,
// grouped contents, and the body passed in as children.
export default function LegalShell({
  docKey,
  eyebrow,
  headline,
  subhead,
  meta = [],
  notice,
  groups,
  children,
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="flex items-start justify-between gap-3">
        <div>
          <MicroLabel>{eyebrow}</MicroLabel>
          <h1 className="mt-3 max-w-2xl font-display text-2xl font-light leading-tight text-foreground sm:text-3xl">
            {headline}
          </h1>
          <p className="mt-3 max-w-2xl text-[12px] leading-relaxed text-foreground/60">{subhead}</p>
        </div>
        <CloseButton fallback="/" label="Close document" />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        {meta.map((item, index) => (
          <span key={item} className="flex items-center gap-3">
            {index > 0 ? <span className="text-amber/40">·</span> : null}
            {item}
          </span>
        ))}
      </div>

      <nav
        aria-label="Legal documents"
        className="mt-7 flex flex-wrap gap-2 border-b border-amber/10 pb-3"
      >
        {LEGAL_DOCS.map((doc) => {
          const active = doc.key === docKey;
          return (
            <Link
              key={doc.key}
              to={doc.path}
              aria-current={active ? "page" : undefined}
              className={`border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.18em] transition-colors ${
                active
                  ? "border-amber/40 bg-amber/10 text-amber"
                  : "border-white/10 text-muted-foreground hover:border-amber/25 hover:text-foreground"
              }`}
            >
              {doc.short}
            </Link>
          );
        })}
      </nav>

      {notice ? (
        <div className="mt-6 border border-amber/30 bg-amber/[0.06] p-4">
          <p className="text-[11px] font-medium uppercase leading-relaxed tracking-[0.06em] text-amber">
            {notice}
          </p>
        </div>
      ) : null}

      <details className="mt-6 border border-amber/15 p-4 lg:hidden">
        <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.24em] text-amber/70">
          Contents
        </summary>
        <LegalContents groups={groups} className="mt-3" />
      </details>

      <div className="mt-8 gap-10 lg:grid lg:grid-cols-[248px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-28 max-h-[calc(100vh-9rem)] overflow-y-auto pr-3 no-scrollbar">
            <LegalContents groups={groups} />
          </div>
        </aside>

        <div className="selectable min-w-0">
          {children}
          <div className="mt-10 border-t border-amber/10 pt-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70">
              {DATA_RATES_NOTICE}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}