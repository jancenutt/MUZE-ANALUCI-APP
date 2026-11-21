import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, RefreshCw, CloudDownload, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MicroLabel from "@/components/MicroLabel";
import SyncReport from "@/components/sync/SyncReport";
import useIsAdmin from "@/hooks/useIsAdmin";

export default function LibrarySync() {
  const isAdmin = useIsAdmin();
  const [busy, setBusy] = useState("");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [lastRun, setLastRun] = useState("");

  const run = async (dryRun) => {
    setBusy(dryRun ? "preview" : "apply");
    setError("");
    try {
      const res = await base44.functions.invoke("notionLibrary", { dryRun });
      setReport(res.data);
      setLastRun(
        new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      );
    } catch (err) {
      setReport(null);
      setError(
        err?.response?.data?.error ||
          "Could not reach Notion. Reconnect the workspace integration and try again."
      );
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        to="/archive"
        className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-amber"
      >
        <ArrowLeft className="h-3 w-3" /> Catalog
      </Link>

      <div className="mt-6">
        <MicroLabel>Notion link</MicroLabel>
        <h1 className="mt-3 font-display text-3xl font-light leading-tight tracking-[0.03em] text-foreground sm:text-4xl">
          Library sync
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/60">
          Artist, title, catalog number, UPC, release date and track numbering are read from your
          Notion Releases and Tracks databases. Artwork and audio files are never touched.
        </p>
      </div>

      {!isAdmin ? (
        <p className="mt-8 rounded-sm border border-amber/10 px-4 py-6 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Owner access only
        </p>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => run(true)}
              disabled={!!busy}
              className="flex items-center gap-2 rounded-sm border border-amber/30 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-amber transition-colors hover:bg-amber/10 disabled:opacity-40"
            >
              {busy === "preview" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Preview changes
            </button>
            <button
              onClick={() => run(false)}
              disabled={!!busy}
              className="flex items-center gap-2 rounded-sm bg-amber px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-primary-foreground transition-colors hover:bg-amber/90 disabled:opacity-40"
            >
              {busy === "apply" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CloudDownload className="h-3.5 w-3.5" />
              )}
              Push to catalog
            </button>
            {lastRun && !busy ? (
              <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-amber/50">
                <Check className="h-3 w-3" /> {lastRun}
              </span>
            ) : null}
          </div>

          {error ? (
            <p className="mt-6 rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-3 text-xs text-destructive-foreground">
              {error}
            </p>
          ) : null}

          {report ? (
            <div className="mt-8">
              <SyncReport report={report} />
            </div>
          ) : null}

          <p className="mt-10 font-mono text-[9px] uppercase leading-relaxed tracking-[0.18em] text-muted-foreground/70">
            Tracks join to a release through the Release column in Notion. Entries left blank there
            fall back to a title match, and anything ambiguous is listed rather than guessed.
          </p>
        </>
      )}
    </div>
  );
}