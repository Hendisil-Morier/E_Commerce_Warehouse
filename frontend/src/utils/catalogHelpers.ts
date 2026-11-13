import type { CategoryTreeDto } from "@/types/catalog";
import type { SelectOption } from "@/types/common";
import { formatCurrency } from "@/utils/formatters";

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
export const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

export function validateCatalogImageFile(file: File): string | null {
  const lowerName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_IMAGE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  const hasValidMime =
    file.type === "" || ALLOWED_IMAGE_MIME_TYPES.has(file.type.toLowerCase());

  if (!hasValidExtension || !hasValidMime) {
    return "Định dạng ảnh không hợp lệ. Chỉ hỗ trợ JPG, JPEG, PNG hoặc WEBP.";
  }

  if (file.size <= 0) {
    return "Tệp ảnh rỗng, vui lòng chọn tệp hợp lệ.";
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const maxMb = Math.round(MAX_IMAGE_SIZE_BYTES / (1024 * 1024));
    return `Dung lượng ảnh vượt quá giới hạn ${maxMb} MB.`;
  }

  return null;
}

export function isSafeImageUrlInput(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/uploads/")) return true;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function flattenCategoryTree(
  tree: CategoryTreeDto[],
  parentPath = ""
): SelectOption[] {
  const options: SelectOption[] = [];

  for (const node of tree) {
    const label = parentPath ? `${parentPath} › ${node.categoryName}` : node.categoryName;
    options.push({
      value: String(node.categoryId),
      label: node.isActive ? label : `${label} (Tạm ẩn)`,
      disabled: !node.isActive,
    });

    if (node.children.length > 0) {
      options.push(...flattenCategoryTree(node.children, label));
    }
  }

  return options;
}

export function formatPriceRange(
  minPrice: number | null,
  maxPrice: number | null
): string {
  if (minPrice === null && maxPrice === null) {
    return "Chưa có giá";
  }

  if (minPrice !== null && maxPrice !== null && minPrice !== maxPrice) {
    return `${formatCurrency(minPrice)} – ${formatCurrency(maxPrice)}`;
  }

  return formatCurrency(minPrice ?? maxPrice ?? 0);
}

