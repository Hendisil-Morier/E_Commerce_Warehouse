import React, { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Link2,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useUploadSellerImageMutation } from "@/features/seller/hooks/useSellerCatalog";
import type { ProductImageInput } from "@/types/catalog";
import { isSafeImageUrlInput, validateCatalogImageFile } from "@/utils/catalogHelpers";
import { resolveAssetUrl } from "@/utils/formatters";

export interface ProductImagesEditorProps {
  images: ProductImageInput[];
  onChange: (next: ProductImageInput[]) => void;
  disabled?: boolean;
}

function normalizeImageOrders(list: ProductImageInput[]): ProductImageInput[] {
  if (list.length === 0) return [];
  const hasPrimary = list.some((item) => item.isPrimary);
  return list.map((item, idx) => ({
    ...item,
    isPrimary: hasPrimary ? item.isPrimary : idx === 0,
    displayOrder: idx,
  }));
}

export const ProductImagesEditor: React.FC<ProductImagesEditorProps> = ({
  images,
  onChange,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadSellerImageMutation();
  const [urlInput, setUrlInput] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);

  const isBusy = disabled || uploadingCount > 0;

  const appendImageUrl = (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed) return;
    if (images.some((img) => img.imageUrl === trimmed)) {
      setLocalError("Ảnh này đã tồn tại trong danh sách.");
      return;
    }

    const next = normalizeImageOrders([
      ...images,
      {
        imageUrl: trimmed,
        isPrimary: images.length === 0,
        displayOrder: images.length,
      },
    ]);
    onChange(next);
  };

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setLocalError(null);
    const validFiles: File[] = [];
    for (const file of files) {
      const err = validateCatalogImageFile(file);
      if (err) {
        setLocalError(`${file.name}: ${err}`);
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) return;

    setUploadingCount(validFiles.length);
    const uploadedItems: ProductImageInput[] = [];

    for (const file of validFiles) {
      try {
        const res = await uploadMutation.mutateAsync(file);
        const alreadyExists =
          images.some((img) => img.imageUrl === res.url) ||
          uploadedItems.some((img) => img.imageUrl === res.url);
        if (!alreadyExists) {
          uploadedItems.push({
            imageUrl: res.url,
            isPrimary: images.length === 0 && uploadedItems.length === 0,
            displayOrder: images.length + uploadedItems.length,
          });
        }
      } catch {
        // Lỗi server đã hiển thị qua toast
      }
    }

    setUploadingCount(0);
    if (uploadedItems.length > 0) {
      onChange(normalizeImageOrders([...images, ...uploadedItems]));
    }
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setLocalError("Vui lòng nhập đường dẫn ảnh.");
      return;
    }
    if (!isSafeImageUrlInput(trimmed)) {
      setLocalError("Đường dẫn ảnh phải bắt đầu bằng /uploads/ hoặc http(s)://");
      return;
    }
    if (images.some((img) => img.imageUrl === trimmed)) {
      setLocalError("Đường dẫn ảnh này đã có trong sản phẩm.");
      return;
    }

    setLocalError(null);
    appendImageUrl(trimmed);
    setUrlInput("");
  };

  const handleSetPrimary = (index: number) => {
    onChange(
      images.map((img, idx) => ({
        ...img,
        isPrimary: idx === index,
      }))
    );
  };

  const handleMove = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;
    const copy = [...images];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    onChange(normalizeImageOrders(copy));
  };

  const handleRemove = (index: number) => {
    const copy = images.filter((_, idx) => idx !== index);
    onChange(normalizeImageOrders(copy));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div className="ew-image-upload-bar">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={handleFilesSelected}
          style={{ display: "none" }}
        />

        <Button
          variant="secondary"
          leftIcon={<Upload size={16} />}
          loading={uploadingCount > 0}
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploadingCount > 0 ? `Đang tải (${uploadingCount})...` : "Tải ảnh từ máy"}
        </Button>

        <div className="ew-image-url-adder">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Hoặc dán URL ảnh (https://... hoặc /uploads/...)"
            disabled={isBusy}
            leftAddon={<Link2 size={15} aria-hidden="true" />}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddUrl();
              }
            }}
          />
          <Button
            variant="secondary"
            leftIcon={<ImagePlus size={16} />}
            disabled={isBusy}
            onClick={handleAddUrl}
          >
            Thêm URL
          </Button>
        </div>
      </div>

      <p className="ew-field__hint">
        Hỗ trợ JPG, JPEG, PNG, WEBP tối đa 5 MB mỗi ảnh. Chọn 1 ảnh đại diện và sắp xếp thứ tự hiển thị.
      </p>

      {localError && (
        <div className="ew-banner ew-banner--danger" role="alert">
          {localError}
        </div>
      )}

      {images.length === 0 ? (
        <div className="ew-image-empty">
          Chưa có hình ảnh nào. Sản phẩm cần ít nhất 1 ảnh khi gửi duyệt.
        </div>
      ) : (
        <div className="ew-image-grid">
          {images.map((img, index) => (
            <div
              key={`${img.imageUrl}-${index}`}
              className={`ew-image-card ${img.isPrimary ? "ew-image-card--primary" : ""}`}
            >
              <div className="ew-image-card__preview">
                <img
                  src={resolveAssetUrl(img.imageUrl)}
                  alt={`Ảnh sản phẩm ${index + 1}`}
                />
                {img.isPrimary && (
                  <span className="ew-image-card__badge">Ảnh đại diện</span>
                )}
              </div>

              <div className="ew-image-card__meta">
                <span>Thứ tự #{index + 1}</span>
                <span className="ew-image-card__url" title={img.imageUrl}>
                  {img.imageUrl}
                </span>
              </div>

              <div className="ew-image-card__actions">
                <Button
                  size="sm"
                  variant={img.isPrimary ? "primary" : "ghost"}
                  disabled={isBusy || img.isPrimary}
                  leftIcon={<Star size={14} />}
                  onClick={() => handleSetPrimary(index)}
                  title="Đặt làm ảnh đại diện"
                >
                  {img.isPrimary ? "Chính" : "Đặt chính"}
                </Button>

                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    type="button"
                    className="ew-icon-btn"
                    disabled={isBusy || index === 0}
                    onClick={() => handleMove(index, -1)}
                    aria-label="Di chuyển ảnh lên trước"
                    title="Lên trước"
                  >
                    <ArrowLeft size={15} />
                  </button>
                  <button
                    type="button"
                    className="ew-icon-btn"
                    disabled={isBusy || index === images.length - 1}
                    onClick={() => handleMove(index, 1)}
                    aria-label="Di chuyển ảnh ra sau"
                    title="Ra sau"
                  >
                    <ArrowRight size={15} />
                  </button>
                  <button
                    type="button"
                    className="ew-icon-btn"
                    disabled={isBusy}
                    onClick={() => handleRemove(index)}
                    aria-label="Xóa ảnh"
                    title="Xóa ảnh"
                    style={{ color: "var(--color-danger)" }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

