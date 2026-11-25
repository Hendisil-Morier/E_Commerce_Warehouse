import { API_ENDPOINTS } from "@/constants/endpoints";
import axiosClient from "@/lib/axios";
import type {
  AddCartItemRequest,
  Cart,
  UpdateCartItemRequest,
} from "@/types/cart";

export const cartService = {
  async getMyCart(): Promise<Cart> {
    const response = await axiosClient.get<Cart>(API_ENDPOINTS.CART.BASE);
    return response.data;
  },

  async addItem(data: AddCartItemRequest): Promise<Cart> {
    const response = await axiosClient.post<Cart>(API_ENDPOINTS.CART.ITEMS, data);
    return response.data;
  },

  async updateItemQuantity(itemId: number, data: UpdateCartItemRequest): Promise<Cart> {
    const response = await axiosClient.put<Cart>(
      API_ENDPOINTS.CART.ITEM_BY_ID(itemId),
      data
    );
    return response.data;
  },

  async removeItem(itemId: number): Promise<void> {
    await axiosClient.delete(API_ENDPOINTS.CART.ITEM_BY_ID(itemId));
  },
};
