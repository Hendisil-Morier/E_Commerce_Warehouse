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

function extractData<T>(data: T | ApiResponse<T>): T {
  if (data !== null && typeof data === "object" && "data" in data) {
    const wrapped = (data as ApiResponse<T>).data;
    if (wrapped !== undefined) {
      return wrapped;
    }
  }
  return data as T;
}

export const catalogService = {
  async getCategories(): Promise<CategoryTreeDto[]> {
    const response = await axiosClient.get<CategoryTreeDto[] | ApiResponse<CategoryTreeDto[]>>(
      API_ENDPOINTS.CATEGORIES.BASE
    );
    return extractData(response.data);
  },

  async getSellerShops(isActive?: boolean): Promise<ShopDto[]> {
    const response = await axiosClient.get<ShopDto[] | ApiResponse<ShopDto[]>>(
      API_ENDPOINTS.SELLER_SHOPS.BASE,
      { params: isActive === undefined ? undefined : { isActive } }
    );
    return extractData(response.data);
  },

  async createSellerShop(payload: CreateShopRequest): Promise<ShopDto> {
    const response = await axiosClient.post<ShopDto | ApiResponse<ShopDto>>(
      API_ENDPOINTS.SELLER_SHOPS.BASE,
      payload
    );
    return extractData(response.data);
  },

  async updateSellerShop(shopId: number, payload: UpdateShopRequest): Promise<ShopDto> {
    const response = await axiosClient.put<ShopDto | ApiResponse<ShopDto>>(
      API_ENDPOINTS.SELLER_SHOPS.BY_ID(shopId),
      payload
    );
    return extractData(response.data);
  },

  async uploadSellerImage(file: File): Promise<ImageUploadResponseDto> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosClient.post<ImageUploadResponseDto | ApiResponse<ImageUploadResponseDto>>(
      API_ENDPOINTS.SELLER_UPLOADS.IMAGES,
      formData,
      {
        headers: {
          "Content-Type": undefined,
        },
      }
    );
    return extractData(response.data);
  },

  async getSellerProducts(
    query: SellerProductQuery
  ): Promise<PagedResult<SellerProductListItemDto>> {
    const response = await axiosClient.get<
      PagedResult<SellerProductListItemDto> | ApiResponse<PagedResult<SellerProductListItemDto>>
    >(API_ENDPOINTS.SELLER_PRODUCTS.BASE, {
      params: cleanParams(query),
    });
    return extractData(response.data);
  },

  async getSellerProductDetail(productId: number): Promise<SellerProductDetailDto> {
    const response = await axiosClient.get<SellerProductDetailDto | ApiResponse<SellerProductDetailDto>>(
      API_ENDPOINTS.SELLER_PRODUCTS.BY_ID(productId)
    );
    return extractData(response.data);
  },

  async createSellerProduct(
    payload: CreateProductRequest
  ): Promise<SellerProductDetailDto> {
    const response = await axiosClient.post<SellerProductDetailDto | ApiResponse<SellerProductDetailDto>>(
      API_ENDPOINTS.SELLER_PRODUCTS.BASE,
      payload
    );
    return extractData(response.data);
  },

  async updateSellerProduct(
    productId: number,
    payload: UpdateProductRequest
  ): Promise<SellerProductDetailDto> {
    const response = await axiosClient.put<SellerProductDetailDto | ApiResponse<SellerProductDetailDto>>(
      API_ENDPOINTS.SELLER_PRODUCTS.BY_ID(productId),
      payload
    );
    return extractData(response.data);
  },

  async submitSellerProduct(productId: number): Promise<SellerProductDetailDto> {
    const response = await axiosClient.post<SellerProductDetailDto | ApiResponse<SellerProductDetailDto>>(
      API_ENDPOINTS.SELLER_PRODUCTS.SUBMIT(productId)
    );
    return extractData(response.data);
  },

  async createProductVariant(
    productId: number,
    payload: UpsertVariantRequest
  ): Promise<ProductVariantDto> {
    const response = await axiosClient.post<ProductVariantDto | ApiResponse<ProductVariantDto>>(
      API_ENDPOINTS.SELLER_PRODUCTS.VARIANTS(productId),
      payload
    );
    return extractData(response.data);
  },

  async updateProductVariant(
    variantId: number,
    payload: UpsertVariantRequest
  ): Promise<ProductVariantDto> {
    const response = await axiosClient.put<ProductVariantDto | ApiResponse<ProductVariantDto>>(
      API_ENDPOINTS.SELLER_VARIANTS.BY_ID(variantId),
      payload
    );
    return extractData(response.data);
  },

  async getAdminProducts(
    query: AdminProductQuery
  ): Promise<PagedResult<AdminProductListItemDto>> {
    const response = await axiosClient.get<
      PagedResult<AdminProductListItemDto> | ApiResponse<PagedResult<AdminProductListItemDto>>
    >(API_ENDPOINTS.ADMIN_PRODUCTS.BASE, {
      params: cleanParams(query),
    });
    return extractData(response.data);
  },

  async getAdminProductDetail(productId: number): Promise<AdminProductDetailDto> {
    const response = await axiosClient.get<AdminProductDetailDto | ApiResponse<AdminProductDetailDto>>(
      API_ENDPOINTS.ADMIN_PRODUCTS.BY_ID(productId)
    );
    return extractData(response.data);
  },

  async approveAdminProduct(productId: number): Promise<AdminProductDetailDto> {
    const response = await axiosClient.post<AdminProductDetailDto | ApiResponse<AdminProductDetailDto>>(
      API_ENDPOINTS.ADMIN_PRODUCTS.APPROVE(productId)
    );
    return extractData(response.data);
  },

  async rejectAdminProduct(
    productId: number,
    payload: RejectProductRequest
  ): Promise<AdminProductDetailDto> {
    const response = await axiosClient.post<AdminProductDetailDto | ApiResponse<AdminProductDetailDto>>(
      API_ENDPOINTS.ADMIN_PRODUCTS.REJECT(productId),
      payload
    );
    return extractData(response.data);
  },

  async getPublicProducts(
    query?: PublicProductQuery
  ): Promise<PagedResult<PublicProductListItemDto>> {
    const response = await axiosClient.get<
      PagedResult<PublicProductListItemDto> | ApiResponse<PagedResult<PublicProductListItemDto>>
    >(API_ENDPOINTS.PRODUCTS.BASE, {
      params: cleanParams(query),
    });
    return extractData(response.data);
  },

  async getPublicProductDetail(productId: number): Promise<PublicProductDetailDto> {
    const response = await axiosClient.get<PublicProductDetailDto | ApiResponse<PublicProductDetailDto>>(
      API_ENDPOINTS.PRODUCTS.BY_ID(productId)
    );
    return extractData(response.data);
  },

  async getPublicShopById(shopId: number): Promise<PublicShopDto> {
    const response = await axiosClient.get<PublicShopDto | ApiResponse<PublicShopDto>>(
      API_ENDPOINTS.SHOPS.BY_ID(shopId)
    );
    return extractData(response.data);
  },
};

