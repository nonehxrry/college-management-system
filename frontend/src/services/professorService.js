import api from "./api";

export const professorService = {
  getDashboard: async () => {
    const { data } = await api.get("/professors/dashboard");
    return data;
  },

  getSubjects: async () => {
    const { data } = await api.get("/professors/subjects");
    return data;
  },

  getStudentsBySubject: async (subjectId, params = {}) => {
    const { data } = await api.get(`/professors/subjects/${subjectId}/students`, { params });
    return data;
  },

  markAttendance: async (subjectId, attendanceData) => {
    const { data } = await api.post(`/professors/attendance/${subjectId}`, attendanceData);
    return data;
  },

  bulkUploadAttendance: async (formData) => {
    const { data } = await api.post("/professors/attendance/bulk", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  editAttendance: async (attendanceId, updatedData) => {
    const { data } = await api.put(`/professors/attendance/${attendanceId}`, updatedData);
    return data;
  },

  getAttendanceReport: async (params = {}) => {
    const { data } = await api.get("/professors/attendance/report", { params });
    return data;
  },

  exportAttendanceReport: async (params = {}) => {
    const response = await api.get("/professors/attendance/export", {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  getAssignments: async (params = {}) => {
    const { data } = await api.get("/professors/assignments", { params });
    return data;
  },

  createAssignment: async (assignmentData) => {
    const { data } = await api.post("/professors/assignments", assignmentData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  updateAssignment: async (assignmentId, assignmentData) => {
    const { data } = await api.put(`/professors/assignments/${assignmentId}`, assignmentData);
    return data;
  },

  deleteAssignment: async (assignmentId) => {
    const { data } = await api.delete(`/professors/assignments/${assignmentId}`);
    return data;
  },

  getSubmissions: async (assignmentId) => {
    const { data } = await api.get(`/professors/assignments/${assignmentId}/submissions`);
    return data;
  },

  downloadAllSubmissions: async (assignmentId) => {
    const response = await api.get(`/professors/assignments/${assignmentId}/download-all`, {
      responseType: "blob",
    });
    return response.data;
  },

  gradeSubmission: async (submissionId, gradeData) => {
    const { data } = await api.put(`/professors/submissions/${submissionId}/grade`, gradeData);
    return data;
  },

  uploadStudyMaterial: async (subjectId, formData) => {
    const { data } = await api.post(`/professors/subjects/${subjectId}/materials`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  updateSyllabus: async (subjectId, syllabusData) => {
    const { data } = await api.put(`/professors/subjects/${subjectId}/syllabus`, syllabusData);
    return data;
  },

  archiveMaterial: async (subjectId, materialId) => {
    const { data } = await api.put(`/professors/subjects/${subjectId}/materials/${materialId}/archive`);
    return data;
  },

  uploadInternalMarks: async (marksData) => {
    const { data } = await api.post("/professors/marks/internal", marksData);
    return data;
  },

  uploadPracticalMarks: async (marksData) => {
    const { data } = await api.post("/professors/marks/practical", marksData);
    return data;
  },

  getResultPreview: async (params = {}) => {
    const { data } = await api.get("/professors/results/preview", { params });
    return data;
  },

  sendNotice: async (noticeData) => {
    const { data } = await api.post("/professors/notices", noticeData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  getAnalytics: async (params = {}) => {
    const { data } = await api.get("/professors/analytics", { params });
    return data;
  },

  getWeakStudents: async (params = {}) => {
    const { data } = await api.get("/professors/analytics/weak-students", { params });
    return data;
  },
};