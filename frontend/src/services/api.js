import axios from "axios";
import { storage } from "../utils/helpers";

const BASE_ROOT = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BASE_URL = import.meta.env.DEV
  ? "/api"
  : `${BASE_ROOT.replace(/\/+$/, "")}/api`;

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// ─── Request interceptor — attach JWT ────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = storage.get("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Network error (backend offline) — do NOT logout, just reject silently
    if (!error.response) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    // 401 — try token refresh once
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = storage.get("refreshToken");

      // If using mock tokens, don't try to refresh against real backend
      if (!refreshToken || refreshToken.startsWith("mock-")) {
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken });
        const newToken = data.accessToken;
        storage.set("accessToken",  newToken);
        storage.set("refreshToken", data.refreshToken || refreshToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        // Refresh failed — only force logout if we have a real (non-mock) token
        const currentToken = storage.get("accessToken");
        if (currentToken && !currentToken.startsWith("mock-")) {
          _forceLogout();
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

function _forceLogout() {
  storage.remove("accessToken");
  storage.remove("refreshToken");
  storage.remove("user");
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export const apiGet    = (url, params   = {}) => api.get(url,  { params });
export const apiPost   = (url, body     = {}) => api.post(url,  body);
export const apiPut    = (url, body     = {}) => api.put(url,   body);
export const apiDelete = (url)                => api.delete(url);
export const apiUpload = (url, formData)      =>
  api.post(url, formData, { headers: { "Content-Type": "multipart/form-data" } });

export default api;