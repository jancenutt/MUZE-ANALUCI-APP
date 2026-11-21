import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CoverImage from "@/components/CoverImage";
import MicroLabel from "@/components/MicroLabel";
import useEntitlement from "@/hooks/useEntitlement";

// Music videos stream in the player for everyone — this copy of the app is the
// open archive. Videos are never served as files: the signed link is issued the
// moment Watch is pressed and expires an hour later.
export default function VideoSection({ tracks, releaseCover }) {
  const { loading } = useEntitlement();
  const [openId, setOpenId] = useState("");
  const [src, setSrc] = useState("");
  const [busyId, setBusyId] = useState("");

  const videos = tracks.filter((track) => track.video_public && track.video_uri);
  if (loading || !videos.length) return null;

  const watch = async (track) => {
    if (openId === track.id) {
      setOpenId("");
      setSrc("");
      return;
    }
    setBusyId(track.id);
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: track.video_uri,
        expires_in: 3600,
      });
      setSrc(signed_url);
      setOpenId(track.id);
    } finally {
      setBusyId("");
    }
  };

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between">
        <MicroLabel>Music videos</MicroLabel>
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-amber/60">
          Streaming · files by email
        </span>
      </div>

      {openId && src ? (
        <div className="mt-3 overflow-hidden rounded-sm border border-amber/20 bg-black">
          <video key={openId} src={src} controls autoPlay className="aspect-video w-full" />
          <p className="px-3 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            {videos.find((track) => track.id === openId)?.title} · music video
          </p>
        </div>
      ) : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {videos.map((track) => {
          const thumb = track.cover_url || releaseCover;
          return (
            <div key={track.id} className="hud-panel flex items-center gap-3 rounded-sm p-2.5">
              <div className="h-11 w-16 shrink-0 overflow-hidden rounded-sm border border-white/10 bg-panel">
                {thumb ? <CoverImage src={thumb} alt="" className="h-full w-full" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-foreground/90">{track.title}</p>
                <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                  Music video
                </p>
              </div>
              <button
                type="button"
                onClick={() => watch(track)}
                disabled={busyId === track.id}
                className="flex shrink-0 items-center gap-1.5 rounded-sm border border-amber/30 px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.16em] text-amber/90 transition-colors hover:bg-amber/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyId === track.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Play className="h-3 w-3" fill="currentColor" />
                )}
                {openId === track.id ? "Hide" : "Watch"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
