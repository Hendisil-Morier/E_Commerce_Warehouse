import React from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ProductModerationAction } from "@/features/admin/components/AdminProductsTable";

export interface ProductModerationTarget {
  productId: number;
  productName: string;
  shopName: string;
  action: ProductModerationAction;
}

export interface ProductModerationConfirmDialogProps {
  target: ProductModerationTarget | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (reason?: string) => Promise<void>;
}

export const ProductModerationConfirmDialog: React.FC<
  ProductModerationConfirmDialogProps
> = ({ target, loading, onCancel, onConfirm }) => {
  if (!target) return null;

  const isReject = target.action === "reject";

  return (
    <ConfirmDialog
      open
      title={isReject ? "Từ chối sản phẩm" : "Duyệt sản phẩm lên sàn"}
      description={
        isReject
          ? `Nhập lý do từ chối sản phẩm "${target.productName}" của shop ${target.shopName} để người bán chỉnh sửa và gửi duyệt lại.`
          : `Xác nhận duyệt sản phẩm "${target.productName}" của shop ${target.shopName}? Sau khi duyệt, sản phẩm sẽ chuyển sang trạng thái Đang bán.`
      }
      variant={isReject ? "danger" : "primary"}
      confirmText={isReject ? "Xác nhận từ chối" : "Duyệt sản phẩm"}
      requireReason={isReject}
      reasonLabel="Lý do từ chối"
      reasonPlaceholder="Ví dụ: Ảnh sản phẩm mờ, thiếu thông số kích thước hoặc sai danh mục..."
      loading={loading}
      onClose={onCancel}
      onConfirm={onConfirm}
    />
  );
};

