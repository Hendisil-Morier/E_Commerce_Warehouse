import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CreditCard,
  ShieldCheck,
  RotateCcw,
  Truck,
  Smartphone,
  Laptop,
  Shirt,
  Home as HomeIcon,
  Heart,
  Coffee,
  Package,
  Store,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductCard } from "@/features/catalog/components/ProductCard";
import { usePublicProductsQuery } from "@/features/catalog/hooks/usePublicCatalog";
import { useCategoriesQuery } from "@/features/seller/hooks/useSellerCatalog";

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  "điện thoại": Smartphone,
  "máy tính": Laptop,
  "laptop": Laptop,
  "thời trang": Shirt,
  "nhà cửa": HomeIcon,
  "sức khỏe": Heart,
  "làm đẹp": Heart,
  "thực phẩm": Coffee,
};

function getCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  for (const [key, IconComp] of Object.entries(CATEGORY_ICON_MAP)) {
    if (lower.includes(key)) return IconComp;
  }
  return Package;
}

export const HomePage: React.FC = () => {
  const productsQuery = usePublicProductsQuery({ pageSize: 10, sort: "-createdAt" });
  const categoriesQuery = useCategoriesQuery();

  const featuredCategories = (categoriesQuery.data ?? []).slice(0, 6);
  const products = productsQuery.data?.items ?? [];

  const featuredShops = useMemo(() => {
    const map = new Map<number, { shopId: number; shopName: string; categoryName: string }>();
    for (const p of products) {
      if (!map.has(p.shopId)) {
        map.set(p.shopId, { shopId: p.shopId, shopName: p.shopName, categoryName: p.categoryName });
      }
    }
    return Array.from(map.values()).slice(0, 4);
  }, [products]);

  return (
    <div style={{
      maxWidth: "1280px",
      margin: "0 auto",
      padding: "24px 20px 60px",
      display: "flex",
      flexDirection: "column",
      gap: "36px",
      width: "100%",
    }}>
      {/* ========================================================
          1. HERO SECTION (Split banner: Left Hero + Right 2 Cards)
          ======================================================== */}
      <section style={{
        display: "grid",
        gridTemplateColumns: "1.9fr 1fr",
        gap: "20px",
        alignItems: "stretch",
      }}>
        {/* Left Hero Card (Forest Green #0a3d31) */}
        <div style={{
          backgroundColor: "#072b22",
          backgroundImage: "linear-gradient(145deg, #062b22 0%, #0a3d31 60%, #08342a 100%)",
          borderRadius: "18px",
          padding: "36px 36px 32px",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(7, 43, 34, 0.15)",
        }}>
          {/* Subtle geometric circles in background */}
          <div style={{
            position: "absolute",
            top: "-60px",
            right: "220px",
            width: "280px",
            height: "280px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(52, 211, 153, 0.08) 0%, rgba(7, 43, 34, 0) 70%)",
            pointerEvents: "none",
          }} />

          {/* Top content & Order simulation card */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "24px",
            alignItems: "center",
            position: "relative",
            zIndex: 2,
          }}>
            {/* Left Texts */}
            <div>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "rgba(255, 255, 255, 0.12)",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "0.75rem",
                color: "#a7f3d0",
                fontWeight: 600,
                marginBottom: "16px",
              }}>
                <span>🌐 Giao từ kho sàn</span>
              </div>

              <h1 style={{
                fontSize: "2.4rem",
                fontWeight: 800,
                lineHeight: 1.15,
                color: "#ffffff",
                letterSpacing: "-0.5px",
                marginBottom: "14px",
              }}>
                Mua từ nhiều shop,<br />trả một lần.
              </h1>

              <p style={{
                color: "#cbd5e1",
                fontSize: "0.86rem",
                lineHeight: 1.55,
                marginBottom: "24px",
                maxWidth: "340px",
              }}>
                Giỏ hàng của nhiều người bán vào cùng một giỏ. Mỗi gói được đóng gói, quét kiểm và theo dõi riêng cho đến khi đến tay bạn.
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <Link
                  to={ROUTES.PRODUCTS}
                  style={{
                    backgroundColor: "#6ee7b7",
                    color: "#064e3b",
                    padding: "10px 20px",
                    borderRadius: "30px",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 2px 10px rgba(110, 231, 183, 0.4)",
                    transition: "transform 0.15s, background-color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#a7f3d0")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#6ee7b7")}
                >
                  <span>Mua sắm ngay</span>
                  <ArrowRight size={15} />
                </Link>

                <Link
                  to={ROUTES.SELLER}
                  style={{
                    backgroundColor: "transparent",
                    color: "#ffffff",
                    border: "1px solid rgba(255, 255, 255, 0.4)",
                    padding: "10px 18px",
                    borderRadius: "30px",
                    fontWeight: 600,
                    fontSize: "0.88rem",
                    textDecoration: "none",
                    transition: "background-color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Trở thành người bán
                </Link>
              </div>
            </div>

            {/* Right: Embedded "Đơn hàng của bạn" Card */}
            <div style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "18px 18px 16px",
              color: "#1e293b",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
            }}>
              {/* Card Header */}
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: "12px",
                marginBottom: "12px",
              }}>
                <div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Đơn hàng của bạn</div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#0f172a" }}>
                    3 gói · thanh toán 1 lần
                  </div>
                </div>
                <span style={{
                  backgroundColor: "#d1fae5",
                  color: "#065f46",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  padding: "3px 8px",
                  borderRadius: "6px",
                }}>
                  COD
                </span>
              </div>

              {/* Package 1 */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid #f8fafc",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    backgroundColor: "#fce7f3",
                    color: "#db2777",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                  }}>
                    PK
                  </div>
                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>Phụ kiện Số</div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b" }}>2 sản phẩm</div>
                  </div>
                </div>
                <span style={{
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: "12px",
                }}>
                  Đã xác nhận
                </span>
              </div>

              {/* Package 2 */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid #f8fafc",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    backgroundColor: "#ffedd5",
                    color: "#ea580c",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                  }}>
                    NX
                  </div>
                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>Nhà Xinh</div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b" }}>1 sản phẩm</div>
                  </div>
                </div>
                <span style={{
                  backgroundColor: "#fef3c7",
                  color: "#d97706",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: "12px",
                }}>
                  Đang soạn
                </span>
              </div>

              {/* Package 3 */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 0 2px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    backgroundColor: "#dcfce7",
                    color: "#16a34a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                  }}>
                    TH
                  </div>
                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>Tiệm Hạt</div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b" }}>2 sản phẩm</div>
                  </div>
                </div>
                <span style={{
                  backgroundColor: "#d1fae5",
                  color: "#059669",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: "12px",
                }}>
                  Đã giao đi
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Indicators */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginTop: "24px",
            position: "relative",
            zIndex: 2,
          }}>
            <div style={{ width: "24px", height: "4px", backgroundColor: "#6ee7b7", borderRadius: "4px" }} />
            <div style={{ width: "6px", height: "4px", backgroundColor: "rgba(255,255,255,0.3)", borderRadius: "4px" }} />
          </div>
        </div>

        {/* Right Stacked Cards (Card 1: Mở shop & Card 2: Theo dõi đơn) */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          height: "100%",
        }}>
          {/* Card 1: Mở shop trên sàn */}
          <div style={{
            flex: 1,
            backgroundColor: "#e8f5f1",
            borderRadius: "18px",
            padding: "26px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: "1px solid #cce8e0",
            transition: "transform 0.15s",
          }}>
            <div>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "#059669",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "14px",
              }}>
                <Store size={20} />
              </div>
              <h3 style={{
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "#064e3b",
                marginBottom: "8px",
              }}>
                Mở shop trên sàn
              </h3>
              <p style={{
                fontSize: "0.82rem",
                color: "#475569",
                lineHeight: 1.5,
              }}>
                Đăng ký người bán, tạo shop và đưa sản phẩm lên bán.
              </p>
            </div>
            <Link
              to={ROUTES.REGISTER}
              style={{
                color: "#059669",
                fontWeight: 700,
                fontSize: "0.85rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                marginTop: "16px",
              }}
            >
              <span>Đăng ký bán hàng →</span>
            </Link>
          </div>

          {/* Card 2: Theo dõi đơn hàng */}
          <div style={{
            flex: 1,
            backgroundColor: "#fdf6ec",
            borderRadius: "18px",
            padding: "26px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: "1px solid #f6e6ce",
            transition: "transform 0.15s",
          }}>
            <div>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "#b45309",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "14px",
              }}>
                <Truck size={20} />
              </div>
              <h3 style={{
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "#78350f",
                marginBottom: "8px",
              }}>
                Theo dõi đơn hàng
              </h3>
              <p style={{
                fontSize: "0.82rem",
                color: "#713f12",
                lineHeight: 1.5,
              }}>
                Xem trạng thái từng gói hàng và mã vận đơn.
              </p>
            </div>
            <Link
              to={ROUTES.ORDERS}
              style={{
                color: "#b45309",
                fontWeight: 700,
                fontSize: "0.85rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                marginTop: "16px",
              }}
            >
              <span>Tra cứu đơn →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. GUARANTEES BAR (4 horizontal value points)
          ======================================================== */}
      <section style={{
        backgroundColor: "#ffffff",
        borderRadius: "14px",
        padding: "18px 24px",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "20px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
      }}>
        {/* Item 1 */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "#e8f5f1",
            color: "#059669",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <CreditCard size={20} />
          </div>
          <div>
            <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "#1e293b" }}>Thanh toán linh hoạt</div>
            <div style={{ fontSize: "0.76rem", color: "#64748b" }}>COD hoặc thanh toán online</div>
          </div>
        </div>

        {/* Item 2 */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "#e8f5f1",
            color: "#059669",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "#1e293b" }}>Quét kiểm khi đóng gói</div>
            <div style={{ fontSize: "0.76rem", color: "#64748b" }}>Đúng mã, đúng số lượng mới xuất kho</div>
          </div>
        </div>

        {/* Item 3 */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "#e8f5f1",
            color: "#059669",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <RotateCcw size={20} />
          </div>
          <div>
            <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "#1e293b" }}>Trả hàng trong 7 ngày</div>
            <div style={{ fontSize: "0.76rem", color: "#64748b" }}>Hàng hoàn được kiểm tra rõ ràng</div>
          </div>
        </div>

        {/* Item 4 */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "#e8f5f1",
            color: "#059669",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <Truck size={20} />
          </div>
          <div>
            <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "#1e293b" }}>Nhiều hãng vận chuyển</div>
            <div style={{ fontSize: "0.76rem", color: "#64748b" }}>GHN, GHTK, Viettel Post, J&T, SPX</div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. DANH MỤC NỔI BẬT (Featured Categories)
          ======================================================== */}
      <section>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
            Danh mục nổi bật
          </h2>
          <Link
            to={ROUTES.PRODUCTS}
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#059669",
              textDecoration: "none",
            }}
          >
            Xem tất cả →
          </Link>
        </div>

        {categoriesQuery.isLoading ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "14px",
          }}>
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "16px", border: "1px solid #e2e8f0" }}>
                <Skeleton height={60} variant="rect" />
              </div>
            ))}
          </div>
        ) : featuredCategories.length > 0 ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "14px",
          }}>
            {featuredCategories.map((cat) => {
              const IconComp = getCategoryIcon(cat.categoryName);
              return (
                <Link
                  key={cat.categoryId}
                  to={`${ROUTES.PRODUCTS}?categoryId=${cat.categoryId}`}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "14px",
                    padding: "20px 12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    border: "1px solid #e2e8f0",
                    textDecoration: "none",
                    gap: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#059669";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 14px rgba(5, 150, 105, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
                  }}
                >
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "#e8f5f1",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <IconComp size={22} />
                  </div>
                  <span style={{
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "#1e293b",
                    lineHeight: 1.3,
                  }}>
                    {cat.categoryName}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : null}
      </section>

      {/* ========================================================
          4. GỢI Ý HÔM NAY (10 Products Grid - 2x5)
          ======================================================== */}
      <section>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
            Gợi ý hôm nay
          </h2>
          <Link
            to={ROUTES.PRODUCTS}
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#059669",
              textDecoration: "none",
            }}
          >
            Xem thêm →
          </Link>
        </div>

        {productsQuery.isLoading ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "16px",
          }}>
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "14px", border: "1px solid #e2e8f0" }}>
                <Skeleton height={140} variant="rect" />
                <div style={{ marginTop: "12px" }}>
                  <Skeleton lines={3} gap={8} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "16px",
          }}>
            {products.map((prod) => (
              <ProductCard key={prod.productId} product={prod} />
            ))}
          </div>
        ) : (
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            padding: "36px",
            textAlign: "center",
            border: "1px solid #e2e8f0",
            color: "#64748b",
            fontSize: "0.9rem",
          }}>
            Chưa có sản phẩm nào đang bán công khai trên sàn.
          </div>
        )}
      </section>

      {/* ========================================================
          5. CỬA HÀNG NỔI BẬT (Featured Stores - 4 Cards)
          ======================================================== */}
      {featuredShops.length > 0 && (
        <section>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
              Cửa hàng nổi bật
            </h2>
            <Link
              to={ROUTES.PRODUCTS}
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#059669",
                textDecoration: "none",
              }}
            >
              Khám phá shop →
            </Link>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
          }}>
            {featuredShops.map((shop) => (
              <div
                key={shop.shopId}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "14px",
                  padding: "18px 16px",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#059669";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 14px rgba(5, 150, 105, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    backgroundColor: "#e8f5f1",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    flexShrink: 0,
                  }}>
                    {shop.shopName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#0f172a" }}>
                      {shop.shopName}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "#64748b" }}>
                      {shop.categoryName}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "10px",
                  borderTop: "1px solid #f1f5f9",
                }}>
                  <span style={{
                    fontSize: "0.72rem",
                    color: "#059669",
                    fontWeight: 600,
                  }}>
                    Giao từ kho sàn
                  </span>

                  <Link
                    to={`/shops/${shop.shopId}`}
                    style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      color: "#1e293b",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "0.76rem",
                      fontWeight: 600,
                      textDecoration: "none",
                      display: "inline-block",
                    }}
                  >
                    Xem shop
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          6. DÀNH CHO NGƯỜI BÁN (Seller Banner - Full Dark Green Card)
          ======================================================== */}
      <section style={{
        backgroundColor: "#072b22",
        backgroundImage: "linear-gradient(145deg, #062b22 0%, #0a3d31 60%, #08342a 100%)",
        borderRadius: "18px",
        padding: "36px 40px",
        color: "#ffffff",
        display: "grid",
        gridTemplateColumns: "1.1fr 1.6fr",
        gap: "40px",
        alignItems: "center",
        boxShadow: "0 6px 20px rgba(7, 43, 34, 0.15)",
      }}>
        {/* Left Column: Heading & CTA */}
        <div>
          <span style={{
            fontSize: "0.75rem",
            fontWeight: 800,
            color: "#34d399",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            display: "inline-block",
            marginBottom: "10px",
          }}>
            DÀNH CHO NGƯỜI BÁN
          </span>

          <h2 style={{
            fontSize: "1.9rem",
            fontWeight: 800,
            lineHeight: 1.25,
            color: "#ffffff",
            marginBottom: "14px",
          }}>
            Bán hàng trên sàn, kho lo phần còn lại
          </h2>

          <p style={{
            color: "#cbd5e1",
            fontSize: "0.88rem",
            lineHeight: 1.6,
            marginBottom: "24px",
          }}>
            Gửi hàng vào kho sàn một lần. Đơn hàng được soạn, đóng gói, quét kiểm và giao đi thay bạn.
          </p>

          <Link
            to={ROUTES.REGISTER}
            style={{
              backgroundColor: "#ffffff",
              color: "#064e3b",
              padding: "11px 24px",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.9rem",
              textDecoration: "none",
              display: "inline-block",
              boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#e8f5f1";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ffffff";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Đăng ký bán hàng
          </Link>
        </div>

        {/* Right Column: 4 Process Steps in dark boxes */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "14px",
        }}>
          {/* Step 1 */}
          <div style={{
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "12px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}>
            <div style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.2)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: 800,
            }}>
              1
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ffffff" }}>
              Đăng ký và chờ duyệt
            </div>
            <div style={{ fontSize: "0.74rem", color: "#cbd5e1", lineHeight: 1.4 }}>
              Quản trị viên xét duyệt hồ sơ người bán.
            </div>
          </div>

          {/* Step 2 */}
          <div style={{
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "12px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}>
            <div style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.2)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: 800,
            }}>
              2
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ffffff" }}>
              Tạo shop, đăng sản phẩm
            </div>
            <div style={{ fontSize: "0.74rem", color: "#cbd5e1", lineHeight: 1.4 }}>
              Thêm biến thể, giá và chờ duyệt sản phẩm.
            </div>
          </div>

          {/* Step 3 */}
          <div style={{
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "12px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}>
            <div style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.2)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: 800,
            }}>
              3
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ffffff" }}>
              Gửi hàng vào kho sàn
            </div>
            <div style={{ fontSize: "0.74rem", color: "#cbd5e1", lineHeight: 1.4 }}>
              Kho nhận hàng, nhập kho và cập nhật tồn.
            </div>
          </div>

          {/* Step 4 (spanning width or grid item) */}
          <div style={{
            gridColumn: "span 3",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "12px",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}>
            <div style={{
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.2)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.78rem",
              fontWeight: 800,
              flexShrink: 0,
            }}>
              4
            </div>
            <div>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ffffff", marginRight: "8px" }}>
                Sàn đóng gói và giao:
              </span>
              <span style={{ fontSize: "0.78rem", color: "#cbd5e1" }}>
                Theo dõi đơn và doanh thu ngay trên kênh người bán.
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
