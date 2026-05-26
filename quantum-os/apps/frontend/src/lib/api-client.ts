import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    // Attempt to get token from storage, safe for SSR
    const token = typeof window !== 'undefined' ? localStorage.getItem('session_token') : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Parse error into strongly typed ApiError
    // We safely extract properties without using any
    const data = error.response?.data as Record<string, unknown> | undefined;
    
    const apiError: ApiError = {
      message: (typeof data?.message === 'string' ? data.message : error.message) || 'An unexpected error occurred',
      code: typeof data?.code === 'string' ? data.code : error.code,
      status: error.response?.status,
    };
    return Promise.reject(apiError);
  }
);

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.get<T, AxiosResponse<T>>(url, config).then((res) => res.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.post<T, AxiosResponse<T>>(url, data, config).then((res) => res.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.put<T, AxiosResponse<T>>(url, data, config).then((res) => res.data),

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.delete<T, AxiosResponse<T>>(url, config).then((res) => res.data),
};
