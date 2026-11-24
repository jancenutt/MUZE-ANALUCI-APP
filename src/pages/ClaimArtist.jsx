import { useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MicroLabel from "@/components/MicroLabel";
import { usePageMeta } from "@/lib/seo";

// Stub claim page: an artist who wants to be added to AnaLuci can leave a
// request here. It records an ArtistClaim with status "pending" — nothing is
// approved automatically and no account is created. The owner reviews
// requests on the private artist stats page and approves them by hand.
export default function ClaimArtist() {
  usePageMeta({
    title: "Request artist verification | AnaLuci.app",
    description: "Ask to be added as a verified artist on AnaLuci.",
    path: "/claim-artist",
  });

  const [form, setForm] = useState({ artist_name: "", contact_email: "", note: "" });
  const [state, setState] = useState({ sending: false, sent: false, error: "" });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.artist_name.trim() || !form.contact_email.trim()) {
      setState({ sending: false, sent: false, error: "Artist name and contact email are required." });
      return;
    }
    setState({ sending: true, sent: false, error: "" });
    try {
      const slug = form.artist_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      await base44.entities.ArtistClaim.create({
        artist_name: form.artist_name.trim(),
        slug,
        contact_email: form.contact_email.trim(),
        note: form.note.trim(),
        status: "pending",
      });
      setState({ sending: false, sent: true, error: "" });
    } catch (err) {
      setState({
        sending: false,
        sent: false,
        error: "The request couldn't be sent right now — please try again later.",
      });
    }
  };

  const inputClass =
    "w-full rounded-sm border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-amber/40 focus:outline-none";

  return (
    <div className="mx-auto max-w-xl px-5 py-12 sm:px-8 sm:py-16">
      <MicroLabel>Artists</MicroLabel>
      <h1 className="mt-3 font-display text-3xl font-light tracking-[0.06em] text-foreground sm:text-4xl">
        Request verification
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-foreground/60">
        Want your music in the archive as a verified artist? Leave a request.
        Every request is reviewed by hand — sending one doesn't create an
        account and doesn't approve anything on its own.
      </p>

      {state.sent ? (
        <div className="hud-panel mt-8 rounded-sm p-5">
          <MicroLabel>Request received</MicroLabel>
          <p className="mt-3 text-sm leading-relaxed text-foreground/70">
            Your request is on file as pending. If it's approved, you'll hear
            back at the email you left.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="hud-panel mt-8 space-y-4 rounded-sm p-5">
          <div>
            <label htmlFor="claim-name" className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.22em] text-foreground/50">
              Artist name
            </label>
            <input
              id="claim-name"
              value={form.artist_name}
              onChange={set("artist_name")}
              className={inputClass}
              placeholder="Your artist name"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="claim-email" className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.22em] text-foreground/50">
              Contact email
            </label>
            <input
              id="claim-email"
              type="email"
              value={form.contact_email}
              onChange={set("contact_email")}
              className={inputClass}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="claim-note" className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.22em] text-foreground/50">
              Note — links to your music, proof it's you
            </label>
            <textarea
              id="claim-note"
              value={form.note}
              onChange={set("note")}
              rows={4}
              className={inputClass}
              placeholder="Streaming links, socials, anything that shows this is your music"
            />
          </div>
          {state.error ? <p className="text-sm text-red-300/90">{state.error}</p> : null}
          <button
            type="submit"
            disabled={state.sending}
            className="inline-flex items-center gap-2 rounded-sm border border-amber/30 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.22em] text-amber/90 hover:bg-amber/[0.08] disabled:opacity-50"
          >
            {state.sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {state.sending ? "Sending…" : "Send request"}
          </button>
        </form>
      )}
    </div>
  );
}
