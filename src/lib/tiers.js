// Membership levels, lowest to highest. Each level includes everything below it.
// Product keys are the checkout ids resolved server-side in create-checkout.
export const LEVEL = {
  none: 0,
  stream: 1,
  enthusiast: 2,
  muzikclik: 3,
  club10k: 4,
  club100k: 5,
};

const BY_PRODUCT = {
  stream_weekly: LEVEL.stream,
  stream_monthly: LEVEL.enthusiast,
  stream_yearly: LEVEL.enthusiast,
  archive_monthly: LEVEL.muzikclik,
  archive_yearly: LEVEL.muzikclik,
  lifetime: LEVEL.club10k,
  lifetime_transfer: LEVEL.club100k,
  // Beta grant: the full 100K Club feature set, with email delivery held until the beta ends.
  beta_100k: LEVEL.club100k,
};

export const BETA_PRODUCT = "beta_100k";

export function levelOf(purchase) {
  if (!purchase) return LEVEL.none;
  return BY_PRODUCT[purchase.productId] ?? LEVEL.stream;
}