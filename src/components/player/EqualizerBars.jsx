// Three bars that keep time while the track plays, and rest flat when it is paused.
export default function EqualizerBars({ paused = false }) {
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
      {[0, 1, 2].map((bar) => (
        <span
          key={bar}
          style={{ animationDelay: `${bar * 0.18}s` }}
          className={`w-[2px] origin-bottom rounded-sm bg-amber ${
            paused ? "h-1" : "h-3 animate-eq"
          }`}
        />
      ))}
    </span>
  );
}