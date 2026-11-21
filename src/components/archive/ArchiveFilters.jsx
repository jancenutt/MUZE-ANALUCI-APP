import { Search, X } from "lucide-react";
import { TYPES } from "@/lib/catalog";

function Chip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-sm border px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] transition-colors ${
        active
          ? "border-amber/50 bg-amber/10 text-amber"
          : "border-white/10 text-muted-foreground hover:border-amber/25 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export default function ArchiveFilters({ q, onQ, type, onType, artist, onArtist, artists, showType = true }) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => onQ(e.target.value)}
          placeholder="Search releases and track titles"
          className="w-full rounded-sm border border-white/10 bg-panel/60 py-3 pl-11 pr-10 font-mono text-xs tracking-[0.08em] text-foreground placeholder:text-muted-foreground/70 focus:border-amber/40 focus:outline-none focus:ring-1 focus:ring-amber/20"
        />
        {q ? (
          <button
            onClick={() => onQ("")}
            aria-label="Clear search"
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {showType ? (
        <div className="flex flex-wrap gap-1.5">
          <Chip active={!type} onClick={() => onType("")}>
            All formats
          </Chip>
          {TYPES.map((t) => (
            <Chip key={t} active={type === t} onClick={() => onType(type === t ? "" : t)}>
              {t}
            </Chip>
          ))}
        </div>
      ) : null}

      {artists.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <Chip active={!artist} onClick={() => onArtist("")}>
            All aliases
          </Chip>
          {artists.map((a) => (
            <Chip key={a} active={artist === a} onClick={() => onArtist(artist === a ? "" : a)}>
              {a}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}