import React from "react";
import { Store, Plus, ArrowUpRight } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

export const SellerPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px" }}>
      {/* Top Banner */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "24px 28px",
        marginBottom: "32px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            backgroundColor: "#eef2ff",
            color: "#4f46e5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Store size={28} />
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
              Kênh Người Bán (Seller Centre)
            </div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", margin: "2px 0 0" }}>
              Chào mừng, {user?.fullName || "Người bán"}!
            </h1>
          </div>
        </div>

        <button style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 18px",
          backgroundColor: "#4f46e5",
          color: "#ffffff",
          borderRadius: "8px",
          fontWeight: 600,
          fontSize: "0.9rem",
        }}>
          <Plus size={16} />
          <span>Thêm sản phẩm mới</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "20px",
        marginBottom: "36px",
      }}>
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px" }}>
          <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>Doanh thu tháng này</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a" }}>45.850.000 đ</div>
          <div style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: 600, marginTop: "4px", display: "flex", alignItems: "center", gap: "2px" }}>
            <ArrowUpRight size={14} /> +12.5% so với tháng trước
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px" }}>
          <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>Đơn hàng cần xử lý</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#4f46e5" }}>14 đơn</div>
          <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>6 đơn chờ đóng gói, 8 đơn đã bàn giao</div>
        </div>

        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px" }}>
          <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>Sản phẩm đang bán</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a" }}>86 SKU</div>
          <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>3 sản phẩm cảnh báo tồn kho thấp</div>
        </div>

        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px" }}>
          <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>Ký gửi Kho sàn (Platform)</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f766e" }}>520 món</div>
          <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>Đang lưu tại Kho Trung Tâm Hà Nội</div>
        </div>
      </div>
    </div>
  );
};
