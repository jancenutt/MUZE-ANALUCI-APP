import CoverImage from "@/components/CoverImage";

export default function ArtistGrid({ artists, onPick }) {
  if (!artists.length) {
    return (
      <div className="hud-panel rounded-sm px-6 py-16 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-amber/60">
          No aliases
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {artists.map((entry) => (
        <button
          key={entry.artist}
          onClick={() => onPick(entry.artist)}
          className="group hud-panel flex flex-col overflow-hidden rounded-sm text-left transition-all hover:border-amber/35"
        >
          <div className="relative aspect-square overflow-hidden bg-panel">
            {entry.cover_url ? (
              <CoverImage
                src={entry.cover_url}
                alt=""
                className="opacity-70 transition-opacity duration-500 group-hover:opacity-100"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          </div>
          <div className="flex flex-1 flex-col justify-between gap-2 p-3.5">
            <h3 className="line-clamp-2 font-display text-sm font-light leading-snug tracking-[0.03em] text-foreground">
              {entry.artist}
            </h3>
            <p className="border-t border-amber/10 pt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              {entry.releases.length} release{entry.releases.length === 1 ? "" : "s"}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}