import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MicroLabel from "@/components/MicroLabel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const randomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export default function CodeManager() {
  const [codes, setCodes] = useState([]);
  const [products, setProducts] = useState([]);
  const [draft, setDraft] = useState({ code: "", label: "", productId: "", maxUses: 1 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [codePage, productPage] = await Promise.all([
        base44.entities.AccessCode.filter({}, { sort: "-created_date", limit: 100 }),
        base44.entities.Product.filter({}, { sort: "sort", limit: 100 }),
      ]);
      setCodes(codePage.items || []);
      setProducts(productPage.items || []);
      if (!draft.productId && productPage.items?.length) {
        setDraft((prev) => ({ ...prev, productId: productPage.items[0].key }));
      }
    } catch (err) {
      setError("Could not load access codes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async (event) => {
    event.preventDefault();
    setError("");
    const code = draft.code.trim().toUpperCase();
    if (!code) {
      setError("Enter a code.");
      return;
    }
    const product = products.find((row) => row.key === draft.productId);
    setBusy("new");
    try {
      await base44.entities.AccessCode.create({
        code,
        label: draft.label.trim(),
        productId: product?.key || "",
        productName: product?.name || draft.label.trim() || "Access pass",
        active: true,
        maxUses: Math.max(1, Number(draft.maxUses) || 1),
        uses: 0,
      });
      setDraft({ code: "", label: "", productId: product?.key || "", maxUses: 1 });
      await load();
    } catch (err) {
      setError("Could not create that code.");
    } finally {
      setBusy("");
    }
  };

  const toggle = async (row) => {
    setBusy(row.id);
    try {
      await base44.entities.AccessCode.update(row.id, { active: row.active === false });
      await load();
    } catch (err) {
      setError("Could not update that code.");
    } finally {
      setBusy("");
    }
  };

  const remove = async (row) => {
    setBusy(row.id);
    try {
      await base44.entities.AccessCode.delete(row.id);
      await load();
    } catch (err) {
      setError("Could not delete that code.");
    } finally {
      setBusy("");
    }
  };

  return (
    <section>
      <MicroLabel>Access codes</MicroLabel>
      <p className="mt-2 text-xs leading-relaxed text-foreground/55">
        Codes customers redeem on the membership page to unlock access without a charge.
      </p>

      <form onSubmit={create} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1.2fr_1.2fr_.5fr_auto]">
        <div className="flex gap-1">
          <input
            value={draft.code}
            onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
            placeholder="CODE"
            className="w-full rounded-sm border border-white/[0.08] bg-background/60 px-2 py-1.5 font-mono text-[10px] uppercase text-foreground focus:border-amber/40 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setDraft({ ...draft, code: randomCode() })}
            className="shrink-0 rounded-sm border border-white/[0.1] px-2 font-mono text-[8px] uppercase text-muted-foreground hover:text-amber"
          >
            Gen
          </button>
        </div>
        <input
          value={draft.label}
          onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          placeholder="Label (internal)"
          className="rounded-sm border border-white/[0.08] bg-background/60 px-2 py-1.5 text-xs text-foreground focus:border-amber/40 focus:outline-none"
        />
        <Select
          value={draft.productId || "none"}
          onValueChange={(value) =>
            setDraft({ ...draft, productId: value === "none" ? "" : value })
          }
        >
          <SelectTrigger className="h-auto rounded-sm border-white/[0.08] bg-background/60 px-2 py-1.5 font-mono text-[10px] uppercase text-foreground focus:border-amber/40 focus:outline-none focus:ring-0">
            <SelectValue placeholder="— no product —" />
          </SelectTrigger>
          <SelectContent className="hud-panel rounded-sm border-amber/25">
            <SelectItem
              value="none"
              className="font-mono text-[10px] uppercase text-muted-foreground focus:bg-amber/15 focus:text-amber"
            >
              — no product —
            </SelectItem>
            {products.map((product) => (
              <SelectItem
                key={product.key}
                value={product.key}
                className="font-mono text-[10px] uppercase focus:bg-amber/15 focus:text-amber"
              >
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          type="number"
          min="1"
          value={draft.maxUses}
          onChange={(e) => setDraft({ ...draft, maxUses: e.target.value })}
          className="rounded-sm border border-white/[0.08] bg-background/60 px-2 py-1.5 text-xs text-foreground focus:border-amber/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy === "new"}
          className="flex items-center justify-center gap-1 rounded-sm bg-amber px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.18em] text-primary-foreground disabled:opacity-40"
        >
          {busy === "new" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          Create
        </button>
      </form>

      {loading ? (
        <Loader2 className="mt-4 h-4 w-4 animate-spin text-amber" />
      ) : (
        <div className="mt-4 divide-y divide-white/[0.05]">
          {codes.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <p className="font-mono text-[11px] tracking-[0.16em] text-amber/85">{row.code}</p>
                <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                  {row.productName || "—"} · {Number(row.uses) || 0}/{Number(row.maxUses) || 1} used
                  {row.label ? ` · ${row.label}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggle(row)}
                  disabled={busy === row.id}
                  className={`rounded-sm border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.16em] disabled:opacity-40 ${
                    row.active === false
                      ? "border-white/[0.1] text-muted-foreground"
                      : "border-amber/30 text-amber/85"
                  }`}
                >
                  {row.active === false ? "Off" : "Live"}
                </button>
                <button
                  onClick={() => remove(row)}
                  disabled={busy === row.id}
                  className="text-muted-foreground hover:text-destructive disabled:opacity-40"
                  aria-label="Delete code"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {!codes.length ? (
            <p className="py-3 text-xs text-muted-foreground">No codes yet.</p>
          ) : null}
        </div>
      )}

      {error ? (
        <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-destructive">{error}</p>
      ) : null}
    </section>
  );
}