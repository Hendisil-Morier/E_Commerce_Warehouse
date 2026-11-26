import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userProfileService } from "@/services/userProfile.service";
import type {
  ChangePasswordRequest,
  UpdateProfileRequest,
} from "@/types/userProfile";

export const USER_PROFILE_QUERY_KEYS = {
  me: ["user", "me"] as const,
};

export function useMyProfile() {
  return useQuery({
    queryKey: USER_PROFILE_QUERY_KEYS.me,
    queryFn: () => userProfileService.getMyProfile(),
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) =>
      userProfileService.updateMyProfile(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(USER_PROFILE_QUERY_KEYS.me, updated);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordRequest) =>
      userProfileService.changePassword(payload),
  });
}
