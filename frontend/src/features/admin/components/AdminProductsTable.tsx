import React from "react";
import { Check, Eye, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table } from "@/components/ui/Table";
import type { TableColumn } from "@/components/ui/Table";
import type { AdminProductListItemDto } from "@/types/catalog";
import { formatPriceRange } from "@/utils/catalogHelpers";
import { formatDate, resolveAssetUrl } from "@/utils/formatters";

export type ProductModerationAction = "approve" | "reject";

export interface AdminProductsTableProps {
  items: AdminProductListItemDto[];
  loading: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  onSelectDetail: (productId: number) => void;
  onRequestAction: (
    item: AdminProductListItemDto,
    action: ProductModerationAction
  ) => void;
}

export const AdminProductsTable: React.FC<AdminProductsTableProps> = ({
  items,
  loading,
  emptyTitle,
  emptyDescription,
  emptyAction,
  onSelectDetail,
  onRequestAction,
}) => {
  const columns: TableColumn<AdminProductListItemDto>[] = [
    {
      key: "product",
      header: "Sản phẩm",
      render: (item) => {
        const thumb = resolveAssetUrl(item.thumbnailUrl);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="ew-thumb-sm">
              {thumb ? (
                <img src={thumb} alt={item.productName} />
              ) : (
                <ImageIcon size={18} aria-hidden="true" />
              )}
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>{item.productName}</div>
              <div style={{ fontSize: "0.82rem", color: "var(--color-muted)" }}>
                #{item.productId} · {item.categoryName}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "shop",
      header: "Shop / Người bán",
      width: "220px",
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600 }}>{item.shopName}</div>
          <div style={{ fontSize: "0.82rem", color: "var(--color-muted)" }}>
            {item.sellerBusinessName}
          </div>
        </div>
      ),
    },
    {
      key: "pricing",
      header: "Biến thể & Giá",
      width: "200px",
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600 }}>
            {formatPriceRange(item.minPrice, item.maxPrice)}
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--color-muted)" }}>
            {item.variantCount} biến thể
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "145px",
      render: (item) => <StatusBadge status={item.productStatus} domain="product" />,
    },
    {
      key: "updatedAt",
      header: "Cập nhật",
      width: "155px",
      render: (item) => formatDate(item.updatedAt),
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      width: "250px",
      render: (item) => {
        const isPending = item.productStatus === "PendingReview";
        return (
          <div className="ew-table-actions">
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Eye size={14} />}
              onClick={() => onSelectDetail(item.productId)}
            >
              Xem
            </Button>
            {isPending && (
              <>
                <Button
                  size="sm"
                  leftIcon={<Check size={14} />}
                  onClick={() => onRequestAction(item, "approve")}
                >
                  Duyệt
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  leftIcon={<X size={14} />}
                  onClick={() => onRequestAction(item, "reject")}
                >
                  Từ chối
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      data={items}
      rowKey={(item) => item.productId}
      loading={loading}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      emptyAction={emptyAction}
    />
  );
};

