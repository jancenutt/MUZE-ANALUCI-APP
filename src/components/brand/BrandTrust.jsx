import { Lock } from "lucide-react";
import MicroLabel from "@/components/MicroLabel";
import useIsAdmin from "@/hooks/useIsAdmin";
import { TRUST } from "@/lib/brand";

// Rendered for the owner only — nothing here reaches visitors or page metadata.
export default function BrandTrust() {
  const isAdmin = useIsAdmin();
  if (!isAdmin) return null;

  return (
    <section className="mt-14 rounded-sm border border-dashed border-amber/30 bg-amber/[0.03] p-6">
      <div className="flex items-center gap-2">
        <Lock className="h-3 w-3 text-amber/70" />
        <MicroLabel>Trust — admin only</MicroLabel>
      </div>
      <h2 className="mt-3 font-display text-xl font-light tracking-[0.03em] text-foreground">
        {TRUST.name}
      </h2>
      <p className="mt-1.5 font-mono text-[8px] uppercase leading-relaxed tracking-[0.2em] text-amber/60">
        {TRUST.note}
      </p>
      <p className="mt-4 max-w-2xl text-xs leading-relaxed text-foreground/60">{TRUST.body}</p>
      <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50">
        Not published — visible to signed-in admins only
      </p>
    </section>
  );
}