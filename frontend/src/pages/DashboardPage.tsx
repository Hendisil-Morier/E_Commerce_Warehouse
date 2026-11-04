import React from "react";

export const DashboardPage: React.FC = () => {
  return (
    <div style={{ padding: "16px 0" }}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>
        Bảng Quản Trị Hệ Thống (Dashboard)
      </h1>
      <p style={{ color: "#6b7280" }}>
        Thống kê tổng quan doanh thu, số lượng đơn hàng và tình trạng tồn kho.
      </p>
    </div>
  );
};

