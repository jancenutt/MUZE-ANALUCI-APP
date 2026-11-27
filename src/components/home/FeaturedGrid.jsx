import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CoverImage from "@/components/CoverImage";
import { getReleases } from "@/lib/catalogData";
import MicroLabel from "@/components/MicroLabel";
import { padNumber } from "@/lib/format";
import { releasePath, useReleaseSlugMap } from "@/lib/slugs";

export default function FeaturedGrid() {
  const [releases, setReleases] = useState([]);
  const slugMap = useReleaseSlugMap();

  useEffect(() => {
    getReleases()
      .then((releases) =>
        setReleases([...releases].sort((a, b) => (a.num ?? 0) - (b.num ?? 0)).slice(0, 6))
      )
      .catch(() => setReleases([]));
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <MicroLabel>First transmissions</MicroLabel>
          <h2 className="mt-3 font-display text-2xl font-light tracking-[0.06em] text-foreground sm:text-3xl">
            Opening the archive
          </h2>
        </div>
        <Link
          to="/archive"
          className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber/70 transition-colors hover:text-amber"
        >
          Full archive →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {releases.length === 0
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="hud-panel animate-pulse overflow-hidden rounded-sm">
                <div className="aspect-[4/3] bg-white/[0.03]" />
              </div>
            ))
          : releases.map((release) => (
              <Link
                key={release.id}
                to={slugMap ? releasePath(release, slugMap) : `/release/${release.id}`}
                className="hud-panel group relative overflow-hidden rounded-sm transition-all hover:border-amber/35"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-panel">
                  <CoverImage
                    src={release.cover_url}
                    alt={`${release.title} cover`}
                    className="opacity-70 transition-opacity duration-500 group-hover:opacity-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                  <span className="absolute left-3 top-3 font-mono text-[9px] tracking-[0.3em] text-amber/80">
                    {padNumber(release.num)}
                  </span>
                  <div className="absolute inset-x-3 bottom-3">
                    <h3 className="line-clamp-1 font-display text-base font-light tracking-[0.04em] text-foreground">
                      {release.title}
                    </h3>
                    <p className="mt-1 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                      <span className="truncate">{release.artist}</span>
                      <span className="shrink-0 text-amber/60">{release.track_count ?? 0} trk</span>
                    </p>
                  </div>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}