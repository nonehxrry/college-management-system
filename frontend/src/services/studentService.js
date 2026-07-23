import api from "./api";

export const studentService = {
  getDashboard: async () => {
    const { data } = await api.get("/students/dashboard");
    return data;
  },

  getAttendance: async (params = {}) => {
    const { data } = await api.get("/students/attendance", { params });
    return data;
  },

  getAttendanceSummary: async () => {
    const { data } = await api.get("/students/attendance/summary");
    return data;
  },

  getAIInsights: async () => {
    const { data } = await api.get("/students/ai/insights");
    return data;
  },

  getAssignments: async (params = {}) => {
    const { data } = await api.get("/students/assignments", { params });
    return data;
  },

  submitAssignment: async (assignmentId, formData) => {
    const { data } = await api.post(`/students/assignments/${assignmentId}/submit`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  getResults: async (params = {}) => {
    const { data } = await api.get("/students/results", { params });
    return data;
  },

  getResultBySemester: async (semester) => {
    const { data } = await api.get(`/students/results/${semester}`);
    return data;
  },

  requestReEvaluation: async (resultId, subjectId, reason) => {
    const { data } = await api.post(`/students/results/${resultId}/re-evaluation`, { subjectId, reason });
    return data;
  },

  getDateSheets: async () => {
    const { data } = await api.get("/students/date-sheets");
    return data;
  },

  getNotices: async (params = {}) => {
    const { data } = await api.get("/students/notices", { params });
    return data;
  },

  markNoticeRead: async (noticeId) => {
    const { data } = await api.put(`/notices/${noticeId}/read`);
    return data;
  },

  getProfile: async () => {
    const { data } = await api.get("/students/profile");
    return data;
  },

  updateProfile: async (formData) => {
    const { data } = await api.put("/students/profile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  uploadMedicalCertificate: async (formData) => {
    const { data } = await api.post("/students/upload/medical", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  uploadInternshipProof: async (formData) => {
    const { data } = await api.post("/students/upload/internship", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  getTickets: async () => {
    const { data } = await api.get("/students/tickets");
    return data;
  },

  createTicket: async (ticketData) => {
    const { data } = await api.post("/students/tickets", ticketData);
    return data;
  },

  replyToTicket: async (ticketId, message) => {
    const { data } = await api.post(`/students/tickets/${ticketId}/reply`, { message });
    return data;
  },

  submitLeaveApplication: async (leaveData) => {
    const { data } = await api.post("/students/leave", leaveData);
    return data;
  },

  submitFeedback: async (feedbackData) => {
    const { data } = await api.post("/students/feedback", feedbackData);
    return data;
  },

  getFeeStatus: async () => {
    const { data } = await api.get("/students/fees");
    return data;
  },

  downloadHallTicket: async (datesheetId) => {
    const response = await api.get(`/students/datesheets/${datesheetId}/hallticket`, {
      responseType: "blob",
    });
    return response.data;
  },

  downloadIdCard: async () => {
    const response = await api.get("/students/profile/idcard", { responseType: "blob" });
    return response.data;
  },

  getSubjects: async () => {
    const { data } = await api.get("/students/subjects");
    return data;
  },

  getStudyMaterial: async (subjectId) => {
    const { data } = await api.get(`/students/subjects/${subjectId}/materials`);
    return data;
  },
};