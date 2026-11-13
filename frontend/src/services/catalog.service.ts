import { API_ENDPOINTS } from "@/constants/endpoints";
import axiosClient from "@/lib/axios";
import type { ApiResponse, PagedResult } from "@/types/api";
import type {
  AdminProductDetailDto,
  AdminProductListItemDto,
  AdminProductQuery,
  CategoryTreeDto,
  CreateProductRequest,
  CreateShopRequest,
  ImageUploadResponseDto,
  ProductVariantDto,
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

export const catalogService = {
  async getCategories(): Promise<CategoryTreeDto[]> {
    const response = await axiosClient.get<ApiResponse<CategoryTreeDto[]>>(
      API_ENDPOINTS.CATEGORIES.BASE
    );
    return response.data.data;
  },

  async getSellerShops(isActive?: boolean): Promise<ShopDto[]> {
    const response = await axiosClient.get<ApiResponse<ShopDto[]>>(
      API_ENDPOINTS.SELLER_SHOPS.BASE,
      { params: isActive === undefined ? undefined : { isActive } }
    );
    return response.data.data;
  },

  async createSellerShop(payload: CreateShopRequest): Promise<ShopDto> {
    const response = await axiosClient.post<ApiResponse<ShopDto>>(
      API_ENDPOINTS.SELLER_SHOPS.BASE,
      payload
    );
    return response.data.data;
  },

  async updateSellerShop(shopId: number, payload: UpdateShopRequest): Promise<ShopDto> {
    const response = await axiosClient.put<ApiResponse<ShopDto>>(
      API_ENDPOINTS.SELLER_SHOPS.BY_ID(shopId),
      payload
    );
    return response.data.data;
  },

  async uploadSellerImage(file: File): Promise<ImageUploadResponseDto> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosClient.post<ApiResponse<ImageUploadResponseDto>>(
      API_ENDPOINTS.SELLER_UPLOADS.IMAGES,
      formData,
      {
        headers: {
          "Content-Type": undefined,
        },
      }
    );
    return response.data.data;
  },

  async getSellerProducts(
    query: SellerProductQuery
  ): Promise<PagedResult<SellerProductListItemDto>> {
    const response = await axiosClient.get<
      ApiResponse<PagedResult<SellerProductListItemDto>>
    >(API_ENDPOINTS.SELLER_PRODUCTS.BASE, {
      params: cleanParams(query),
    });
    return response.data.data;
  },

  async getSellerProductDetail(productId: number): Promise<SellerProductDetailDto> {
    const response = await axiosClient.get<ApiResponse<SellerProductDetailDto>>(
      API_ENDPOINTS.SELLER_PRODUCTS.BY_ID(productId)
    );
    return response.data.data;
  },

  async createSellerProduct(
    payload: CreateProductRequest
  ): Promise<SellerProductDetailDto> {
    const response = await axiosClient.post<ApiResponse<SellerProductDetailDto>>(
      API_ENDPOINTS.SELLER_PRODUCTS.BASE,
      payload
    );
    return response.data.data;
  },

  async updateSellerProduct(
    productId: number,
    payload: UpdateProductRequest
  ): Promise<SellerProductDetailDto> {
    const response = await axiosClient.put<ApiResponse<SellerProductDetailDto>>(
      API_ENDPOINTS.SELLER_PRODUCTS.BY_ID(productId),
      payload
    );
    return response.data.data;
  },

  async submitSellerProduct(productId: number): Promise<SellerProductDetailDto> {
    const response = await axiosClient.post<ApiResponse<SellerProductDetailDto>>(
      API_ENDPOINTS.SELLER_PRODUCTS.SUBMIT(productId)
    );
    return response.data.data;
  },

  async createProductVariant(
    productId: number,
    payload: UpsertVariantRequest
  ): Promise<ProductVariantDto> {
    const response = await axiosClient.post<ApiResponse<ProductVariantDto>>(
      API_ENDPOINTS.SELLER_PRODUCTS.VARIANTS(productId),
      payload
    );
    return response.data.data;
  },

  async updateProductVariant(
    variantId: number,
    payload: UpsertVariantRequest
  ): Promise<ProductVariantDto> {
    const response = await axiosClient.put<ApiResponse<ProductVariantDto>>(
      API_ENDPOINTS.SELLER_VARIANTS.BY_ID(variantId),
      payload
    );
    return response.data.data;
  },

  async getAdminProducts(
    query: AdminProductQuery
  ): Promise<PagedResult<AdminProductListItemDto>> {
    const response = await axiosClient.get<
      ApiResponse<PagedResult<AdminProductListItemDto>>
    >(API_ENDPOINTS.ADMIN_PRODUCTS.BASE, {
      params: cleanParams(query),
    });
    return response.data.data;
  },

  async getAdminProductDetail(productId: number): Promise<AdminProductDetailDto> {
    const response = await axiosClient.get<ApiResponse<AdminProductDetailDto>>(
      API_ENDPOINTS.ADMIN_PRODUCTS.BY_ID(productId)
    );
    return response.data.data;
  },

  async approveAdminProduct(productId: number): Promise<AdminProductDetailDto> {
    const response = await axiosClient.post<ApiResponse<AdminProductDetailDto>>(
      API_ENDPOINTS.ADMIN_PRODUCTS.APPROVE(productId)
    );
    return response.data.data;
  },

  async rejectAdminProduct(
    productId: number,
    payload: RejectProductRequest
  ): Promise<AdminProductDetailDto> {
    const response = await axiosClient.post<ApiResponse<AdminProductDetailDto>>(
      API_ENDPOINTS.ADMIN_PRODUCTS.REJECT(productId),
      payload
    );
    return response.data.data;
  },
};

