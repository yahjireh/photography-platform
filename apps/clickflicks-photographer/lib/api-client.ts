import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://clickflicks-api.onrender.com/api';

const TOKEN_KEY = 'clickflicks_photographer_token';
const USER_KEY = 'clickflicks_photographer_user';

export const tokenManager = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  getUser: <T = any>(): T | null => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setUser: (user: any): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      tokenManager.removeToken();
      window.dispatchEvent(new CustomEvent('clickflicks:photographer-unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
