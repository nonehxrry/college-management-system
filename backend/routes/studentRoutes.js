const express = require("express");
const router  = express.Router();
const { protect }   = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { uploadCSV } = require("../middleware/uploadMiddleware");
const Student    = require("../models/Student");
const User       = require("../models/User");
const Attendance = require("../models/Attendance");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Result     = require("../models/Result");
const DateSheet  = require("../models/DateSheet");
const Notice     = require("../models/Notice");
const Ticket     = require("../models/Ticket");
const FeeRecord  = require("../models/FeeRecord");

router.use(protect);
router.use(authorize("student", "admin"));

const getStudent = async (userId) => {
  const s = await Student.findOne({ user: userId })
    .populate("user", "name email avatar phone")
    .populate("department", "name code")
    .populate("subjects", "name code credits type semester");
  if (!s) { const e = new Error("Student profile not found"); e.statusCode = 404; throw e; }
  return s;
};

// DASHBOARD
router.get("/dashboard", async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    const now = new Date();
    const assignments = await Assignment.find({ subject: { $in: student.subjects }, deadline: { $gt: now }, isActive: true })
      .sort({ deadline: 1 }).limit(5).populate("subject", "name code");
    const submissions  = await Submission.find({ student: student._id }).select("assignment");
    const submittedIds = new Set(submissions.map((s) => s.assignment.toString()));
    const pendingAssignments = assignments.filter((a) => !submittedIds.has(a._id.toString()));
    const latestResult  = await Result.findOne({ student: student._id, isPublished: true }).sort({ semester: -1 }).lean();
    const unreadNotices = await Notice.countDocuments({ $or: [{ targetType: "global" }, { targetType: "students_only" }], readBy: { $ne: student._id }, isActive: true });
    res.json({ success: true, data: { student: { name: student.user.name, rollNumber: student.rollNumber, department: student.department?.name, semester: student.semester, section: student.section, cgpa: student.cgpa, avatar: student.user.avatar }, pendingAssignments, latestResult, unreadNotices, totalSubjects: student.subjects.length } });
  } catch (err) { res.status(err.statusCode || 500).json({ success: false, message: err.message }); }
});

// ATTENDANCE
router.get("/attendance", async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    const records = await Attendance.find({ "records.student": student._id }).populate("subject", "name code credits").sort({ date: -1 });
    const bySubject = {};
    for (const record of records) {
      const id = record.subject._id.toString();
      if (!bySubject[id]) bySubject[id] = { subject: record.subject, classes: [] };
      const sr = record.records.find((r) => r.student.toString() === student._id.toString());
      if (sr) bySubject[id].classes.push({ date: record.date, status: sr.status, topic: record.topic });
    }
    const result = Object.values(bySubject).map((item) => {
      const total = item.classes.length, present = item.classes.filter((c) => c.status === "present").length;
      return { subject: item.subject, total, present, absent: total - present, percentage: total > 0 ? Math.round((present / total) * 100) : 0, classes: item.classes };
    });
    res.json({ success: true, data: result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ASSIGNMENTS
router.get("/assignments", async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    const now = new Date();
    const assignments = await Assignment.find({ subject: { $in: student.subjects }, isActive: true }).populate("subject", "name code").sort({ deadline: 1 });
    const submissions = await Submission.find({ student: student._id });
    const subMap = {}; submissions.forEach((s) => { subMap[s.assignment.toString()] = s; });
    let data = assignments.map((a) => ({ ...a.toObject(), submission: subMap[a._id.toString()] || null, isSubmitted: !!subMap[a._id.toString()], isOverdue: a.deadline < now && !subMap[a._id.toString()] }));
    const { status } = req.query;
    if (status === "pending")   data = data.filter((a) => !a.isSubmitted && !a.isOverdue);
    if (status === "submitted") data = data.filter((a) => a.isSubmitted);
    if (status === "overdue")   data = data.filter((a) => a.isOverdue);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post("/assignments/:id/submit", uploadCSV.single("file"), async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });
    const exists = await Submission.findOne({ assignment: assignment._id, student: student._id });
    if (exists) return res.status(400).json({ success: false, message: "Already submitted" });
    const submission = await Submission.create({ assignment: assignment._id, student: student._id, fileUrl: req.file?.path || req.body.fileUrl, fileName: req.file?.originalname || req.body.fileName, notes: req.body.notes, submittedAt: new Date(), isLate: new Date() > assignment.deadline });
    res.status(201).json({ success: true, data: submission, message: "Submitted successfully" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// RESULTS
router.get("/results", async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    const results = await Result.find({ student: student._id, isPublished: true }).sort({ semester: -1 }).populate("subjects.subject", "name code credits type");
    res.json({ success: true, data: results });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/results/:semester", async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    const result  = await Result.findOne({ student: student._id, semester: req.params.semester, isPublished: true }).populate("subjects.subject", "name code credits type");
    if (!result) return res.status(404).json({ success: false, message: "Result not found" });
    res.json({ success: true, data: result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DATE SHEETS
router.get("/date-sheets", async (req, res) => {
  try {
    const student    = await getStudent(req.user._id);
    const dateSheets = await DateSheet.find({ department: student.department._id, semester: student.semester, isPublished: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: dateSheets });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// NOTICES
router.get("/notices", async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    const notices = await Notice.find({ $or: [{ targetType: "global" }, { targetType: "students_only" }, { targetType: "department", targetDepartment: student.department._id }], isActive: true }).sort({ createdAt: -1 }).limit(50);
    const data = notices.map((n) => ({ ...n.toObject(), isRead: n.readBy.map(String).includes(student._id.toString()) }));
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put("/notices/:id/read", async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    await Notice.findByIdAndUpdate(req.params.id, { $addToSet: { readBy: student._id } });
    res.json({ success: true, message: "Marked as read" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put("/notices/read-all", async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    await Notice.updateMany({ isActive: true }, { $addToSet: { readBy: student._id } });
    res.json({ success: true, message: "All marked as read" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PROFILE
router.get("/profile", async (req, res) => {
  try { const student = await getStudent(req.user._id); res.json({ success: true, data: student }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put("/profile", uploadCSV.single("photo"), async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    const { phone, address, bloodGroup } = req.body;
    await User.findByIdAndUpdate(req.user._id, { ...(phone && { phone }), ...(req.file?.path && { avatar: req.file.path }) });
    await Student.findByIdAndUpdate(student._id, { ...(address && { address }), ...(bloodGroup && { bloodGroup }) });
    res.json({ success: true, message: "Profile updated" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// FEES
router.get("/fees", async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    const fees = await FeeRecord.find({ student: student._id }).sort({ semester: -1 });
    res.json({ success: true, data: fees });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// TICKETS
router.get("/tickets", async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    const tickets = await Ticket.find({ student: student._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: tickets });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post("/tickets", async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    const { title, description, category, priority } = req.body;
    if (!title || !description) return res.status(400).json({ success: false, message: "Title and description required" });
    const ticket = await Ticket.create({ student: student._id, title, description, category, priority, status: "open", replies: [] });
    res.status(201).json({ success: true, data: ticket });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post("/tickets/:id/reply", async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    const ticket  = await Ticket.findOne({ _id: req.params.id, student: student._id });
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
    ticket.replies.push({ from: student.user.name, message: req.body.message, time: new Date() });
    await ticket.save();
    res.json({ success: true, message: "Reply added" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/subjects", async (req, res) => {
  try { const student = await getStudent(req.user._id); res.json({ success: true, data: student.subjects }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;