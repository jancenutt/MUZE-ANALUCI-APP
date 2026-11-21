import { Link } from "react-router-dom";
import { Check, Lock, X } from "lucide-react";
import { usePlayer } from "@/lib/player";
import MicroLabel from "@/components/MicroLabel";
import { MEMBERSHIPS } from "@/lib/memberships";

export default function PaywallModal() {
  const { paywallOpen, closePaywall } = usePlayer();
  if (!paywallOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-background/80 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0">
      <div className="hud-panel hud-glow relative w-full max-w-lg rounded-sm p-6 sm:p-8">
        <button
          type="button"
          onClick={closePaywall}
          aria-label="Close"
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-amber" />
          <MicroLabel>Membership required</MicroLabel>
        </div>

        <h2 className="mt-4 font-display text-2xl font-light leading-tight tracking-[0.03em] text-foreground">
          Streaming is for members
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/60">
          Browsing the archive is open to everyone. Pressing play needs one of the five memberships.
        </p>

        <div className="mt-5 space-y-2">
          {MEMBERSHIPS.map((membership) => {
            const plan = membership.plans[0];
            return (
              <div
                key={membership.id}
                className="flex items-center justify-between gap-3 rounded-sm border border-amber/12 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{membership.name}</p>
                  <p className="truncate font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                    ${plan.price} {plan.unit === "one time" ? "one time" : `per ${plan.unit}`}
                    {membership.plans.length > 1 ? " · or yearly" : ""}
                  </p>
                </div>
                <Check className="h-3.5 w-3.5 shrink-0 text-amber/70" />
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            to="/membership"
            onClick={closePaywall}
            className="flex flex-1 items-center justify-center rounded-sm bg-amber px-5 py-3 font-mono text-[10px] uppercase tracking-[0.24em] text-primary-foreground transition-colors hover:bg-amber/90"
          >
            See memberships
          </Link>
          <button
            type="button"
            onClick={closePaywall}
            className="flex-1 rounded-sm border border-amber/20 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}