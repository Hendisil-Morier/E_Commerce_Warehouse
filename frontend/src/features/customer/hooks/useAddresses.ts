import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addressService } from "@/services/address.service";
import type { CreateAddressRequest } from "@/types/address";

export const ADDRESS_QUERY_KEYS = {
  myAddresses: ["user", "addresses"] as const,
};

export function useMyAddresses() {
  return useQuery({
    queryKey: ADDRESS_QUERY_KEYS.myAddresses,
    queryFn: () => addressService.getMyAddresses(),
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAddressRequest) =>
      addressService.createAddress(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ADDRESS_QUERY_KEYS.myAddresses,
      });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: number) => addressService.deleteAddress(addressId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ADDRESS_QUERY_KEYS.myAddresses,
      });
    },
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: number) => addressService.setDefaultAddress(addressId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ADDRESS_QUERY_KEYS.myAddresses,
      });
    },
  });
}
