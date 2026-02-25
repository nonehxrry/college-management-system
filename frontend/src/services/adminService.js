import api from "./api";

export const adminService = {
  getDashboard: async () => {
    const { data } = await api.get("/admin/dashboard");
    return data;
  },

  getUsers: async (params = {}) => {
    const { data } = await api.get("/admin/users", { params });
    return data;
  },

  createUser: async (userData) => {
    const { data } = await api.post("/admin/users", userData);
    return data;
  },

  updateUser: async (userId, userData) => {
    const { data } = await api.put(`/admin/users/${userId}`, userData);
    return data;
  },

  deleteUser: async (userId) => {
    const { data } = await api.delete(`/admin/users/${userId}`);
    return data;
  },

  toggleUserStatus: async (userId) => {
    const { data } = await api.put(`/admin/users/${userId}/toggle-status`);
    return data;
  },

  resetUserPassword: async (userId, newPassword) => {
    const { data } = await api.put(`/admin/users/${userId}/reset-password`, { newPassword });
    return data;
  },

  bulkImportUsers: async (formData) => {
    const { data } = await api.post("/admin/users/bulk-import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  getDepartments: async () => {
    const { data } = await api.get("/admin/departments");
    return data;
  },

  createDepartment: async (deptData) => {
    const { data } = await api.post("/admin/departments", deptData);
    return data;
  },

  updateDepartment: async (deptId, deptData) => {
    const { data } = await api.put(`/admin/departments/${deptId}`, deptData);
    return data;
  },

  deleteDepartment: async (deptId) => {
    const { data } = await api.delete(`/admin/departments/${deptId}`);
    return data;
  },

  getCourses: async (params = {}) => {
    const { data } = await api.get("/admin/courses", { params });
    return data;
  },

  createCourse: async (courseData) => {
    const { data } = await api.post("/admin/courses", courseData);
    return data;
  },

  updateCourse: async (courseId, courseData) => {
    const { data } = await api.put(`/admin/courses/${courseId}`, courseData);
    return data;
  },

  getSubjects: async (params = {}) => {
    const { data } = await api.get("/admin/subjects", { params });
    return data;
  },

  createSubject: async (subjectData) => {
    const { data } = await api.post("/admin/subjects", subjectData);
    return data;
  },

  updateSubject: async (subjectId, subjectData) => {
    const { data } = await api.put(`/admin/subjects/${subjectId}`, subjectData);
    return data;
  },

  assignFacultyToSubject: async (subjectId, professorId) => {
    const { data } = await api.put(`/admin/subjects/${subjectId}/assign-faculty`, { professorId });
    return data;
  },

  getResults: async (params = {}) => {
    const { data } = await api.get("/admin/results", { params });
    return data;
  },

  publishResult: async (resultIds, scheduledAt = null) => {
    const { data } = await api.put("/admin/results/publish", { resultIds, scheduledAt });
    return data;
  },

  lockResult: async (resultId) => {
    const { data } = await api.put(`/admin/results/${resultId}/lock`);
    return data;
  },

  generateCGPA: async (studentId) => {
    const { data } = await api.post(`/admin/results/generate-cgpa/${studentId}`);
    return data;
  },

  uploadResultPdf: async (resultId, formData) => {
    const { data } = await api.post(`/admin/results/${resultId}/pdf`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  getDateSheets: async (params = {}) => {
    const { data } = await api.get("/admin/datesheets", { params });
    return data;
  },

  createDateSheet: async (dateSheetData) => {
    const { data } = await api.post("/admin/datesheets", dateSheetData);
    return data;
  },

  updateDateSheet: async (dateSheetId, dateSheetData) => {
    const { data } = await api.put(`/admin/datesheets/${dateSheetId}`, dateSheetData);
    return data;
  },

  publishDateSheet: async (dateSheetId) => {
    const { data } = await api.put(`/admin/datesheets/${dateSheetId}/publish`);
    return data;
  },

  deleteDateSheet: async (dateSheetId) => {
    const { data } = await api.delete(`/admin/datesheets/${dateSheetId}`);
    return data;
  },

  getNotices: async (params = {}) => {
    const { data } = await api.get("/admin/notices", { params });
    return data;
  },

  createNotice: async (noticeData) => {
    const { data } = await api.post("/admin/notices", noticeData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  deleteNotice: async (noticeId) => {
    const { data } = await api.delete(`/admin/notices/${noticeId}`);
    return data;
  },

  getFees: async (params = {}) => {
    const { data } = await api.get("/admin/fees", { params });
    return data;
  },

  createFeeRecord: async (feeData) => {
    const { data } = await api.post("/admin/fees", feeData);
    return data;
  },

  updateFeePayment: async (feeId, paymentData) => {
    const { data } = await api.put(`/admin/fees/${feeId}/payment`, paymentData);
    return data;
  },

  getReports: async (type, params = {}) => {
    const { data } = await api.get(`/admin/reports/${type}`, { params });
    return data;
  },

  getAuditLogs: async (params = {}) => {
    const { data } = await api.get("/admin/audit-logs", { params });
    return data;
  },

  getSystemSettings: async () => {
    const { data } = await api.get("/admin/settings");
    return data;
  },

  updateSystemSettings: async (settings) => {
    const { data } = await api.put("/admin/settings", settings);
    return data;
  },

  backupDatabase: async () => {
    const response = await api.post("/admin/backup", {}, { responseType: "blob" });
    return response.data;
  },
};