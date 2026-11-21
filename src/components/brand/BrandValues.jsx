import { VALUES } from "@/lib/brand";

export default function BrandValues() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {VALUES.map((value, index) => (
        <article key={value.label} className="rounded-sm border border-amber/10 bg-white/[0.015] p-5">
          <p className="font-mono text-[9px] tracking-[0.24em] text-amber/45">
            {String(index + 1).padStart(2, "0")}
          </p>
          <h3 className="mt-2 font-display text-base font-light tracking-[0.03em] text-foreground">
            {value.label}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-foreground/60">{value.body}</p>
        </article>
      ))}
    </div>
  );
}