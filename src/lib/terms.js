import { base44 } from "@/api/base44Client";
import { TERMS_VERSION, TERMS_EFFECTIVE_DATE } from "@/content/membershipTerms";

export const TERMS_PATH = "/terms";

// The consent log promised in Section 14: who accepted which version, and when.
// Failure to log must never block a signup — the acceptance itself has already happened.
export async function recordTermsAcceptance({ email, source = "signup" } = {}) {
  return base44.entities.TermsAcceptance.create({
    email,
    terms_version: TERMS_VERSION,
    terms_effective_date: TERMS_EFFECTIVE_DATE,
    source,
    accepted_at: new Date().toISOString(),
  });
}