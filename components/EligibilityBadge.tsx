"use client";

import { isEligibleToDonate, daysUntilEligible } from "@/lib/constants";

interface Props {
  lastDonatedAt: number | null;
}

export function EligibilityBadge({ lastDonatedAt }: Props) {
  const eligible = isEligibleToDonate(lastDonatedAt);
  const days = daysUntilEligible(lastDonatedAt);

  if (eligible) {
    return (
      <span className="eligible-badge eligible">
        <span>●</span> Eligible
      </span>
    );
  }

  return (
    <span className="eligible-badge ineligible">
      <span>◷</span> {days}d wait
    </span>
  );
}
