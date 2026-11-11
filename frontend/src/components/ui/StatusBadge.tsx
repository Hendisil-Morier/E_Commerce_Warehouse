import React from "react";
import { getStatusMeta } from "@/constants/statusLabels";
import type { StatusDomain } from "@/types/common";

export interface StatusBadgeProps {
  status: string;
  domain?: StatusDomain;
  labelOverride?: string;
  size?: "sm" | "md";
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  domain,
  labelOverride,
  size = "sm",
  showDot = true,
}) => {
  const meta = getStatusMeta(status, domain);
  const label = labelOverride ?? meta.label;

  return (
    <span className={`ew-badge ew-badge--${meta.tone} ew-badge--${size}`}>
      {showDot && <span className="ew-badge__dot" aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
};

