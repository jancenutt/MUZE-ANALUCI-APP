import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import useEntitlement from "@/hooks/useEntitlement";

const PlayerContext = createContext(null);
const PREVIEW_SECONDS = 30;

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const queueRef = useRef([]);
  const indexRef = useRef(-1);
  const cacheRef = useRef(new Map());
  const ticketRef = useRef(0);

  const [current, setCurrent] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [notice, setNotice] = useState("");
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [previewRange, setPreviewRange] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState("off");
  const [nowPlaying, setNowPlaying] = useState(false);
  const shuffleRef = useRef(false);
  const repeatRef = useRef("off");
  // The order the member had before shuffle, so the second tap restores it.
  const savedOrderRef = useRef(null);
  const previewRangeRef = useRef(null);
  const pendingPreviewRef = useRef(false);
  const entitlement = useEntitlement();

  // Once a membership arrives, the snippet window is dropped mid-track.
  useEffect(() => {
    if (entitlement.restricted) return;
    previewRangeRef.current = null;
    setPreviewRange(null);
  }, [entitlement.restricted]);

  // A stream link is minted only for the track being played — never on page load.
  const streamUrl = useCallback(async (track) => {
    const cached = cacheRef.current.get(track.audio_uri);
    if (cached && cached.expires > Date.now() + 120000) return cached.url;
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
      file_uri: track.audio_uri,
      expires_in: 3600,
    });
    cacheRef.current.set(track.audio_uri, { url: signed_url, expires: Date.now() + 3600 * 1000 });
    return signed_url;
  }, []);

  const start = useCallback(
    async (track, list, index) => {
      if (!track) return;
      const audio = audioRef.current;
      // A track is cut to a snippet only when the server confirmed this member has no
      // membership. Everything else — beta tester, paying member, admin, or a browser that
      // blocked the answer — plays the full master.
      const entitled = !entitlement.restricted;
      // Non-members hear a random 30-second snippet of the master, then the paywall.
      previewRangeRef.current = null;
      setPreviewRange(null);
      pendingPreviewRef.current = !entitled;
      const ticket = ++ticketRef.current;
      const nextList = Array.isArray(list) ? list : [track];
      // A brand-new list replaces the one shuffle remembered.
      if (Array.isArray(list) && list !== queueRef.current) savedOrderRef.current = null;
      queueRef.current = nextList;
      indexRef.current = index;
      setQueue(nextList);
      setQueueIndex(index);
      setCurrent(track);
      setTime(0);
      setDuration(0);
      setNotice("");
      if (!audio || !track) return;
      audio.pause();
      if (!track.has_audio || !track.audio_uri) {
        audio.removeAttribute("src");
        setPlaying(false);
        setLoading(false);
        setNotice("This master isn't in the archive yet");
        return;
      }
      setLoading(true);
      setPlaying(true);
      try {
        const url = await streamUrl(track);
        if (ticketRef.current !== ticket) return;
        audio.src = url;
        await audio.play();
      } catch (err) {
        if (ticketRef.current === ticket) {
          setPlaying(false);
          if (err?.name === "NotAllowedError") {
            // Safari and Brave hold the stream back when play() follows a network await
            // (the tap is no longer counted). The source stays loaded, so the next press
            // starts it straight away — reloading it here would restart the whole fetch.
            setNotice("Press play to start the stream");
          } else {
            setNotice("Stream unavailable — try again");
          }
        }
      } finally {
        if (ticketRef.current === ticket) setLoading(false);
      }
    },
    [streamUrl, entitlement.loading, entitlement.restricted]
  );

  // Pressing a song anywhere opens the full player over the page.
  const playFrom = useCallback(
    (list, index) => {
      setNowPlaying(true);
      return start(list[index], list, index);
    },
    [start]
  );

  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!current) return;
    if (!audio.src) {
      start(current, queueRef.current, indexRef.current);
      return;
    }
    if (audio.paused) {
      try {
        await audio.play();
      } catch (err) {
        setPlaying(false);
      }
    } else {
      audio.pause();
    }
  }, [current, start]);

  const step = useCallback(
    (dir) => {
      const list = queueRef.current;
      const target = indexRef.current + dir;
      if (target < 0 || target >= list.length) return;
      start(list[target], list, target);
    },
    [start]
  );

  // The visible up-next list IS the play order, so next is the row below.
  const next = useCallback(() => {
    const list = queueRef.current;
    if (!list.length) return;
    const target = indexRef.current + 1;
    if (target < list.length) {
      start(list[target], list, target);
      return;
    }
    if (repeatRef.current === "all") start(list[0], list, 0);
  }, [start]);

  const handleEnded = useCallback(() => {
    const list = queueRef.current;
    if (!list.length) return;
    if (repeatRef.current === "one") {
      start(list[indexRef.current], list, indexRef.current);
      return;
    }
    next();
  }, [next, start]);

  // Shuffle physically rewrites the up-next order: the playing track stays first and the
  // rest are scattered behind it. The second tap puts the original order back.
  const toggleShuffle = useCallback(() => {
    const list = queueRef.current;
    const turningOn = !shuffleRef.current;
    shuffleRef.current = turningOn;
    setShuffle(turningOn);
    if (!list.length) return;

    const playingTrack = list[indexRef.current];
    if (turningOn) {
      if (!savedOrderRef.current) savedOrderRef.current = { list, index: indexRef.current };
      const rest = list.filter((_, index) => index !== indexRef.current);
      for (let i = rest.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
      const reordered = playingTrack ? [playingTrack, ...rest] : rest;
      queueRef.current = reordered;
      indexRef.current = playingTrack ? 0 : -1;
      setQueue(reordered);
      setQueueIndex(indexRef.current);
      return;
    }

    const saved = savedOrderRef.current;
    savedOrderRef.current = null;
    if (!saved || !playingTrack) return;
    const present = new Set(list.map((track) => track.id));
    const restored = saved.list.filter((track) => present.has(track.id));
    list.forEach((track) => {
      if (!restored.some((item) => item.id === track.id)) restored.push(track);
    });
    const at = restored.findIndex((track) => track.id === playingTrack.id);
    queueRef.current = restored;
    indexRef.current = at;
    setQueue(restored);
    setQueueIndex(at);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeat((prev) => {
      const mode = prev === "off" ? "all" : prev === "all" ? "one" : "off";
      repeatRef.current = mode;
      return mode;
    });
  }, []);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    const range = previewRangeRef.current;
    if (audio && range) {
      audio.currentTime = range.start;
      setTime(range.start);
      return;
    }
    if (audio && audio.currentTime > 4) {
      audio.currentTime = 0;
      setTime(0);
      return;
    }
    step(-1);
  }, [step]);

  const seek = useCallback((value) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(value)) return;
    const range = previewRangeRef.current;
    const target = range
      ? Math.min(Math.max(value, range.start), Math.max(range.start, range.end - 0.5))
      : value;
    audio.currentTime = target;
    setTime(target);
  }, []);

  const setVolume = useCallback((value) => {
    if (audioRef.current) audioRef.current.volume = value;
    setVolumeState(value);
  }, []);

  // Up-next list: add a song, a whole album, or a playlist's worth of tracks.
  const addToQueue = useCallback(
    (tracks, options = {}) => {
      const items = (Array.isArray(tracks) ? tracks : [tracks]).filter(
        (track) => track && track.has_audio && track.audio_uri
      );
      if (!items.length) return 0;
      const audio = audioRef.current;
      if (!current || !audio || !audio.src) {
        start(items[0], items, 0);
        return items.length;
      }
      const list = queueRef.current;
      const at = options.next
        ? Math.min(Math.max(indexRef.current + 1, 0), list.length)
        : list.length;
      const nextList = [...list.slice(0, at), ...items, ...list.slice(at)];
      queueRef.current = nextList;
      setQueue(nextList);
      return items.length;
    },
    [current, start]
  );

  const removeFromQueue = useCallback((index) => {
    const list = [...queueRef.current];
    if (index < 0 || index >= list.length) return;
    if (index === indexRef.current) return;
    list.splice(index, 1);
    if (index < indexRef.current) indexRef.current -= 1;
    queueRef.current = list;
    setQueue(list);
    setQueueIndex(indexRef.current);
  }, []);

  // Dragging rows in Up Next hands us the new visible order; playback follows it.
  const reorderQueue = useCallback((nextList) => {
    if (!Array.isArray(nextList) || nextList.length !== queueRef.current.length) return;
    const playingTrack = queueRef.current[indexRef.current];
    const at = playingTrack ? nextList.findIndex((track) => track.id === playingTrack.id) : -1;
    queueRef.current = nextList;
    indexRef.current = at;
    setQueue(nextList);
    setQueueIndex(at);
  }, []);

  // Clear everything except the track that is playing right now.
  const clearQueue = useCallback(() => {
    const now = queueRef.current[indexRef.current];
    const list = now ? [now] : [];
    queueRef.current = list;
    indexRef.current = now ? 0 : -1;
    setQueue(list);
    setQueueIndex(indexRef.current);
  }, []);

  // The next stream link is minted only as the current track runs out, so the list never
  // mints links ahead of playback.
  useEffect(() => {
    if (entitlement.restricted) return;
    const upcoming = queueRef.current[indexRef.current + 1];
    if (!upcoming || !upcoming.audio_uri) return;
    if (!duration || duration - time > 15) return;
    streamUrl(upcoming).catch(() => {
      // A failed prefetch just means the link is minted again when the track starts.
    });
  }, [time, duration, entitlement.restricted, streamUrl]);

  // Lock-screen / OS media controls, so playback survives a locked phone.
  // The OS decides which buttons exist on the lock screen, so the active
  // shuffle/repeat mode is shown on the displayed line instead.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const MediaMeta = typeof window !== "undefined" ? window.MediaMetadata : null;
    if (!current || !MediaMeta) return;
    const modes = [
      shuffle ? "Shuffle on" : null,
      repeat === "one" ? "Repeat one" : repeat === "all" ? "Repeat all" : null,
    ].filter(Boolean);
    try {
      navigator.mediaSession.metadata = new MediaMeta({
        title: current.title || "Untitled",
        artist: [current.artist || "J'ance Nutt", ...modes].join(" \u00B7 "),
        album: current.release_title || "ANA.LUCI Player",
        artwork: current.cover_url
          ? [{ src: current.cover_url, sizes: "512x512", type: "image/jpeg" }]
          : [],
      });
    } catch (err) {
      // Media metadata is a progressive enhancement.
    }
  }, [current]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;
    const handlers = {
      play: () => {
        if (audioRef.current?.paused) toggle();
      },
      pause: () => {
        if (audioRef.current && !audioRef.current.paused) toggle();
      },
      previoustrack: prev,
      nexttrack: next,
      stop: () => audioRef.current?.pause(),
    };
    Object.entries(handlers).forEach(([action, handler]) => {
      try {
        session.setActionHandler(action, handler);
      } catch (err) {
        // That action isn't supported by this browser.
      }
    });
    return () => {
      Object.keys(handlers).forEach((action) => {
        try {
          session.setActionHandler(action, null);
        } catch (err) {
          // Nothing to release.
        }
      });
    };
  }, [toggle, prev, next]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    } catch (err) {
      // Safari exposes the session but keeps this member read-only on older versions.
    }
  }, [playing]);

  const value = {
    current,
    playing,
    loading,
    time,
    duration,
    volume,
    notice,
    playFrom,
    toggle,
    next,
    prev,
    seek,
    setVolume,
    queue,
    queueIndex,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    shuffle,
    toggleShuffle,
    repeat,
    cycleRepeat,
    nowPlaying,
    openNowPlaying: () => setNowPlaying(true),
    closeNowPlaying: () => setNowPlaying(false),
    paywallOpen,
    closePaywall: () => setPaywallOpen(false),
    preview: previewRange,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        playsInline
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          const range = previewRangeRef.current;
          if (range && el.currentTime >= range.end - 0.12) {
            el.pause();
            el.currentTime = range.start;
            setTime(range.start);
            setNotice("Preview ended · membership unlocks the full master");
            setPaywallOpen(true);
            return;
          }
          setTime(el.currentTime);
        }}
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          el.volume = volume;
          setDuration(el.duration || 0);
          if (!pendingPreviewRef.current) return;
          pendingPreviewRef.current = false;
          // Membership landed between the press and the metadata — play the master whole.
          if (!entitlement.restricted) return;
          const total = Number.isFinite(el.duration) ? el.duration : 0;
          const length = Math.min(PREVIEW_SECONDS, total || PREVIEW_SECONDS);
          const offset = total > length ? Math.random() * (total - length) : 0;
          const range = { start: offset, end: offset + length };
          previewRangeRef.current = range;
          setPreviewRange(range);
          try {
            el.currentTime = offset;
            setTime(offset);
          } catch (err) {
            // Safari refuses the jump until the file reports a seekable length.
          }
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onWaiting={() => setLoading(true)}
        onPlaying={() => setLoading(false)}
        onEnded={handleEnded}
        onError={(e) => {
          if (!e.currentTarget.getAttribute("src")) return;
          setPlaying(false);
          setLoading(false);
          setNotice("Stream unavailable — try again");
        }}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}