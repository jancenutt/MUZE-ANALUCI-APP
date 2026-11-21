const BLOCK_CLASS = {
  p: "text-[13px] leading-relaxed text-foreground/70",
  def: "text-[13px] leading-relaxed text-foreground/70",
  caps: "text-[12px] font-medium uppercase leading-relaxed tracking-[0.03em] text-foreground/85",
};

export default function TermsSection({ section }) {
  return (
    <section
      id={section.id}
      className="scroll-mt-28 border-t border-amber/10 pt-6"
    >
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[10px] tracking-[0.2em] text-amber/60">
          {String(section.no).padStart(2, "0")}
        </span>
        <h2 className="font-display text-base font-light leading-snug text-foreground sm:text-lg">
          {section.title}
        </h2>
      </div>
      <div className="mt-3 space-y-3">
        {section.body.map((block, index) => (
          <p key={index} className={BLOCK_CLASS[block.kind] || BLOCK_CLASS.p}>
            {block.term ? (
              <span className="font-medium text-foreground/90">{block.term} </span>
            ) : null}
            {block.text}
          </p>
        ))}
      </div>
    </section>
  );
}