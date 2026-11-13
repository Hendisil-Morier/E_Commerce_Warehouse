export type ProductStatus = "Draft" | "PendingReview" | "Active" | "Rejected" | "Inactive";

export interface CategoryTreeDto {
  categoryId: number;
  parentCategoryId: number | null;
  categoryName: string;
  description: string | null;
  isActive: boolean;
  children: CategoryTreeDto[];
}

export interface ShopDto {
  shopId: number;
  sellerId: number;
  shopName: string;
  description: string | null;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShopRequest {
  shopName: string;
  description?: string | null;
  logoUrl?: string | null;
}

export interface UpdateShopRequest {
  shopName: string;
  description?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
}

export interface ImageUploadResponseDto {
  url: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface ProductImageDto {
  imageId: number;
  productId: number;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface ProductImageInput {
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface ProductVariantDto {
  variantId: number;
  productId: number;
  sku: string;
  barcode: string | null;
  variantName: string;
  price: number;
  weightGrams: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertVariantRequest {
  sku: string;
  barcode?: string | null;
  variantName: string;
  price: number;
  weightGrams?: number | null;
  isActive: boolean;
}

export interface SellerProductListItemDto {
  productId: number;
  shopId: number;
  shopName: string;
  categoryId: number;
  categoryName: string;
  productName: string;
  productStatus: ProductStatus;
  rejectReason: string | null;
  thumbnailUrl: string | null;
  variantCount: number;
  minPrice: number | null;
  maxPrice: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SellerProductDetailDto {
  productId: number;
  shopId: number;
  shopName: string;
  categoryId: number;
  categoryName: string;
  productName: string;
  description: string | null;
  productStatus: ProductStatus;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
  images: ProductImageDto[];
  variants: ProductVariantDto[];
}

export interface SellerProductQuery {
  status?: ProductStatus | "";
  shopId?: number | "";
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}

export interface CreateProductRequest {
  shopId: number;
  categoryId: number;
  productName: string;
  description?: string | null;
  images?: ProductImageInput[];
  variants?: UpsertVariantRequest[];
}

export interface UpdateProductRequest {
  shopId: number;
  categoryId: number;
  productName: string;
  description?: string | null;
  images?: ProductImageInput[];
}

export interface AdminProductListItemDto {
  productId: number;
  productName: string;
  shopId: number;
  shopName: string;
  sellerId: number;
  sellerBusinessName: string;
  categoryId: number;
  categoryName: string;
  productStatus: ProductStatus;
  rejectReason: string | null;
  thumbnailUrl: string | null;
  variantCount: number;
  minPrice: number | null;
  maxPrice: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductShopSummaryDto {
  shopId: number;
  sellerId: number;
  shopName: string;
  sellerBusinessName: string;
  logoUrl: string | null;
  isActive: boolean;
}

export interface AdminProductDetailDto {
  productId: number;
  productName: string;
  description: string | null;
  productStatus: ProductStatus;
  rejectReason: string | null;
  categoryId: number;
  categoryName: string;
  shop: AdminProductShopSummaryDto;
  images: ProductImageDto[];
  variants: ProductVariantDto[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductQuery {
  status?: ProductStatus | "";
  shopId?: number | "";
  categoryId?: number | "";
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}

export interface RejectProductRequest {
  reason: string;
}

