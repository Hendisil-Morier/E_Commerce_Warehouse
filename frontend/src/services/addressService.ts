import axiosClient from "@/lib/axios";
import type {
  UserAddress,
  CreateAddressRequest,
  UpdateAddressRequest,
} from "@/types/user";

export const addressService = {
  async getMyAddresses(): Promise<UserAddress[]> {
    const response = await axiosClient.get<UserAddress[]>("/api/v1/users/me/addresses");
    return response.data;
  },

  async getAddressById(id: number): Promise<UserAddress> {
    const response = await axiosClient.get<UserAddress>(`/api/v1/users/me/addresses/${id}`);
    return response.data;
  },

  async createAddress(payload: CreateAddressRequest): Promise<UserAddress> {
    const response = await axiosClient.post<UserAddress>("/api/v1/users/me/addresses", payload);
    return response.data;
  },

  async updateAddress(id: number, payload: UpdateAddressRequest): Promise<UserAddress> {
    const response = await axiosClient.put<UserAddress>(`/api/v1/users/me/addresses/${id}`, payload);
    return response.data;
  },

  async deleteAddress(id: number): Promise<void> {
    await axiosClient.delete(`/api/v1/users/me/addresses/${id}`);
  },

  async setDefaultAddress(id: number): Promise<UserAddress> {
    const response = await axiosClient.patch<UserAddress>(`/api/v1/users/me/addresses/${id}/default`);
    return response.data;
  },
};
