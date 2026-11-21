// Display defaults for the membership cards. The Product records (editable in the admin console)
// override these; the charged amounts are always resolved server-side in create-checkout.
export const DEFAULT_PRODUCTS = [
  {
    key: "stream_weekly",
    tier: "stream",
    name: "Interested Party Club Member — Weekly",
    blurb: "Stream the full catalog in the player. No ownership, no email drops. Cancel anytime.",
    price: "1.99",
    interval: "WEEK",
    sort: 1,
    active: true,
  },
  {
    key: "stream_monthly",
    tier: "full",
    name: "Enthusiast Club Member — Monthly",
    blurb:
      "Full-catalog streaming plus permanent ownership of every drop in a paid month, auto-emailed as a ZIP and resendable forever.",
    price: "16.99",
    interval: "MONTH",
    sort: 2,
    active: true,
  },
  {
    key: "stream_yearly",
    tier: "full",
    name: "Enthusiast Club Member — Yearly",
    blurb:
      "A year of full-catalog streaming plus ownership of every drop in each paid month, auto-emailed and resendable forever.",
    price: "129",
    interval: "YEAR",
    sort: 3,
    active: true,
  },
  {
    key: "archive_monthly",
    tier: "full",
    name: "JN Muzik Clik Club Member — Monthly",
    blurb:
      "Everything Enthusiast gets, plus Request Full Library by email while payments stay active.",
    price: "49.99",
    interval: "MONTH",
    sort: 4,
    active: true,
  },
  {
    key: "archive_yearly",
    tier: "full",
    name: "JN Muzik Clik Club Member — Yearly",
    blurb:
      "A year of everything Enthusiast gets, plus Request Full Library by email while payments stay active.",
    price: "500",
    interval: "YEAR",
    sort: 5,
    active: true,
  },
  {
    key: "lifetime",
    tier: "lifetime",
    name: "10K Club",
    blurb:
      "Lifetime licensed streaming of the full archive. The complete archive emails on purchase and every future drop follows for life. Non-transferable, no business use.",
    price: "10000",
    interval: "ONE_TIME",
    sort: 6,
    active: true,
  },
  {
    key: "lifetime_transfer",
    tier: "lifetime",
    name: "100K Club",
    blurb:
      "The only ownership tier: the full archive, past and future, delivered by email forever. Business and reuse rights, transferable to a person, entity, or trust.",
    price: "100000",
    interval: "ONE_TIME",
    sort: 7,
    active: true,
  },
];

// Active product rows over the defaults, so an admin edit wins and an empty table falls back.
export function mergeProducts(rows) {
  if (!rows?.length) return DEFAULT_PRODUCTS;
  const map = new Map(DEFAULT_PRODUCTS.map((product) => [product.key, product]));
  rows.forEach((row) => {
    if (row?.key) map.set(row.key, { ...map.get(row.key), ...row });
  });
  return [...map.values()]
    .filter((product) => product.active !== false)
    .sort((a, b) => (a.sort ?? 99) - (b.sort ?? 99));
}

export function formatPrice(value) {
  const amount = Number(String(value ?? "").replace(/,/g, ""));
  if (!Number.isFinite(amount)) return value || "—";
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

const LABELS = { WEEK: "week", MONTH: "month", YEAR: "year", ONE_TIME: "one time" };

export function intervalLabel(interval) {
  return LABELS[interval] || "month";
}