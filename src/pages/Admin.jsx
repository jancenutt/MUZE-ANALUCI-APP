import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MicroLabel from "@/components/MicroLabel";
import ProductEditor from "@/components/admin/ProductEditor";
import CodeManager from "@/components/admin/CodeManager";
import PurchaseTable from "@/components/admin/PurchaseTable";
import { usePageMeta } from "@/lib/seo";

export default function Admin() {
  usePageMeta({
    title: "Admin console | AnaLuci.app",
    description: "Owner-only console.",
    path: "/admin",
  });

  const [gate, setGate] = useState({ loading: true, isAdmin: false });

  useEffect(() => {
    let alive = true;
    base44.auth
      .me()
      .then((me) => alive && setGate({ loading: false, isAdmin: me?.role === "admin" }))
      .catch(() => alive && setGate({ loading: false, isAdmin: false }));
    return () => {
      alive = false;
    };
  }, []);

  if (gate.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-amber" />
      </div>
    );
  }

  if (!gate.isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center sm:px-8">
        <MicroLabel>Restricted</MicroLabel>
        <h1 className="mt-4 font-display text-2xl font-light text-foreground">
          Owner access only
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground/60">
          Sign in with the owner account to open the console.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-block rounded-sm border border-amber/30 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.22em] text-amber/90 hover:bg-amber/[0.08]"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <MicroLabel>Owner console</MicroLabel>
      <h1 className="mt-3 font-display text-3xl font-light tracking-[0.06em] text-foreground sm:text-4xl">
        Admin
      </h1>

      <div className="mt-6 flex flex-wrap gap-3 font-mono text-[9px] uppercase tracking-[0.2em]">
        <Link to="/archive" className="text-amber/80 hover:text-amber">
          Edit release artwork →
        </Link>
        <Link to="/sync" className="text-amber/80 hover:text-amber">
          Notion sync →
        </Link>
        <Link to="/account" className="text-muted-foreground hover:text-foreground">
          My account →
        </Link>
      </div>

      <div className="mt-10 space-y-10">
        <div className="hud-panel rounded-sm p-5">
          <ProductEditor />
        </div>
        <div className="hud-panel rounded-sm p-5">
          <CodeManager />
        </div>
        <div className="hud-panel rounded-sm p-5">
          <PurchaseTable />
        </div>
      </div>
    </div>
  );
}