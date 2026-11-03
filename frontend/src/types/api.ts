
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface ApiError {
    success: boolean;
    message: string;
    errors?: Record<string, string[]>;
}
