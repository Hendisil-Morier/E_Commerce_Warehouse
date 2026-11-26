export interface UserProfileDto {
  userId: number;
  username: string | null;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  roles: string[];
  createdAt: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
