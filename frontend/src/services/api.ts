import axios, { AxiosError as AxiosErrorType } from 'axios';
import {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
} from '../types/auth';
import { ApiErrorResponse, AxiosError } from '../types/api';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'https://outbound-ai.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API methods
export const authAPI = {
  // Register new user
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/signup', credentials);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosErrorType;
      throw axiosError.response?.data || { message: 'Registration failed' };
    }
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/signin', credentials);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosErrorType;
      throw axiosError.response?.data || { message: 'Login failed' };
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    }
  },

  // Get current user profile
  getProfile: async (): Promise<{ success: boolean; data: { user: User } }> => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosErrorType;
      throw axiosError.response?.data || { message: 'Failed to fetch profile' };
    }
  },

  // Update user profile
  updateProfile: async (
    data: Partial<User>
  ): Promise<{ success: boolean; data: { user: User } }> => {
    try {
      const response = await api.put('/auth/profile', data);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosErrorType;
      throw axiosError.response?.data || { message: 'Failed to update profile' };
    }
  },

  // Change password
  changePassword: async (passwords: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.put('/user/change-password', passwords);
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosErrorType;
      throw axiosError.response?.data || { message: 'Failed to change password' };
    }
  },

  // Get dashboard data
  getDashboard: async (): Promise<any> => {
    try {
      const response = await api.get('/user/dashboard');
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosErrorType;
      throw (
        axiosError.response?.data || { message: 'Failed to fetch dashboard data' }
      );
    }
  },
};

// Health check
export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health');
    return response.data.status === 'OK';
  } catch {
    return false;
  }
};

export default api;
