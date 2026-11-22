import { Link, useLocation } from "react-router-dom";
import useIsAdmin from "@/hooks/useIsAdmin";
import { useAuth } from "@/lib/AuthContext";

const LINKS = [
  { to: "/", label: "Core" },
  { to: "/archive", label: "Archive" },
  { to: "/brand", label: "Brand" },
  { to: "/membership", label: "Membership" },
  { to: "/playlists", label: "Playlists" },
  { to: "/account", label: "Account" },
];

export default function SiteNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const links = isAdmin
    ? [...LINKS, { to: "/sync", label: "Sync" }, { to: "/admin", label: "Admin" }]
    : LINKS;

  return (
    <header className="safe-top sticky top-0 z-40 border-b border-amber/10 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link to="/" className="group flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-amber/50" />
            <span className="relative h-2 w-2 rounded-full bg-amber" />
          </span>
          <span className="font-mono text-sm uppercase tracking-[0.42em] text-foreground transition-colors group-hover:text-amber">
            ANA.LUCI
          </span>
        </Link>

        {!user ? (
          <Link
            to={`/login?returnTo=${encodeURIComponent(pathname + window.location.search)}`}
            className="shrink-0 rounded-sm border border-amber/30 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber/90 transition-colors hover:bg-amber/[0.08]"
          >
            Log in
          </Link>
        ) : (
          <Link
            to="/account"
            className="shrink-0 rounded-sm border border-amber/15 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
          >
            {user.full_name || "My account"}
          </Link>
        )}
      </div>

      {/* The mobile shell navigates from BottomTabs, so only the logo row shows there. */}
      <div className="hidden border-t border-amber/[0.07] md:block">
        <nav className="mx-auto flex max-w-7xl items-stretch overflow-x-auto px-5 no-scrollbar sm:px-8">
          {links.map((link) => {
            const active = pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex flex-1 items-center justify-center whitespace-nowrap px-3 py-3 font-mono text-[10px] uppercase tracking-[0.22em] transition-colors ${
                  active
                    ? "border-b-2 border-amber bg-amber/[0.06] text-amber"
                    : "border-b-2 border-transparent text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="hidden justify-between px-8 py-1 font-mono text-[9px] uppercase tracking-[0.3em] text-amber/35 sm:flex">
        <span>ANA.LUCI — AI system online</span>
        <span>Archive reconstruction · On-demand audio</span>
      </div>
    </header>
  );
}