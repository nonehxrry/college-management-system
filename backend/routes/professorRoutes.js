const express = require("express");
const router  = express.Router();
const { protect }   = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const upload        = require("../middleware/uploadMiddleware");
const Professor  = require("../models/Professor");
const User       = require("../models/User");
const Student    = require("../models/Student");
const Subject    = require("../models/Subject");
const Attendance = require("../models/Attendance");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Result     = require("../models/Result");
const Notice     = require("../models/Notice");

router.use(protect);
router.use(authorize("professor", "admin"));

const getProfessor = async (userId) => {
  const p = await Professor.findOne({ user: userId })
    .populate("user", "name email avatar phone")
    .populate("department", "name code")
    .populate("subjects", "name code credits type semester section");
  if (!p) { const e = new Error("Professor profile not found"); e.statusCode = 404; throw e; }
  return p;
};

// DASHBOARD
router.get("/dashboard", async (req, res) => {
  try {
    const professor = await getProfessor(req.user._id);
    const pendingGrading   = await Submission.countDocuments({ professor: professor._id, marksObtained: { $exists: false } });
    const activeAssignments = await Assignment.countDocuments({ professor: professor._id, isActive: true, deadline: { $gt: new Date() } });
    res.json({ success: true, data: { professor: { name: professor.user.name, employeeId: professor.employeeId, department: professor.department?.name, designation: professor.designation, avatar: professor.user.avatar }, totalSubjects: professor.subjects.length, pendingGrading, activeAssignments } });
  } catch (err) { res.status(err.statusCode || 500).json({ success: false, message: err.message }); }
});

// SUBJECTS
router.get("/subjects", async (req, res) => {
  try { const professor = await getProfessor(req.user._id); res.json({ success: true, data: professor.subjects }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/subjects/:id/students", async (req, res) => {
  try {
    const { section } = req.query;
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });
    const query = { subjects: subject._id, semester: subject.semester };
    if (section) query.section = section;
    const students = await Student.find(query).populate("user", "name email avatar").sort({ rollNumber: 1 });
    res.json({ success: true, data: students });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ATTENDANCE
router.post("/attendance/:subjectId", async (req, res) => {
  try {
    const professor = await getProfessor(req.user._id);
    const { date, topic, section, records } = req.body;
    if (!records || !Array.isArray(records)) return res.status(400).json({ success: false, message: "Records array required" });
    const existing = await Attendance.findOne({ subject: req.params.subjectId, date: new Date(date), section });
    if (existing) return res.status(400).json({ success: false, message: "Attendance already marked for this date" });
    const attendance = await Attendance.create({ subject: req.params.subjectId, professor: professor._id, date: new Date(date), topic, section, records: records.map((r) => ({ student: r.studentId, status: r.status })) });
    res.status(201).json({ success: true, data: attendance, message: "Attendance marked successfully" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put("/attendance/:attendanceId", async (req, res) => {
  try {
    const { studentId, status, reason } = req.body;
    const attendance = await Attendance.findById(req.params.attendanceId);
    if (!attendance) return res.status(404).json({ success: false, message: "Record not found" });
    const record = attendance.records.find((r) => r.student.toString() === studentId);
    if (!record) return res.status(404).json({ success: false, message: "Student record not found" });
    record.status = status; record.reason = reason;
    await attendance.save();
    res.json({ success: true, message: "Attendance updated" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/attendance/:subjectId/report", async (req, res) => {
  try {
    const { month, year, section } = req.query;
    const query = { subject: req.params.subjectId };
    if (month && year) { const start = new Date(year, month - 1, 1), end = new Date(year, month, 0); query.date = { $gte: start, $lte: end }; }
    if (section) query.section = section;
    const records = await Attendance.find(query).sort({ date: 1 });
    res.json({ success: true, data: records });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ASSIGNMENTS
router.get("/assignments", async (req, res) => {
  try {
    const professor = await getProfessor(req.user._id);
    const assignments = await Assignment.find({ professor: professor._id }).populate("subject", "name code").sort({ createdAt: -1 });
    const result = await Promise.all(assignments.map(async (a) => {
      const totalSubmissions  = await Submission.countDocuments({ assignment: a._id });
      const gradedSubmissions = await Submission.countDocuments({ assignment: a._id, marksObtained: { $exists: true } });
      return { ...a.toObject(), totalSubmissions, gradedSubmissions };
    }));
    res.json({ success: true, data: result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post("/assignments", upload.single("file"), async (req, res) => {
  try {
    const professor = await getProfessor(req.user._id);
    const { subjectId, title, description, deadline, maxMarks, section, allowedFormats } = req.body;
    if (!subjectId || !title || !deadline) return res.status(400).json({ success: false, message: "Subject, title and deadline required" });
    const assignment = await Assignment.create({ subject: subjectId, professor: professor._id, title, description, deadline: new Date(deadline), maxMarks: maxMarks || 10, section, allowedFormats: allowedFormats ? JSON.parse(allowedFormats) : ["pdf", "docx"], fileUrl: req.file?.path, fileName: req.file?.originalname, isActive: true });
    res.status(201).json({ success: true, data: assignment, message: "Assignment created" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete("/assignments/:id", async (req, res) => {
  try {
    const professor  = await getProfessor(req.user._id);
    const assignment = await Assignment.findOne({ _id: req.params.id, professor: professor._id });
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });
    await assignment.deleteOne();
    res.json({ success: true, message: "Assignment deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/assignments/:id/submissions", async (req, res) => {
  try {
    const submissions = await Submission.find({ assignment: req.params.id }).populate({ path: "student", populate: { path: "user", select: "name avatar" } }).sort({ submittedAt: -1 });
    res.json({ success: true, data: submissions });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put("/assignments/submissions/:id/grade", async (req, res) => {
  try {
    const { marksObtained, feedback } = req.body;
    const submission = await Submission.findByIdAndUpdate(req.params.id, { marksObtained, feedback, gradedAt: new Date() }, { new: true });
    if (!submission) return res.status(404).json({ success: false, message: "Submission not found" });
    res.json({ success: true, data: submission, message: "Graded successfully" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// NOTICES
router.post("/notices", upload.single("attachment"), async (req, res) => {
  try {
    const professor = await getProfessor(req.user._id);
    const { title, content, targetType, section, priority, isForced, expiresAt } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: "Title and content required" });
    const notice = await Notice.create({ title, content, createdBy: professor.user.name, createdByRef: req.user._id, targetType: targetType || "section", targetDepartment: professor.department._id, section, priority: priority || "normal", isForced: isForced === "true", expiresAt: expiresAt ? new Date(expiresAt) : null, attachmentUrl: req.file?.path, isActive: true });
    const io = req.app.get("io");
    if (io) io.to("role:student").emit("new_notification", { type: "notice", title: notice.title, message: notice.content.slice(0, 100), isForced: notice.isForced, _id: notice._id });
    res.status(201).json({ success: true, data: notice, message: "Notice sent" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/notices", async (req, res) => {
  try {
    const notices = await Notice.find({ createdByRef: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: notices });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete("/notices/:id", async (req, res) => {
  try {
    await Notice.findOneAndDelete({ _id: req.params.id, createdByRef: req.user._id });
    res.json({ success: true, message: "Notice deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// STUDY MATERIAL
router.post("/subjects/:subjectId/materials", upload.single("file"), async (req, res) => {
  try {
    const { title, type, description } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: "File required" });
    const subject = await Subject.findById(req.params.subjectId);
    if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });
    subject.materials = subject.materials || [];
    subject.materials.push({ title, type, description, fileUrl: req.file.path, fileName: req.file.originalname, uploadedAt: new Date(), isArchived: false });
    await subject.save();
    res.status(201).json({ success: true, message: "Material uploaded" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/subjects/:subjectId/materials", async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId).select("materials name code");
    if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });
    res.json({ success: true, data: subject.materials || [] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ANALYTICS
router.get("/analytics/:subjectId", async (req, res) => {
  try {
    const records = await Attendance.find({ subject: req.params.subjectId });
    const studentMap = {};
    records.forEach((r) => { r.records.forEach((sr) => { const id = sr.student.toString(); if (!studentMap[id]) studentMap[id] = { id, total: 0, present: 0 }; studentMap[id].total++; if (sr.status === "present") studentMap[id].present++; }); });
    const allStudents = Object.values(studentMap).map((s) => ({ ...s, percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0 }));
    const weakStudents = allStudents.filter((s) => s.percentage < 75).map((s) => ({ ...s, riskLevel: s.percentage < 60 ? "high" : "medium", riskScore: Math.round((75 - s.percentage) * 1.5) }));
    const avgAttendance = allStudents.length ? Math.round(allStudents.reduce((a, s) => a + s.percentage, 0) / allStudents.length) : 0;
    res.json({ success: true, data: { totalStudents: allStudents.length, weakStudents, avgAttendance } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PROFILE
router.get("/profile", async (req, res) => {
  try { const professor = await getProfessor(req.user._id); res.json({ success: true, data: professor }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put("/profile", upload.single("photo"), async (req, res) => {
  try {
    const { phone } = req.body;
    await User.findByIdAndUpdate(req.user._id, { ...(phone && { phone }), ...(req.file?.path && { avatar: req.file.path }) });
    res.json({ success: true, message: "Profile updated" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;  