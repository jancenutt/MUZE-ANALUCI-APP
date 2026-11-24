import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CornerDownLeft, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MicroLabel from "@/components/MicroLabel";
import CloseButton from "@/components/CloseButton";
import { usePageMeta } from "@/lib/seo";
import { releasePath, useReleaseSlugMap } from "@/lib/slugs";

const SUGGESTIONS = [
  "What's the newest release?",
  "How many tracks are in the archive?",
  "Which alias released the most?",
  "Open ARIZONA",
];

const GREETING = {
  role: "core",
  text: "ANA.LUCI online. I hold the whole archive — 41 releases, 272 tracks. Ask for a release, an alias, or a count.",
};

export default function Ask() {
  usePageMeta({
    title: "Ask ANA.LUCI — J'ance Nutt Archive Assistant | AnaLuci.app",
    description:
      "Ask ANA.LUCI about the music of J'ance Nutt — search 41 releases and 272 tracks in the AnaLuci.app open archive and find the right release by J'ance Nutt.",
    path: "/ask",
  });

  const slugMap = useReleaseSlugMap();
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const send = async (value) => {
    const question = (value ?? input).trim();
    if (!question || busy) return;
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setBusy(true);
    try {
      const res = await base44.functions.invoke("askAnaluci", { question });
      const data = res?.data || {};
      setMessages((prev) => [
        ...prev,
        { role: "core", text: data.answer || "I couldn't resolve that.", release: data.release || null },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "core", text: "Core link interrupted. Try that again in a moment." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <MicroLabel>Interface · catalog query</MicroLabel>
          <h1 className="mt-3 font-display text-3xl font-light tracking-[0.06em] text-foreground sm:text-4xl">
            Ask ANA.LUCI
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/60">
            The operations core answers from the archive itself — every title, alias and track count
            comes from the stored catalog.
          </p>
        </div>
        <CloseButton label="Close the terminal" />
      </div>

      <div className="hud-panel hud-glow overflow-hidden rounded-sm">
        <div className="flex items-center justify-between border-b border-amber/10 px-4 py-2.5">
          <MicroLabel>Core terminal</MicroLabel>
          <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-amber/60">
            <span className="h-1.5 w-1.5 rounded-full bg-amber" /> Online
          </span>
        </div>

        <div className="max-h-[52vh] min-h-[280px] space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
          {messages.map((message, i) => (
            <div key={i} className={message.role === "user" ? "flex justify-end" : ""}>
              <div className={message.role === "user" ? "max-w-[85%]" : "max-w-[92%]"}>
                <p className="mb-1 font-mono text-[8px] uppercase tracking-[0.26em] text-muted-foreground/70">
                  {message.role === "user" ? "Operator" : "ANA.LUCI"}
                </p>
                <p
                  className={`selectable whitespace-pre-wrap rounded-sm px-3.5 py-2.5 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "border border-amber/25 bg-amber/[0.07] text-foreground"
                      : "text-foreground/80"
                  }`}
                >
                  {message.text}
                </p>
                {message.release ? (
                  <Link
                    to={slugMap ? releasePath(message.release, slugMap) : `/release/${message.release.id}`}
                    className="mt-2 inline-flex items-center gap-2 rounded-sm border border-amber/25 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-amber/80 transition-colors hover:bg-amber/10"
                  >
                    Open {message.release.title} →
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
          {busy ? (
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber/60">
              <Loader2 className="h-3 w-3 animate-spin" /> Querying archive
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        <div className="border-t border-amber/10 px-4 py-4 sm:px-6">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={busy}
                className="rounded-sm border border-white/10 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-amber/30 hover:text-foreground disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 rounded-sm border border-white/10 bg-panel/60 px-3 focus-within:border-amber/40"
          >
            <span className="font-mono text-xs text-amber/60">&gt;</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the archive…"
              className="flex-1 bg-transparent py-3 font-mono text-xs tracking-[0.06em] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="flex h-8 w-8 items-center justify-center rounded-sm bg-amber text-primary-foreground transition-opacity disabled:opacity-30"
            >
              <CornerDownLeft className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}