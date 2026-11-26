import React, { useMemo, useState } from "react";
import { ChevronRight, FolderTree, Pencil, Plus, Power } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Textarea } from "@/components/ui/Textarea";
import { useCategoriesQuery } from "@/features/seller/hooks/useSellerCatalog";
import { useToast } from "@/hooks/useToast";
import type { CategoryTreeDto } from "@/types/catalog";
import { getErrorMessage } from "@/utils/errorHandler";

interface FlatCategoryRow {
  categoryId: number;
  parentCategoryId: number | null;
  categoryName: string;
  description: string | null;
  isActive: boolean;
  level: number;
}

function flattenTree(nodes: CategoryTreeDto[], level = 1): FlatCategoryRow[] {
  const out: FlatCategoryRow[] = [];
  for (const node of nodes) {
    out.push({
      categoryId: node.categoryId,
      parentCategoryId: node.parentCategoryId,
      categoryName: node.categoryName,
      description: node.description,
      isActive: node.isActive,
      level,
    });
    if (node.children?.length) {
      out.push(...flattenTree(node.children, level + 1));
    }
  }
  return out;
}

export const AdminCategoriesPage: React.FC = () => {
  const toast = useToast();
  const categoriesQuery = useCategoriesQuery();

  // Ghi đè cục bộ tạm cho các thao tác Thêm/Sửa/Ẩn trong lúc chờ BE bổ sung POST/PUT /admin/categories
  const [localAdded, setLocalAdded] = useState<FlatCategoryRow[]>([]);
  const [localEdits, setLocalEdits] = useState<Record<number, Partial<FlatCategoryRow>>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<FlatCategoryRow | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const base = flattenTree(categoriesQuery.data ?? []);
    const merged = [...base, ...localAdded].map((row) => ({
      ...row,
      ...(localEdits[row.categoryId] ?? {}),
    }));
    return merged;
  }, [categoriesQuery.data, localAdded, localEdits]);

  const rootOptions = useMemo(
    () => [
      { value: "", label: "(Danh mục gốc — Cấp 1)" },
      ...rows
        .filter((r) => r.level === 1 && r.categoryId !== editingRow?.categoryId)
        .map((r) => ({ value: String(r.categoryId), label: r.categoryName })),
    ],
    [rows, editingRow]
  );

  const openCreateModal = () => {
    setEditingRow(null);
    setCategoryName("");
    setParentCategoryId("");
    setDescription("");
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (row: FlatCategoryRow) => {
    setEditingRow(row);
    setCategoryName(row.categoryName);
    setParentCategoryId(row.parentCategoryId ? String(row.parentCategoryId) : "");
    setDescription(row.description ?? "");
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = categoryName.trim();
    if (!trimmed) {
      setFormError("Vui lòng nhập tên danh mục (CategoryName).");
      return;
    }

    const parentIdNum = parentCategoryId ? Number(parentCategoryId) : null;

    if (editingRow) {
      setLocalEdits((prev) => ({
        ...prev,
        [editingRow.categoryId]: {
          ...(prev[editingRow.categoryId] ?? {}),
          categoryName: trimmed,
          parentCategoryId: parentIdNum,
          description: description.trim() || null,
          level: parentIdNum ? 2 : 1,
        },
      }));
      toast.info(
        `Đã cập nhật "${trimmed}" trên giao diện (chờ BE bổ sung PUT /api/v1/admin/categories/${editingRow.categoryId}).`
      );
    } else {
      const nextId = Math.max(100, ...rows.map((r) => r.categoryId)) + 1;
      setLocalAdded((prev) => [
        ...prev,
        {
          categoryId: nextId,
          parentCategoryId: parentIdNum,
          categoryName: trimmed,
          description: description.trim() || null,
          isActive: true,
          level: parentIdNum ? 2 : 1,
        },
      ]);
      toast.info(
        `Đã thêm danh mục "${trimmed}" trên giao diện (chờ BE bổ sung POST /api/v1/admin/categories).`
      );
    }

    setModalOpen(false);
  };

  const handleToggleActive = (row: FlatCategoryRow) => {
    const nextActive = !row.isActive;
    setLocalEdits((prev) => ({
      ...prev,
      [row.categoryId]: {
        ...(prev[row.categoryId] ?? {}),
        isActive: nextActive,
      },
    }));
    toast.info(
      nextActive
        ? `Đã bật hiển thị danh mục "${row.categoryName}" (xem trước cục bộ).`
        : `Đã tạm ẩn danh mục "${row.categoryName}" (xem trước cục bộ).`
    );
  };

  return (
    <section>
      <PageHeader
        title="Quản lý danh mục (A8)"
        subtitle="Cây danh mục sản phẩm đọc trực tiếp từ API thật GET /api/v1/categories (bảng Categories: CategoryId, ParentCategoryId, CategoryName, Description, IsActive)."
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            disabled={categoriesQuery.isLoading || categoriesQuery.isError}
            onClick={openCreateModal}
          >
            Thêm danh mục
          </Button>
        }
      />

      {categoriesQuery.isLoading ? (
        <div className="ew-card" style={{ padding: "24px" }}>
          <Skeleton lines={6} height={20} gap={14} />
        </div>
      ) : categoriesQuery.isError ? (
        <ErrorState
          title="Không thể tải cây danh mục từ API"
          message={getErrorMessage(categoriesQuery.error)}
          onRetry={() => void categoriesQuery.refetch()}
        />
      ) : rows.length === 0 ? (
        <div className="ew-card">
          <EmptyState
            icon={<FolderTree size={28} />}
            title="Chưa có danh mục sản phẩm nào"
            description="Thêm danh mục gốc đầu tiên để phân loại sản phẩm trên sàn."
            action={
              <Button variant="primary" onClick={openCreateModal}>
                Thêm danh mục
              </Button>
            }
          />
        </div>
      ) : (
        <div className="ew-card">
          <div className="ew-table-scroll">
            <table className="ew-table">
              <thead>
                <tr>
                  <th>Cây danh mục (CategoryName)</th>
                  <th>Mã ID</th>
                  <th>Mô tả (Description)</th>
                  <th>Trạng thái (IsActive)</th>
                  <th className="ew-table__cell--right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((cat) => (
                  <tr key={cat.categoryId}>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          paddingLeft: cat.level === 2 ? "24px" : cat.level >= 3 ? "44px" : "0",
                        }}
                      >
                        {cat.level === 1 ? (
                          <FolderTree size={16} color="var(--color-primary)" aria-hidden="true" />
                        ) : (
                          <ChevronRight size={14} color="var(--color-muted)" aria-hidden="true" />
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--color-dark)" }}>
                            {cat.categoryName}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
                            Cấp {cat.level}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="ks-tabular">#{cat.categoryId}</td>
                    <td style={{ color: "var(--color-text)", maxWidth: "360px" }}>
                      {cat.description || "—"}
                    </td>
                    <td>
                      <StatusBadge
                        status={cat.isActive ? "Active" : "Inactive"}
                        labelOverride={cat.isActive ? "Đang hiển thị" : "Tạm ẩn"}
                      />
                    </td>
                    <td className="ew-table__cell--right">
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Pencil size={13} />}
                          onClick={() => openEditModal(cat)}
                        >
                          Sửa
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Power size={13} />}
                          onClick={() => handleToggleActive(cat)}
                        >
                          {cat.isActive ? "Ẩn" : "Hiện"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRow ? `Sửa danh mục #${editingRow.categoryId}` : "Thêm danh mục mới"}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Lưu danh mục
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <FormField label="Tên danh mục (CategoryName)" required>
            <Input
              placeholder="VD: Thiết bị thông minh"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
          </FormField>

          <FormField label="Danh mục cha (ParentCategoryId)">
            <Select
              value={parentCategoryId}
              options={rootOptions}
              onChange={(e) => setParentCategoryId(e.target.value)}
            />
          </FormField>

          <FormField label="Mô tả (Description)">
            <Textarea
              rows={3}
              placeholder="Mô tả ngắn về nhóm ngành hàng..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>

          {formError && <p className="ew-field__error">{formError}</p>}
        </form>
      </Modal>
    </section>
  );
};
