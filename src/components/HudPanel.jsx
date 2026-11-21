import MicroLabel from "@/components/MicroLabel";

export default function HudPanel({ label, right, children, className = "" }) {
  return (
    <div className={`hud-panel hud-glow relative rounded-sm ${className}`}>
      <span className="pointer-events-none absolute left-0 top-0 h-2 w-2 border-l border-t border-amber/40" />
      <span className="pointer-events-none absolute right-0 top-0 h-2 w-2 border-r border-t border-amber/40" />
      <span className="pointer-events-none absolute bottom-0 left-0 h-2 w-2 border-b border-l border-amber/40" />
      <span className="pointer-events-none absolute bottom-0 right-0 h-2 w-2 border-b border-r border-amber/40" />
      {(label || right) && (
        <div className="flex items-center justify-between gap-4 border-b border-amber/10 px-4 py-2.5">
          <MicroLabel>{label}</MicroLabel>
          {right ? <div className="font-mono text-[10px] text-muted-foreground">{right}</div> : null}
        </div>
      )}
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}