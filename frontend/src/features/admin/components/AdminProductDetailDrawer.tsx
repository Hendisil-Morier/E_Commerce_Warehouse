import React, { useEffect, useState } from "react";
import { Check, Image as ImageIcon, Store, X } from "lucide-react";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ProductModerationAction } from "@/features/admin/components/AdminProductsTable";
import { useAdminProductDetailQuery } from "@/features/admin/hooks/useAdminProducts";
import type { AdminProductDetailDto } from "@/types/catalog";
import { formatPriceRange } from "@/utils/catalogHelpers";
import { formatCurrency, formatDate, resolveAssetUrl } from "@/utils/formatters";

export interface AdminProductDetailDrawerProps {
  productId: number | null;
  isActionPending: boolean;
  onClose: () => void;
  onRequestAction: (
    detail: AdminProductDetailDto,
    action: ProductModerationAction
  ) => void;
}

export const AdminProductDetailDrawer: React.FC<AdminProductDetailDrawerProps> = ({
  productId,
  isActionPending,
  onClose,
  onRequestAction,
}) => {
  const detailQuery = useAdminProductDetailQuery(productId);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");

  const detail = detailQuery.data;

  useEffect(() => {
    if (!detail) {
      setSelectedImageUrl("");
      return;
    }
    const primary = detail.images.find((img) => img.isPrimary) ?? detail.images[0];
    setSelectedImageUrl(primary?.imageUrl ?? "");
  }, [detail]);

  useEffect(() => {
    if (productId === null) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose, productId]);

  if (productId === null) return null;

  const prices = (detail?.variants ?? []).map((v) => v.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
  const activeUrl = resolveAssetUrl(selectedImageUrl);
  const shopLogo = resolveAssetUrl(detail?.shop.logoUrl);

  return (
    <div
      className="ew-drawer-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-product-drawer-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside className="ew-drawer ew-drawer--wide">
        <header className="ew-drawer__header">
          <div>
            <h2 id="admin-product-drawer-title" className="ew-drawer__title">
              {detail ? detail.productName : `Chi tiết sản phẩm #${productId}`}
            </h2>
            {detail && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                <StatusBadge status={detail.productStatus} domain="product" />
                <span style={{ fontSize: "0.84rem", color: "var(--color-muted)" }}>
                  Cập nhật {formatDate(detail.updatedAt)}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="ew-icon-btn"
            aria-label="Đóng chi tiết sản phẩm"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>

        <div className="ew-drawer__body">
          {detailQuery.isLoading ? (
            <Skeleton lines={8} height={22} gap={14} />
          ) : detailQuery.isError ? (
            <ErrorState
              error={detailQuery.error}
              onRetry={() => void detailQuery.refetch()}
            />
          ) : detail ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {detail.productStatus === "Rejected" && detail.rejectReason && (
                <div className="ew-banner ew-banner--danger" role="alert">
                  <strong>Lý do từ chối:</strong> {detail.rejectReason}
                </div>
              )}

              <div className="ew-preview-gallery">
                <div className="ew-preview-gallery__main">
                  {activeUrl ? (
                    <img src={activeUrl} alt={detail.productName} />
                  ) : (
                    <div className="ew-preview-gallery__empty">
                      <ImageIcon size={32} aria-hidden="true" />
                      <span>Sản phẩm chưa có ảnh</span>
                    </div>
                  )}
                </div>

                {detail.images.length > 0 && (
                  <div className="ew-preview-gallery__thumbs">
                    {detail.images.map((img) => {
                      const isSelected = img.imageUrl === selectedImageUrl;
                      return (
                        <button
                          key={img.imageId}
                          type="button"
                          onClick={() => setSelectedImageUrl(img.imageUrl)}
                          className={`ew-preview-thumb ${
                            isSelected ? "ew-preview-thumb--active" : ""
                          }`}
                        >
                          <img
                            src={resolveAssetUrl(img.imageUrl)}
                            alt={`Ảnh ${img.displayOrder + 1}`}
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="ew-detail-grid">
                <div className="ew-detail-item">
                  <span className="ew-detail-item__label">Danh mục</span>
                  <span className="ew-detail-item__value">{detail.categoryName}</span>
                </div>
                <div className="ew-detail-item">
                  <span className="ew-detail-item__label">Khoảng giá</span>
                  <span className="ew-detail-item__value">
                    {formatPriceRange(minPrice, maxPrice)}
                  </span>
                </div>
              </div>

              <div className="ew-shop-summary-card">
                <div className="ew-thumb-sm">
                  {shopLogo ? (
                    <img src={shopLogo} alt={detail.shop.shopName} />
                  ) : (
                    <Store size={18} aria-hidden="true" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{detail.shop.shopName}</div>
                  <div style={{ fontSize: "0.84rem", color: "var(--color-muted)" }}>
                    Doanh nghiệp: {detail.shop.sellerBusinessName}
                  </div>
                </div>
                <StatusBadge status={detail.shop.isActive ? "Active" : "Inactive"} />
              </div>

              <div>
                <h3 className="ew-drawer__section-title">Mô tả sản phẩm</h3>
                <p className="ew-description-box">
                  {detail.description || "Người bán chưa cung cấp mô tả chi tiết."}
                </p>
              </div>

              <div>
                <h3 className="ew-drawer__section-title">
                  Danh sách biến thể ({detail.variants.length})
                </h3>
                {detail.variants.length === 0 ? (
                  <div className="ew-image-empty">Chưa có biến thể.</div>
                ) : (
                  <div className="ew-table-wrap">
                    <table className="ew-table">
                      <thead>
                        <tr>
                          <th>SKU</th>
                          <th>Biến thể</th>
                          <th>Giá bán</th>
                          <th>Khối lượng</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.variants.map((v) => (
                          <tr key={v.variantId}>
                            <td>
                              <strong>{v.sku}</strong>
                              {v.barcode && (
                                <div style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
                                  Barcode: {v.barcode}
                                </div>
                              )}
                            </td>
                            <td>{v.variantName}</td>
                            <td style={{ fontWeight: 600 }}>{formatCurrency(v.price)}</td>
                            <td>{v.weightGrams ? `${v.weightGrams} g` : "—"}</td>
                            <td>
                              <StatusBadge status={v.isActive ? "Active" : "Inactive"} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {detail?.productStatus === "PendingReview" && (
          <footer className="ew-drawer__footer">
            <Button
              variant="danger"
              leftIcon={<X size={16} />}
              disabled={isActionPending}
              onClick={() => onRequestAction(detail, "reject")}
            >
              Từ chối
            </Button>
            <Button
              leftIcon={<Check size={16} />}
              disabled={isActionPending}
              onClick={() => onRequestAction(detail, "approve")}
            >
              Duyệt hiển thị sàn
            </Button>
          </footer>
        )}
      </aside>
    </div>
  );
};

