// The five memberships. Each is standalone: its own card, its own Join, its own checkout.
// Display prices mirror base44/functions/create-checkout/entry.ts, which always charges
// the server-side amount — these are only shown until the Product rows load.
export const RIGHTS_LINE =
  "Members own the work they earn or buy. Ownership does not include the right to reuse, redistribute, or commercially exploit it — reuse and business rights exist only at the 100K Club.";

export const NO_ADS_LINE =
  "No third-party ads, ever. J'ance Nutt release news and drop announcements — including your drop delivery emails — are part of your membership.";

export const MEMBERSHIPS = [
  {
    id: "interested",
    name: "Interested Party Club Member",
    kicker: "Streaming only",
    summary: "In-app streaming of the full catalog. No ownership, no email drops.",
    plans: [{ key: "stream_weekly", price: "1.99", unit: "week", label: "Weekly" }],
    features: [
      "Stream the full catalog in the ANA.LUCI player",
      "Music videos included",
      "No third-party ads, ever",
      "Cancel any time",
    ],
    excluded: ["No drop emails", "No library carry-over", "No ownership"],
  },
  {
    id: "enthusiast",
    name: "Enthusiast Club Member",
    kicker: "You keep what you paid for",
    summary:
      "Full-catalog streaming while subscribed, plus permanent ownership of every drop in a month you pay for — auto-emailed as a ZIP.",
    plans: [
      { key: "stream_monthly", price: "16.99", unit: "month", label: "Monthly" },
      { key: "stream_yearly", price: "129", unit: "year", label: "Yearly", save: "Save $74.88" },
    ],
    features: [
      "Everything in Interested Party",
      "Every drop in a paid month is yours forever",
      "Each drop auto-emailed the moment it lands",
      "Resend any drop to your email, any time — even after canceling",
      "Resubscribing resumes new drops and streaming",
    ],
    excluded: ["No full-library request", "No business or reuse rights"],
    featured: true,
  },
  {
    id: "muzikclik",
    name: "JN Muzik Clik Club Member",
    kicker: "Everything, on demand",
    summary:
      "Everything Enthusiast gets, plus a Request Full Library button while payments are active.",
    plans: [
      { key: "archive_monthly", price: "49.99", unit: "month", label: "Monthly" },
      { key: "archive_yearly", price: "500", unit: "year", label: "Yearly", save: "Save $99.88" },
    ],
    features: [
      "Everything in Enthusiast",
      "Request Full Library — email yourself the entire catalog (ZIP or secure link)",
      "Ask ANA.LUCI about the brand and the catalog",
      "Everything already emailed to you is yours to keep",
    ],
    excluded: ["Full-library requests stop if payments stop", "No business or reuse rights"],
  },
  {
    id: "club10k",
    name: "10K Club",
    kicker: "Lifetime licensed access",
    summary:
      "Pay once. Lifetime streaming of the full archive, with the complete archive emailed on purchase and every future drop auto-emailed for life.",
    plans: [{ key: "lifetime", price: "10,000", unit: "one time", label: "One-time" }],
    features: [
      "Lifetime streaming of the full archive",
      "Complete archive emailed to you on purchase — no request needed",
      "Every future drop auto-emailed for life",
      "Licensed, not owned",
    ],
    excluded: ["Non-transferable", "No business use", "No reuse or redistribution rights"],
  },
  {
    id: "club100k",
    name: "100K Club",
    kicker: "Ownership",
    summary:
      "The only true ownership tier: the full archive, past and future — every track, music video, film, screenplay, book, and artwork — delivered by email, forever.",
    plans: [{ key: "lifetime_transfer", price: "100,000", unit: "one time", label: "One-time" }],
    features: [
      "Ownership of the full archive, past and future",
      "Everything delivered by email, forever",
      "The only tier with business, commercial, and reuse rights",
      "The only transferable tier — to a person, entity, or trust",
      "Transfer Ownership from your account page",
    ],
    excluded: [],
    ownership: true,
  },
];

// Comparison rows: which membership includes each line.
export const COMPARE_ROWS = [
  { label: "Full-catalog streaming in the player", tiers: ["interested", "enthusiast", "muzikclik", "club10k", "club100k"] },
  { label: "Music videos in the player", tiers: ["interested", "enthusiast", "muzikclik", "club10k", "club100k"] },
  { label: "No third-party ads, ever\u00B9", tiers: ["interested", "enthusiast", "muzikclik", "club10k", "club100k"] },
  { label: "Drops auto-emailed each paid month", tiers: ["enthusiast", "muzikclik", "club10k", "club100k"] },
  { label: "Own the drops you paid for \u2014 forever", tiers: ["enthusiast", "muzikclik", "club100k"] },
  { label: "Resend any drop to your email", tiers: ["enthusiast", "muzikclik", "club10k", "club100k"] },
  { label: "Request Full Library any time", tiers: ["muzikclik"] },
  { label: "Complete archive emailed on purchase", tiers: ["club10k", "club100k"] },
  { label: "Every future drop, for life", tiers: ["club10k", "club100k"] },
  { label: "Keep everything after canceling", tiers: ["enthusiast", "muzikclik", "club10k", "club100k"] },
  { label: "Ask ANA.LUCI about the catalog\u00B2", tiers: ["muzikclik", "club10k", "club100k"] },
  { label: "New releases while unsubscribed\u00B3", tiers: ["club10k", "club100k"] },
  { label: "Business, commercial and reuse rights", tiers: ["club100k"] },
  { label: "Transferable ownership", tiers: ["club100k"] },
];

export const COMPARE_SHORT = {
  interested: "Interested",
  enthusiast: "Enthusiast",
  muzikclik: "Muzik Clik",
  club10k: "10K",
  club100k: "100K",
};