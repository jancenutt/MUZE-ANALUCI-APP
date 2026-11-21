export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const STATUS_TONES = {
  Released: "border-emerald-400/30 bg-emerald-400/5 text-emerald-300",
  "Taken down": "border-rose-400/30 bg-rose-400/5 text-rose-300/90",
  "Not shown": "border-white/15 bg-white/[0.03] text-muted-foreground",
};

export function statusLabel(status) {
  const s = (status || "").toLowerCase();
  if (!s) return "Not shown";
  if (s.includes("released")) return "Released";
  if (s.includes("taken down")) return "Taken down";
  return "Not shown";
}

export function statusTone(status) {
  return STATUS_TONES[statusLabel(status)] ?? STATUS_TONES["Not shown"];
}

export function padNumber(n, size = 2) {
  if (n === null || n === undefined || n === "") return "—";
  return String(n).padStart(size, "0");
}