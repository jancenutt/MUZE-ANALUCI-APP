// One numbered section of a clause-based legal document (Website Terms, Privacy Policy).
export default function ClauseSection({ section }) {
  return (
    <section id={section.id} className="scroll-mt-28 border-t border-amber/10 pt-6">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[10px] tracking-[0.2em] text-amber/60">
          {String(section.no).padStart(2, "0")}
        </span>
        <h2 className="font-display text-base font-light leading-snug text-foreground sm:text-lg">
          {section.title}
        </h2>
      </div>
      <div className="mt-3 space-y-2.5">
        {section.clauses.map((clause) => (
          <p
            key={clause.code}
            className={
              clause.caps
                ? "text-[12px] font-medium uppercase leading-relaxed tracking-[0.03em] text-foreground/85"
                : "text-[13px] leading-relaxed text-foreground/70"
            }
          >
            <span className="mr-2 font-mono text-[9px] tracking-[0.1em] text-amber/45">
              {clause.code}
            </span>
            {clause.text}
          </p>
        ))}
      </div>
    </section>
  );
}