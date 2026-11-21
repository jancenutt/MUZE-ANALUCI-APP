import { Link, useLocation } from "react-router-dom";
import { Disc3, Home, ListMusic, Sparkles, UserRound } from "lucide-react";
import useIsAdmin from "@/hooks/useIsAdmin";

const TABS = [
  { to: "/", label: "Core", Icon: Home },
  { to: "/archive", label: "Archive", Icon: Disc3 },
  { to: "/membership", label: "Membership", Icon: Sparkles },
  { to: "/playlists", label: "Playlists", Icon: ListMusic },
  { to: "/account", label: "Account", Icon: UserRound },
];

// Fixed mobile navigation. Desktop keeps the SiteNav link bar, so this only renders
// below the md breakpoint. It lives inside Layout, which auth screens are never wrapped in.
export default function BottomTabs() {
  const { pathname } = useLocation();
  const isAdmin = useIsAdmin();
  // Membership is private to the admin in this copy — everyone else sees the open archive.
  const tabs = isAdmin ? TABS : TABS.filter((tab) => tab.to !== "/membership");

  return (
    <nav
      aria-label="Primary"
      className="safe-bottom fixed inset-x-0 bottom-0 z-[45] border-t border-amber/15 bg-background/95 backdrop-blur-xl md:hidden"
    >
      <div className="flex items-stretch">
        {tabs.map(({ to, label, Icon }) => {
          const active =
            to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 px-1 py-2 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors ${
                active ? "text-amber" : "text-muted-foreground active:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-amber" : ""}`} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}