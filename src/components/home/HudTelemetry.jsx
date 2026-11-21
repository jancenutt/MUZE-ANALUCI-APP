import MicroLabel from "@/components/MicroLabel";

export function TelemetryRight() {
  return (
    <div className="hidden w-[248px] shrink-0 lg:block">
      <div className="hud-panel hud-glow rounded-sm">
        <div className="flex items-center justify-between border-b border-amber/10 px-3 py-2">
          <MicroLabel>Core</MicroLabel>
          <span className="font-mono text-[9px] text-amber/50">105.73</span>
        </div>
        <div className="flex items-center justify-center py-5">
          <div className="relative h-24 w-24">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="0.6" className="text-amber/20" />
              <circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" strokeWidth="0.4" className="text-amber/25" />
              <circle
                cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="1.4"
                strokeDasharray="180 264" strokeLinecap="round" className="text-amber"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-[13px] tracking-[0.2em] text-amber">AI</span>
              <span className="font-mono text-[8px] tracking-[0.24em] text-muted-foreground">ONLINE</span>
            </div>
          </div>
        </div>
        <div className="space-y-1.5 border-t border-amber/10 px-3 py-3 font-mono text-[10px] text-muted-foreground">
          <div className="flex justify-between"><span className="text-amber/50">NOD</span><span>205.A8</span></div>
          <div className="flex justify-between"><span className="text-amber/50">SYN</span><span>308.5</span></div>
          <div className="flex justify-between"><span className="text-amber/50">AUD</span><span>READY</span></div>
        </div>
      </div>
    </div>
  );
}