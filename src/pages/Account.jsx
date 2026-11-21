import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MicroLabel from "@/components/MicroLabel";
import CloseButton from "@/components/CloseButton";
import useEntitlement from "@/hooks/useEntitlement";
import LibraryPanel from "@/components/library/LibraryPanel";
import PullToRefresh from "@/components/PullToRefresh";
import DeleteAccountPanel from "@/components/account/DeleteAccountPanel";
import { usePageMeta } from "@/lib/seo";

export default function Account() {
  usePageMeta({
    title: "My Account | AnaLuci.app",
    description: "Manage your AnaLuci.app profile, membership and purchases.",
    path: "/account",
  });

  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const { hasAccess, purchase } = useEntitlement();

  const load = async () => {
    const me = await base44.auth.me().catch(() => null);
    if (!me) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    setUser(me);
    setName(me.full_name || "");
    try {
      const page = await base44.entities.Base44Purchase.filter(
        {},
        { sort: "-created_date", limit: 25 }
      );
      setPurchases(page.items || []);
    } catch (err) {
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const updated = await base44.auth.updateMe({ full_name: name.trim() });
      setUser((prev) => ({ ...prev, ...updated, full_name: name.trim() }));
      setNotice("Profile saved.");
    } catch (err) {
      setError("Could not save your profile.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-amber" />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={load}>
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="flex items-start justify-between gap-4">
        <div>
          <MicroLabel>Account</MicroLabel>
          <h1 className="mt-3 font-display text-3xl font-light tracking-[0.06em] text-foreground sm:text-4xl">
            My Account
          </h1>
        </div>
        <CloseButton label="Close my account" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <div className="hud-panel rounded-sm p-5">
            <MicroLabel>Profile</MicroLabel>
            <form onSubmit={save} className="mt-4 space-y-4">
              <div>
                <label className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  Display name
                </label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full rounded-sm border border-amber/20 bg-background/60 px-3 py-2.5 text-sm text-foreground focus:border-amber/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  Email
                </label>
                <p className="mt-2 font-mono text-[11px] tracking-[0.08em] text-foreground/70">
                  {user?.email}
                </p>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="flex min-h-[44px] items-center gap-2 rounded-sm bg-amber px-5 font-mono text-[9px] uppercase tracking-[0.22em] text-primary-foreground transition-colors hover:bg-amber/90 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Save profile
              </button>
              {notice ? (
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-amber/80">{notice}</p>
              ) : null}
              {error ? (
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-destructive">{error}</p>
              ) : null}
            </form>
          </div>

          <div className="hud-panel rounded-sm p-5">
            <MicroLabel>Purchases</MicroLabel>
            {purchases.length ? (
              <div className="mt-4 divide-y divide-white/[0.05]">
                {purchases.map((row) => (
                  <div key={row.id} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <p className="text-sm text-foreground/85">{row.productName || row.productId}</p>
                      <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
                        {new Date(row.created_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[10px] tracking-[0.12em] text-amber/80">
                        {row.amount ? `$${row.amount}` : "—"}
                      </p>
                      <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
                        {row.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs leading-relaxed text-foreground/55">
                Nothing purchased yet.
                {user?.role === "admin" ? (
                  <>
                    {" "}
                    <Link to="/membership" className="text-amber/80 hover:text-amber">
                      See membership levels
                    </Link>
                    .
                  </>
                ) : null}
              </p>
            )}
          </div>

          <LibraryPanel />
        </div>

        <div className="space-y-4">
          {user?.role === "admin" ? (
            <div className="hud-panel rounded-sm p-5">
              <MicroLabel>Membership</MicroLabel>
              <p className="mt-3 font-display text-xl font-light text-foreground">
                {hasAccess ? "Active" : "None"}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-foreground/55">
                {purchase?.productName
                  ? purchase.productName
                  : hasAccess
                    ? "Owner access"
                    : "A membership unlocks playback of the archive."}
              </p>
              <Link
                to="/membership"
                className="mt-4 inline-block font-mono text-[9px] uppercase tracking-[0.2em] text-amber/80 hover:text-amber"
              >
                Manage membership
              </Link>
            </div>
          ) : null}

          <div className="rounded-sm border border-amber/10 p-5">
            <MicroLabel>Session</MicroLabel>
            {user?.role === "admin" ? (
              <Link
                to="/admin"
                className="mt-3 block font-mono text-[9px] uppercase tracking-[0.2em] text-amber/80 hover:text-amber"
              >
                Admin console
              </Link>
            ) : null}
            <button
              onClick={() => base44.auth.logout("/")}
              className="mt-3 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </div>

          <DeleteAccountPanel email={user?.email} />
        </div>
      </div>
    </div>
    </PullToRefresh>
  );
}