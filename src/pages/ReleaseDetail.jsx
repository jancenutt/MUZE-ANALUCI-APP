import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Play, ListPlus, Loader2 } from "lucide-react";
import CoverImage from "@/components/CoverImage";
import { base44 } from "@/api/base44Client";
import MicroLabel from "@/components/MicroLabel";
import CloseButton from "@/components/CloseButton";
import ReleaseMeta from "@/components/release/ReleaseMeta";
import TrackRow from "@/components/release/TrackRow";
import AudioIntake from "@/components/release/AudioIntake";
import BulkAudioUpload from "@/components/release/BulkAudioUpload";
import VideoIntake from "@/components/release/VideoIntake";
import DropIntake from "@/components/release/DropIntake";
import VideoSection from "@/components/release/VideoSection";
import AddToPlaylistButton from "@/components/playlists/AddToPlaylistButton";
import useIsAdmin from "@/hooks/useIsAdmin";
import { usePlayer } from "@/lib/player";
import { padNumber } from "@/lib/format";
import { SITE_URL, usePageMeta } from "@/lib/seo";

export default function ReleaseDetail() {
  const { id } = useParams();
  const [release, setRelease] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [artBusy, setArtBusy] = useState("");
  const isAdmin = useIsAdmin();
  const { current, playing, playFrom, addToQueue } = usePlayer();

  const load = async () => {
    try {
      const record = await base44.entities.Release.get(id);
      const page = await base44.entities.Track.filter({ release_id: id }, { sort: "no", limit: 200 });
      setRelease(record);
      setTracks(page.items);
    } catch (err) {
      setRelease(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    load().then(() => alive);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (loading || release) return;
    const meta = document.createElement("meta");
    meta.name = "prerender-status-code";
    meta.content = "404";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, [loading, release]);

  const playable = tracks.filter((t) => t.has_audio);

  const playTrack = (track) => {
    const index = playable.findIndex((t) => t.id === track.id);
    if (index < 0) {
      playFrom([track], 0);
      return;
    }
    playFrom(playable, index);
  };

  const playAll = () => {
    if (playable.length) playFrom(playable, 0);
  };

  // Release pages are the deep indexable pages, so they carry their own album record.
  usePageMeta({
    title: release
      ? `${release.title} — ${release.artist || "J'ance Nutt"} | AnaLuci.app`
      : "AnaLuci.app — Archive & Stream | J'ance Nutt",
    description: release
      ? `${release.type} · ${release.title} by ${release.artist || "J'ance Nutt"}${
          release.year ? ` (${release.year})` : ""
        } — ${tracks.length} tracks in the AnaLuci.app archive.`
      : "AnaLuci.app is the archive and on-demand streaming platform for artist J'ance Nutt.",
    path: `/release/${id}`,
    image: release?.cover_url,
    type: "music.album",
    jsonLd: release
      ? {
          "@context": "https://schema.org",
          "@type": "MusicAlbum",
          "@id": `${SITE_URL}/release/${release.id}#album`,
          name: release.title,
          url: `${SITE_URL}/release/${release.id}`,
          image: release.cover_url,
          datePublished: release.date || (release.year ? String(release.year) : undefined),
          numTracks: tracks.length || release.track_count,
          byArtist: {
            "@type": "Person",
            "@id": `${SITE_URL}/#jance-nutt`,
            name: release.artist || "J'ance Nutt",
          },
          track: tracks.slice(0, 100).map((track) => ({
            "@type": "MusicRecording",
            name: track.title,
            position: track.no,
          })),
        }
      : undefined,
  });

  // Owner-only artwork swaps, inline: click the cover or a track thumbnail.
  const replaceCover = async (file) => {
    if (!file || !release) return;
    setArtBusy("release");
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      await base44.entities.Release.update(release.id, { cover_url: file_url });
      await base44.entities.Track.updateMany(
        { release_id: release.id },
        { $set: { cover_url: file_url } }
      );
      await load();
    } finally {
      setArtBusy("");
    }
  };

  const replaceTrackArt = async (track, file) => {
    if (!file) return;
    setArtBusy(track.id);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      await base44.entities.Track.update(track.id, { cover_url: file_url });
      await load();
    } finally {
      setArtBusy("");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-amber" />
      </div>
    );
  }

  if (!release) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center sm:px-8">
        <MicroLabel>Signal lost</MicroLabel>
        <h1 className="mt-4 font-display text-2xl font-light text-foreground">
          That release isn&apos;t in the archive
        </h1>
        <Link
          to="/archive"
          className="mt-8 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-amber/80 hover:text-amber"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to the catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/archive"
          className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-amber"
        >
          <ArrowLeft className="h-3 w-3" /> Catalog
        </Link>
        <CloseButton fallback="/archive" label="Close this release" />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div>
          <div className="relative overflow-hidden rounded-sm border border-amber/15 bg-panel hud-glow">
            <CoverImage
              src={release.cover_url}
              alt={`${release.title} cover`}
              className="aspect-square w-full"
            />
            {isAdmin ? (
              <label className="absolute bottom-2 right-2 cursor-pointer rounded-sm border border-amber/40 bg-background/85 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.18em] text-amber/90 hover:bg-amber/15">
                {artBusy === "release" ? "Saving…" : "Change artwork"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => replaceCover(e.target.files?.[0])}
                />
              </label>
            ) : null}
          </div>
          <div className="mt-3 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            <span>No. {padNumber(release.num)}</span>
            <span>{release.type}</span>
          </div>
        </div>

        <div>
          <MicroLabel>{release.type}</MicroLabel>
          <h1 className="mt-3 font-display text-3xl font-light leading-tight tracking-[0.03em] text-foreground sm:text-5xl">
            {release.title}
          </h1>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.28em] text-amber/70">
            {release.artist}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={playAll}
              disabled={!playable.length}
              className="flex items-center gap-2 rounded-sm bg-amber px-6 py-3 font-mono text-[10px] uppercase tracking-[0.24em] text-primary-foreground transition-all hover:bg-amber/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Play className="h-3 w-3" fill="currentColor" /> Stream release
            </button>
            <button
              onClick={() => addToQueue(playable)}
              disabled={!playable.length}
              className="flex items-center gap-2 rounded-sm border border-amber/30 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-amber/90 transition-colors hover:bg-amber/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ListPlus className="h-3 w-3" /> Queue album
            </button>
            <AddToPlaylistButton
              trackIds={playable.map((track) => track.id)}
              label="Add album to playlist"
              className="flex items-center gap-2 rounded-sm border border-white/12 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-amber/30 hover:text-amber"
            />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              {playable.length} of {tracks.length} masters loaded
            </span>
          </div>

          <div className="mt-8">
            <ReleaseMeta release={release} />
          </div>

          {release.activity ? (
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-amber/60">
              {release.activity}
            </p>
          ) : null}
        </div>
      </div>

      <VideoSection tracks={tracks} releaseCover={release.cover_url} />

      <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="hud-panel overflow-hidden rounded-sm">
          <div className="flex items-center justify-between border-b border-amber/10 px-4 py-2.5">
            <MicroLabel>Track manifest</MicroLabel>
            <span className="font-mono text-[9px] tracking-[0.18em] text-muted-foreground">
              {String(tracks.length).padStart(3, "0")} ENTRIES
            </span>
          </div>
          <div>
            {tracks.map((track, index) => (
              <TrackRow
                key={track.id}
                track={track}
                index={index}
                isCurrent={current?.id === track.id}
                isPlaying={playing && current?.id === track.id}
                releaseCover={release.cover_url}
                onArtwork={isAdmin ? replaceTrackArt : undefined}
                onAudio={isAdmin ? load : undefined}
                busy={artBusy === track.id}
                onPlay={playTrack}
                onQueue={addToQueue}
              />
            ))}
            {!tracks.length && (
              <p className="px-4 py-10 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                No tracks recorded
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {isAdmin ? <BulkAudioUpload tracks={tracks} onUpdated={load} /> : null}
          {isAdmin ? <AudioIntake tracks={tracks} onUpdated={load} /> : null}
          {isAdmin ? <VideoIntake tracks={tracks} onUpdated={load} /> : null}
          {isAdmin ? <DropIntake release={release} onUpdated={load} /> : null}
          <div className="hud-panel rounded-sm px-4 py-4">
            <MicroLabel>Stream note</MicroLabel>
            <p className="mt-3 text-xs leading-relaxed text-foreground/60">
              Masters sit in private storage. A signed link is issued the moment a track is
              played, then released — so the catalog never preloads audio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}