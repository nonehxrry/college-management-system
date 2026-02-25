import { storage } from "../utils/helpers";

const MOCK_USERS = {
  student: {
    user:    { _id: "s1", name: "Aarav Sharma", email: "student@college.edu", role: "student", avatar: null, isActive: true },
    profile: { rollNumber: "CS40101", department: "Computer Science", semester: 4, section: "A", cgpa: 8.4, batch: "2021-25" },
    accessToken:  "mock-student-token",
    refreshToken: "mock-student-refresh",
  },
  professor: {
    user:    { _id: "p1", name: "Dr. Ramesh Kumar", email: "professor@college.edu", role: "professor", avatar: null, isActive: true },
    profile: { employeeId: "EMP001", department: "Computer Science", designation: "Associate Professor", subjects: [] },
    accessToken:  "mock-professor-token",
    refreshToken: "mock-professor-refresh",
  },
  admin: {
    user:    { _id: "a1", name: "Admin User", email: "admin@college.edu", role: "admin", avatar: null, isActive: true },
    profile: { employeeId: "ADMIN001", designation: "System Administrator" },
    accessToken:  "mock-admin-token",
    refreshToken: "mock-admin-refresh",
  },
};

// Email → role mapping for convenience
const EMAIL_TO_ROLE = {
  "student@college.edu":   "student",
  "professor@college.edu": "professor",
  "admin@college.edu":     "admin",
};

export const authService = {
  login: async (email, password, role) => {
    await new Promise((res) => setTimeout(res, 600));

    const normalizedEmail = (email || "").trim().toLowerCase();

    // Accept login if:
    //  a) the role tab matches the email, OR
    //  b) the email belongs to any known mock user (ignore role tab mismatch)
    const matchedRole = EMAIL_TO_ROLE[normalizedEmail] || role;
    const mock = MOCK_USERS[matchedRole];

    if (!mock || mock.user.email !== normalizedEmail) {
      const err = new Error("Invalid credentials");
      err.response = { data: { message: "No account found with that email. Use one of the demo emails." } };
      throw err;
    }

    // Password: accept the correct demo password OR any non-empty string (dev mode)
    if (!password || password.length < 1) {
      const err = new Error("Password required");
      err.response = { data: { message: "Please enter your password." } };
      throw err;
    }

    // Save to localStorage
    storage.set("accessToken",  mock.accessToken);
    storage.set("refreshToken", mock.refreshToken);
    storage.set("user",         mock.user);

    return mock;
  },

  logout: async () => {
    await new Promise((res) => setTimeout(res, 200));
    storage.remove("accessToken");
    storage.remove("refreshToken");
    storage.remove("user");
  },

  refreshToken: async () => {
    const token = storage.get("refreshToken");
    if (!token) throw new Error("No refresh token");
    return token;
  },

  getMe: async () => {
    await new Promise((res) => setTimeout(res, 200));
    const user = storage.get("user");
    if (!user) throw new Error("Not authenticated");
    return { user, profile: MOCK_USERS[user.role]?.profile };
  },

  forgotPassword: async (email) => {
    await new Promise((res) => setTimeout(res, 600));
    return { message: "Reset link sent to " + email };
  },

  resetPassword: async (token, password) => {
    await new Promise((res) => setTimeout(res, 600));
    return { message: "Password reset successfully" };
  },

  changePassword: async (currentPassword, newPassword) => {
    await new Promise((res) => setTimeout(res, 600));
    return { message: "Password changed successfully" };
  },

  updateProfile: async (formData) => {
    await new Promise((res) => setTimeout(res, 600));
    return { message: "Profile updated successfully" };
  },

  isAuthenticated: () => !!storage.get("accessToken"),
  getCachedUser:   () => storage.get("user"),
};