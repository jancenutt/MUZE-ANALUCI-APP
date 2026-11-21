import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MicroLabel from "@/components/MicroLabel";

export default function PurchaseTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const page = await base44.entities.Base44Purchase.filter(
        {},
        { sort: "-created_date", limit: 50 }
      );
      setRows(page.items || []);
    } catch (err) {
      setError("Could not load purchases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (row, status) => {
    setBusy(row.id);
    try {
      await base44.entities.Base44Purchase.update(row.id, {
        status,
        ...(status === "canceled" ? { canceledAt: new Date().toISOString() } : {}),
      });
      await load();
    } catch (err) {
      setError("Could not update that purchase.");
    } finally {
      setBusy("");
    }
  };

  return (
    <section>
      <MicroLabel>Subscriptions &amp; purchases</MicroLabel>
      <p className="mt-2 text-xs leading-relaxed text-foreground/55">
        Every checkout on the app, newest first. Canceling a record revokes that account&apos;s
        access immediately.
      </p>

      {loading ? (
        <Loader2 className="mt-4 h-4 w-4 animate-spin text-amber" />
      ) : (
        <div className="mt-4 divide-y divide-white/[0.05]">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-xs text-foreground/85">
                  {row.productName || row.productId}
                </p>
                <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                  {row.buyerEmail || "no email"} ·{" "}
                  {new Date(row.created_date).toLocaleDateString()} · {row.status}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-amber/80">
                  {row.amount ? `$${row.amount}` : "—"}
                </span>
                <button
                  onClick={() => setStatus(row, row.status === "canceled" ? "paid" : "canceled")}
                  disabled={busy === row.id}
                  className={`rounded-sm border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.16em] disabled:opacity-40 ${
                    row.status === "canceled"
                      ? "border-amber/30 text-amber/85"
                      : "border-white/[0.1] text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {row.status === "canceled" ? "Reactivate" : "Cancel"}
                </button>
              </div>
            </div>
          ))}
          {!rows.length ? (
            <p className="py-3 text-xs text-muted-foreground">No purchases yet.</p>
          ) : null}
        </div>
      )}

      {error ? (
        <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-destructive">{error}</p>
      ) : null}
    </section>
  );
}