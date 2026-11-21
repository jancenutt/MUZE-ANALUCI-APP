import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import MicroLabel from "@/components/MicroLabel";
import CoverImage from "@/components/CoverImage";

const TYPE_LABEL = {
  audio: "Music",
  video: "Film",
  image: "Artwork",
  document: "Book",
  mixed: "Mixed",
};

function monthLabel(release) {
  if (release.release_month) return release.release_month;
  if (typeof release.date === "string" && release.date.length >= 7) return release.date.slice(0, 7);
  return release.year ? String(release.year) : "Unlisted";
}

// Announcements live here: new releases and drops are part of the service, not advertising.
export default function WhatsNew() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    base44.entities.Release.filter({}, { sort: "-year", limit: 4 })
      .then((page) => setItems(page.items || []))
      .catch(() => {});
  }, []);

  if (!items.length) return null;

  return (
    <section className="border-b border-amber/10">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <MicroLabel>What&apos;s new · drops</MicroLabel>
            <h2 className="mt-2 font-display text-2xl font-light tracking-[0.03em] text-foreground">
              Latest drops
            </h2>
          </div>
          <Link
            to="/archive"
            className="shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-amber"
          >
            All releases
          </Link>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((release) => (
            <Link
              key={release.id}
              to={`/release/${release.id}`}
              className="hud-panel flex items-center gap-3 rounded-sm p-2.5 transition-colors hover:border-amber/30"
            >
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-sm border border-white/10 bg-panel">
                {release.cover_url ? (
                  <CoverImage src={release.cover_url} alt="" className="h-full w-full" />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-foreground/90">{release.title}</p>
                <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
                  {monthLabel(release)} · {TYPE_LABEL[release.content_type || "audio"]}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground/60">
          Release news and drop announcements are part of your membership. No third-party ads, ever.
        </p>
      </div>
    </section>
  );
}