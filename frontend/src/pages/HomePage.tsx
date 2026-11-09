import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Star,
  Heart,
  Plus,
  Truck,
  RotateCcw,
  Headphones,
  ShieldCheck,
  Zap,
  Sparkles,
  ChevronRight,
  Mail,
  Check,
  TrendingUp,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/authStore";

// Mock Products matching the image aesthetic
interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountBadge?: string;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  stockLeft?: number;
}

const flashDeals: Product[] = [
  {
    id: "fd-1",
    name: "Soundcore Space One",
    category: "Âm thanh",
    description: "Chống ồn chủ động ANC, 40h pin",
    price: 79.0,
    originalPrice: 99.0,
    discountBadge: "-20%",
    rating: 4.8,
    reviewsCount: 142,
    stockLeft: 3,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "fd-2",
    name: "Amazfit Active 2",
    category: "Đồng hồ thông minh",
    description: "Màn hình AMOLED, GPS chính xác",
    price: 89.99,
    originalPrice: 109.99,
    discountBadge: "-18%",
    rating: 4.7,
    reviewsCount: 89,
    stockLeft: 5,
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "fd-3",
    name: "JBL Flip 6 Portable",
    category: "Loa di động",
    description: "Kháng nước IP67, âm bass sâu",
    price: 99.95,
    originalPrice: 129.95,
    discountBadge: "-23%",
    rating: 4.9,
    reviewsCount: 230,
    stockLeft: 2,
    imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "fd-4",
    name: "Everyday Knit Runner",
    category: "Thời trang & Giày",
    description: "Đệm êm thoáng khí cả ngày",
    price: 114.0,
    originalPrice: 145.0,
    discountBadge: "-21%",
    rating: 4.8,
    reviewsCount: 74,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "fd-5",
    name: "Breva Mini Espresso",
    category: "Thiết bị pha chế",
    description: "Áp suất 15 bar, thiết kế retro",
    price: 119.2,
    originalPrice: 149.0,
    discountBadge: "-20%",
    rating: 4.6,
    reviewsCount: 61,
    imageUrl: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500&auto=format&fit=crop&q=80",
  },
];

const bestSellers: Product[] = [
  {
    id: "bs-1",
    name: "Nothing Ear (a) Transparent",
    category: "Tech",
    description: "Âm thanh Hi-Res, kiểu dáng trong suốt",
    price: 99.0,
    rating: 4.9,
    reviewsCount: 312,
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "bs-2",
    name: "Transit Daypack Waterproof",
    category: "Accessories",
    description: "Vải chống thấm, ngăn laptop 16 inch",
    price: 84.5,
    rating: 4.8,
    reviewsCount: 198,
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "bs-3",
    name: "Arc Ambient Table Lamp",
    category: "Lifestyle",
    description: "Ánh sáng ấm 3000K, dimmer cảm ứng",
    price: 48.0,
    rating: 4.7,
    reviewsCount: 85,
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "bs-4",
    name: "Instax Mini 12 Pastel",
    category: "Tech",
    description: "Chụp ảnh lấy liền, tự động phơi sáng",
    price: 79.9,
    rating: 4.9,
    reviewsCount: 420,
    imageUrl: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=80",
  },
];

const newArrivals: Product[] = [
  {
    id: "na-1",
    name: "Keychron K3 Pro Wireless",
    category: "Bàn phím cơ",
    description: "Low-profile, switch cơ học QMK/VIA",
    price: 84.0,
    rating: 4.9,
    reviewsCount: 42,
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "na-2",
    name: "Daybreak Thermal Bottle 750ml",
    category: "Đời sống",
    description: "Inox 316, giữ nhiệt nóng/lạnh 24h",
    price: 32.5,
    rating: 4.8,
    reviewsCount: 38,
    imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "na-3",
    name: "Nomad MagSafe Stand 3-in-1",
    category: "Phụ kiện",
    description: "Sạc nhanh 15W cho iPhone, Apple Watch",
    price: 119.0,
    rating: 4.7,
    reviewsCount: 53,
    imageUrl: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=500&auto=format&fit=crop&q=80",
  },
  {
    id: "na-4",
    name: "Transit Weekender Duffle",
    category: "Túi du lịch",
    description: "Chứa đồ 3 ngày, khóa YKK cao cấp",
    price: 94.0,
    rating: 4.9,
    reviewsCount: 29,
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80",
  },
];

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState("All");
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  // Countdown timer for Flash Deals (08:52:16)
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 52, seconds: 16 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setEmailInput("");
    }
  };

  return (
    <div style={{ width: "100%", backgroundColor: "#ffffff" }}>
      {/* Container wrapper */}
      <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "28px 24px" }}>
        
        {/* Logged in welcome greeting if authenticated */}
        {isAuthenticated && user && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            padding: "12px 20px",
            borderRadius: "12px",
            marginBottom: "24px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.2rem" }}>👋</span>
              <span style={{ fontSize: "0.95rem", color: "#166534", fontWeight: 600 }}>
                Chào mừng bạn trở lại, <strong>{user.fullName}</strong>!
              </span>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <Link to={ROUTES.ORDERS} style={{ fontSize: "0.85rem", color: "#166534", textDecoration: "underline", fontWeight: 600 }}>
                Xem đơn hàng của tôi
              </Link>
              <Link to={ROUTES.WAREHOUSE} style={{ fontSize: "0.85rem", color: "#166534", textDecoration: "underline", fontWeight: 600 }}>
                Quản lý tồn kho
              </Link>
            </div>
          </div>
        )}

        {/* 1. HERO SECTION */}
        <section style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          gap: "36px",
          alignItems: "center",
          backgroundColor: "#f8fafc",
          borderRadius: "24px",
          padding: "48px 48px",
          border: "1px solid #f1f5f9",
          marginBottom: "40px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Left Column: Headline & Value Proposition */}
          <div>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "20px",
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "#4f46e5",
              letterSpacing: "0.8px",
              textTransform: "uppercase",
              marginBottom: "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}>
              <Sparkles size={14} /> FOR EVERYDAY COMFORTS
            </div>

            <h1 style={{
              fontSize: "3.2rem",
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1.15,
              letterSpacing: "-1.5px",
              marginBottom: "18px",
            }}>
              Good things.<br />
              Better living.
            </h1>

            <p style={{
              fontSize: "1.08rem",
              color: "#64748b",
              lineHeight: 1.6,
              marginBottom: "32px",
              maxWidth: "480px",
            }}>
              Sản phẩm chuẩn mực, tinh tuyển cho đời sống hiện đại. Khám phá những thiết bị và đồ dùng giúp mỗi ngày của bạn trở nên trọn vẹn hơn.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px", flexWrap: "wrap" }}>
              <Link
                to={ROUTES.PRODUCTS}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "14px 28px",
                  backgroundColor: "#4f46e5",
                  color: "#ffffff",
                  borderRadius: "24px",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
                  transition: "all 0.2s ease",
                }}
              >
                <span>Khám phá ngay</span>
                <ArrowRight size={18} />
              </Link>

              <a
                href="#flash-deals"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "14px 24px",
                  backgroundColor: "#ffffff",
                  color: "#1e293b",
                  borderRadius: "24px",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  border: "1px solid #cbd5e1",
                  transition: "all 0.2s ease",
                }}
              >
                <span>Xem ưu đãi hot</span>
                <ArrowRight size={16} />
              </a>
            </div>

            {/* Social Proof */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem", color: "#64748b" }}>
              <div style={{ display: "flex", color: "#f59e0b" }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="#f59e0b" />
                ))}
              </div>
              <span>Tin chọn bởi hơn <strong>20.000+</strong> khách hàng hài lòng</span>
            </div>
          </div>

          {/* Right Column: Hero Visual Product Banner */}
          <div style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <div style={{
              width: "100%",
              height: "380px",
              borderRadius: "20px",
              backgroundColor: "#f1f5f9",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "inset 0 0 40px rgba(0,0,0,0.02)",
            }}>
              {/* Product Visual Image */}
              <img
                src="https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80"
                alt="Featured Hero Headphone"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "20px",
                }}
              />

              {/* Floating promotional badge */}
              <div style={{
                position: "absolute",
                bottom: "20px",
                left: "20px",
                backgroundColor: "rgba(255, 255, 255, 0.92)",
                backdropFilter: "blur(8px)",
                padding: "10px 16px",
                borderRadius: "14px",
                boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                border: "1px solid rgba(255,255,255,0.6)",
              }}>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                    Ưu đãi độc quyền tuần này
                  </div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#0f172a" }}>
                    Giảm giá lên đến 40%
                  </div>
                </div>
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: "#4f46e5",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <ArrowRight size={15} />
                </div>
              </div>

              {/* Slider Next button */}
              <div style={{
                position: "absolute",
                right: "16px",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "#ffffff",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#1e293b",
              }}>
                <ChevronRight size={20} />
              </div>
            </div>
          </div>
        </section>

        {/* 2. VALUE PROPOSITION BAR (4 Key Guarantees) */}
        <section style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "24px",
          padding: "24px 0",
          borderBottom: "1px solid #f1f5f9",
          marginBottom: "48px",
        }}>
          {/* Item 1 */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              backgroundColor: "#eef2ff",
              color: "#4f46e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <Truck size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
                Miễn phí vận chuyển
              </div>
              <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                Cho đơn hàng từ 500.000đ toàn quốc
              </div>
            </div>
          </div>

          {/* Item 2 */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              backgroundColor: "#f0fdf4",
              color: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <RotateCcw size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
                30 Ngày đổi trả linh hoạt
              </div>
              <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                Đối soát kho tự động, hoàn tiền nhanh
              </div>
            </div>
          </div>

          {/* Item 3 */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              backgroundColor: "#fef3c7",
              color: "#d97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <Headphones size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
                Hỗ trợ chuyên nghiệp 24/7
              </div>
              <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                Đội ngũ chăm sóc khách hàng tận tâm
              </div>
            </div>
          </div>

          {/* Item 4 */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              backgroundColor: "#f3e8ff",
              color: "#9333ea",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
                Thanh toán an toàn 100%
              </div>
              <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                Mã hóa chuẩn SSL, minh bạch tồn kho
              </div>
            </div>
          </div>
        </section>

        {/* 3. FLASH DEALS / "GOOD DEALS. GONE SOON." */}
        <section id="flash-deals" style={{ marginBottom: "56px" }}>
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "20px",
            flexWrap: "wrap",
            gap: "16px",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <Zap size={22} color="#4f46e5" fill="#4f46e5" />
                <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
                  Good deals. Gone soon.
                </h2>
              </div>
              <p style={{ color: "#64748b", fontSize: "0.92rem" }}>
                Giá ưu đãi số lượng có hạn. Sản phẩm tự động giữ tồn kho khi hoàn tất đặt hàng.
              </p>
            </div>

            {/* Countdown Clock banner */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#eef2ff",
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "0.85rem",
                color: "#1e40af",
                fontWeight: 600,
              }}>
                <span>Kết thúc sau:</span>
                <span style={{
                  backgroundColor: "#1e293b",
                  color: "#ffffff",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                }}>
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                :
                <span style={{
                  backgroundColor: "#1e293b",
                  color: "#ffffff",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                }}>
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                :
                <span style={{
                  backgroundColor: "#1e293b",
                  color: "#ffffff",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                }}>
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
              </div>

              <Link
                to={ROUTES.PRODUCTS}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: "#4f46e5",
                }}
              >
                <span>Xem tất cả ưu đãi</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Product Cards Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
            gap: "20px",
          }}>
            {flashDeals.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #f1f5f9",
                  borderRadius: "16px",
                  padding: "16px",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.25s ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.06)";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.02)";
                  e.currentTarget.style.borderColor = "#f1f5f9";
                }}
              >
                {/* Image & Badges */}
                <div style={{
                  position: "relative",
                  width: "100%",
                  height: "190px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "12px",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "14px",
                }}>
                  {item.discountBadge && (
                    <span style={{
                      position: "absolute",
                      top: "10px",
                      left: "10px",
                      backgroundColor: "#4f46e5",
                      color: "#ffffff",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "6px",
                      zIndex: 2,
                    }}>
                      {item.discountBadge}
                    </span>
                  )}

                  <button
                    title="Thêm vào yêu thích"
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      backgroundColor: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748b",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                      zIndex: 2,
                    }}
                  >
                    <Heart size={16} />
                  </button>

                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.3s ease",
                    }}
                  />
                </div>

                {/* Rating & Stock warning */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                  fontSize: "0.78rem",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#f59e0b" }}>
                    <Star size={13} fill="#f59e0b" />
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{item.rating}</span>
                    <span style={{ color: "#94a3b8" }}>({item.reviewsCount})</span>
                  </div>

                  {item.stockLeft && (
                    <span style={{ color: "#dc2626", fontWeight: 600, fontSize: "0.72rem" }}>
                      Chỉ còn {item.stockLeft} sp
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 style={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  lineHeight: 1.3,
                  marginBottom: "4px",
                  minHeight: "2.5em",
                }}>
                  {item.name}
                </h3>

                <p style={{
                  fontSize: "0.78rem",
                  color: "#64748b",
                  marginBottom: "14px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {item.description}
                </p>

                {/* Price & Add to Cart button */}
                <div style={{
                  marginTop: "auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                      ${item.price.toFixed(2)}
                    </div>
                    {item.originalPrice && (
                      <div style={{ fontSize: "0.78rem", color: "#94a3b8", textDecoration: "line-through" }}>
                        ${item.originalPrice.toFixed(2)}
                      </div>
                    )}
                  </div>

                  <button
                    title="Thêm vào giỏ hàng"
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      backgroundColor: "#f1f5f9",
                      color: "#1e293b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#4f46e5";
                      e.currentTarget.style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#f1f5f9";
                      e.currentTarget.style.color = "#1e293b";
                    }}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. CATEGORY SHOWCASE ("A WORLD OF GOOD THINGS.") */}
        <section style={{ marginBottom: "56px" }}>
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "12px",
          }}>
            <div>
              <div style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#64748b",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}>
                FIND YOUR EVERYDAY
              </div>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
                A world of good things.
              </h2>
            </div>

            <Link
              to={ROUTES.PRODUCTS}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "#4f46e5",
              }}
            >
              <span>Xem tất cả danh mục</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
          }}>
            {/* Card 1: Electronics */}
            <Link
              to="/products?category=electronics"
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: "18px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                border: "1px solid #f1f5f9",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.06)";
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{
                height: "180px",
                borderRadius: "12px",
                overflow: "hidden",
                marginBottom: "16px",
                backgroundColor: "#e2e8f0",
              }}>
                <img
                  src="https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&auto=format&fit=crop&q=80"
                  alt="Electronics"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", marginBottom: "2px" }}>
                    Electronics
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    Plug into something better
                  </p>
                </div>
                <ChevronRight size={18} color="#94a3b8" />
              </div>
            </Link>

            {/* Card 2: Apparel */}
            <Link
              to="/products?category=apparel"
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: "18px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                border: "1px solid #f1f5f9",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.06)";
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{
                height: "180px",
                borderRadius: "12px",
                overflow: "hidden",
                marginBottom: "16px",
                backgroundColor: "#e2e8f0",
              }}>
                <img
                  src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&auto=format&fit=crop&q=80"
                  alt="Apparel"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", marginBottom: "2px" }}>
                    Apparel
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    Made for your every day
                  </p>
                </div>
                <ChevronRight size={18} color="#94a3b8" />
              </div>
            </Link>

            {/* Card 3: Accessories */}
            <Link
              to="/products?category=accessories"
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: "18px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                border: "1px solid #f1f5f9",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.06)";
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{
                height: "180px",
                borderRadius: "12px",
                overflow: "hidden",
                marginBottom: "16px",
                backgroundColor: "#e2e8f0",
              }}>
                <img
                  src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80"
                  alt="Accessories"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", marginBottom: "2px" }}>
                    Accessories
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    The details that make the look
                  </p>
                </div>
                <ChevronRight size={18} color="#94a3b8" />
              </div>
            </Link>

            {/* Card 4: Home Appliances */}
            <Link
              to="/products?category=home"
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: "18px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                border: "1px solid #f1f5f9",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.06)";
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{
                height: "180px",
                borderRadius: "12px",
                overflow: "hidden",
                marginBottom: "16px",
                backgroundColor: "#e2e8f0",
              }}>
                <img
                  src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=80"
                  alt="Home Appliances"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", marginBottom: "2px" }}>
                    Home Appliances
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    A fresh view on home
                  </p>
                </div>
                <ChevronRight size={18} color="#94a3b8" />
              </div>
            </Link>
          </div>
        </section>

        {/* 5. BEST SELLERS ("YOUR FAVORITES, FOR A REASON.") */}
        <section style={{ marginBottom: "56px" }}>
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "20px",
            flexWrap: "wrap",
            gap: "12px",
          }}>
            <div>
              <div style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#64748b",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}>
                TRIED, TESTED, REPEATED
              </div>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
                Your favorites, for a reason.
              </h2>
            </div>

            <Link
              to={ROUTES.PRODUCTS}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "#4f46e5",
              }}
            >
              <span>Xem danh sách bán chạy</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "24px", overflowX: "auto", paddingBottom: "4px" }}>
            {["All", "Accessories", "Tech", "Lifestyle", "Home"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "6px 16px",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  backgroundColor: activeTab === tab ? "#1e293b" : "#f1f5f9",
                  color: activeTab === tab ? "#ffffff" : "#475569",
                  transition: "all 0.2s ease",
                }}
              >
                {tab === "All" ? "Tất cả" : tab}
              </button>
            ))}
          </div>

          {/* Best Sellers Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "20px",
          }}>
            {bestSellers
              .filter((item) => activeTab === "All" || item.category === activeTab)
              .map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #f1f5f9",
                    borderRadius: "16px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.02)";
                  }}
                >
                  <div style={{
                    position: "relative",
                    width: "100%",
                    height: "210px",
                    backgroundColor: "#f8fafc",
                    borderRadius: "12px",
                    overflow: "hidden",
                    marginBottom: "14px",
                  }}>
                    <button
                      title="Yêu thích"
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        backgroundColor: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#64748b",
                        zIndex: 2,
                      }}
                    >
                      <Heart size={16} />
                    </button>
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "#f59e0b", marginBottom: "4px" }}>
                    <Star size={13} fill="#f59e0b" />
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{item.rating}</span>
                    <span style={{ color: "#94a3b8" }}>({item.reviewsCount})</span>
                  </div>

                  <h3 style={{ fontSize: "0.98rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                    {item.name}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "16px" }}>
                    {item.description}
                  </p>

                  <div style={{
                    marginTop: "auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}>
                    <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>
                      ${item.price.toFixed(2)}
                    </span>
                    <button
                      title="Thêm nhanh"
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        backgroundColor: "#f1f5f9",
                        color: "#1e293b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* 6. EDITORIAL SPLIT BANNER ("MAKE ROOM FOR BETTER.") */}
        <section style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          borderRadius: "24px",
          overflow: "hidden",
          backgroundColor: "#0f172a",
          marginBottom: "56px",
          boxShadow: "0 15px 30px rgba(0,0,0,0.1)",
        }}>
          {/* Left Text */}
          <div style={{
            padding: "54px 48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}>
            <div style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#60a5fa",
              letterSpacing: "0.8px",
              textTransform: "uppercase",
              marginBottom: "14px",
            }}>
              NEW HOME / WORK EDIT
            </div>

            <h2 style={{
              fontSize: "2.6rem",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.15,
              letterSpacing: "-1px",
              marginBottom: "16px",
            }}>
              Make room for better.
            </h2>

            <p style={{
              fontSize: "1.02rem",
              color: "#94a3b8",
              lineHeight: 1.6,
              marginBottom: "32px",
              maxWidth: "440px",
            }}>
              Bộ sưu tập góc làm việc và sinh hoạt tinh gọn. Tối ưu năng suất với thiết bị công thái học kết nối chuẩn xác từ hệ thống kho bãi trực tuyến.
            </p>

            <div>
              <Link
                to={ROUTES.PRODUCTS}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  backgroundColor: "#4f46e5",
                  color: "#ffffff",
                  borderRadius: "24px",
                  fontWeight: 600,
                  fontSize: "0.92rem",
                }}
              >
                <span>Khám phá bộ sưu tập</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div style={{ width: "100%", height: "100%", minHeight: "360px" }}>
            <img
              src="https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1000&auto=format&fit=crop&q=80"
              alt="Editorial Workspace Setup"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </section>

        {/* 7. NEW ARRIVALS ("NEW IN. ALL YOU.") */}
        <section style={{ marginBottom: "56px" }}>
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "12px",
          }}>
            <div>
              <div style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#64748b",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}>
                FRESH FINDS, JUST LANDED
              </div>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
                New in. All you.
              </h2>
            </div>

            <Link
              to={ROUTES.PRODUCTS}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "#4f46e5",
              }}
            >
              <span>Xem hàng mới cập nhật</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* New Arrivals Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "20px",
          }}>
            {newArrivals.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #f1f5f9",
                  borderRadius: "16px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.02)";
                }}
              >
                <div style={{
                  position: "relative",
                  width: "100%",
                  height: "210px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "12px",
                  overflow: "hidden",
                  marginBottom: "14px",
                }}>
                  <span style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    backgroundColor: "#0f172a",
                    color: "#ffffff",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "6px",
                    zIndex: 2,
                  }}>
                    MỚI VỀ
                  </span>
                  <button
                    title="Yêu thích"
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      backgroundColor: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748b",
                      zIndex: 2,
                    }}
                  >
                    <Heart size={16} />
                  </button>
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "#f59e0b", marginBottom: "4px" }}>
                  <Star size={13} fill="#f59e0b" />
                  <span style={{ fontWeight: 600, color: "#1e293b" }}>{item.rating}</span>
                  <span style={{ color: "#94a3b8" }}>({item.reviewsCount})</span>
                </div>

                <h3 style={{ fontSize: "0.98rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                  {item.name}
                </h3>
                <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "16px" }}>
                  {item.description}
                </p>

                <div style={{
                  marginTop: "auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>
                    ${item.price.toFixed(2)}
                  </span>
                  <button
                    title="Thêm nhanh"
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      backgroundColor: "#f1f5f9",
                      color: "#1e293b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* 8. NEWSLETTER / VOUCHER SIGNUP BANNER ("GET 10% OFF YOUR FIRST ORDER.") */}
      <section style={{
        backgroundColor: "#4338ca",
        color: "#ffffff",
        padding: "56px 24px",
        width: "100%",
      }}>
        <div style={{
          maxWidth: "1320px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "32px",
        }}>
          <div>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "rgba(255,255,255,0.15)",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "0.78rem",
              fontWeight: 700,
              marginBottom: "12px",
            }}>
              <TrendingUp size={14} /> DÀNH CHO KHÁCH HÀNG MỚI
            </div>
            <h2 style={{ fontSize: "2.3rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px", marginBottom: "8px" }}>
              Nhận ngay mã giảm 10% cho đơn hàng đầu tiên.
            </h2>
            <p style={{ color: "#bfdbfe", fontSize: "0.98rem", maxWidth: "560px" }}>
              Cập nhật các sản phẩm mới nhất, ưu đãi thành viên độc quyền và thông tin xuất nhập kho thời gian thực.
            </p>
          </div>

          <div>
            {subscribed ? (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "rgba(255,255,255,0.18)",
                padding: "16px 24px",
                borderRadius: "30px",
              }}>
                <Check size={20} color="#86efac" />
                <span style={{ fontWeight: 600 }}>Cảm ơn bạn! Mã ưu đãi NEW10 đã được lưu cho tài khoản của bạn.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#ffffff",
                  borderRadius: "30px",
                  padding: "6px 8px 6px 18px",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
                }}>
                  <Mail size={18} color="#94a3b8" style={{ marginRight: "10px" }} />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Nhập địa chỉ email của bạn..."
                    required
                    style={{
                      border: "none",
                      outline: "none",
                      fontSize: "0.92rem",
                      width: "280px",
                      color: "#1e293b",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      backgroundColor: "#0f172a",
                      color: "#ffffff",
                      padding: "10px 20px",
                      borderRadius: "24px",
                      fontWeight: 600,
                      fontSize: "0.88rem",
                      transition: "background-color 0.2s",
                    }}
                  >
                    Đăng ký ngay
                  </button>
                </div>
                <span style={{ fontSize: "0.75rem", color: "#93c5fd", paddingLeft: "16px" }}>
                  Chúng tôi tôn trọng quyền riêng tư và cam kết không gửi thư rác.
                </span>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
