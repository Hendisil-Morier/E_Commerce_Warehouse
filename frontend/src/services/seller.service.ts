import { API_ENDPOINTS } from "@/constants/endpoints";
import axiosClient from "@/lib/axios";
import type { PagedResult } from "@/types/api";
import type {
  AdminSellerListQuery,
  RegisterSellerRequest,
  RejectSellerRequest,
  SellerProfile,
  SuspendSellerRequest,
} from "@/types/seller";

export const sellerService = {
  async registerOrResubmit(payload: RegisterSellerRequest): Promise<SellerProfile> {
    const response = await axiosClient.post<SellerProfile>(
      API_ENDPOINTS.SELLERS.BASE,
      payload
    );
    return response.data;
  },

  async getMySeller(): Promise<SellerProfile> {
    const response = await axiosClient.get<SellerProfile>(API_ENDPOINTS.SELLERS.ME);
    return response.data;
  },

  async getAdminSellers(query: AdminSellerListQuery): Promise<PagedResult<SellerProfile>> {
    const params: Record<string, string | number> = {};
    if (query.status) params.status = query.status;
    if (query.search?.trim()) params.search = query.search.trim();
    if (query.page) params.page = query.page;
    if (query.pageSize) params.pageSize = query.pageSize;
    if (query.sort) params.sort = query.sort;

    const response = await axiosClient.get<PagedResult<SellerProfile>>(
      API_ENDPOINTS.ADMIN_SELLERS.BASE,
      { params }
    );
    return response.data;
  },

  async approveSeller(sellerId: number): Promise<SellerProfile> {
    const response = await axiosClient.post<SellerProfile>(
      API_ENDPOINTS.ADMIN_SELLERS.APPROVE(sellerId)
    );
    return response.data;
  },

  async rejectSeller(
    sellerId: number,
    payload: RejectSellerRequest
  ): Promise<SellerProfile> {
    const response = await axiosClient.post<SellerProfile>(
      API_ENDPOINTS.ADMIN_SELLERS.REJECT(sellerId),
      payload
    );
    return response.data;
  },

  async suspendSeller(
    sellerId: number,
    payload?: SuspendSellerRequest
  ): Promise<SellerProfile> {
    const response = await axiosClient.post<SellerProfile>(
      API_ENDPOINTS.ADMIN_SELLERS.SUSPEND(sellerId),
      payload ?? {}
    );
    return response.data;
  },
};

