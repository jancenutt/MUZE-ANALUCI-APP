import { Play, Pause, ListPlus, Clock } from "lucide-react";
import CoverImage from "@/components/CoverImage";
import AddToPlaylistButton from "@/components/playlists/AddToPlaylistButton";
import TrackAudioUpload from "@/components/release/TrackAudioUpload";
import { padNumber } from "@/lib/format";

export default function TrackRow({
  track,
  index,
  isCurrent,
  isPlaying,
  releaseCover,
  onArtwork,
  onAudio,
  busy,
  onPlay,
  onQueue,
}) {
  const available = Boolean(track.has_audio && track.audio_uri);
  const customArt = track.cover_url && track.cover_url !== releaseCover;
  const thumb = track.cover_url || releaseCover;

  return (
    <div
      className={`group flex items-center gap-3 border-b border-white/5 px-3 py-2.5 transition-colors last:border-0 sm:px-4 ${
        isCurrent ? "bg-amber/[0.06]" : "hover:bg-white/[0.025]"
      }`}
    >
      <span className="w-5 shrink-0 text-center font-mono text-[10px] text-muted-foreground">
        {isCurrent ? <span className="text-amber">▸</span> : padNumber(track.no)}
      </span>

      {onArtwork ? (
        <label
          title="Change this track's artwork"
          className="group/art relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-sm border border-white/10 bg-panel"
        >
          {thumb ? <CoverImage src={thumb} alt="" className="h-full w-full" /> : null}
          <span className="absolute inset-0 flex items-center justify-center bg-background/75 font-mono text-[7px] uppercase tracking-[0.1em] text-amber opacity-0 transition-opacity group-hover/art:opacity-100">
            {busy ? "…" : "Art"}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onArtwork(track, e.target.files?.[0])}
          />
        </label>
      ) : customArt ? (
        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-sm border border-white/10">
          <CoverImage src={track.cover_url} alt="" className="h-full w-full" />
        </div>
      ) : null}

      <button
        onClick={() => available && onPlay(track, index)}
        disabled={!available}
        aria-label={available ? `Play ${track.title}` : `${track.title} — coming soon`}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
          isCurrent
            ? "border-amber/60 bg-amber/15 text-amber"
            : "border-white/10 text-muted-foreground hover:border-amber/40 hover:text-amber"
        }`}
      >
        {isCurrent && isPlaying ? (
          <Pause className="h-3 w-3" fill="currentColor" />
        ) : (
          <Play className="ml-0.5 h-3 w-3" fill="currentColor" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className={`selectable truncate text-sm ${isCurrent ? "text-amber" : "text-foreground"}`}>
          {track.title}
        </p>
        <p className="truncate font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
          {track.artist}
        </p>
      </div>

      {onQueue && available ? (
        <button
          onClick={() => onQueue(track)}
          aria-label={`Add ${track.title} to up next`}
          title="Add to up next"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-muted-foreground/70 transition-colors hover:text-amber"
        >
          <ListPlus className="h-3.5 w-3.5" />
        </button>
      ) : null}

      <AddToPlaylistButton
        trackIds={[track.id]}
        className="shrink-0 text-muted-foreground/70 transition-colors hover:text-amber"
      />

      {available ? (
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          {track.duration || "—"}
        </span>
      ) : onAudio ? (
        <TrackAudioUpload track={track} onUpdated={onAudio} />
      ) : (
        <span className="flex shrink-0 items-center gap-1 font-mono text-[8px] uppercase tracking-[0.16em] text-amber/50">
          <Clock className="h-3 w-3" /> Coming soon
        </span>
      )}
    </div>
  );
}