import axios from "axios";
import { DEFAULT_ERROR_MESSAGE, ERROR_CODES } from "@/constants/errorCodes";
import type { ProblemDetails } from "@/types/api";

interface ErrorPayload extends ProblemDetails {
  message?: string;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ErrorPayload>(error)) {
    if (!error.response) {
      return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng và thử lại.";
    }

    const data = error.response.data;

    // 1. Ưu tiên ánh xạ theo ProblemDetails.code
    if (data?.code && ERROR_CODES[data.code]) {
      return ERROR_CODES[data.code];
    }

    // 2. Sau đó lấy detail từ ProblemDetails hoặc message từ legacy wrapper
    if (typeof data?.detail === "string" && data.detail.trim().length > 0) {
      return data.detail;
    }

    if (typeof data?.message === "string" && data.message.trim().length > 0) {
      return data.message;
    }

    if (typeof data?.title === "string" && data.title.trim().length > 0) {
      return data.title;
    }

    return DEFAULT_ERROR_MESSAGE;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return DEFAULT_ERROR_MESSAGE;
}

