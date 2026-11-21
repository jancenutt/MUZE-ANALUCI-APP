import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Mail, Send, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MicroLabel from "@/components/MicroLabel";
import useEntitlement from "@/hooks/useEntitlement";

// Files never come from this site: every button here asks the server to email the drop to
// the member's signup address. `send-drop` re-checks the membership before it sends.
export default function LibraryPanel() {
  const { hasDrops, hasFullLibrary, hasOwnership, isBeta } = useEntitlement();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  const load = async () => {
    try {
      const me = await base44.auth.me().catch(() => null);
      if (!me) {
        setItems([]);
        return;
      }
      const page = await base44.entities.LibraryItem.filter(
        { app_user_id: me.id },
        { sort: "-created_date", limit: 100 }
      );
      setItems(page.items || []);
    } catch (err) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const run = async (key, payload, success) => {
    setBusy(key);
    setNotice("");
    setError("");
    try {
      const res = await base44.functions.invoke("send-drop", payload);
      setNotice(success(res?.data));
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || "That delivery couldn't be sent.");
    } finally {
      setBusy("");
    }
  };

  const resend = (item) => {
    setBusy(item.id);
    setNotice("");
    setError("");
    base44.functions
      .invoke("send-drop", { scope: "drop", releaseId: item.release_id })
      .then(() => {
        setNotice(`Sent to ${item.user_email}.`);
        return load();
      })
      .catch((err) => {
        setError(err?.response?.data?.error || "That delivery couldn't be sent.");
      })
      .finally(() => setBusy(""));
  };

  return (
    <div className="hud-panel rounded-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <MicroLabel>Library</MicroLabel>
        <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
          Files arrive by email
        </span>
      </div>

      {loading ? (
        <div className="mt-6 flex justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-amber" />
        </div>
      ) : items.length ? (
        <div className="mt-4 divide-y divide-white/[0.05]">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground/85">{item.release_title}</p>
                <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                  {item.release_month || "—"} · {item.content_type || "audio"}
                  {item.delivered_at
                    ? ` · delivered ${new Date(item.delivered_at).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
              {isBeta ? null : (
                <button
                  type="button"
                  onClick={() => resend(item)}
                  disabled={Boolean(busy)}
                  className="flex shrink-0 items-center gap-1.5 rounded-sm border border-amber/25 px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.14em] text-amber/90 transition-colors hover:bg-amber/10 disabled:opacity-50"
                >
                  {busy === item.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Mail className="h-3 w-3" />
                  )}
                  Resend to my email
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs leading-relaxed text-foreground/55">
          {hasDrops
            ? "No drops have landed yet. Every drop in a month you pay for appears here, and can be re-sent by email forever."
            : "Drops start at the Enthusiast Club. Interested Party memberships stream only. "}
          {!hasDrops ? (
            <Link to="/membership" className="text-amber/80 hover:text-amber">
              See memberships
            </Link>
          ) : null}
        </p>
      )}

      {isBeta ? (
        <p className="mt-4 rounded-sm border border-amber/15 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          Email delivery opens once the beta ends. Everything streams in the player until then.
        </p>
      ) : null}

      {hasFullLibrary && !isBeta ? (
        <button
          type="button"
          onClick={() =>
            run("full", { scope: "full-library" }, (data) =>
              data?.sent
                ? `${data.sent} drop${data.sent === 1 ? "" : "s"} emailed. Request again for the rest.`
                : "No drops have files in storage yet."
            )
          }
          disabled={Boolean(busy)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-sm border border-amber/30 px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.16em] text-amber/90 transition-colors hover:bg-amber/10 disabled:opacity-50"
        >
          {busy === "full" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Send className="h-3 w-3" />
          )}
          Request Full Library
        </button>
      ) : null}

      {hasOwnership ? (
        confirming ? (
          <div className="mt-4 rounded-sm border border-amber/25 bg-amber/[0.04] p-3">
            <p className="text-[11px] leading-relaxed text-foreground/65">
              Ownership can move to another person, entity, or trust. This notifies the admin to
              complete the transfer.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  run("transfer", { scope: "transfer" }, () => "Admin notified of the transfer.");
                }}
                disabled={Boolean(busy)}
                className="flex flex-1 items-center justify-center gap-2 rounded-sm bg-amber px-3 py-2 font-mono text-[8px] uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-amber/90 disabled:opacity-50"
              >
                {busy === "transfer" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ShieldCheck className="h-3 w-3" />
                )}
                Notify admin
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-sm border border-amber/20 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={Boolean(busy)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-sm border border-amber/20 px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <ShieldCheck className="h-3 w-3" />
            Transfer Ownership
          </button>
        )
      ) : null}

      {notice ? (
        <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-amber/80">{notice}</p>
      ) : null}
      {error ? (
        <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}