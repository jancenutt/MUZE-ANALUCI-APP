import { Link } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import MicroLabel from "@/components/MicroLabel";
import { TERMS_EFFECTIVE_DATE, TERMS_VERSION } from "@/content/membershipTerms";

const linkClass = "text-primary underline underline-offset-2";

// Beta access is granted only after the acceptance is ticked; the consent log records it.
export default function BetaAcceptance({ accepted, onChange, onConfirm, busy }) {
  return (
    <div className="mt-6 space-y-4">
      <MicroLabel>Required before access</MicroLabel>
      <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-amber/20 p-4">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
        />
        <span className="text-[11px] leading-relaxed text-foreground/70">
          I have read and agree to the{" "}
          <Link to="/terms" target="_blank" rel="noreferrer" className={linkClass}>
            Membership Terms, Conditions &amp; License Agreement
          </Link>{" "}
          (version {TERMS_VERSION}, effective {TERMS_EFFECTIVE_DATE}), including Section 21 on beta
          and complimentary access, the{" "}
          <Link to="/terms-of-use" target="_blank" rel="noreferrer" className={linkClass}>
            Website Terms of Use
          </Link>{" "}
          and the{" "}
          <Link to="/privacy" target="_blank" rel="noreferrer" className={linkClass}>
            Privacy Policy
          </Link>
          . I understand beta access is complimentary, has no cash value, is revocable, and that any
          purchase I make is still governed by those Terms and is non-refundable. My own mobile or
          internet provider&apos;s rates and data charges may apply.
        </span>
      </label>
      <button
        type="button"
        onClick={onConfirm}
        disabled={!accepted || busy}
        className="flex items-center justify-center gap-2 rounded-sm bg-amber px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-amber/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ShieldCheck className="h-3.5 w-3.5" />
        )}
        {busy ? "Activating" : "Activate 100K beta access"}
      </button>
    </div>
  );
}