export interface UserAddressDto {
  addressId: number;
  userId: number;
  recipientName: string;
  phoneNumber: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  fullAddress: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateAddressRequest {
  recipientName: string;
  phoneNumber: string;
  province: string;
  district: string;
  ward: string;
  streetAddress: string;
  isDefault: boolean;
}
