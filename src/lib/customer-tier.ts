// Customer purchase-value classification, as specified by the user directly (not derived from
// the $200K-increment "Purchase Band" in Devtraco's own consolidation spreadsheet — this is a
// separate, named 4-tier scheme layered on top of the same lifetime-value number).
export const CUSTOMER_TIERS = [
  { key: "PREMIUM", label: "Premium", min: 0, icon: "🔹" },
  { key: "EXECUTIVE", label: "Executive", min: 200000, icon: "🥈" },
  { key: "PRESTIGE", label: "Prestige", min: 500000, icon: "🥇" },
  { key: "PLATINUM", label: "Platinum", min: 1000000, icon: "💎" },
] as const;

export type CustomerTier = (typeof CUSTOMER_TIERS)[number];

export function tierForLifetimeValue(value: number): CustomerTier {
  let current: CustomerTier = CUSTOMER_TIERS[0];
  for (const t of CUSTOMER_TIERS) if (value >= t.min) current = t;
  return current;
}
