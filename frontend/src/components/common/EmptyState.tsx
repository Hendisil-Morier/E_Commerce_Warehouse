import React from "react";
import { Inbox } from "lucide-react";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "Chưa có dữ liệu",
  description = "Hiện tại chưa có bản ghi nào phù hợp với điều kiện đang chọn.",
  icon,
  action,
}) => {
  return (
    <div className="ew-state">
      <div className="ew-state__icon ew-state__icon--empty" aria-hidden="true">
        {icon ?? <Inbox size={26} />}
      </div>
      <div className="ew-state__title">{title}</div>
      {description && <p className="ew-state__desc">{description}</p>}
      {action && <div style={{ marginTop: "6px" }}>{action}</div>}
    </div>
  );
};

