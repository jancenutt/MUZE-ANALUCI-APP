export default function MicroLabel({ children, className = "" }) {
  return (
    <span
      className={`font-mono text-[10px] uppercase tracking-[0.34em] text-amber/60 ${className}`}
    >
      {children}
    </span>
  );
}