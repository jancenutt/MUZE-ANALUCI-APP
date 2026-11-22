import { useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Image } from "@/components/ui/image";
import { base44 } from "@/api/base44Client";
import MicroLabel from "@/components/MicroLabel";
import CloseButton from "@/components/CloseButton";
import useEntitlement from "@/hooks/useEntitlement";
import useProducts from "@/hooks/useProducts";
import MembershipCard from "@/components/membership/MembershipCard";
import MembershipCompare from "@/components/membership/MembershipCompare";
import CheckoutTerms from "@/components/membership/CheckoutTerms";
import AccessCodeForm from "@/components/pricing/AccessCodeForm";
import { MEMBERSHIPS } from "@/lib/memberships";
import { usePageMeta } from "@/lib/seo";

const ART =
  "https://media.base44.com/images/public/user_6adbe2cf8290cc62f80be414/ee6876484_artcraft_2026-11-07-16-01-29.png";

// Why checkout can fail before any payment page opens — and what to tell the buyer.
// Base44 answers function calls with HTTP errors: a 402 means the app's monthly
// integration credits ran out (nothing to do with the buyer or their card), and a 500
// "Payments not configured" means Base44 Payments was never connected (or was
// disconnected) for this app. Both are account-side, so "try again" is a dead end —
// say what's actually wrong instead.
const checkoutErrorMessage = (err) => {
  const status = err?.response?.status ?? err?.status;
  const data = err?.response?.data ?? {};
  const reason = data?.extra_data?.reason ?? "";
  const detail = data?.error ?? data?.detail ?? data?.message ?? "";
  const message = err?.message ?? "";
  if (
    status === 402 ||
    reason === "integration_credits_limit_reached" ||
    /status code 402/.test(message) ||
    /credit limit/i.test(detail) ||
    /credit limit/i.test(message)
  ) {
    return "Membership checkout is paused — the app's monthly credits ran out. It opens again Dec 8.";
  }
  if (status === 500 && /not configured/i.test(detail)) {
    return "Payments aren't connected yet, so checkout can't start.";
  }
  return "Checkout couldn't start — try again.";
};

export default function Membership() {
  usePageMeta({
    title: "Membership — Five Ways Into the Catalog | AnaLuci.app",
    description:
      "Stream the full catalog from $1.99 a week with no third-party ads, ever. Every drop from a month you pay for is yours forever, delivered by email. Ownership belongs to the 100K Club.",
    path: "/membership",
  });

  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const products = useProducts();
  const { hasAccess, purchase, loading, refresh } = useEntitlement();

  const startCheckout = async (productId) => {
    setBusy(productId);
    setError("");
    try {
      // Membership is tied to the app account, so collect the buyer's sign-in first.
      const me = await base44.auth.me().catch(() => null);
      if (!me) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      const res = await base44.functions.invoke("create-checkout", { productId });
      const url = res?.data?.redirectUrl;
      if (url) {
        window.location.href = url;
        return;
      }
      setError("Checkout couldn't start — try again.");
    } catch (err) {
      setError(checkoutErrorMessage(err));
    } finally {
      setBusy("");
    }
  };

  const confirm = async () => {
    const plan = pending?.plan;
    setPending(null);
    if (plan) await startCheckout(plan.key);
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="flex items-start justify-between gap-4">
        <div>
          <MicroLabel>Membership</MicroLabel>
          <h1 className="mt-4 font-display text-3xl font-light leading-tight tracking-[0.03em] text-foreground sm:text-5xl">
            Five ways in
          </h1>
        </div>
        <CloseButton fallback="/" label="Close membership" />
      </div>

      <div className="mt-6 flex gap-6">
        <p className="max-w-3xl text-sm leading-relaxed text-foreground/60">
          Browsing stays open. Memberships stream the full catalog in the ANA.LUCI player from $1.99 a
          week — no third-party ads, ever, cancel anytime. Every drop from a month you&apos;ve paid for
          is yours forever, delivered straight to your email the moment it lands. The catalog grows
          beyond music — videos, films, artwork, books, and more from the world of J&apos;ance Nutt.
          Business use and transferable ownership belong to the 100K Club.
        </p>
        <div className="relative hidden h-40 w-32 shrink-0 overflow-hidden rounded-sm border border-amber/15 sm:block">
          <Image
            src={ART}
            alt="AnaLuci.app artwork"
            fittingType="fill"
            className="h-full w-full object-cover object-top opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>
      </div>

      {!loading && hasAccess ? (
        <div className="mt-8 flex items-center gap-3 rounded-sm border border-amber/25 bg-amber/[0.06] px-4 py-3">
          <Check className="h-3.5 w-3.5 text-amber" />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber/85">
            Membership active
            {purchase?.productName ? ` · ${purchase.productName}` : ""}
          </p>
        </div>
      ) : null}

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MEMBERSHIPS.map((membership) => (
          <MembershipCard
            key={membership.id}
            membership={membership}
            products={products}
            busy={busy}
            onJoin={(selection, plan) => {
              setError("");
              setPending({ membership: selection, plan });
            }}
          />
        ))}
      </div>

      <div className="mt-10">
        <MembershipCompare />
      </div>

      <div className="mt-8 rounded-sm border border-amber/10 bg-muted/30 px-4 py-4 sm:px-5">
        <MicroLabel>You keep what you paid for</MicroLabel>
        <p className="mt-3 max-w-3xl text-[11px] leading-relaxed text-foreground/50">
          Every release is tagged with its release month. Each paid month on Enthusiast or JN Muzik
          Clik permanently unlocks that month&apos;s drops: they email on release day, appear in your
          library, and can be re-sent to your email forever. Canceling never removes earned drops — it
          only pauses full-catalog streaming and future drop emails until you resubscribe. Interested
          Party memberships are streaming only and earn nothing. Files arrive by email, never from this
          site; the player streams one item at a time through signed, on-demand links.
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <AccessCodeForm onRedeemed={refresh} />
        <Link
          to="/login?returnTo=%2Faccount"
          aria-label="Sign in to your account"
          className="group block rounded-sm border border-amber/10 px-4 py-4 transition-colors hover:border-amber/35 hover:bg-amber/[0.04] focus-visible:border-amber/50 focus-visible:outline-none"
        >
          <MicroLabel>Already a member</MicroLabel>
          <p className="mt-3 text-xs leading-relaxed text-foreground/55 group-hover:text-foreground/70">
            <span className="font-medium text-amber underline decoration-amber/40 underline-offset-2">
              Sign in
            </span>{" "}
            to keep your memberships on your account, then manage your library, deliveries, and
            ownership from My Account.
          </p>
        </Link>
      </div>

      {error ? (
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-destructive">
          {error}
        </p>
      ) : null}

      <p className="mt-10 max-w-2xl font-mono text-[9px] uppercase leading-relaxed tracking-[0.18em] text-muted-foreground/60">
        Billing is handled by Base44 Payments. Subscriptions renew automatically until canceled;
        one-time memberships are charged once. Manage or cancel from your payment receipt.
      </p>

      <CheckoutTerms
        pending={pending}
        products={products}
        busy={busy}
        error={error}
        onClose={() => setPending(null)}
        onConfirm={confirm}
      />
    </div>
  );
}