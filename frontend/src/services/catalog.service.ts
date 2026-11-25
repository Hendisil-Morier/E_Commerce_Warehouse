import { API_ENDPOINTS } from "@/constants/endpoints";
import axiosClient from "@/lib/axios";
import type { PagedResult } from "@/types/api";
import type {
  AdminProductDetailDto,
  AdminProductListItemDto,
  AdminProductQuery,
  CategoryTreeDto,
  CreateProductRequest,
  CreateShopRequest,
  ImageUploadResponseDto,
  ProductVariantDto,
  PublicProductDetailDto,
  PublicProductListItemDto,
  PublicProductQuery,
  PublicShopDto,
  RejectProductRequest,
  SellerProductDetailDto,
  SellerProductListItemDto,
  SellerProductQuery,
  ShopDto,
  UpdateProductRequest,
  UpdateShopRequest,
  UpsertVariantRequest,
} from "@/types/catalog";

function cleanParams<T extends object>(params?: T): Record<string, unknown> {
  if (!params) return {};
  return Object.fromEntries(
    Object.entries(params as Record<string, unknown>).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
}

/**
 * Hỗ trợ giải nén dữ liệu an toàn từ cả DTO gốc (chuẩn các controller mới)
 * lẫn wrapper `{ success, data }` nếu có.
 */
function unwrapData<T>(payload: T | { data: T }): T {
  if (
    payload !== null &&
    typeof payload === "object" &&
    "data" in payload &&
    "success" in payload
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export const catalogService = {
  async getCategories(): Promise<CategoryTreeDto[]> {
    const response = await axiosClient.get<CategoryTreeDto[]>(
      API_ENDPOINTS.CATEGORIES.BASE
    );
    return unwrapData(response.data);
  },

  async getPublicProducts(
    query: PublicProductQuery
  ): Promise<PagedResult<PublicProductListItemDto>> {
    const response = await axiosClient.get<PagedResult<PublicProductListItemDto>>(
      API_ENDPOINTS.PRODUCTS.BASE,
      { params: cleanParams(query) }
    );
    return unwrapData(response.data);
  },

  async getPublicProductDetail(productId: number): Promise<PublicProductDetailDto> {
    const response = await axiosClient.get<PublicProductDetailDto>(
      API_ENDPOINTS.PRODUCTS.BY_ID(productId)
    );
    return unwrapData(response.data);
  },

  async getPublicShopDetail(shopId: number): Promise<PublicShopDto> {
    const response = await axiosClient.get<PublicShopDto>(
      API_ENDPOINTS.SHOPS.BY_ID(shopId)
    );
    return unwrapData(response.data);
  },

  async getSellerShops(isActive?: boolean): Promise<ShopDto[]> {
    const response = await axiosClient.get<ShopDto[]>(
      API_ENDPOINTS.SELLER_SHOPS.BASE,
      { params: isActive === undefined ? undefined : { isActive } }
    );
    return unwrapData(response.data);
  },

  async createSellerShop(payload: CreateShopRequest): Promise<ShopDto> {
    const response = await axiosClient.post<ShopDto>(
      API_ENDPOINTS.SELLER_SHOPS.BASE,
      payload
    );
    return unwrapData(response.data);
  },

  async updateSellerShop(shopId: number, payload: UpdateShopRequest): Promise<ShopDto> {
    const response = await axiosClient.put<ShopDto>(
      API_ENDPOINTS.SELLER_SHOPS.BY_ID(shopId),
      payload
    );
    return unwrapData(response.data);
  },

  async uploadSellerImage(file: File): Promise<ImageUploadResponseDto> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosClient.post<ImageUploadResponseDto>(
      API_ENDPOINTS.SELLER_UPLOADS.IMAGES,
      formData,
      {
        headers: {
          "Content-Type": undefined,
        },
      }
    );
    return unwrapData(response.data);
  },

  async getSellerProducts(
    query: SellerProductQuery
  ): Promise<PagedResult<SellerProductListItemDto>> {
    const response = await axiosClient.get<PagedResult<SellerProductListItemDto>>(
      API_ENDPOINTS.SELLER_PRODUCTS.BASE,
      {
        params: cleanParams(query),
      }
    );
    return unwrapData(response.data);
  },

  async getSellerProductDetail(productId: number): Promise<SellerProductDetailDto> {
    const response = await axiosClient.get<SellerProductDetailDto>(
      API_ENDPOINTS.SELLER_PRODUCTS.BY_ID(productId)
    );
    return unwrapData(response.data);
  },

  async createSellerProduct(
    payload: CreateProductRequest
  ): Promise<SellerProductDetailDto> {
    const response = await axiosClient.post<SellerProductDetailDto>(
      API_ENDPOINTS.SELLER_PRODUCTS.BASE,
      payload
    );
    return unwrapData(response.data);
  },

  async updateSellerProduct(
    productId: number,
    payload: UpdateProductRequest
  ): Promise<SellerProductDetailDto> {
    const response = await axiosClient.put<SellerProductDetailDto>(
      API_ENDPOINTS.SELLER_PRODUCTS.BY_ID(productId),
      payload
    );
    return unwrapData(response.data);
  },

  async submitSellerProduct(productId: number): Promise<SellerProductDetailDto> {
    const response = await axiosClient.post<SellerProductDetailDto>(
      API_ENDPOINTS.SELLER_PRODUCTS.SUBMIT(productId)
    );
    return unwrapData(response.data);
  },

  async createProductVariant(
    productId: number,
    payload: UpsertVariantRequest
  ): Promise<ProductVariantDto> {
    const response = await axiosClient.post<ProductVariantDto>(
      API_ENDPOINTS.SELLER_PRODUCTS.VARIANTS(productId),
      payload
    );
    return unwrapData(response.data);
  },

  async updateProductVariant(
    variantId: number,
    payload: UpsertVariantRequest
  ): Promise<ProductVariantDto> {
    const response = await axiosClient.put<ProductVariantDto>(
      API_ENDPOINTS.SELLER_VARIANTS.BY_ID(variantId),
      payload
    );
    return unwrapData(response.data);
  },

  async getAdminProducts(
    query: AdminProductQuery
  ): Promise<PagedResult<AdminProductListItemDto>> {
    const response = await axiosClient.get<PagedResult<AdminProductListItemDto>>(
      API_ENDPOINTS.ADMIN_PRODUCTS.BASE,
      {
        params: cleanParams(query),
      }
    );
    return unwrapData(response.data);
  },

  async getAdminProductDetail(productId: number): Promise<AdminProductDetailDto> {
    const response = await axiosClient.get<AdminProductDetailDto>(
      API_ENDPOINTS.ADMIN_PRODUCTS.BY_ID(productId)
    );
    return unwrapData(response.data);
  },

  async approveAdminProduct(productId: number): Promise<AdminProductDetailDto> {
    const response = await axiosClient.post<AdminProductDetailDto>(
      API_ENDPOINTS.ADMIN_PRODUCTS.APPROVE(productId)
    );
    return unwrapData(response.data);
  },

  async rejectAdminProduct(
    productId: number,
    payload: RejectProductRequest
  ): Promise<AdminProductDetailDto> {
    const response = await axiosClient.post<AdminProductDetailDto>(
      API_ENDPOINTS.ADMIN_PRODUCTS.REJECT(productId)
    , payload);
    return unwrapData(response.data);
  },
};
