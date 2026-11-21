import { Link } from "react-router-dom";
import { Archive, MessageSquare, Play } from "lucide-react";
import Hero from "@/components/home/Hero";
import StatsStrip from "@/components/home/StatsStrip";
import WhatsNew from "@/components/home/WhatsNew";
import FeaturedGrid from "@/components/home/FeaturedGrid";
import MicroLabel from "@/components/MicroLabel";
import { usePageMeta } from "@/lib/seo";

const HOW_IT_WORKS = [
  {
    icon: Archive,
    step: "01",
    title: "Browse the archive",
    body: "Every release, track, film and artwork is listed in the open. No account, no email wall — look through the whole catalog first.",
    to: "/archive",
    cta: "Open the archive",
  },
  {
    icon: MessageSquare,
    step: "02",
    title: "Ask ANA.LUCI",
    body: "Questions about the catalog, the brand, or where to start — ask the archive directly and get pointed to the right release.",
    to: "/ask",
    cta: "Ask a question",
  },
  {
    icon: Play,
    step: "03",
    title: "Press play, hear it all",
    body: "Press play on anything and hear the full song, start to finish. The archive is open — no previews, no paywall.",
    to: "/archive",
    cta: "Open the archive",
  },
];

function HowItWorks() {
  return (
    <section className="border-b border-amber/10">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <MicroLabel>How AnaLuci works</MicroLabel>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {HOW_IT_WORKS.map((s) => (
            <Link
              key={s.step}
              to={s.to}
              className="hud-panel group rounded-sm p-5 transition-colors hover:border-amber/30"
            >
              <div className="flex items-center justify-between">
                <s.icon className="h-4 w-4 text-amber/80" strokeWidth={1.75} />
                <span className="font-mono text-[9px] tracking-[0.3em] text-amber/50">
                  {s.step}
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-light tracking-[0.04em] text-foreground">
                {s.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-foreground/60">{s.body}</p>
              <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.22em] text-amber/70 transition-colors group-hover:text-amber">
                {s.cta} →
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  usePageMeta({
    title: "AnaLuci.app — Archive & Stream | J'ance Nutt",
    description:
      "AnaLuci.app is the archive and on-demand streaming platform for artist J'ance Nutt — every release, track and master in one place. Browse free and stream the full archive.",
    path: "/",
  });

  return (
    <>
      <Hero />
      <HowItWorks />
      <StatsStrip />
      <WhatsNew />
      <FeaturedGrid />

      <section className="border-t border-amber/10">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="hud-panel hud-glow relative overflow-hidden rounded-sm p-8 sm:p-12">
            <div className="pointer-events-none absolute inset-0 grid-lines opacity-30" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <MicroLabel>Delivery protocol</MicroLabel>
                <h2 className="mt-3 font-display text-2xl font-light tracking-[0.04em] text-foreground sm:text-3xl">
                  Audio loads on demand
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/65">
                  Every master is held privately in the archive. Stream links are issued one
                  track at a time, the moment you press play — so browsing stays instant and
                  full albums never load in the background. Files arrive by email; the site
                  streams only.
                </p>
              </div>
              <div className="shrink-0 font-mono text-[10px] uppercase leading-loose tracking-[0.24em] text-amber/60">
                <p>Buffer · 0%</p>
                <p>Stream · on play</p>
                <p>Storage · private</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
