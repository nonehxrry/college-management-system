import api from "./api";
import { storage } from "../utils/helpers";

export const authService = {
  login: async (email, password, role) => {
    try {
      const { data } = await api.post("/auth/login", { email, password, role });
      console.log("✅ Login response:", data);
      storage.set("accessToken",  data.accessToken);
      storage.set("refreshToken", data.refreshToken);
      storage.set("user",         data.user);
      return data;
    } catch (error) {
      console.error("❌ Login error:", error.response?.data || error.message);
      throw error;
    }
  },

  logout: async () => {
    try { await api.post("/auth/logout"); } catch {}
    storage.remove("accessToken");
    storage.remove("refreshToken");
    storage.remove("user");
  },

  refreshToken: async () => {
    const refreshToken = storage.get("refreshToken");
    if (!refreshToken) throw new Error("No refresh token");
    const { data } = await api.post("/auth/refresh-token", { refreshToken });
    storage.set("accessToken",  data.accessToken);
    storage.set("refreshToken", data.refreshToken || refreshToken);
    return data.accessToken;
  },

  getMe: async () => {
    const { data } = await api.get("/auth/me");
    return { user: data.user, profile: data.profile };
  },

  forgotPassword: async (email) => {
    const { data } = await api.post("/auth/forgot-password", { email });
    return data;
  },

  resetPassword: async (token, password, confirmPassword) => {
    const { data } = await api.put(`/auth/reset-password/${token}`, { password, confirmPassword });
    return data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const { data } = await api.put("/auth/change-password", { currentPassword, newPassword });
    return data;
  },

  updateProfile: async (formData) => {
    const { data } = await api.put("/auth/profile", formData);
    return data;
  },

  isAuthenticated: () => !!storage.get("accessToken"),
  getCachedUser:   () => storage.get("user"),
};