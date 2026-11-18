import React, { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Send, Store } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Textarea } from "@/components/ui/Textarea";
import { ROUTES } from "@/constants/routes";
import { ProductImagesEditor } from "@/features/seller/components/ProductImagesEditor";
import { ProductVariantsEditor } from "@/features/seller/components/ProductVariantsEditor";
import {
  useCategoriesQuery,
  useCreateProductMutation,
  useSellerProductDetailQuery,
  useSellerShopsQuery,
  useSubmitProductMutation,
  useUpdateProductMutation,
} from "@/features/seller/hooks/useSellerCatalog";
import { useToast } from "@/hooks/useToast";
import type { ProductImageInput, UpsertVariantRequest } from "@/types/catalog";
import { flattenCategoryTree } from "@/utils/catalogHelpers";
import { getFieldErrors } from "@/utils/errorHandler";

const productSchema = z.object({
  shopId: z.string().min(1, "Vui lòng chọn gian hàng."),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục."),
  productName: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên sản phẩm.")
    .max(255, "Tên sản phẩm tối đa 255 ký tự."),
  description: z.string().max(5000, "Mô tả tối đa 5000 ký tự.").optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export const SellerProductFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const parsedId = id ? Number(id) : null;
  const isEdit = parsedId !== null && Number.isFinite(parsedId) && parsedId > 0;

  const shopsQuery = useSellerShopsQuery();
  const categoriesQuery = useCategoriesQuery();
  const detailQuery = useSellerProductDetailQuery(isEdit ? parsedId : null);

  const createProduct = useCreateProductMutation();
  const updateProduct = useUpdateProductMutation(parsedId ?? 0);
  const submitProduct = useSubmitProductMutation();

  const [images, setImages] = useState<ProductImageInput[]>([]);
  const [draftVariants, setDraftVariants] = useState<UpsertVariantRequest[]>([
    { sku: "", barcode: "", variantName: "", price: 0, weightGrams: null, isActive: true },
  ]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { shopId: "", categoryId: "", productName: "", description: "" },
  });

  const detail = detailQuery.data;
  const isLocked = isEdit && detail?.productStatus === "PendingReview";
  const canSubmit =
    !isEdit ||
    detail?.productStatus === "Draft" ||
    detail?.productStatus === "Rejected";

  const activeShops = useMemo(
    () => (shopsQuery.data ?? []).filter((s) => s.isActive),
    [shopsQuery.data]
  );

  const shopOptions = useMemo(() => {
    const list = shopsQuery.data ?? [];
    return list.map((s) => ({
      value: String(s.shopId),
      label: s.isActive ? s.shopName : `${s.shopName} (Đang ẩn)`,
    }));
  }, [shopsQuery.data]);

  const categoryOptions = useMemo(
    () => flattenCategoryTree(categoriesQuery.data ?? []),
    [categoriesQuery.data]
  );

  useEffect(() => {
    if (isEdit && detail) {
      reset({
        shopId: String(detail.shopId),
        categoryId: String(detail.categoryId),
        productName: detail.productName,
        description: detail.description ?? "",
      });
      setImages(
        detail.images.map((img) => ({
          imageUrl: img.imageUrl,
          isPrimary: img.isPrimary,
          displayOrder: img.displayOrder,
        }))
      );
    } else if (!isEdit && activeShops.length === 1) {
      reset({
        shopId: String(activeShops[0].shopId),
        categoryId: "",
        productName: "",
        description: "",
      });
    }
  }, [activeShops, detail, isEdit, reset]);

  const validateDraftVariantsForCreate = (): boolean => {
    const filled = draftVariants.filter(
      (v) => v.sku.trim() || v.variantName.trim() || v.price > 0
    );
    for (const v of filled) {
      if (!v.sku.trim() || !v.variantName.trim() || v.price <= 0) {
        toast.error(
          "Mỗi biến thể cần đủ SKU, tên biến thể và giá bán lớn hơn 0 (hoặc xóa dòng trống)."
        );
        return false;
      }
    }
    return true;
  };

  const applyFieldErrors = (error: unknown) => {
    const fe = getFieldErrors(error);
    if (fe.shopId?.[0]) setError("shopId", { message: fe.shopId[0] });
    if (fe.categoryId?.[0]) setError("categoryId", { message: fe.categoryId[0] });
    if (fe.productName?.[0]) setError("productName", { message: fe.productName[0] });
    if (fe.description?.[0]) setError("description", { message: fe.description[0] });
  };

  const handleSave = async (values: ProductFormValues, andSubmit: boolean) => {
    if (!isEdit && !validateDraftVariantsForCreate()) return;

    const cleanVariants = draftVariants
      .filter((v) => v.sku.trim() || v.variantName.trim() || v.price > 0)
      .map((v) => ({
        sku: v.sku.trim(),
        barcode: v.barcode?.trim() || null,
        variantName: v.variantName.trim(),
        price: Number(v.price),
        weightGrams: v.weightGrams ?? null,
        isActive: v.isActive,
      }));

    try {
      if (!isEdit) {
        const created = await createProduct.mutateAsync({
          shopId: Number(values.shopId),
          categoryId: Number(values.categoryId),
          productName: values.productName.trim(),
          description: values.description?.trim() || null,
          images,
          variants: cleanVariants,
        });
        if (andSubmit) {
          try {
            await submitProduct.mutateAsync(created.productId);
          } catch {
            // Đã tạo bản nháp thành công, chuyển qua trang sửa để seller bổ sung điều kiện gửi duyệt
          }
        }
        navigate(`/seller/products/${created.productId}/edit`, { replace: true });
        return;
      }

      if (parsedId) {
        if (!isLocked) {
          await updateProduct.mutateAsync({
            shopId: Number(values.shopId),
            categoryId: Number(values.categoryId),
            productName: values.productName.trim(),
            description: values.description?.trim() || null,
            images,
          });
        }
        if (andSubmit) {
          await submitProduct.mutateAsync(parsedId);
        }
      }
    } catch (error) {
      applyFieldErrors(error);
    }
  };

  const isMutating =
    createProduct.isPending || updateProduct.isPending || submitProduct.isPending;

  if (isEdit && detailQuery.isLoading) {
    return (
      <div className="ew-card" style={{ padding: "24px" }}>
        <Skeleton lines={8} height={24} gap={14} />
      </div>
    );
  }

  if (isEdit && detailQuery.isError) {
    return (
      <div className="ew-card" style={{ padding: "24px" }}>
        <ErrorState
          error={detailQuery.error}
          onRetry={() => void detailQuery.refetch()}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <Link to={ROUTES.SELLER_PRODUCTS} className="ew-back-link">
          <ArrowLeft size={16} /> Quay lại danh sách sản phẩm
        </Link>
      </div>

      <PageHeader
        title={isEdit ? detail?.productName ?? `Sản phẩm #${id}` : "Thêm sản phẩm mới"}
        subtitle={
          isEdit
            ? `Mã sản phẩm #${detail?.productId} · Quản lý ảnh và biến thể trực tiếp`
            : "Tạo bản nháp sản phẩm, tải ảnh và cấu hình biến thể SKU trước khi gửi duyệt."
        }
        badge={
          isEdit && detail ? (
            <StatusBadge status={detail.productStatus} domain="product" size="md" />
          ) : undefined
        }
        actions={
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {!isLocked && (
              <Button
                variant="secondary"
                leftIcon={<Save size={16} />}
                loading={createProduct.isPending || updateProduct.isPending}
                disabled={submitProduct.isPending}
                onClick={handleSubmit((v) => void handleSave(v, false))}
              >
                {isEdit ? "Lưu thông tin & ảnh" : "Lưu nháp"}
              </Button>
            )}

            {canSubmit && (
              <Button
                leftIcon={<Send size={16} />}
                loading={submitProduct.isPending}
                disabled={createProduct.isPending || updateProduct.isPending}
                onClick={handleSubmit((v) => void handleSave(v, true))}
              >
                {isEdit && !isDirty ? "Gửi duyệt" : "Lưu & Gửi duyệt"}
              </Button>
            )}
          </div>
        }
      />

      {!isEdit && !shopsQuery.isLoading && activeShops.length === 0 && (
        <div className="ew-banner ew-banner--warning">
          <Store size={18} style={{ flexShrink: 0 }} />
          <div>
            Bạn chưa có gian hàng nào đang hoạt động. Vui lòng{" "}
            <Link to={ROUTES.SELLER_SHOPS} style={{ fontWeight: 700, textDecoration: "underline" }}>
              tạo shop trước
            </Link>{" "}
            để gán cho sản phẩm.
          </div>
        </div>
      )}

      {isLocked && (
        <div className="ew-banner ew-banner--warning">
          Sản phẩm đang ở trạng thái <strong>Chờ duyệt</strong>. Bạn không thể chỉnh sửa cho đến khi Admin hoàn tất kiểm duyệt.
        </div>
      )}

      {detail?.productStatus === "Rejected" && detail.rejectReason && (
        <div className="ew-banner ew-banner--danger" role="alert">
          <div>
            <strong>Sản phẩm bị từ chối:</strong> {detail.rejectReason}
          </div>
        </div>
      )}

      <section className="ew-card" style={{ padding: "22px" }}>
        <h2 className="ew-section-heading">1. Thông tin chung</h2>
        <div className="ew-form-grid-2">
          <FormField
            label="Gian hàng (Shop)"
            htmlFor="product-shop"
            required
            error={errors.shopId?.message}
          >
            <Select
              id="product-shop"
              placeholder="-- Chọn gian hàng --"
              options={shopOptions}
              hasError={Boolean(errors.shopId)}
              disabled={isLocked || isMutating || shopsQuery.isLoading}
              {...register("shopId")}
            />
          </FormField>

          <FormField
            label="Danh mục"
            htmlFor="product-category"
            required
            error={errors.categoryId?.message}
          >
            <Select
              id="product-category"
              placeholder="-- Chọn danh mục --"
              options={categoryOptions}
              hasError={Boolean(errors.categoryId)}
              disabled={isLocked || isMutating || categoriesQuery.isLoading}
              {...register("categoryId")}
            />
          </FormField>
        </div>

        <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <FormField
            label="Tên sản phẩm"
            htmlFor="product-name"
            required
            error={errors.productName?.message}
          >
            <Input
              id="product-name"
              placeholder="Ví dụ: Bàn phím cơ không dây Keychron K2"
              hasError={Boolean(errors.productName)}
              disabled={isLocked || isMutating}
              {...register("productName")}
            />
          </FormField>

          <FormField
            label="Mô tả chi tiết"
            htmlFor="product-description"
            error={errors.description?.message}
          >
            <Textarea
              id="product-description"
              rows={4}
              placeholder="Thông số kỹ thuật, chất liệu, hướng dẫn bảo quản..."
              hasError={Boolean(errors.description)}
              disabled={isLocked || isMutating}
              {...register("description")}
            />
          </FormField>
        </div>
      </section>

      <section className="ew-card" style={{ padding: "22px" }}>
        <h2 className="ew-section-heading">2. Hình ảnh sản phẩm</h2>
        <ProductImagesEditor
          images={images}
          onChange={setImages}
          disabled={isLocked || isMutating}
        />
      </section>

      <section className="ew-card" style={{ padding: "22px" }}>
        <h2 className="ew-section-heading">3. Biến thể (SKU & Giá bán)</h2>
        {isEdit && detail ? (
          <ProductVariantsEditor
            mode="edit"
            productId={detail.productId}
            variants={detail.variants}
            disabled={isLocked || isMutating}
          />
        ) : (
          <ProductVariantsEditor
            mode="create"
            draftVariants={draftVariants}
            onDraftChange={setDraftVariants}
            disabled={isMutating}
          />
        )}
      </section>
    </div>
  );
};

