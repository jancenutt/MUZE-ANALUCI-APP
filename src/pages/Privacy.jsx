import { usePageMeta } from "@/lib/seo";
import LegalShell from "@/components/legal/LegalShell";
import ClauseSection from "@/components/legal/ClauseSection";
import {
  PRIVACY_CODE,
  PRIVACY_EFFECTIVE_DATE,
  PRIVACY_HEADLINE,
  PRIVACY_SECTIONS,
  PRIVACY_SUBHEAD,
  PRIVACY_VERSION,
} from "@/content/privacyPolicy";

const GROUPS = [
  {
    label: "Sections",
    items: PRIVACY_SECTIONS.map((section) => ({
      id: section.id,
      marker: String(section.no).padStart(2, "0"),
      label: section.title,
    })),
  },
];

export default function Privacy() {
  usePageMeta({
    title: "Privacy Policy — ANA.LUCI",
    description:
      "How AnaLuci.app collects, uses, and protects your information: account and transaction data, internal-only analytics, no sale of personal information, and your rights.",
    path: "/privacy",
  });

  return (
    <LegalShell
      docKey="privacy"
      eyebrow="Legal · Privacy"
      headline={PRIVACY_HEADLINE}
      subhead={PRIVACY_SUBHEAD}
      meta={[
        `Document ${PRIVACY_CODE}`,
        `Effective ${PRIVACY_EFFECTIVE_DATE}`,
        `Version ${PRIVACY_VERSION}`,
        "We never sell your information",
      ]}
      groups={GROUPS}
    >
      <div className="space-y-6">
        {PRIVACY_SECTIONS.map((section) => (
          <ClauseSection key={section.id} section={section} />
        ))}
      </div>

      <p className="mt-8 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        {PRIVACY_CODE} · Version {PRIVACY_VERSION} · Effective {PRIVACY_EFFECTIVE_DATE} · XYE LLC
      </p>
    </LegalShell>
  );
}