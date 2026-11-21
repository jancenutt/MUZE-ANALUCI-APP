import { Suspense } from "react";
import { Link, useLocation, useNavigationType, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import SiteNav from "@/components/SiteNav";
import BottomTabs from "@/components/BottomTabs";
import { DATA_RATES_NOTICE, LEGAL_DOCS } from "@/lib/legalDocs";
import PlayerBar from "@/components/player/PlayerBar";
import NowPlaying from "@/components/player/NowPlaying";
import PaywallModal from "@/components/paywall/PaywallModal";
import { PlayerProvider, usePlayer } from "@/lib/player";

function RouteSpinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber/20 border-t-amber" />
    </div>
  );
}

function LayoutInner() {
  const { current } = usePlayer();
  const location = useLocation();
  const navigationType = useNavigationType();
  const outlet = useOutlet();

  // Push slides in from the right, going back slides in from the left.
  const entering = navigationType === "POP" ? -28 : 28;
  const exiting = navigationType === "POP" ? 28 : -28;

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 z-0 grid-lines opacity-40" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteNav />
        <main className={`flex-1 overscroll-none ${current ? "pad-tabs-player" : "pad-tabs"}`}>
          <Suspense fallback={<RouteSpinner />}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, x: entering }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: exiting }}
                transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
              >
                {outlet}
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </main>
        <footer className="pad-tabs border-t border-amber/10 px-5 py-8 sm:px-8">
          <div className="mx-auto max-w-7xl space-y-4">
            <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2">
              {LEGAL_DOCS.map((doc) => (
                <Link
                  key={doc.key}
                  to={doc.path}
                  className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-amber"
                >
                  {doc.short}
                </Link>
              ))}
            </nav>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">
              {DATA_RATES_NOTICE}
            </p>
            <div className="flex flex-col gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>AnaLuci.app · Operations core for J&apos;ance Nutt</span>
              <span className="text-amber/50">Catalog reconstruction · 2020 → now</span>
            </div>
          </div>
        </footer>
      </div>
      <PlayerBar />
      <NowPlaying />
      <BottomTabs />
      <PaywallModal />
    </div>
  );
}

export default function Layout() {
  return (
    <PlayerProvider>
      <LayoutInner />
    </PlayerProvider>
  );
}