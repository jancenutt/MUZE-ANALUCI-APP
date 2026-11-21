import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MicroLabel from "@/components/MicroLabel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DeleteAccountPanel({ email }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const remove = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await base44.functions.invoke("delete-account", {});
      if (response?.data?.error) throw new Error(response.data.error);
      await base44.auth.logout("/");
    } catch (err) {
      setError(
        err?.response?.data?.error || err?.message || "Could not delete this account."
      );
      setBusy(false);
    }
  };

  return (
    <div className="rounded-sm border border-destructive/30 p-5">
      <MicroLabel>Delete account</MicroLabel>
      <p className="mt-3 text-xs leading-relaxed text-foreground/55">
        Removing your account permanently deletes your profile, purchases, playlists and library
        items. This cannot be undone.
      </p>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            disabled={busy}
            className="mt-4 flex min-h-[44px] items-center gap-2 rounded-sm border border-destructive/50 px-4 font-mono text-[9px] uppercase tracking-[0.2em] text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            Delete my account
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="hud-panel rounded-sm border-amber/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-light tracking-[0.04em] text-foreground">
              Delete {email || "this account"}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed text-foreground/60">
              Your profile, purchases, playlists and library items are permanently deleted, and any
              active membership ends immediately. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px] rounded-sm border-white/15 bg-transparent font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground hover:bg-white/5 hover:text-foreground">
              Keep my account
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={remove}
              className="min-h-[44px] rounded-sm bg-destructive font-mono text-[9px] uppercase tracking-[0.18em] text-destructive-foreground hover:bg-destructive/90"
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {error ? (
        <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-destructive">{error}</p>
      ) : null}
    </div>
  );
}