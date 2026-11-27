import { useEffect, useState } from "react";
import MicroLabel from "@/components/MicroLabel";
import { fetchArtists } from "@/lib/catalog";
import { getReleases, getTracks } from "@/lib/catalogData";

const TYPE_LABELS = {
  audio: "Music",
  video: "Film",
  image: "Artwork",
  document: "Books",
  mixed: "Mixed",
};

// Real counts, never placeholders. The content-type strip lists only the types that
// actually exist, so it grows by itself as films, artwork and books are added.
export default function StatsStrip() {
  const [stats, setStats] = useState([
    { label: "Releases", value: "0" },
    { label: "Tracks", value: "0" },
    { label: "Aliases", value: "0" },
    { label: "Span", value: "2020 →" },
  ]);
  const [types, setTypes] = useState([]);

  useEffect(() => {
    Promise.all([getReleases(), getTracks(), fetchArtists().catch(() => [])])
      .then(([releaseList, trackList, artists]) => {
        setStats([
          { label: "Releases", value: String(releaseList.length) },
          { label: "Tracks", value: String(trackList.length) },
          { label: "Aliases", value: String(artists.length) },
          { label: "Span", value: "2020 →" },
        ]);
        const byType = new Map();
        releaseList.forEach((release) => {
          const key = release.content_type || "audio";
          byType.set(key, (byType.get(key) || 0) + 1);
        });
        setTypes(
          [...byType.entries()].map(([content_type, count]) => ({
            type: content_type,
            count,
          }))
        );
      })
      .catch(() => {});
  }, []);

  return (
    <section className="border-b border-amber/10">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-amber/10 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="px-5 py-7 sm:px-8">
            <MicroLabel>{stat.label}</MicroLabel>
            <p className="mt-2 font-display text-3xl font-light tracking-[0.08em] text-foreground sm:text-4xl">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {types.length ? (
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 border-t border-amber/10 px-5 py-3 sm:px-8">
          <MicroLabel>Catalog</MicroLabel>
          {types.map((entry) => (
            <span
              key={entry.type}
              className="font-mono text-[9px] uppercase tracking-[0.18em] text-foreground/60"
            >
              {TYPE_LABELS[entry.type] || entry.type} · {entry.count}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}