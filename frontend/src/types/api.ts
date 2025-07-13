// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ApiError[];
}

export interface ApiError {
  field?: string;
  message: string;
  code?: string;
}

// Error Types
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: ApiError[];
  statusCode?: number;
}

export interface NetworkError {
  message: string;
  status?: number;
  statusText?: string;
  url?: string;
}

// Generic Error Handler
export type ErrorHandler = (error: ApiErrorResponse | NetworkError | Error) => void;

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Request Configuration
export interface RequestConfig {
  method: HttpMethod;
  url: string;
  data?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

// Response Configuration
export interface ResponseConfig<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
}

// Axios Error Type
export interface AxiosError {
  message: string;
  response?: {
    data: ApiErrorResponse;
    status: number;
    statusText: string;
    headers: Record<string, string>;
  };
  request?: {
    method: string;
    url: string;
    headers: Record<string, string>;
  };
  config: RequestConfig;
  isAxiosError: boolean;
}

// API Client Configuration
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
  withCredentials?: boolean;
}

// Request Interceptor
export interface RequestInterceptor {
  onFulfilled?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  onRejected?: (error: AxiosError) => AxiosError | Promise<AxiosError>;
}

// Response Interceptor
export interface ResponseInterceptor<T = unknown> {
  onFulfilled?: (response: ResponseConfig<T>) => ResponseConfig<T> | Promise<ResponseConfig<T>>;
  onRejected?: (error: AxiosError) => AxiosError | Promise<AxiosError>;
} 