import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/products";
import { NO_ADS_LINE, RIGHTS_LINE } from "@/lib/memberships";

// The terms step before every checkout. Members must see the ownership line and the
// no-ads line, and tick the box, before Base44 Payments is asked to start a session.
export default function CheckoutTerms({ pending, products, busy, error, onClose, onConfirm }) {
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    setAgreed(false);
  }, [pending?.plan?.key]);

  if (!pending) return null;

  const { membership, plan } = pending;
  const product = products.find((row) => row.key === plan.key) || null;
  const price = product?.price ?? plan.price;

  return (
    <Dialog open onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent className="max-w-md rounded-sm border-amber/20 bg-background">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-light leading-tight text-foreground">
            {membership.name}
          </DialogTitle>
        </DialogHeader>

        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber/80">
          ${formatPrice(price)} {plan.unit === "one time" ? "one time" : `per ${plan.unit}`}
        </p>

        <div className="space-y-3 border-t border-amber/10 pt-3">
          <p className="text-[11px] leading-relaxed text-foreground/65">{RIGHTS_LINE}</p>
          <p className="text-[11px] leading-relaxed text-foreground/65">{NO_ADS_LINE}</p>
          <p className="text-[11px] leading-relaxed text-foreground/65">
            Files arrive by email, never from this site — the player streams only.
          </p>
        </div>

        <a
          href="/terms"
          target="_blank"
          rel="noreferrer"
          className="block font-mono text-[9px] uppercase tracking-[0.16em] text-amber/80 underline decoration-amber/30 underline-offset-4 transition-colors hover:text-amber"
        >
          Read the Membership Terms & License Agreement
        </a>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-sm border border-amber/15 p-3">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
          />
          <span className="text-[11px] leading-relaxed text-foreground/70">
            I understand ownership never includes reuse, redistribution, or commercial rights —
            those belong to the 100K Club only.
          </span>
        </label>

        {error ? (
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-destructive">{error}</p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!agreed || Boolean(busy)}
            className="flex flex-1 items-center justify-center gap-2 rounded-sm bg-amber px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-amber/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Continue to checkout
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-sm border border-amber/20 px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}