import { usePageMeta } from "@/lib/seo";
import LegalShell from "@/components/legal/LegalShell";
import TermsSection from "@/components/terms/TermsSection";
import TermsSchedule from "@/components/terms/TermsSchedule";
import {
  ACCEPTANCE_BLOCK,
  MASTER_SECTIONS,
  TERMS_CODE,
  TERMS_EFFECTIVE_DATE,
  TERMS_GOVERNING_LAW,
  TERMS_HEADLINE,
  TERMS_NOTICE,
  TERMS_SUBHEAD,
  TERMS_VERSION,
  TIER_SCHEDULES,
} from "@/content/membershipTerms";

const GROUPS = [
  {
    label: "Part I — Master Terms",
    items: MASTER_SECTIONS.map((section) => ({
      id: section.id,
      marker: String(section.no).padStart(2, "0"),
      label: section.title,
    })),
  },
  {
    label: "Part II — Schedules",
    items: TIER_SCHEDULES.map((schedule) => ({
      id: schedule.id,
      marker: schedule.letter,
      label: schedule.title,
    })),
  },
];

export default function Terms() {
  usePageMeta({
    title: "Membership Terms & License Agreement — ANA.LUCI",
    description:
      "The Membership Terms, Conditions and License Agreement governing all five ANA.LUCI club memberships, including licensing, delivery by email, and dispute resolution.",
    path: "/terms",
  });

  return (
    <LegalShell
      docKey="membership"
      eyebrow="Legal · Membership"
      headline={TERMS_HEADLINE}
      subhead={TERMS_SUBHEAD}
      meta={[
        `Document ${TERMS_CODE}`,
        `Effective ${TERMS_EFFECTIVE_DATE}`,
        `Version ${TERMS_VERSION}`,
        `Governing law: ${TERMS_GOVERNING_LAW}`,
      ]}
      notice={TERMS_NOTICE}
      groups={GROUPS}
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-amber/60">
        Part I — Master Terms
      </p>

      <div className="mt-5 space-y-6">
        {MASTER_SECTIONS.map((section) => (
          <TermsSection key={section.id} section={section} />
        ))}
      </div>

      <p className="mt-12 font-mono text-[9px] uppercase tracking-[0.24em] text-amber/60">
        Part II — Membership Schedules
      </p>
      <p className="mt-2 text-[12px] leading-relaxed text-foreground/60">
        Each Schedule below is incorporated into and forms part of these Terms. The Schedule matching
        your purchase governs your Membership. In any conflict, the Schedule controls for that Tier.
      </p>

      <div className="mt-5 space-y-4">
        {TIER_SCHEDULES.map((schedule) => (
          <TermsSchedule key={schedule.id} schedule={schedule} />
        ))}
      </div>

      <section className="mt-10 border border-amber/25 bg-card/40 p-5">
        <h2 className="font-display text-lg font-light text-foreground">{ACCEPTANCE_BLOCK.title}</h2>
        <div className="mt-3 space-y-3">
          {ACCEPTANCE_BLOCK.paragraphs.map((paragraph) => (
            <p
              key={paragraph.slice(0, 40)}
              className="text-[12px] leading-relaxed text-foreground/70"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <p className="mt-8 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        {TERMS_CODE} · Version {TERMS_VERSION} · Effective {TERMS_EFFECTIVE_DATE} · XYE LLC
      </p>
    </LegalShell>
  );
}