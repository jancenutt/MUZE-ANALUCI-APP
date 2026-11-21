import { useEffect, useState } from "react";
import { Loader2, Plus, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MicroLabel from "@/components/MicroLabel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INTERVALS = ["WEEK", "MONTH", "YEAR", "ONE_TIME"];
const TIERS = ["stream", "full", "lifetime"];
const BLANK = { key: "", name: "", price: "", interval: "MONTH", tier: "stream", sort: 50 };

export default function ProductEditor() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(BLANK);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const { items } = await base44.entities.Product.filter({}, { sort: "sort", limit: 100 });
      setRows(items || []);
    } catch (err) {
      setError("Could not load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const patch = (id, changes) =>
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...changes } : row)));

  const save = async (row) => {
    setBusy(row.id);
    setError("");
    try {
      await base44.entities.Product.update(row.id, {
        name: row.name,
        price: String(row.price),
        interval: row.interval,
        active: row.active !== false,
      });
    } catch (err) {
      setError("Could not save that product.");
    } finally {
      setBusy("");
    }
  };

  const create = async (event) => {
    event.preventDefault();
    setError("");
    if (!draft.key.trim() || !draft.name.trim() || !draft.price.trim()) {
      setError("Key, name and price are required.");
      return;
    }
    setBusy("new");
    try {
      await base44.entities.Product.create({
        ...draft,
        key: draft.key.trim(),
        price: draft.price.trim(),
        active: true,
        sort: Number(draft.sort) || 50,
      });
      setDraft(BLANK);
      await load();
    } catch (err) {
      setError("Could not create that product.");
    } finally {
      setBusy("");
    }
  };

  return (
    <section>
      <MicroLabel>Products</MicroLabel>
      <p className="mt-2 text-xs leading-relaxed text-foreground/55">
        Names, prices and billing intervals here are what checkout charges. Changes apply on the
        next purchase.
      </p>

      {loading ? (
        <Loader2 className="mt-4 h-4 w-4 animate-spin text-amber" />
      ) : (
        <div className="mt-4 space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="grid items-center gap-2 rounded-sm border border-white/[0.06] px-3 py-2 sm:grid-cols-[1.2fr_1.3fr_.6fr_.8fr_auto_auto]"
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-amber/60">
                {row.key}
              </span>
              <input
                value={row.name || ""}
                onChange={(e) => patch(row.id, { name: e.target.value })}
                className="rounded-sm border border-white/[0.08] bg-background/60 px-2 py-1.5 text-xs text-foreground focus:border-amber/40 focus:outline-none"
              />
              <input
                value={row.price || ""}
                onChange={(e) => patch(row.id, { price: e.target.value })}
                className="rounded-sm border border-white/[0.08] bg-background/60 px-2 py-1.5 font-mono text-xs text-foreground focus:border-amber/40 focus:outline-none"
              />
              <Select
                value={row.interval || "MONTH"}
                onValueChange={(value) => patch(row.id, { interval: value })}
              >
                <SelectTrigger className="h-auto rounded-sm border-white/[0.08] bg-background/60 px-2 py-1.5 font-mono text-[10px] uppercase text-foreground focus:border-amber/40 focus:outline-none focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="hud-panel rounded-sm border-amber/25">
                  {INTERVALS.map((value) => (
                    <SelectItem
                      key={value}
                      value={value}
                      className="font-mono text-[10px] uppercase focus:bg-amber/15 focus:text-amber"
                    >
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                <input
                  type="checkbox"
                  checked={row.active !== false}
                  onChange={(e) => patch(row.id, { active: e.target.checked })}
                />
                Live
              </label>
              <button
                onClick={() => save(row)}
                disabled={busy === row.id}
                className="flex items-center gap-1 rounded-sm border border-amber/30 px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.18em] text-amber/90 hover:bg-amber/[0.08] disabled:opacity-40"
              >
                {busy === row.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                Save
              </button>
            </div>
          ))}
          {!rows.length ? (
            <p className="text-xs text-muted-foreground">No product records yet.</p>
          ) : null}
        </div>
      )}

      <form onSubmit={create} className="mt-5 grid gap-2 sm:grid-cols-[1fr_1fr_.6fr_.8fr_.8fr_auto]">
        <input
          value={draft.key}
          onChange={(e) => setDraft({ ...draft, key: e.target.value })}
          placeholder="product_key"
          className="rounded-sm border border-white/[0.08] bg-background/60 px-2 py-1.5 font-mono text-[10px] text-foreground focus:border-amber/40 focus:outline-none"
        />
        <input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="Product name"
          className="rounded-sm border border-white/[0.08] bg-background/60 px-2 py-1.5 text-xs text-foreground focus:border-amber/40 focus:outline-none"
        />
        <input
          value={draft.price}
          onChange={(e) => setDraft({ ...draft, price: e.target.value })}
          placeholder="1.99"
          className="rounded-sm border border-white/[0.08] bg-background/60 px-2 py-1.5 font-mono text-xs text-foreground focus:border-amber/40 focus:outline-none"
        />
        <Select
          value={draft.interval}
          onValueChange={(value) => setDraft({ ...draft, interval: value })}
        >
          <SelectTrigger className="h-auto rounded-sm border-white/[0.08] bg-background/60 px-2 py-1.5 font-mono text-[10px] uppercase text-foreground focus:border-amber/40 focus:outline-none focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="hud-panel rounded-sm border-amber/25">
            {INTERVALS.map((value) => (
              <SelectItem
                key={value}
                value={value}
                className="font-mono text-[10px] uppercase focus:bg-amber/15 focus:text-amber"
              >
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={draft.tier} onValueChange={(value) => setDraft({ ...draft, tier: value })}>
          <SelectTrigger className="h-auto rounded-sm border-white/[0.08] bg-background/60 px-2 py-1.5 font-mono text-[10px] uppercase text-foreground focus:border-amber/40 focus:outline-none focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="hud-panel rounded-sm border-amber/25">
            {TIERS.map((value) => (
              <SelectItem
                key={value}
                value={value}
                className="font-mono text-[10px] uppercase focus:bg-amber/15 focus:text-amber"
              >
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="submit"
          disabled={busy === "new"}
          className="flex items-center justify-center gap-1 rounded-sm bg-amber px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.18em] text-primary-foreground disabled:opacity-40"
        >
          {busy === "new" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          Add
        </button>
      </form>

      {error ? (
        <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-destructive">{error}</p>
      ) : null}
    </section>
  );
}