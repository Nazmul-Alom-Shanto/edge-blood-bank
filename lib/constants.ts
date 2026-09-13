// Blood groups
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

// Generate dynamic batch options: 4 years back to 3 years forward from current year
export function getBatchOptions(): string[] {
  const currentYear = new Date().getFullYear();
  const batches: string[] = [];
  for (let y = currentYear - 4; y <= currentYear + 3; y++) {
    batches.push(`HSC ${String(y).slice(2)}`);
  }
  return batches;
}

// 90 days in milliseconds
export const DONATION_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;

export function isEligibleToDonate(lastDonatedAt: number | null): boolean {
  if (!lastDonatedAt) return true;
  return Date.now() - lastDonatedAt * 1000 >= DONATION_COOLDOWN_MS;
}

export function daysUntilEligible(lastDonatedAt: number | null): number {
  if (!lastDonatedAt) return 0;
  const elapsed = Date.now() - lastDonatedAt * 1000;
  const remaining = DONATION_COOLDOWN_MS - elapsed;
  return remaining > 0 ? Math.ceil(remaining / (24 * 60 * 60 * 1000)) : 0;
}

export const COOKIE_NAME = "b24bb_token";
