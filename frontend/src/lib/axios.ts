import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/authStore";
import type { ApiResponse } from "@/types/api";
import type { AuthResponse } from "@/types/auth";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface FailedQueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5126";

const BASE_URL = API_BASE_URL;

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

function processQueue(error: unknown, token: string | null): void {
  for (const item of failedQueue) {
    if (error || !token) {
      item.reject(error);
    } else {
      item.resolve(token);
    }
  }
  failedQueue = [];
}

function redirectToLogin(): void {
  if (
    typeof window !== "undefined" &&
    window.location.pathname !== ROUTES.LOGIN &&
    window.location.pathname !== ROUTES.REGISTER
  ) {
    window.location.assign(ROUTES.LOGIN);
  }
}

axiosClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url ?? "";
    const isAuthEndpoint =
      requestUrl.includes("/api/v1/Auth/login") ||
      requestUrl.includes("/api/v1/Auth/register") ||
      requestUrl.includes("/api/v1/Auth/refresh");

    // Xử lý 403 Forbidden cho các request nghiệp vụ
    if (status === 403 && !isAuthEndpoint) {
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== ROUTES.FORBIDDEN
      ) {
        window.location.assign(ROUTES.FORBIDDEN);
      }
      return Promise.reject(error);
    }

    // Xử lý 401 Unauthorized: thử refresh token một lần, thất bại thì về /login
    if (
      status === 401 &&
      originalRequest &&
      !isAuthEndpoint &&
      !originalRequest._retry
    ) {
      const currentRefreshToken = useAuthStore.getState().refreshToken;
      if (!currentRefreshToken) {
        useAuthStore.getState().logout();
        redirectToLogin();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await axios.post<ApiResponse<AuthResponse>>(
          `${BASE_URL}/api/v1/Auth/refresh`,
          { refreshToken: currentRefreshToken },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 15000,
          }
        );

        const nextAuth = refreshRes.data.data;
        useAuthStore.getState().setAuth(nextAuth);
        processQueue(null, nextAuth.accessToken);

        originalRequest.headers.Authorization = `Bearer ${nextAuth.accessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError: unknown) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
