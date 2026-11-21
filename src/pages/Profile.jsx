import MicroLabel from "@/components/MicroLabel";
import ProfileLinks from "@/components/profile/ProfileLinks";
import { ARTIST, BIO, DISAMBIGUATION, LINKS, SITE_LINKS } from "@/lib/profile";
import { SITE_URL, usePageMeta } from "@/lib/seo";
import useIsAdmin from "@/hooks/useIsAdmin";

export default function Profile() {
  const isAdmin = useIsAdmin();
  // Membership is private to the admin in this copy — everyone else sees the open archive.
  const siteLinks = isAdmin
    ? SITE_LINKS
    : SITE_LINKS.filter((link) => link.url !== "/membership");
  usePageMeta({
    title: `${ARTIST.name} — Artist Profile & Links | AnaLuci.app`,
    description: `${ARTIST.name}: ${ARTIST.role}. Founder of ${ARTIST.company}. Official links, catalog and contact.`,
    path: "/profile",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "ProfilePage",
          "@id": `${SITE_URL}/profile#page`,
          url: `${SITE_URL}/profile`,
          name: `${ARTIST.name} — Artist Profile`,
          mainEntity: { "@id": `${SITE_URL}/#jance-nutt` },
        },
        {
          "@type": "Person",
          "@id": `${SITE_URL}/#jance-nutt`,
          name: ARTIST.name,
          alternateName: ARTIST.alternateName,
          jobTitle: ARTIST.role,
          url: ARTIST.site,
          disambiguatingDescription: DISAMBIGUATION,
          worksFor: { "@id": `${SITE_URL}/#jn-muzik-clik` },
          sameAs: LINKS.filter((link) => link.url.startsWith("http")).map((link) => link.url),
        },
        {
          "@type": "Organization",
          "@id": `${SITE_URL}/#jn-muzik-clik`,
          name: ARTIST.company,
          url: ARTIST.site,
          founder: { "@id": `${SITE_URL}/#jance-nutt` },
        },
      ],
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <MicroLabel>Identity record</MicroLabel>
          <h1 className="amber-glow mt-4 font-display text-3xl font-light leading-tight tracking-[0.03em] text-foreground sm:text-5xl">
            {ARTIST.name}
          </h1>
          <p className="mt-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.26em] text-amber/70">
            {ARTIST.role}
          </p>

          <div className="mt-8 space-y-4">
            {BIO.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="max-w-2xl text-sm leading-relaxed text-foreground/65">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="hud-panel mt-8 rounded-sm p-5">
            <MicroLabel>Company</MicroLabel>
            <p className="mt-3 font-display text-xl font-light tracking-[0.03em] text-foreground">
              {ARTIST.company}
            </p>
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-foreground/55">
              Creative company behind the sound design and audio work, the streetwear line, and the
              AnaLuci.app streaming platform.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.18em] text-amber/70">
              <a href={ARTIST.site} target="_blank" rel="noopener noreferrer" className="hover:text-amber">
                {ARTIST.site.replace("https://", "")}
              </a>
            </div>
          </div>

          <p className="mt-6 max-w-2xl font-mono text-[9px] uppercase leading-relaxed tracking-[0.18em] text-muted-foreground/60">
            {DISAMBIGUATION}
          </p>
        </div>

        <div className="space-y-8">
          <ProfileLinks title="Links" links={LINKS} />
          <ProfileLinks title="On AnaLuci.app" links={siteLinks} internal />
        </div>
      </div>
    </div>
  );
}