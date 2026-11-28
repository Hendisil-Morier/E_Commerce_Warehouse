import React, { useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";
import type { AuthResponse } from "@/types/auth";
import { getErrorMessage } from "@/utils/errorHandler";

interface GoogleSignInButtonProps {
  disabled?: boolean;
  onSuccess: (authData: AuthResponse) => void;
  onError: (message: string) => void;
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  disabled,
  onSuccess,
  onError,
}) => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const [submitting, setSubmitting] = useState(false);

  if (!googleClientId) {
    return null;
  }

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    const idToken = response.credential;
    if (!idToken) {
      onError("Không nhận được mã xác thực từ Google.");
      return;
    }

    try {
      setSubmitting(true);
      const authData = await authService.googleLogin(idToken);
      setAuth(authData);
      onSuccess(authData);
    } catch (err: unknown) {
      onError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          color: "var(--color-muted)",
          fontSize: "0.8rem",
        }}
      >
        <span style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)" }} />
        <span>hoặc</span>
        <span style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border)" }} />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          opacity: disabled || submitting ? 0.6 : 1,
          pointerEvents: disabled || submitting ? "none" : "auto",
        }}
      >
        <GoogleLogin
          onSuccess={(res) => void handleGoogleSuccess(res)}
          onError={() => onError("Đăng nhập Google thất bại, vui lòng thử lại.")}
          text="signin_with"
          shape="rectangular"
          size="large"
          width="360"
        />
      </div>
    </div>
  );
};
