import { useRef, useState } from "react";
import { ArrowDown, Loader2 } from "lucide-react";

const TRIGGER = 70;
const MAX_PULL = 110;

// Touch-only pull-down refresh. Nested inside the page it wraps, so the browser's own
// rubber-band scrolling is already switched off in index.css.
export default function PullToRefresh({ onRefresh, children, disabled = false }) {
  const startY = useRef(null);
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const start = (event) => {
    if (disabled || refreshing) return;
    if (window.scrollY > 0) return;
    startY.current = event.touches[0].clientY;
  };

  const move = (event) => {
    if (startY.current == null || disabled || refreshing) return;
    if (window.scrollY > 0) {
      startY.current = null;
      setDistance(0);
      return;
    }
    const delta = event.touches[0].clientY - startY.current;
    setDistance(delta > 0 ? Math.min(MAX_PULL, delta) : 0);
  };

  const end = async () => {
    if (startY.current == null) return;
    startY.current = null;
    if (distance < TRIGGER || disabled) {
      setDistance(0);
      return;
    }
    setDistance(0);
    setRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setRefreshing(false);
    }
  };

  const ready = distance >= TRIGGER;
  const height = refreshing ? 44 : Math.min(distance * 0.6, 66);

  return (
    <div onTouchStart={start} onTouchMove={move} onTouchEnd={end} onTouchCancel={end}>
      <div
        className="flex items-end justify-center overflow-hidden transition-[height] duration-150"
        style={{ height }}
        aria-hidden={!refreshing}
      >
        {refreshing ? (
          <Loader2 className="mb-2 h-4 w-4 animate-spin text-amber" />
        ) : (
          <ArrowDown
            className={`mb-2 h-4 w-4 transition-transform ${ready ? "rotate-180 text-amber" : "text-muted-foreground"}`}
          />
        )}
      </div>
      {children}
    </div>
  );
}