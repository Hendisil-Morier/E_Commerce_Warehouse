import React from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Store,
  Trash2,
} from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useCart,
  useRemoveCartItemMutation,
  useUpdateCartItemMutation,
} from "@/features/cart/hooks/useCart";
import { ROUTES } from "@/constants/routes";
import { useToast } from "@/hooks/useToast";
import type { CartItem } from "@/types/cart";
import { formatCurrency, resolveAssetUrl } from "@/utils/formatters";

export const CartPage: React.FC = () => {
  const toast = useToast();
  const { data: cart, isLoading, isError, error, refetch } = useCart();
  const updateMutation = useUpdateCartItemMutation();
  const removeMutation = useRemoveCartItemMutation();

  const isMutating = updateMutation.isPending || removeMutation.isPending;

  const handleQuantityChange = (item: CartItem, nextQty: number) => {
    if (nextQty < 1 || nextQty === item.quantity) return;
    if (item.availableQuantity > 0 && nextQty > item.availableQuantity && nextQty > item.quantity) {
      toast.warning(`Sản phẩm "${item.productName}" chỉ còn ${item.availableQuantity} sản phẩm khả dụng.`);
      return;
    }
    updateMutation.mutate({
      cartItemId: item.cartItemId,
      data: { quantity: nextQty },
    });
  };

  const handleRemove = (item: CartItem) => {
    removeMutation.mutate(item.cartItemId);
  };

  const handleCheckoutClick = () => {
    if (!cart || cart.totalItems === 0) return;
    if (cart.unavailableItemCount > 0) {
      toast.warning("Vui lòng xóa hoặc điều chỉnh các sản phẩm không khả dụng trước khi đặt hàng.");
      return;
    }
    toast.info("Chức năng Đặt hàng (Checkout) đang được triển khai ở phân hệ Đơn hàng.");
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 20px" }}>
        <Skeleton height="36px" width="240px" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", marginTop: "24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Skeleton height="180px" />
            <Skeleton height="180px" />
          </div>
          <Skeleton height="260px" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 20px" }}>
        <ErrorState
          error={error ?? new Error("Không thể tải giỏ hàng.")}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const isEmpty = !cart || cart.shops.length === 0 || cart.totalItems === 0;

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 20px 56px" }}>
      {/* Page Title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <ShoppingCart size={26} color="#0E7C66" />
          <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: "#0f172a" }}>
            Giỏ hàng của bạn
          </h1>
          {!isEmpty && (
            <span
              style={{
                backgroundColor: "#E6F4F1",
                color: "#0E7C66",
                fontSize: "0.85rem",
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: "9999px",
              }}
            >
              {cart.totalQuantity} sản phẩm
            </span>
          )}
        </div>

        <Link
          to={ROUTES.PRODUCTS}
          style={{
            color: "#0E7C66",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.9rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>Tiếp tục mua sắm</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {isEmpty ? (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            padding: "48px 24px",
          }}
        >
          <EmptyState
            icon={<ShoppingBag size={32} />}
            title="Giỏ hàng đang trống"
            description="Hãy khám phá hàng trăm sản phẩm đang bán trên sàn và thêm món bạn thích vào giỏ nhé."
            action={
              <Link to={ROUTES.PRODUCTS} style={{ textDecoration: "none" }}>
                <Button variant="primary" size="md">
                  Khám phá sản phẩm
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: "24px", alignItems: "start" }}>
          {/* Left Column: Warnings & Shop Groups */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {cart.hasWarnings && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "14px 18px",
                  backgroundColor: "#FFFBEB",
                  border: "1px solid #FDE68A",
                  borderRadius: "10px",
                  color: "#92400E",
                  fontSize: "0.9rem",
                }}
              >
                <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <div style={{ fontWeight: 700 }}>
                    Có {cart.unavailableItemCount} sản phẩm trong giỏ cần kiểm tra lại
                  </div>
                  <div style={{ marginTop: "2px", fontSize: "0.85rem" }}>
                    Một số sản phẩm đã hết hàng, ngừng bán hoặc số lượng chọn vượt quá tồn khả dụng. Vui lòng điều chỉnh hoặc xóa trước khi đặt hàng.
                  </div>
                </div>
              </div>
            )}

            {cart.shops.map((shop) => (
              <section
                key={shop.shopId}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                }}
              >
                {/* Shop Header */}
                <div
                  style={{
                    padding: "14px 20px",
                    backgroundColor: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Store size={18} color="#0E7C66" />
                    <Link
                      to={`/shops/${shop.shopId}`}
                      style={{
                        fontWeight: 700,
                        color: "#0f172a",
                        textDecoration: "none",
                        fontSize: "1rem",
                      }}
                    >
                      {shop.shopName}
                    </Link>
                    <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                      ({shop.sellerBusinessName})
                    </span>
                    {!shop.isShopActive && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "9999px",
                          backgroundColor: "#FEE2E2",
                          color: "#991B1B",
                        }}
                      >
                        Shop tạm ngừng hoạt động
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: "0.9rem", color: "#475569" }}>
                    Tạm tính shop:{" "}
                    <strong style={{ color: "#0E7C66" }}>
                      {formatCurrency(shop.shopSubtotal)}
                    </strong>
                  </div>
                </div>

                {/* Shop Items */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {shop.items.map((item, idx) => {
                    const thumbUrl = resolveAssetUrl(item.thumbnailUrl);
                    const hasIssue = !item.isAvailable || item.availabilityStatus !== "Available";

                    return (
                      <div
                        key={item.cartItemId}
                        style={{
                          padding: "18px 20px",
                          borderTop: idx > 0 ? "1px solid #f1f5f9" : "none",
                          backgroundColor: hasIssue ? "#FEF2F2" : "#ffffff",
                          display: "grid",
                          gridTemplateColumns: "84px minmax(0, 1fr) auto auto auto",
                          gap: "16px",
                          alignItems: "center",
                        }}
                      >
                        {/* Thumbnail */}
                        <Link
                          to={`/products/${item.productId}`}
                          style={{
                            width: "84px",
                            height: "84px",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            backgroundColor: "#f8fafc",
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {thumbUrl ? (
                            <img
                              src={thumbUrl}
                              alt={item.productName}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <Package size={28} color="#94a3b8" />
                          )}
                        </Link>

                        {/* Product Info */}
                        <div style={{ minWidth: 0 }}>
                          <Link
                            to={`/products/${item.productId}`}
                            style={{
                              fontWeight: 700,
                              color: "#0f172a",
                              textDecoration: "none",
                              fontSize: "0.98rem",
                              display: "block",
                            }}
                          >
                            {item.productName}
                          </Link>
                          <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "4px" }}>
                            Phân loại: <strong style={{ color: "#334155" }}>{item.variantName}</strong> • SKU: {item.sku}
                          </div>
                          <div style={{ fontSize: "0.85rem", color: "#0E7C66", fontWeight: 600, marginTop: "4px" }}>
                            {formatCurrency(item.unitPrice)}
                            <span style={{ color: "#64748b", fontWeight: 400, marginLeft: "10px" }}>
                              (Khả dụng: {item.availableQuantity})
                            </span>
                          </div>
                          {item.warningMessage && (
                            <div
                              style={{
                                marginTop: "6px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                color: "#B91C1C",
                                backgroundColor: "#FEE2E2",
                                padding: "3px 8px",
                                borderRadius: "6px",
                              }}
                            >
                              <AlertTriangle size={14} />
                              <span>{item.warningMessage}</span>
                            </div>
                          )}
                        </div>

                        {/* Quantity Stepper */}
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            border: "1px solid #cbd5e1",
                            borderRadius: "8px",
                            overflow: "hidden",
                            backgroundColor: "#ffffff",
                          }}
                        >
                          <button
                            type="button"
                            disabled={isMutating || item.quantity <= 1}
                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                            aria-label="Giảm số lượng"
                            style={{
                              width: "32px",
                              height: "32px",
                              border: "none",
                              backgroundColor: "#f8fafc",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: isMutating || item.quantity <= 1 ? "not-allowed" : "pointer",
                              color: "#334155",
                            }}
                          >
                            <Minus size={14} />
                          </button>
                          <span
                            style={{
                              minWidth: "38px",
                              textAlign: "center",
                              fontWeight: 700,
                              fontSize: "0.9rem",
                              color: "#0f172a",
                            }}
                          >
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={
                              isMutating ||
                              item.availableQuantity <= 0 ||
                              item.quantity >= item.availableQuantity
                            }
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                            aria-label="Tăng số lượng"
                            style={{
                              width: "32px",
                              height: "32px",
                              border: "none",
                              backgroundColor: "#f8fafc",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor:
                                isMutating ||
                                item.availableQuantity <= 0 ||
                                item.quantity >= item.availableQuantity
                                  ? "not-allowed"
                                  : "pointer",
                              color: "#334155",
                            }}
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        {/* Line Total */}
                        <div
                          style={{
                            minWidth: "110px",
                            textAlign: "right",
                            fontWeight: 800,
                            fontSize: "1rem",
                            color: hasIssue ? "#94a3b8" : "#0f172a",
                          }}
                        >
                          {formatCurrency(item.lineTotal)}
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          disabled={isMutating}
                          onClick={() => handleRemove(item)}
                          title="Xóa khỏi giỏ hàng"
                          aria-label={`Xóa ${item.productName}`}
                          style={{
                            border: "none",
                            backgroundColor: "transparent",
                            color: "#ef4444",
                            cursor: isMutating ? "not-allowed" : "pointer",
                            padding: "6px",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* Right Column: Summary Card */}
          <aside
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              padding: "22px",
              position: "sticky",
              top: "96px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>
              Tóm tắt giỏ hàng
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.92rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                <span>Số dòng sản phẩm:</span>
                <strong>{cart.totalItems} dòng</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                <span>Tổng số lượng:</span>
                <strong>{cart.totalQuantity} sản phẩm</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                <span>Số shop:</span>
                <strong>{cart.shops.length} gian hàng</strong>
              </div>
            </div>

            <div
              style={{
                borderTop: "1px dashed #cbd5e1",
                paddingTop: "14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <span style={{ fontWeight: 700, color: "#0f172a" }}>Tạm tính khả dụng:</span>
              <span style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0E7C66" }}>
                {formatCurrency(cart.subtotal)}
              </span>
            </div>

            <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b", lineHeight: 1.5 }}>
              Giá trên là tạm tính tham khảo cho các mặt hàng đang khả dụng (chưa bao gồm phí vận chuyển và không giữ chỗ tồn kho trước khi đặt hàng).
            </p>

            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isMutating || cart.unavailableItemCount > 0}
              onClick={handleCheckoutClick}
              style={{ justifyContent: "center" }}
            >
              Tiến hành đặt hàng
            </Button>

            {cart.unavailableItemCount > 0 && (
              <div style={{ fontSize: "0.8rem", color: "#B91C1C", textAlign: "center", fontWeight: 600 }}>
                Vui lòng xử lý {cart.unavailableItemCount} sản phẩm cảnh báo trước khi đặt hàng.
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};
