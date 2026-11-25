import { API_ENDPOINTS } from "@/constants/endpoints";
import axiosClient from "@/lib/axios";
import type {
  AddCartItemRequest,
  CartDto,
  UpdateCartItemRequest,
} from "@/types/cart";

export const cartService = {
  async getMyCart(): Promise<CartDto> {
    const response = await axiosClient.get<CartDto>(API_ENDPOINTS.CART.BASE);
    return response.data;
  },

  async addItem(payload: AddCartItemRequest): Promise<CartDto> {
    const response = await axiosClient.post<CartDto>(
      API_ENDPOINTS.CART.ITEMS,
      payload
    );
    return response.data;
  },

  async updateItemQuantity(
    cartItemId: number,
    payload: UpdateCartItemRequest
  ): Promise<CartDto> {
    const response = await axiosClient.put<CartDto>(
      API_ENDPOINTS.CART.ITEM_BY_ID(cartItemId),
      payload
    );
    return response.data;
  },

  async removeItem(cartItemId: number): Promise<void> {
    await axiosClient.delete(API_ENDPOINTS.CART.ITEM_BY_ID(cartItemId));
  },
};
