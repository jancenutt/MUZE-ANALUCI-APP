const VIEWS = [
  { id: "albums", label: "Album view" },
  { id: "songs", label: "Song view" },
  { id: "artists", label: "Artist view" },
];

export default function ArchiveViewToggle({ view, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-sm border border-amber/15 p-1 sm:w-fit">
      {VIEWS.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`rounded-sm px-4 py-2 font-mono text-[9px] uppercase tracking-[0.2em] transition-colors ${
            view === item.id
              ? "bg-amber/10 text-amber"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}