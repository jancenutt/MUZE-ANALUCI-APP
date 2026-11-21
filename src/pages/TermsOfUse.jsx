import { usePageMeta } from "@/lib/seo";
import LegalShell from "@/components/legal/LegalShell";
import ClauseSection from "@/components/legal/ClauseSection";
import {
  WEBSITE_TERMS_CODE,
  WEBSITE_TERMS_EFFECTIVE_DATE,
  WEBSITE_TERMS_HEADLINE,
  WEBSITE_TERMS_SECTIONS,
  WEBSITE_TERMS_SUBHEAD,
  WEBSITE_TERMS_VERSION,
} from "@/content/websiteTerms";

const GROUPS = [
  {
    label: "Sections",
    items: WEBSITE_TERMS_SECTIONS.map((section) => ({
      id: section.id,
      marker: String(section.no).padStart(2, "0"),
      label: section.title,
    })),
  },
];

export default function TermsOfUse() {
  usePageMeta({
    title: "Website Terms of Use — ANA.LUCI",
    description:
      "The Website Terms of Use governing access to AnaLuci.app and the ANA.LUCI platform, including accounts, streaming, prohibited conduct, and dispute resolution.",
    path: "/terms-of-use",
  });

  return (
    <LegalShell
      docKey="terms-of-use"
      eyebrow="Legal · Terms of Use"
      headline={WEBSITE_TERMS_HEADLINE}
      subhead={WEBSITE_TERMS_SUBHEAD}
      meta={[
        `Document ${WEBSITE_TERMS_CODE}`,
        `Effective ${WEBSITE_TERMS_EFFECTIVE_DATE}`,
        `Version ${WEBSITE_TERMS_VERSION}`,
        "Governing law: State of Arizona",
      ]}
      groups={GROUPS}
    >
      <div className="space-y-6">
        {WEBSITE_TERMS_SECTIONS.map((section) => (
          <ClauseSection key={section.id} section={section} />
        ))}
      </div>

      <p className="mt-8 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        {WEBSITE_TERMS_CODE} · Version {WEBSITE_TERMS_VERSION} · Effective{" "}
        {WEBSITE_TERMS_EFFECTIVE_DATE} · XYE LLC
      </p>
    </LegalShell>
  );
}