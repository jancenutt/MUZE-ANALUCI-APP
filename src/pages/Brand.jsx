import MicroLabel from "@/components/MicroLabel";
import BrandChain from "@/components/brand/BrandChain";
import BrandValues from "@/components/brand/BrandValues";
import BrandTrust from "@/components/brand/BrandTrust";
import { BRAND_INTRO, BRAND_LINKS, CULTURE } from "@/lib/brand";
import { SITE_URL, usePageMeta } from "@/lib/seo";

const DESCRIPTION =
  "The brand behind AnaLuci.app: J'ance Nutt, the artist; jancenutt.com, the official home and store; and AnaLuci.app, the ad-free streaming platform and AI assistant. Core values and culture.";

export default function Brand() {
  usePageMeta({
    title: "The Brand — J'ance Nutt, jancenutt.com & AnaLuci.app",
    description: DESCRIPTION,
    path: "/brand",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "AboutPage",
          "@id": `${SITE_URL}/brand#page`,
          url: `${SITE_URL}/brand`,
          name: "The Brand — J'ance Nutt, jancenutt.com & AnaLuci.app",
          description: DESCRIPTION,
          about: [
            { "@id": `${SITE_URL}/#jance-nutt` },
            { "@id": "https://jancenutt.com/#website" },
            { "@id": `${SITE_URL}/#website` },
          ],
        },
        {
          "@type": "Person",
          "@id": `${SITE_URL}/#jance-nutt`,
          name: "J'ance Nutt",
          alternateName: ["Jance Nutt", "jancenutt", "JAY.XYE", "JayNutt", "FknJance", "ZaddyXYE", "XYE"],
          jobTitle: "Sound designer, audio engineer, recording artist",
          url: "https://jancenutt.com",
          worksFor: { "@id": `${SITE_URL}/#jn-muzik-clik` },
          knowsAbout: ["sound design", "audio engineering", "sonic branding", "streetwear", "hip-hop"],
          sameAs: ["https://soundcloud.com/jancenutt"],
        },
        {
          "@type": "Organization",
          "@id": `${SITE_URL}/#jn-muzik-clik`,
          name: "JN MUZIK CLIK",
          url: "https://jancenutt.com",
          founder: { "@id": `${SITE_URL}/#jance-nutt` },
          description:
            "Creative company behind jancenutt.com — sound design and audio branding, streetwear, and the AnaLuci.app streaming platform.",
        },
        {
          "@type": "WebSite",
          "@id": "https://jancenutt.com/#website",
          name: "jancenutt.com — Official Site",
          alternateName: "jancenutt.com",
          url: "https://jancenutt.com",
          publisher: { "@id": `${SITE_URL}/#jance-nutt` },
        },
        {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          name: "AnaLuci.app",
          alternateName: "AnaLuci.app",
          url: SITE_URL,
          description:
            "Ad-free streaming platform and AI assistant for the catalog of J'ance Nutt.",
          publisher: { "@id": `${SITE_URL}/#jn-muzik-clik` },
          about: { "@id": `${SITE_URL}/#jance-nutt` },
        },
      ],
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <header className="max-w-3xl">
        <MicroLabel>Brand record</MicroLabel>
        <h1 className="amber-glow mt-4 font-display text-3xl font-light leading-tight tracking-[0.03em] text-foreground sm:text-5xl">
          One artist, one site, one platform
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-foreground/65">{BRAND_INTRO}</p>
      </header>

      <div className="mt-12">
        <BrandChain />
      </div>

      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <MicroLabel>Core values</MicroLabel>
            <h2 className="mt-3 font-display text-2xl font-light tracking-[0.03em] text-foreground sm:text-3xl">
              What the platform is built on
            </h2>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
            Non-negotiable
          </span>
        </div>
        <div className="mt-7">
          <BrandValues />
        </div>
      </section>

      <section className="mt-14">
        <MicroLabel>Beliefs & culture</MicroLabel>
        <h2 className="mt-3 font-display text-2xl font-light tracking-[0.03em] text-foreground sm:text-3xl">
          How ANA.LUCI carries it
        </h2>
        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          {CULTURE.map((item) => (
            <article key={item.label} className="hud-panel rounded-sm p-5">
              <h3 className="font-mono text-[9px] uppercase leading-relaxed tracking-[0.2em] text-amber/70">
                {item.label}
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-foreground/60">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="hud-panel mt-14 flex flex-col gap-5 rounded-sm p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <MicroLabel>Elsewhere</MicroLabel>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.18em] text-amber/70">
            {BRAND_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="transition-colors hover:text-amber"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <p className="max-w-xs font-mono text-[9px] uppercase leading-relaxed tracking-[0.18em] text-muted-foreground/60">
          Ad-free streaming, run by ANA.LUCI
        </p>
      </section>

      <BrandTrust />
    </div>
  );
}