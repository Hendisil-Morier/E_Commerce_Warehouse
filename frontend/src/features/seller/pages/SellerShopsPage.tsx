import React, { useMemo, useState } from "react";
import { ExternalLink, Pencil, Plus, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table } from "@/components/ui/Table";
import type { TableColumn } from "@/components/ui/Table";
import { ROUTES } from "@/constants/routes";
import { ShopFormModal } from "@/features/seller/components/ShopFormModal";
import { useSellerShopsQuery } from "@/features/seller/hooks/useSellerCatalog";
import type { ShopDto } from "@/types/catalog";
import { formatDate, resolveAssetUrl } from "@/utils/formatters";

type ShopStatusFilter = "all" | "active" | "inactive";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "active", label: "Đang hoạt động" },
  { value: "inactive", label: "Tạm ẩn" },
];

export const SellerShopsPage: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ShopStatusFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<ShopDto | null>(null);

  const isActiveParam = useMemo(() => {
    if (statusFilter === "active") return true;
    if (statusFilter === "inactive") return false;
    return undefined;
  }, [statusFilter]);

  const shopsQuery = useSellerShopsQuery(isActiveParam);

  const openCreateModal = () => {
    setEditingShop(null);
    setModalOpen(true);
  };

  const openEditModal = (shop: ShopDto) => {
    setEditingShop(shop);
    setModalOpen(true);
  };

  const columns: TableColumn<ShopDto>[] = [
    {
      key: "shopName",
      header: "Gian hàng",
      render: (shop) => {
        const logoSrc = resolveAssetUrl(shop.logoUrl);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="ew-thumb-sm">
              {logoSrc ? (
                <img src={logoSrc} alt={shop.shopName} />
              ) : (
                <Store size={18} aria-hidden="true" />
              )}
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>{shop.shopName}</div>
              <div
                style={{
                  fontSize: "0.84rem",
                  color: "var(--color-muted)",
                  maxWidth: "360px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {shop.description || "Chưa có mô tả"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "160px",
      render: (shop) => (
        <StatusBadge status={shop.isActive ? "Active" : "Inactive"} />
      ),
    },
    {
      key: "createdAt",
      header: "Ngày tạo",
      width: "165px",
      render: (shop) => formatDate(shop.createdAt),
    },
    {
      key: "updatedAt",
      header: "Cập nhật",
      width: "165px",
      render: (shop) => formatDate(shop.updatedAt),
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      width: "240px",
      render: (shop) => (
        <div className="ew-table-actions">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Pencil size={14} />}
            onClick={() => openEditModal(shop)}
          >
            Sửa
          </Button>
          <Button
            variant="ghost"
            size="sm"
            rightIcon={<ExternalLink size={14} />}
            onClick={() => navigate(`${ROUTES.SELLER_PRODUCTS}?shopId=${shop.shopId}`)}
          >
            Sản phẩm
          </Button>
        </div>
      ),
    },
  ];

  const shops = shopsQuery.data ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="Quản lý gian hàng (Shop)"
        subtitle="Tạo gian hàng để đăng bán sản phẩm, cập nhật logo và bật/tắt trạng thái hiển thị."
        actions={
          <Button leftIcon={<Plus size={16} />} onClick={openCreateModal}>
            Tạo shop mới
          </Button>
        }
      />

      <section className="ew-card" style={{ padding: "18px 20px" }}>
        <div className="ew-toolbar">
          <div className="ew-toolbar__group">
            <Select
              aria-label="Lọc trạng thái gian hàng"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ShopStatusFilter)}
              options={STATUS_FILTER_OPTIONS}
              style={{ minWidth: "200px" }}
            />
          </div>

          <div style={{ fontSize: "0.88rem", color: "var(--color-muted)" }}>
            Tổng số: <strong>{shops.length}</strong> gian hàng
          </div>
        </div>
      </section>

      {shopsQuery.isError ? (
        <section className="ew-card" style={{ padding: "24px" }}>
          <ErrorState
            error={shopsQuery.error}
            onRetry={() => void shopsQuery.refetch()}
          />
        </section>
      ) : (
        <section className="ew-card" style={{ overflow: "hidden" }}>
          <Table
            columns={columns}
            data={shops}
            rowKey={(shop) => shop.shopId}
            loading={shopsQuery.isLoading}
            emptyTitle="Bạn chưa có gian hàng nào"
            emptyDescription="Hãy tạo gian hàng đầu tiên trước khi thêm sản phẩm lên sàn."
            emptyAction={
              <Button leftIcon={<Plus size={16} />} onClick={openCreateModal}>
                Tạo shop đầu tiên
              </Button>
            }
          />
        </section>
      )}

      <ShopFormModal
        open={modalOpen}
        editingShop={editingShop}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};
