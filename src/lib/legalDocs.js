import { PRIVACY_CODE } from "@/content/privacyPolicy";
import { TERMS_CODE } from "@/content/membershipTerms";
import { WEBSITE_TERMS_CODE } from "@/content/websiteTerms";

// Every legal document the site carries. The order here drives the document switcher
// on each page, the footer links, and the drop emails.
export const LEGAL_DOCS = [
  {
    key: "terms-of-use",
    path: "/terms-of-use",
    label: "Website Terms of Use",
    short: "Terms of Use",
    code: WEBSITE_TERMS_CODE,
  },
  {
    key: "membership",
    path: "/terms",
    label: "Membership Terms & License Agreement",
    short: "Membership Terms",
    code: TERMS_CODE,
  },
  {
    key: "privacy",
    path: "/privacy",
    label: "Privacy Policy",
    short: "Privacy Policy",
    code: PRIVACY_CODE,
  },
];

export const DATA_RATES_NOTICE =
  "Internet access is required. Mobile-carrier data rates and internet-service charges may apply.";