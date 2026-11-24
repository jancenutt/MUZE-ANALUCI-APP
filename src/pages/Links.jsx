import MicroLabel from "@/components/MicroLabel";
import { ARTIST } from "@/lib/profile";
import { SITE_URL, usePageMeta } from "@/lib/seo";

const DESCRIPTION =
  "Every official link for J'ance Nutt in one place: the AnaLuci.app archive, the Apple Music playlists, SoundCloud, YouTube, the JJ&CO TRUST BRAND store at jancenutt.com, The Svens magazine, and his socials.";

const SAME_AS = [
  "https://jancenutt.com",
  "https://soundcloud.com/jancenutt",
  "https://www.youtube.com/jancenutt",
  "https://x.com/jancenutt",
  "https://www.instagram.com/analuci.app/",
  "https://www.instagram.com/fknjancee/",
  "https://www.threads.net/@fknjancee",
  "https://www.tiktok.com/@.jancenutt",
  "https://www.facebook.com/profile.php?id=61588059278192",
];

const GROUPS = [
  {
    label: "Listen",
    links: [
      { label: "AnaLuci.app — the full archive", note: "Every release, streamed free", url: "/archive" },
      {
        label: "Apple Music — J'ance Nutt playlist",
        note: "55 songs, the full contract catalog",
        url: "https://music.apple.com/us/playlist/jance-nutt/pl.u-BNA6vvNTeKXyBYE",
      },
      {
        label: "Apple Music — JN Muzik Clik Inc playlist",
        note: "96 songs",
        url: "https://music.apple.com/us/playlist/jn-muzik-clik-inc/pl.u-6mo41G4i87kpM4e",
      },
      { label: "SoundCloud", note: "soundcloud.com/jancenutt", url: "https://soundcloud.com/jancenutt" },
      { label: "YouTube", note: "youtube.com/jancenutt", url: "https://www.youtube.com/jancenutt" },
    ],
  },
  {
    label: "Shop",
    links: [
      {
        label: "JJ&CO TRUST BRAND — jancenutt.com",
        note: "Street & skate wear, album drops and music",
        url: "https://jancenutt.com",
      },
      {
        label: "WEDDA — Full Album (Digital), $10",
        note: "The complete album, delivered by email",
        url: "https://jancenutt.com/shop",
      },
    ],
  },
  {
    label: "Read",
    links: [
      { label: "The Svens magazine", note: "the7smag.com — stories and the Sportsbook", url: "https://the7smag.com" },
    ],
  },
  {
    label: "Follow",
    links: [
      { label: "Instagram — @analuci.app", note: "The archive, daily", url: "https://www.instagram.com/analuci.app/" },
      { label: "Instagram — @fknjancee", note: "The artist", url: "https://www.instagram.com/fknjancee/" },
      { label: "Threads — @fknjancee", note: "threads.net/@fknjancee", url: "https://www.threads.net/@fknjancee" },
      { label: "TikTok — @.jancenutt", note: "tiktok.com/@.jancenutt", url: "https://www.tiktok.com/@.jancenutt" },
      { label: "Facebook — Ana.Luci", note: "The AnaLuci page", url: "https://www.facebook.com/profile.php?id=61588059278192" },
      { label: "X — @jancenutt", note: "x.com/jancenutt", url: "https://x.com/jancenutt" },
    ],
  },
];

export default function Links() {
  usePageMeta({
    title: "Links — J'ance Nutt",
    description: DESCRIPTION,
    path: "/links",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "ProfilePage",
          "@id": `${SITE_URL}/links#page`,
          url: `${SITE_URL}/links`,
          name: "Links — J'ance Nutt",
          description: DESCRIPTION,
          mainEntity: { "@id": `${SITE_URL}/#jance-nutt` },
        },
        {
          "@type": "Person",
          "@id": `${SITE_URL}/#jance-nutt`,
          name: ARTIST.name,
          alternateName: ARTIST.alternateName,
          url: "https://jancenutt.com",
          sameAs: SAME_AS,
        },
      ],
    },
  });

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8 sm:py-16">
      <header className="text-center">
        <img
          src="/logo-coin.svg"
          alt="AnaLuci coin logo"
          className="mx-auto h-20 w-20 rounded-full"
          width="80"
          height="80"
        />
        <h1 className="amber-glow mt-5 font-display text-3xl font-light leading-tight tracking-[0.03em] text-foreground sm:text-4xl">
          J'ance Nutt
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground/65">
          Every official link in one place — the music, the store, the magazine, and the socials.
        </p>
      </header>

      {GROUPS.map((group) => (
        <section key={group.label} className="mt-10">
          <MicroLabel>{group.label}</MicroLabel>
          <div className="mt-4 flex flex-col gap-3">
            {group.links.map((link) => {
              const external = link.url.startsWith("http");
              return (
                <a
                  key={link.url + link.label}
                  href={link.url}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  className="hud-panel group rounded-sm p-4 transition-colors hover:border-amber/50"
                >
                  <span className="block font-display text-base font-light tracking-[0.02em] text-foreground group-hover:text-amber">
                    {link.label}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-foreground/55">{link.note}</span>
                </a>
              );
            })}
          </div>
        </section>
      ))}

      <p className="mt-12 text-center font-mono text-[9px] uppercase leading-relaxed tracking-[0.18em] text-muted-foreground/60">
        AnaLuci.app — ad-free streaming, run by ANA.LUCI
      </p>
    </div>
  );
}
