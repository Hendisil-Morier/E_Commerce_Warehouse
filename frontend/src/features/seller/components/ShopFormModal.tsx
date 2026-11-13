import React, { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Store, Trash2, Upload } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import {
  useCreateShopMutation,
  useUpdateShopMutation,
  useUploadSellerImageMutation,
} from "@/features/seller/hooks/useSellerCatalog";
import type { ShopDto } from "@/types/catalog";
import { isSafeImageUrlInput, validateCatalogImageFile } from "@/utils/catalogHelpers";
import { getFieldErrors } from "@/utils/errorHandler";
import { resolveAssetUrl } from "@/utils/formatters";

const shopSchema = z.object({
  shopName: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên shop.")
    .max(200, "Tên shop không được vượt quá 200 ký tự."),
  description: z
    .string()
    .max(2000, "Mô tả shop không được vượt quá 2000 ký tự.")
    .optional(),
  logoUrl: z
    .string()
    .trim()
    .max(500, "URL logo không được vượt quá 500 ký tự.")
    .refine(
      (val) => val === "" || isSafeImageUrlInput(val),
      "URL logo phải bắt đầu bằng /uploads/ hoặc http(s)://"
    )
    .optional(),
  isActive: z.boolean(),
});

type ShopFormValues = z.infer<typeof shopSchema>;

export interface ShopFormModalProps {
  open: boolean;
  editingShop: ShopDto | null;
  onClose: () => void;
}

export const ShopFormModal: React.FC<ShopFormModalProps> = ({
  open,
  editingShop,
  onClose,
}) => {
  const isEdit = editingShop !== null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const createShop = useCreateShopMutation();
  const updateShop = useUpdateShopMutation();
  const uploadImage = useUploadSellerImageMutation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    control,
    formState: { errors },
  } = useForm<ShopFormValues>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      shopName: "",
      description: "",
      logoUrl: "",
      isActive: true,
    },
  });

  const watchedLogoUrl = useWatch({ control, name: "logoUrl" }) ?? "";

  useEffect(() => {
    if (!open) return;
    setUploadError(null);
    reset({
      shopName: editingShop?.shopName ?? "",
      description: editingShop?.description ?? "",
      logoUrl: editingShop?.logoUrl ?? "",
      isActive: editingShop?.isActive ?? true,
    });
  }, [editingShop, open, reset]);

  const isBusy =
    createShop.isPending || updateShop.isPending || uploadImage.isPending;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateCatalogImageFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploadError(null);
    try {
      const uploaded = await uploadImage.mutateAsync(file);
      setValue("logoUrl", uploaded.url, { shouldValidate: true, shouldDirty: true });
    } catch {
      // Lỗi đã được toast từ mutation; giữ nguyên form để người dùng thử lại
    }
  };

  const applyBackendFieldErrors = (error: unknown) => {
    const fieldErrors = getFieldErrors(error);
    if (fieldErrors.shopName?.[0]) {
      setError("shopName", { message: fieldErrors.shopName[0] });
    }
    if (fieldErrors.description?.[0]) {
      setError("description", { message: fieldErrors.description[0] });
    }
    if (fieldErrors.logoUrl?.[0]) {
      setError("logoUrl", { message: fieldErrors.logoUrl[0] });
    }
  };

  const onSubmit = async (values: ShopFormValues) => {
    const normalizedDescription = values.description?.trim() || null;
    const normalizedLogo = values.logoUrl?.trim() || null;

    try {
      if (isEdit && editingShop) {
        await updateShop.mutateAsync({
          shopId: editingShop.shopId,
          payload: {
            shopName: values.shopName.trim(),
            description: normalizedDescription,
            logoUrl: normalizedLogo,
            isActive: values.isActive,
          },
        });
      } else {
        await createShop.mutateAsync({
          shopName: values.shopName.trim(),
          description: normalizedDescription,
          logoUrl: normalizedLogo,
        });
      }
      onClose();
    } catch (error) {
      applyBackendFieldErrors(error);
    }
  };

  const resolvedPreview = resolveAssetUrl(watchedLogoUrl);

  return (
    <Modal
      open={open}
      onClose={isBusy ? () => undefined : onClose}
      title={isEdit ? `Chỉnh sửa shop #${editingShop?.shopId}` : "Tạo gian hàng (Shop) mới"}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isBusy}>
            Hủy
          </Button>
          <Button
            type="submit"
            form="seller-shop-form"
            loading={createShop.isPending || updateShop.isPending}
            disabled={uploadImage.isPending}
          >
            {isEdit ? "Lưu thay đổi" : "Tạo shop"}
          </Button>
        </>
      }
    >
      <form
        id="seller-shop-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        <FormField
          label="Tên gian hàng"
          htmlFor="shop-name-input"
          required
          error={errors.shopName?.message}
        >
          <Input
            id="shop-name-input"
            placeholder="Ví dụ: TechZone Official"
            hasError={Boolean(errors.shopName)}
            disabled={isBusy}
            {...register("shopName")}
          />
        </FormField>

        <FormField
          label="Mô tả gian hàng"
          htmlFor="shop-description-input"
          error={errors.description?.message}
        >
          <Textarea
            id="shop-description-input"
            placeholder="Giới thiệu ngắn về ngành hàng, chính sách bảo hành hoặc thời gian xử lý đơn..."
            hasError={Boolean(errors.description)}
            disabled={isBusy}
            {...register("description")}
          />
        </FormField>

        <FormField
          label="Logo gian hàng"
          htmlFor="shop-logo-url-input"
          error={uploadError ?? errors.logoUrl?.message}
          hint="Tải ảnh JPG/PNG/WEBP tối đa 5 MB hoặc dán trực tiếp đường dẫn ảnh."
        >
          <div className="ew-logo-upload-row">
            <div className="ew-logo-preview">
              {resolvedPreview ? (
                <img src={resolvedPreview} alt="Xem trước logo shop" />
              ) : (
                <Store size={24} aria-hidden="true" />
              )}
            </div>

            <div className="ew-logo-upload-controls">
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Upload size={15} />}
                  loading={uploadImage.isPending}
                  disabled={createShop.isPending || updateShop.isPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Tải ảnh từ máy
                </Button>

                {watchedLogoUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Trash2 size={15} />}
                    disabled={isBusy}
                    onClick={() => {
                      setUploadError(null);
                      setValue("logoUrl", "", { shouldDirty: true, shouldValidate: true });
                    }}
                  >
                    Xóa ảnh
                  </Button>
                )}
              </div>

              <Input
                id="shop-logo-url-input"
                placeholder="Hoặc dán URL logo (https://... hoặc /uploads/...)"
                hasError={Boolean(errors.logoUrl || uploadError)}
                disabled={isBusy}
                {...register("logoUrl")}
              />
            </div>
          </div>
        </FormField>

        {isEdit && (
          <label className="ew-switch-row">
            <input type="checkbox" disabled={isBusy} {...register("isActive")} />
            <div>
              <div style={{ fontWeight: 600 }}>Gian hàng đang hoạt động</div>
              <div style={{ fontSize: "0.84rem", color: "var(--color-muted)" }}>
                Tắt tùy chọn này nếu bạn muốn tạm ẩn gian hàng khỏi sàn.
              </div>
            </div>
          </label>
        )}
      </form>
    </Modal>
  );
};

