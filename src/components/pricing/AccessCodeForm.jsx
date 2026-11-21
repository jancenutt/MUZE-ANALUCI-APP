import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { refreshEntitlement } from "@/hooks/useEntitlement";
import MicroLabel from "@/components/MicroLabel";

// Developer / promo codes, validated server-side by the redeem-code function.
export default function AccessCodeForm({ onRedeemed }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const me = await base44.auth.me().catch(() => null);
      if (!me) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      const res = await base44.functions.invoke("redeem-code", { code });
      refreshEntitlement();
      setMessage(`${res?.data?.productName || "Access"} unlocked on your account.`);
      setCode("");
      onRedeemed?.();
    } catch (err) {
      setError(err?.response?.data?.error || "That code could not be redeemed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="hud-panel rounded-sm p-5">
      <MicroLabel>Access code</MicroLabel>
      <p className="mt-3 text-xs leading-relaxed text-foreground/55">
        Have a developer or promo code? Redeem it here to unlock membership on your account.
      </p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ENTER CODE"
          className="w-full rounded-sm border border-amber/20 bg-background/60 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-foreground placeholder:text-muted-foreground/50 focus:border-amber/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="flex items-center justify-center gap-2 rounded-sm border border-amber/30 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.22em] text-amber/90 transition-colors hover:bg-amber/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <KeyRound className="h-3 w-3" />}
          Redeem
        </button>
      </form>
      {message ? (
        <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-amber/80">{message}</p>
      ) : null}
      {error ? (
        <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-destructive">{error}</p>
      ) : null}
    </div>
  );
}