import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Play } from "lucide-react";
import MicroLabel from "@/components/MicroLabel";
import { TelemetryRight } from "@/components/home/HudTelemetry";
import { getReleases, getTracks } from "@/lib/catalogData";

const HERO_VIDEO =
  "https://media.base44.com/videos/public/user_6adbe2cf8290cc62f80be414/0a4b7acd7_seedance_20_2026-11-07-16-38-44.mp4";

export default function Hero() {
  const [counts, setCounts] = useState({ releases: null, tracks: null });

  useEffect(() => {
    Promise.all([getReleases(), getTracks()])
      .then(([releases, tracks]) => setCounts({ releases: releases.length, tracks: tracks.length }))
      .catch(() => {});
  }, []);

  const catalogLine =
    counts.releases && counts.tracks
      ? `${counts.releases} releases and ${counts.tracks} tracks`
      : "the full archive";

  return (
    <section className="relative isolate overflow-hidden border-b border-amber/10">
      <video
        src={HERO_VIDEO}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="https://media.base44.com/images/public/user_6adbe2cf8290cc62f80be414/ee6876484_artcraft_2026-11-07-16-01-29.png"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-50" />
      <div className="pointer-events-none absolute inset-0 scanlines opacity-30" />

      <div className="relative mx-auto flex min-h-[86vh] max-w-7xl items-center gap-8 px-5 py-16 sm:px-8">
        <div className="flex flex-1 flex-col items-center text-center">
          <div className="mb-7 flex items-center gap-3 rounded-full border border-amber/25 bg-amber/[0.06] px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber shadow-[0_0_10px_2px_hsl(35_100%_64%/0.5)]" />
            <MicroLabel className="text-amber/80">Archive &amp; Stream · J&apos;ance Nutt</MicroLabel>
          </div>

          <h1 className="amber-glow font-display text-[clamp(2.75rem,11vw,8rem)] font-light leading-none tracking-[0.16em] text-foreground">
            ANA.LUCI
          </h1>

          <p className="mt-5 max-w-xl font-mono text-[11px] uppercase leading-relaxed tracking-[0.3em] text-muted-foreground sm:text-xs">
            Every release J&apos;ance Nutt has ever made — one archive, streamed on demand
          </p>

          <p className="mt-6 max-w-lg text-sm leading-relaxed text-foreground/70 sm:text-base">
            Browse {catalogLine} free — no account needed. Press play on anything and
            hear the full song. The archive is open.
          </p>

          <div className="mt-10 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            <Link
              to="/archive"
              className="group flex w-full items-center justify-center gap-2 rounded-sm bg-amber px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.24em] text-primary-foreground transition-all hover:bg-amber/90 hover:shadow-[0_0_40px_-8px_hsl(35_100%_64%/0.6)] sm:w-auto"
            >
              <Play className="h-3.5 w-3.5" strokeWidth={2.5} />
              Listen free — full songs
            </Link>
            <Link
              to="/ask"
              className="group flex w-full items-center justify-center gap-2 rounded-sm border border-amber/25 px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.24em] text-amber/90 transition-colors hover:bg-amber/[0.07] sm:w-auto"
            >
              Ask ANA.LUCI
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <TelemetryRight />
      </div>
    </section>
  );
}
