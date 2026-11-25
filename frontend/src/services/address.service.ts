import { API_ENDPOINTS } from "@/constants/endpoints";
import axiosClient from "@/lib/axios";
import type { CreateAddressRequest, UserAddressDto } from "@/types/address";

export const addressService = {
  async getMyAddresses(): Promise<UserAddressDto[]> {
    const response = await axiosClient.get<UserAddressDto[]>(
      API_ENDPOINTS.USER_ADDRESSES.BASE
    );
    return response.data;
  },

  async createAddress(payload: CreateAddressRequest): Promise<UserAddressDto> {
    const response = await axiosClient.post<UserAddressDto>(
      API_ENDPOINTS.USER_ADDRESSES.BASE,
      payload
    );
    return response.data;
  },

  async deleteAddress(addressId: number): Promise<void> {
    await axiosClient.delete(API_ENDPOINTS.USER_ADDRESSES.BY_ID(addressId));
  },

  async setDefaultAddress(addressId: number): Promise<UserAddressDto> {
    const response = await axiosClient.patch<UserAddressDto>(
      API_ENDPOINTS.USER_ADDRESSES.SET_DEFAULT(addressId)
    );
    return response.data;
  },
};
