import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MicroLabel from "@/components/MicroLabel";
import CloseButton from "@/components/CloseButton";
import BetaAcceptance from "@/components/beta/BetaAcceptance";
import useEntitlement, { refreshEntitlement } from "@/hooks/useEntitlement";
import { recordTermsAcceptance } from "@/lib/terms";
import { TERMS_VERSION } from "@/content/membershipTerms";
import { LEVEL } from "@/lib/tiers";

const DEFAULT_CODE = "ANALUCI100K";

// Private beta link: /join?code=XXXX — a tester signs up with their own email, accepts the
// Terms, and gets 100K Club level access on their own account. Never admin rights.
export default function Join() {
  const code = (new URLSearchParams(window.location.search).get("code") || DEFAULT_CODE)
    .trim()
    .toUpperCase();
  const { hasOwnership, loading, refresh } = useEntitlement();
  const [status, setStatus] = useState("checking");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const consentLogged = useRef(false);
  const joinPath = `/join?code=${encodeURIComponent(code)}`;
  const returnTo = encodeURIComponent(joinPath);

  useEffect(() => {
    let alive = true;
    (async () => {
      const me = await base44.auth.me().catch(() => null);
      if (!alive) return;
      if (!me) {
        setStatus("signed-out");
        return;
      }
      if (loading) return;
      setStatus(hasOwnership ? "done" : "terms");
    })();
    return () => {
      alive = false;
    };
  }, [loading, hasOwnership]);

  const activate = async () => {
    if (!accepted || busy) return;
    setBusy(true);
    setError("");
    try {
      const me = await base44.auth.me().catch(() => null);
      if (!me) {
        setStatus("signed-out");
        return;
      }
      if (!consentLogged.current) {
        await recordTermsAcceptance({ email: me.email, source: "checkout" });
        consentLogged.current = true;
      }
      await base44.functions.invoke("redeem-code", { code, termsVersion: TERMS_VERSION });
      // Beta has to land on the same top tier a paying 100K member holds — check the
      // purchase itself rather than assuming the code mapped correctly.
      const check = await base44.functions.invoke("my-entitlement", {});
      const granted = Number(check?.data?.level) || 0;
      if (granted < LEVEL.club100k) {
        throw new Error("Access was granted, but not at 100K level. Ask for a fresh beta link.");
      }
      await refresh();
      // The player mounted before the grant — tell every entitlement copy to re-read it.
      refreshEntitlement();
      setStatus("done");
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "That code couldn't be applied.");
      setStatus("error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col justify-center px-5 py-16 sm:px-8 sm:py-24">
      <div className="flex items-center justify-between gap-4">
        <MicroLabel>Beta access</MicroLabel>
        <CloseButton label="Close" />
      </div>
      <h1 className="mt-4 font-display text-3xl font-light leading-tight tracking-[0.03em] text-foreground sm:text-5xl">
        100K Club beta access
      </h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-foreground/60">
        This private link gives the account you sign in with the same 100K Club membership a paying
        100K member holds — every right, nothing reduced. You keep your own account and email; no
        admin tools are granted, and nothing here changes your role.
      </p>

      <div className="hud-panel mt-8 rounded-sm px-5 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <MicroLabel>Access code</MicroLabel>
          <span className="rounded-sm border border-amber/30 bg-amber/[0.08] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-amber">
            Beta · ANA.LUCI 100K Club
          </span>
        </div>

        {status === "checking" ? (
          <div className="mt-6 flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-amber" />
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Checking your access
            </p>
          </div>
        ) : null}

        {status === "signed-out" ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-foreground/60">
              Sign up with your own email and a password you choose — the code comes with this link.
              Creating the account requires accepting the Membership Terms.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                to={`/register?returnTo=${returnTo}`}
                className="flex flex-1 items-center justify-center rounded-sm bg-amber px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-amber/90"
              >
                Create my account
              </Link>
              <Link
                to={`/login?returnTo=${returnTo}`}
                className="flex flex-1 items-center justify-center rounded-sm border border-amber/30 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-amber/90 transition-colors hover:bg-amber/[0.08]"
              >
                I already have an account
              </Link>
            </div>
          </div>
        ) : null}

        {status === "terms" ? (
          <BetaAcceptance
            accepted={accepted}
            onChange={setAccepted}
            onConfirm={activate}
            busy={busy}
          />
        ) : null}

        {status === "done" ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-amber" />
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber">
                Full 100K beta access active
              </p>
            </div>
            <ul className="space-y-1.5 text-xs leading-relaxed text-foreground/65">
              {[
                "Stream the full archive — music videos and films included",
                "Ask ANA.LUCI about the catalog and the brand",
                "Transfer ownership to a person, entity, or trust",
                "Business, commercial and reuse rights",
                "Email drop delivery switches on when the beta ends",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-amber/70" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs leading-relaxed text-muted-foreground">
              You are signed in as a member on your own account — not an admin. The Terms you accepted
              still apply to anything you buy.
            </p>
            <Link
              to="/archive"
              className="inline-flex items-center justify-center rounded-sm bg-amber px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-amber/90"
            >
              Enter the archive
            </Link>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={activate}
              disabled={!accepted || busy}
              className="rounded-sm border border-amber/30 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-amber/90 transition-colors hover:bg-amber/[0.08] disabled:opacity-40"
            >
              Try again
            </button>
            <p className="text-xs text-muted-foreground/70">
              If the code is used up, ask for a fresh beta link.
            </p>
          </div>
        ) : null}
      </div>

      <p className="mt-6 text-[10px] leading-relaxed text-muted-foreground">
        Beta access is complimentary, has no cash value, and can be modified or withdrawn. It does not
        exempt you from the Membership Terms — any purchase is still governed by them and is
        non-refundable. Your mobile or internet provider&apos;s rates and data charges are yours.
      </p>
    </div>
  );
}