import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ChevronRight,
  CreditCard,
  Info,
  Package,
  ShieldCheck,
  ShoppingCart,
  Store,
  Trash2,
  Warehouse,
} from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ROUTES } from "@/constants/routes";
import {
  useMyCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from "@/features/cart/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import type { CartAvailabilityStatus, CartItemDto } from "@/types/cart";
import { getErrorMessage } from "@/utils/errorHandler";
import { formatCurrency, resolveAssetUrl } from "@/utils/formatters";

function getAvailabilityBadgeProps(status: CartAvailabilityStatus): {
  status: string;
  label: string;
} {
  switch (status) {
    case "Available":
      return { status: "InStock", label: "Sẵn hàng" };
    case "InsufficientStock":
      return { status: "LowStock", label: "Vượt tồn kho" };
    case "OutOfStock":
      return { status: "OutOfStock", label: "Hết hàng" };
    case "ProductUnavailable":
    default:
      return { status: "Inactive", label: "Ngừng kinh doanh" };
  }
}

export const CartPage: React.FC = () => {
  const toast = useToast();
  const { data: cart, isLoading, isError, error, refetch } = useMyCart();
  const updateItemMutation = useUpdateCartItem();
  const removeItemMutation = useRemoveCartItem();

  const [pendingItemId, setPendingItemId] = useState<number | null>(null);
  const [removingItem, setRemovingItem] = useState<CartItemDto | null>(null);

  const handleUpdateQty = async (item: CartItemDto, nextQty: number) => {
    if (nextQty < 1) return;
    setPendingItemId(item.cartItemId);
    try {
      await updateItemMutation.mutateAsync({
        cartItemId: item.cartItemId,
        payload: { quantity: nextQty },
      });
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setPendingItemId(null);
    }
  };

  const handleConfirmRemove = async () => {
    if (!removingItem) return;
    try {
      await removeItemMutation.mutateAsync(removingItem.cartItemId);
      toast.success(`Đã xóa "${removingItem.productName}" khỏi giỏ hàng.`);
      setRemovingItem(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="ks-breadcrumb-bar">
        <div className="ks-container">
          <nav className="ks-breadcrumb" aria-label="Đường dẫn trang">
            <Link to={ROUTES.HOME}>Trang chủ</Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span className="ks-breadcrumb-current">Giỏ hàng</span>
          </nav>
        </div>
      </div>

      <div className="ks-container ks-store-main">
        <div className="ks-section-head">
          <div>
            <h1 className="ks-section-title" style={{ fontSize: "24px" }}>
              Giỏ hàng của bạn
            </h1>
            <p className="ks-section-subtitle">
              Sản phẩm được nhóm theo từng gian hàng. Số tiền tạm tính và cảnh báo tồn khả dụng
              được đồng bộ trực tiếp từ máy chủ.
            </p>
          </div>
          <Link to={ROUTES.PRODUCTS} className="ew-btn ew-btn--secondary ew-btn--sm">
            Tiếp tục mua sắm
          </Link>
        </div>

        {isLoading ? (
          <div className="ks-cart-grid">
            <div className="ew-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <Skeleton height={84} />
              <Skeleton height={84} />
            </div>
            <div className="ew-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <Skeleton height={28} />
              <Skeleton height={20} />
              <Skeleton height={44} />
            </div>
          </div>
        ) : isError ? (
          <div className="ew-card">
            <ErrorState
              title="Không thể tải giỏ hàng"
              error={error}
              onRetry={() => void refetch()}
            />
          </div>
        ) : !cart || cart.shops.length === 0 ? (
          <div className="ew-card">
            <EmptyState
              icon={<ShoppingCart size={28} />}
              title="Giỏ hàng của bạn đang trống"
              description="Khám phá các sản phẩm đã kiểm duyệt tại Kho sàn và thêm vào giỏ để đặt mua nhanh chóng."
              action={
                <Link to={ROUTES.PRODUCTS} className="ew-btn ew-btn--primary ew-btn--md">
                  Khám phá sản phẩm ngay
                </Link>
              }
            />
          </div>
        ) : (
          <div className="ks-cart-grid">
            {/* Left: Multi-Seller Cart Groups */}
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {cart.hasWarnings && (
                <div className="ks-alert-banner" role="alert">
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: "2px" }} aria-hidden="true" />
                  <div>
                    <strong>
                      Có {cart.unavailableItemCount} dòng sản phẩm cần kiểm tra lại số lượng hoặc
                      tình trạng tồn kho.
                    </strong>{" "}
                    Vui lòng điều chỉnh số lượng hoặc xóa sản phẩm không khả dụng trước khi đặt hàng.
                  </div>
                </div>
              )}

              {cart.shops.map((shopGroup) => (
                <section key={shopGroup.shopId} className="ks-cart-shop-card">
                  <div className="ks-cart-shop-head">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                      <span className="ks-warehouse-tag">
                        <Warehouse size={11} aria-hidden="true" />
                        <span>Kho sàn</span>
                      </span>
                      <Link
                        to={`/shops/${shopGroup.shopId}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontWeight: 700,
                          fontSize: "15px",
                          color: "var(--color-dark)",
                        }}
                      >
                        <Store size={15} color="var(--color-primary)" aria-hidden="true" />
                        <span>{shopGroup.shopName}</span>
                      </Link>
                      {!shopGroup.isShopActive && (
                        <StatusBadge status="Inactive" labelOverride="Shop tạm ngừng" size="sm" />
                      )}
                    </div>

                    <div className="ks-tabular" style={{ fontSize: "13px", color: "var(--color-muted)" }}>
                      Tạm tính shop:{" "}
                      <strong style={{ color: "var(--color-dark)", fontSize: "14px" }}>
                        {formatCurrency(shopGroup.shopSubtotal)}
                      </strong>
                    </div>
                  </div>

                  <div>
                    {shopGroup.items.map((item) => {
                      const thumb = resolveAssetUrl(item.thumbnailUrl);
                      const isRowBusy = pendingItemId === item.cartItemId;
                      const badge = getAvailabilityBadgeProps(item.availabilityStatus);
                      const maxQty = Math.max(1, item.availableQuantity);

                      return (
                        <div
                          key={item.cartItemId}
                          className={`ks-cart-item-row ${
                            !item.isAvailable ? "ks-cart-item-row--warn" : ""
                          }`}
                        >
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={item.productName}
                              className="ks-item-thumb"
                            />
                          ) : (
                            <div
                              className="ks-item-thumb"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--color-slate-400)",
                              }}
                              aria-hidden="true"
                            >
                              <Package size={24} />
                            </div>
                          )}

                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                flexWrap: "wrap",
                                marginBottom: "4px",
                              }}
                            >
                              <Link
                                to={`/products/${item.productId}`}
                                style={{
                                  fontSize: "15px",
                                  fontWeight: 700,
                                  color: "var(--color-dark)",
                                }}
                              >
                                {item.productName}
                              </Link>
                              <StatusBadge
                                status={badge.status}
                                labelOverride={badge.label}
                                size="sm"
                              />
                            </div>

                            <div style={{ fontSize: "13px", color: "var(--color-muted)" }}>
                              Phân loại: <strong>{item.variantName}</strong> ·{" "}
                              <span className="ks-tabular">SKU: {item.sku}</span>
                            </div>

                            <div
                              className="ks-tabular"
                              style={{ fontSize: "12px", color: "var(--color-muted)", marginTop: "3px" }}
                            >
                              Đơn giá: {formatCurrency(item.unitPrice)} · Tồn khả dụng:{" "}
                              <strong>{item.availableQuantity}</strong>
                            </div>

                            {item.warningMessage && (
                              <div
                                style={{
                                  marginTop: "6px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  flexWrap: "wrap",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color: "var(--color-warning)",
                                }}
                              >
                                <span>⚠ {item.warningMessage}</span>
                                {item.availabilityStatus === "InsufficientStock" &&
                                  item.availableQuantity > 0 && (
                                    <button
                                      type="button"
                                      className="ew-btn ew-btn--secondary ew-btn--sm"
                                      disabled={isRowBusy}
                                      onClick={() =>
                                        void handleUpdateQty(item, item.availableQuantity)
                                      }
                                    >
                                      Điều chỉnh về {item.availableQuantity}
                                    </button>
                                  )}
                              </div>
                            )}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                            <div className="ks-qty-stepper">
                              <button
                                type="button"
                                className="ks-qty-btn"
                                aria-label={`Giảm số lượng ${item.productName}`}
                                disabled={
                                  item.quantity <= 1 ||
                                  isRowBusy ||
                                  item.availabilityStatus === "ProductUnavailable" ||
                                  item.availableQuantity <= 0
                                }
                                onClick={() => {
                                  const nextQty =
                                    item.quantity > item.availableQuantity &&
                                    item.availableQuantity > 0
                                      ? item.availableQuantity
                                      : item.quantity - 1;
                                  void handleUpdateQty(item, nextQty);
                                }}
                              >
                                −
                              </button>
                              <span className="ks-qty-val ks-tabular">{item.quantity}</span>
                              <button
                                type="button"
                                className="ks-qty-btn"
                                aria-label={`Tăng số lượng ${item.productName}`}
                                disabled={
                                  isRowBusy ||
                                  item.availabilityStatus === "ProductUnavailable" ||
                                  item.availableQuantity <= 0 ||
                                  item.quantity >= maxQty
                                }
                                onClick={() => void handleUpdateQty(item, item.quantity + 1)}
                              >
                                +
                              </button>
                            </div>

                            <div
                              className="ks-tabular"
                              style={{ minWidth: "110px", textAlign: "right" }}
                            >
                              <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-dark)" }}>
                                {formatCurrency(item.lineTotal)}
                              </div>
                            </div>

                            <button
                              type="button"
                              className="ew-icon-btn"
                              aria-label={`Xóa ${item.productName} khỏi giỏ hàng`}
                              disabled={isRowBusy || removeItemMutation.isPending}
                              onClick={() => setRemovingItem(item)}
                              style={{ minWidth: "44px", minHeight: "44px", color: "var(--color-danger)" }}
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            {/* Right: Authoritative Server Summary Panel */}
            <aside className="ew-card" style={{ position: "sticky", top: "136px", overflow: "hidden" }}>
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--color-border)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: 700,
                  fontSize: "16px",
                  color: "var(--color-dark)",
                }}
              >
                <CreditCard size={18} color="var(--color-primary)" aria-hidden="true" />
                <span>Tóm tắt giỏ hàng</span>
              </div>

              <div
                style={{
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div className="ks-summary-row ks-tabular">
                  <span>Số gian hàng (đơn con dự kiến)</span>
                  <strong>{cart.shops.length} shop</strong>
                </div>
                <div className="ks-summary-row ks-tabular">
                  <span>Số dòng sản phẩm</span>
                  <strong>{cart.totalItems} dòng</strong>
                </div>
                <div className="ks-summary-row ks-tabular">
                  <span>Tổng số lượng</span>
                  <strong>{cart.totalQuantity} sản phẩm</strong>
                </div>
                <div className="ks-summary-row ks-summary-total ks-tabular">
                  <span>Tạm tính khả dụng</span>
                  <span className="ks-summary-total-price">{formatCurrency(cart.subtotal)}</span>
                </div>

                <div className="ks-alert-banner ks-alert-banner--info">
                  <Info size={16} style={{ flexShrink: 0, marginTop: "2px" }} aria-hidden="true" />
                  <span>
                    Giỏ hàng chỉ kiểm tra tồn khả dụng tham khảo và <strong>chưa giữ chỗ</strong>.
                    Bước đặt hàng (Checkout) sẽ tách đơn theo từng shop và giữ chỗ tồn kho khi API{" "}
                    <code>POST /api/v1/orders</code> hoàn thiện ở giai đoạn kế tiếp.
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={cart.hasWarnings || cart.subtotal <= 0}
                  onClick={() =>
                    toast.info(
                      "Luồng Đặt hàng & Giữ chỗ tồn kho (POST /api/v1/orders) sẽ được mở ở Bước 6."
                    )
                  }
                >
                  Tiến hành đặt hàng
                </Button>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "12px",
                    color: "var(--color-muted)",
                  }}
                >
                  <ShieldCheck size={15} color="var(--color-primary)" aria-hidden="true" />
                  <span>Giá cuối cùng &amp; phí vận chuyển do máy chủ xác nhận khi tạo đơn.</span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(removingItem)}
        onClose={() => setRemovingItem(null)}
        onConfirm={() => void handleConfirmRemove()}
        title="Xóa sản phẩm khỏi giỏ hàng"
        description={
          removingItem
            ? `Bạn có chắc muốn xóa "${removingItem.productName} (${removingItem.variantName})" khỏi giỏ hàng?`
            : ""
        }
        confirmText="Xóa khỏi giỏ"
        variant="danger"
        loading={removeItemMutation.isPending}
      />
    </div>
  );
};
