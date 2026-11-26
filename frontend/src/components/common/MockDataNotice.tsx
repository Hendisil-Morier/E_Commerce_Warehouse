import React from "react";
import { Database } from "lucide-react";

interface MockDataNoticeProps {
  endpointHint: string;
}

export const MockDataNotice: React.FC<MockDataNoticeProps> = ({ endpointHint }) => {
  return (
    <div className="ew-preview-banner" role="status">
      <div className="ew-preview-banner__left">
        <Database size={15} aria-hidden="true" style={{ flexShrink: 0 }} />
        <span>
          Dữ liệu tương tác chuẩn CSDL <strong>ECommerceWarehouse</strong> — đang dùng bộ mô phỏng cục bộ chờ Backend mở{" "}
          <code className="ks-tabular">{endpointHint}</code>.
        </span>
      </div>
    </div>
  );
};
