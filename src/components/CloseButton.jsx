import { X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

// Page-level close: step back to wherever the listener came from, or to a sensible home
// when this page was opened directly (fresh tab, pasted link, bookmark). `history.length`
// alone can't tell the difference — the router's own history index can.
export default function CloseButton({ fallback = "/", label = "Close", className = "" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const close = () => {
    const idx = window.history.state?.idx;
    const canGoBack = typeof idx === "number" ? idx > 0 : location.key !== "default";
    if (canGoBack) {
      navigate(-1);
      return;
    }
    navigate(fallback, { replace: true });
  };

  return (
    <button
      type="button"
      onClick={close}
      aria-label={label}
      title={label}
      className={`-mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-amber active:bg-white/10 ${className}`}
    >
      <X className="h-[18px] w-[18px]" />
    </button>
  );
}