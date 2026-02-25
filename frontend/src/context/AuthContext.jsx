import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService } from "../services/authService";
import { storage }      from "../utils/helpers";
import toast            from "react-hot-toast";

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user,            setUser]            = useState(null);   // { _id, name, email, role, … }
  const [profile,         setProfile]         = useState(null);   // Student | Professor document
  const [loading,         setLoading]         = useState(true);   // true while checking auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ── Initialise auth from stored token on first mount ──────────────────────
  useEffect(() => {
    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeAuth = useCallback(async () => {
    const token = storage.get("accessToken");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { user: serverUser, profile: serverProfile } = await authService.getMe();
      setUser(serverUser);
      setProfile(serverProfile);
      setIsAuthenticated(true);
    } catch (err) {
      // Token may be expired — try refresh
      try {
        await authService.refreshToken();
        const { user: serverUser, profile: serverProfile } = await authService.getMe();
        setUser(serverUser);
        setProfile(serverProfile);
        setIsAuthenticated(true);
      } catch {
        // Refresh failed — clear everything
        storage.remove("accessToken");
        storage.remove("refreshToken");
        storage.remove("user");
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password, role) => {
    const data = await authService.login(email, password, role);
    setUser(data.user);
    setProfile(data.profile);
    setIsAuthenticated(true);
    toast.success(`Welcome back, ${data.user.name.split(" ")[0]}! 👋`);
    return data;
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
    toast.success("Signed out successfully");
  }, []);

  // ── Patch user / profile after edits ──────────────────────────────────────
  const updateUser = useCallback((patch) => {
    setUser((prev) => ({ ...prev, ...patch }));
    storage.set("user", { ...storage.get("user"), ...patch });
  }, []);

  const updateProfile = useCallback((patch) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  // ── Derived helpers ────────────────────────────────────────────────────────
  const isStudent   = user?.role === "student";
  const isProfessor = user?.role === "professor";
  const isAdmin     = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAuthenticated,
        isStudent,
        isProfessor,
        isAdmin,
        login,
        logout,
        updateUser,
        updateProfile,
        initializeAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthContext;