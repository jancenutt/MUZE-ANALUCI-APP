import { useState } from "react";
import { Check, Loader2, Minus } from "lucide-react";
import MicroLabel from "@/components/MicroLabel";
import { formatPrice } from "@/lib/products";
import { RIGHTS_LINE } from "@/lib/memberships";

export default function MembershipCard({ membership, products, busy, onJoin }) {
  const plans = membership.plans;
  const [index, setIndex] = useState(0);
  const plan = plans[index] || plans[0];
  const product = products.find((row) => row.key === plan.key) || null;
  const price = product?.price ?? plan.price;

  return (
    <div
      className={`hud-panel flex flex-col rounded-sm p-5 ${
        membership.featured ? "border-amber/40 hud-glow" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <MicroLabel>{membership.kicker}</MicroLabel>
        {membership.featured ? (
          <span className="rounded-sm bg-amber px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-primary-foreground">
            Most chosen
          </span>
        ) : null}
      </div>

      <h3 className="mt-2 font-display text-xl font-light leading-tight tracking-[0.02em] text-foreground">
        {membership.name}
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-foreground/55">{membership.summary}</p>

      {plans.length > 1 ? (
        <div className="mt-4 flex items-center gap-1 rounded-sm border border-amber/15 p-1">
          {plans.map((option, optionIndex) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setIndex(optionIndex)}
              className={`flex-1 rounded-sm px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] transition-colors ${
                index === optionIndex
                  ? "bg-amber/10 text-amber"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-display text-3xl font-light text-amber">${formatPrice(price)}</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
          {plan.unit === "one time" ? "one time" : `per ${plan.unit}`}
        </span>
      </div>
      {plan.save ? (
        <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.16em] text-amber/70">
          {plan.save}
        </p>
      ) : null}

      <ul className="mt-4 flex-1 space-y-2">
        {membership.features.map((feature) => (
          <li key={feature} className="flex gap-2 text-[11px] leading-relaxed text-foreground/70">
            <Check className="mt-0.5 h-3 w-3 shrink-0 text-amber/80" />
            <span>{feature}</span>
          </li>
        ))}
        {membership.excluded.map((feature) => (
          <li key={feature} className="flex gap-2 text-[11px] leading-relaxed text-foreground/35">
            <Minus className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/40" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onJoin(membership, plan)}
        disabled={Boolean(busy)}
        className={`mt-5 flex w-full items-center justify-center gap-1.5 rounded-sm px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.18em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          membership.featured || membership.ownership
            ? "bg-amber text-primary-foreground hover:bg-amber/90"
            : "border border-amber/30 text-amber/90 hover:bg-amber/[0.08]"
        }`}
      >
        {busy === plan.key ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
        Join {membership.name}
      </button>

      <p className="mt-4 border-t border-amber/10 pt-3 font-mono text-[8px] uppercase leading-relaxed tracking-[0.1em] text-muted-foreground/65">
        {RIGHTS_LINE}
      </p>
    </div>
  );
}