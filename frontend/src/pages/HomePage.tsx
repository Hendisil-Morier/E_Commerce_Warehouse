import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Warehouse, ShieldCheck, Zap, Layers, ArrowRight } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/authStore";
import { getHealth, type HealthResponse } from "@/services/healthService";

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [checkingBackend, setCheckingBackend] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setCheckingBackend(true);
        const res = await getHealth();
        setHealth(res);
      } catch {
        setHealth(null);
      } finally {
        setCheckingBackend(false);
      }
    };
    void checkConnection();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "48px 36px",
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.04)",
        border: "1px solid #e5e7eb",
        marginBottom: "36px",
      }}>
        <div style={{ maxWidth: "800px" }}>
          {isAuthenticated && user && (
            <div style={{
              display: "inline-block",
              padding: "6px 14px",
              backgroundColor: "#dbeafe",
              color: "#1d4ed8",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "16px",
            }}>
              Xin chào, {user.fullName}! 👋
            </div>
          )}

          <h1 style={{
            fontSize: "2.4rem",
            fontWeight: 800,
            color: "#111827",
            lineHeight: 1.25,
            marginBottom: "16px",
          }}>
            Hệ thống Thương Mại Điện Tử & Quản Lý Kho Hàng Đa Kênh
          </h1>

          <p style={{
            fontSize: "1.1rem",
            color: "#4b5563",
            lineHeight: 1.6,
            marginBottom: "28px",
          }}>
            Nền tảng tích hợp quy trình mua sắm trực tuyến với quản lý kho bãi chuyên sâu, bảo đảm tính nhất quán dữ liệu giữa đơn hàng và số lượng tồn kho khả dụng theo thời gian thực.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
            <Link
              to={ROUTES.PRODUCTS}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                borderRadius: "8px",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: "1rem",
              }}
            >
              <ShoppingBag size={20} />
              <span>Khám phá sản phẩm</span>
              <ArrowRight size={18} />
            </Link>

            <Link
              to={ROUTES.WAREHOUSE}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                backgroundColor: "#f3f4f6",
                color: "#374151",
                borderRadius: "8px",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: "1rem",
                border: "1px solid #d1d5db",
              }}
            >
              <Warehouse size={20} />
              <span>Nghiệp vụ kho bãi</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "24px",
        marginBottom: "36px",
      }}>
        {/* Card 1 */}
        <div style={{
          backgroundColor: "#ffffff",
          padding: "24px",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            backgroundColor: "#eff6ff",
            color: "#2563eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
          }}>
            <Zap size={24} />
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>
            Đồng Bộ Tồn Kho Tức Thì
          </h3>
          <p style={{ color: "#6b7280", lineHeight: 1.5, fontSize: "0.95rem" }}>
            Cơ chế giữ chỗ (Stock Reservation) khóa dòng giao dịch, đảm bảo không bị bán vượt tồn (Over-selling) khi nhiều khách cùng đặt hàng.
          </p>
        </div>

        {/* Card 2 */}
        <div style={{
          backgroundColor: "#ffffff",
          padding: "24px",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            backgroundColor: "#ecfdf5",
            color: "#059669",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
          }}>
            <Layers size={24} />
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>
            Mô Hình Đa Người Bán
          </h3>
          <p style={{ color: "#6b7280", lineHeight: 1.5, fontSize: "0.95rem" }}>
            Hỗ trợ Seller mở nhiều gian hàng (Shops), ký gửi kho sàn hoặc tự vận hành kho riêng với các đơn con (SellerOrders) độc lập.
          </p>
        </div>

        {/* Card 3 */}
        <div style={{
          backgroundColor: "#ffffff",
          padding: "24px",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            backgroundColor: "#fdf4ff",
            color: "#c026d3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
          }}>
            <ShieldCheck size={24} />
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>
            Sổ Cái Tồn Kho Bất Biến
          </h3>
          <p style={{ color: "#6b7280", lineHeight: 1.5, fontSize: "0.95rem" }}>
            Toàn bộ biến động tồn kho ghi vào StockMovements theo cơ chế append-only với trigger MySQL bảo vệ tính toàn vẹn kiểm toán.
          </p>
        </div>
      </section>

      {/* Backend Health Status Badge */}
      <section style={{
        padding: "16px 20px",
        backgroundColor: health ? "#f0fdf4" : "#fef2f2",
        border: `1px solid ${health ? "#bbf7d0" : "#fecaca"}`,
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: health ? "#16a34a" : "#dc2626",
          }} />
          <span style={{ fontSize: "0.9rem", color: health ? "#166534" : "#991b1b", fontWeight: 500 }}>
            {checkingBackend
              ? "Đang kiểm tra kết nối API..."
              : health
              ? `Backend API: Đã kết nối thành công (${health.message || health.status})`
              : "Backend API: Chưa kết nối (Hãy chạy 'dotnet run' tại thư mục WebAPI)"}
          </span>
        </div>

        <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
          API Base URL: <code>{import.meta.env.VITE_API_BASE_URL || "http://localhost:5126"}</code>
        </span>
      </section>
    </div>
  );
};

