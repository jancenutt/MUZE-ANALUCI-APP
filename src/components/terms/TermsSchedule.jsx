export default function TermsSchedule({ schedule }) {
  return (
    <section
      id={schedule.id}
      className="hud-panel scroll-mt-28 rounded-sm p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-amber/30 font-mono text-[11px] text-amber">
          {schedule.letter}
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-amber/60">
            Schedule {schedule.letter}
          </p>
          <h3 className="mt-1 font-display text-base font-light text-foreground">{schedule.title}</h3>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/60">
            {schedule.price}
          </p>
        </div>
      </div>
      <dl className="mt-4 space-y-2.5 border-t border-amber/10 pt-3">
        {schedule.lines.map((line) => (
          <div key={line.code} className="flex gap-3">
            <dt className="w-8 shrink-0 font-mono text-[9px] tracking-[0.14em] text-amber/50">
              {line.code}
            </dt>
            <dd className="text-[12px] leading-relaxed text-foreground/70">{line.text}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}