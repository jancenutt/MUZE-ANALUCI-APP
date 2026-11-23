import { Link } from "react-router-dom";
import CoverImage from "@/components/CoverImage";
import { padNumber } from "@/lib/format";

export default function ReleaseCard({ release }) {
  return (
    <Link
      to={`/release/${release.id}`}
      className="group hud-panel relative flex flex-col overflow-hidden rounded-sm transition-all hover:border-amber/35 hover:shadow-[0_30px_60px_-40px_hsl(35_100%_64%/0.55)]"
    >
      <div className="relative aspect-square overflow-hidden bg-panel">
        <CoverImage
          src={release.cover_url}
          alt={`${release.title} by J'ance Nutt — album cover`}
          className="opacity-85 transition-opacity duration-500 group-hover:opacity-100"
        />
        <span className="absolute left-2 top-2 rounded-sm bg-background/80 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.22em] text-amber/80 backdrop-blur">
          {padNumber(release.num)}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 p-3.5">
        <div>
          <h3 className="line-clamp-2 font-display text-sm font-light leading-snug tracking-[0.03em] text-foreground">
            {release.title}
          </h3>
          <p className="mt-1 truncate font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            {release.artist}
          </p>
        </div>
        <div className="flex items-center justify-between border-t border-amber/10 pt-2.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
          <span>{release.type}</span>
          <span className="text-amber/60">{release.track_count ?? 0} trk</span>
        </div>
      </div>
    </Link>
  );
}