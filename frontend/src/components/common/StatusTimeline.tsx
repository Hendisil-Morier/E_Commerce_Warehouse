import React from "react";
import { Clock, User } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { StatusDomain, StatusTimelineItem } from "@/types/common";
import { formatDate } from "@/utils/formatters";

export interface StatusTimelineProps {
  items: readonly StatusTimelineItem[];
  domain?: StatusDomain;
  emptyText?: string;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  items,
  domain,
  emptyText = "Chưa có lịch sử chuyển trạng thái.",
}) => {
  if (items.length === 0) {
    return (
      <p style={{ fontSize: "0.88rem", color: "var(--color-muted)" }}>
        {emptyText}
      </p>
    );
  }

  return (
    <ol className="ew-timeline">
      {items.map((item, index) => {
        const key = item.id ?? `${item.status}-${item.changedAt}-${index}`;
        const detailText = item.reason || item.note;

        return (
          <li key={key} className="ew-timeline__item">
            <span className="ew-timeline__marker" aria-hidden="true" />

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <StatusBadge status={item.status} domain={item.domain ?? domain} />
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.8rem",
                  color: "var(--color-muted)",
                }}
              >
                <Clock size={13} aria-hidden="true" />
                <span>{formatDate(item.changedAt)}</span>
              </span>
            </div>

            {item.actorName && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  marginTop: "6px",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  color: "var(--color-dark)",
                }}
              >
                <User size={13} color="var(--color-muted)" aria-hidden="true" />
                <span>{item.actorName}</span>
              </div>
            )}

            {detailText && (
              <p
                style={{
                  marginTop: "4px",
                  fontSize: "0.84rem",
                  color: "var(--color-text)",
                  backgroundColor: "var(--color-slate-50)",
                  border: "1px solid var(--color-slate-200)",
                  borderRadius: "8px",
                  padding: "6px 10px",
                }}
              >
                {detailText}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
};

