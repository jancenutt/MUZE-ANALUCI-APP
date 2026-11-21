import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

const STAMP_KEY = "analuci:notion-sync-at";
const THROTTLE_MS = 5 * 60 * 1000;

// Notion → catalog reconcile, run quietly whenever the owner opens the app.
// Throttled so a burst of page loads still only reads Notion once every few minutes.
export default function useNotionAutoSync() {
  useEffect(() => {
    let alive = true;

    base44.auth
      .me()
      .then((user) => {
        if (!alive || user?.role !== "admin") return;

        const last = Number(window.localStorage.getItem(STAMP_KEY) || 0);
        if (Date.now() - last < THROTTLE_MS) return;
        window.localStorage.setItem(STAMP_KEY, String(Date.now()));

        base44.functions
          .invoke("notionLibrary", { dryRun: false })
          .then((res) => {
            const applied = res?.data?.applied;
            if (!applied) return;
            const changed =
              applied.releaseUpdates +
              applied.releaseCreates +
              applied.trackUpdates +
              applied.trackCreates;
            // Fresh data landed — reload once so the open page shows it.
            if (changed > 0) window.location.reload();
          })
          .catch(() => {});
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);
}