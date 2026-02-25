const express = require("express");
const router  = express.Router();
const { protect }   = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const upload        = require("../middleware/uploadMiddleware");
const User       = require("../models/User");
const Student    = require("../models/Student");
const Professor  = require("../models/Professor");
const Department = require("../models/Department");
const Subject    = require("../models/Subject");
const Course     = require("../models/Course");
const Result     = require("../models/Result");
const DateSheet  = require("../models/DateSheet");
const Notice     = require("../models/Notice");
const FeeRecord  = require("../models/FeeRecord");
const AuditLog   = require("../models/AuditLog");
const Ticket     = require("../models/Ticket");

router.use(protect);
router.use(authorize("admin"));

// DASHBOARD
router.get("/dashboard", async (req, res) => {
  try {
    const totalStudents    = await Student.countDocuments();
    const totalProfessors  = await Professor.countDocuments();
    const totalDepartments = await Department.countDocuments();
    const pendingTickets   = await Ticket.countDocuments({ status: "open" });
    const recentUsers      = await User.find().sort({ createdAt: -1 }).limit(5).select("name email role createdAt avatar");
    res.json({ success: true, data: { totalStudents, totalProfessors, totalDepartments, pendingTickets, recentUsers } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// USERS
router.get("/users", async (req, res) => {
  try {
    const { role, search, isActive, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role)     query.role     = role;
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (search)   query.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).select("-password -refreshToken");
    res.json({ success: true, data: users, pagination: { total, page: Number(page), pages: Math.ceil(total / limit), limit: Number(limit) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post("/users", async (req, res) => {
  try {
    const { name, email, password, role, department, rollNumber, employeeId, semester, section, designation } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ success: false, message: "Name, email, password and role required" });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: "Email already registered" });
    const user = await User.create({ name, email, password, role });
    if (role === "student") {
      await Student.create({ user: user._id, rollNumber, department, semester: semester || 1, section: section || "A" });
    } else if (role === "professor") {
      await Professor.create({ user: user._id, employeeId, department, designation: designation || "Assistant Professor" });
    }
    res.status(201).json({ success: true, message: `${role} created successfully`, data: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put("/users/:id", async (req, res) => {
  try {
    const { name, email, isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { ...(name && { name }), ...(email && { email }), ...(isActive !== undefined && { isActive }) }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user, message: "User updated" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.role === "student")   await Student.findOneAndDelete({ user: req.params.id });
    if (user.role === "professor") await Professor.findOneAndDelete({ user: req.params.id });
    res.json({ success: true, message: "User deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put("/users/:id/toggle-status", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? "activated" : "deactivated"}`, data: { isActive: user.isActive } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put("/users/:id/reset-password", async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DEPARTMENTS
router.get("/departments", async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json({ success: true, data: departments });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post("/departments", async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, message: "Name and code required" });
    const dept = await Department.create({ name, code, description });
    res.status(201).json({ success: true, data: dept });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put("/departments/:id", async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!dept) return res.status(404).json({ success: false, message: "Department not found" });
    res.json({ success: true, data: dept });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete("/departments/:id", async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Department deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// SUBJECTS
router.get("/subjects", async (req, res) => {
  try {
    const { department, semester } = req.query;
    const query = {};
    if (department) query.department = department;
    if (semester)   query.semester   = semester;
    const subjects = await Subject.find(query).populate("department", "name code").populate("professor", "name").sort({ semester: 1, name: 1 });
    res.json({ success: true, data: subjects });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post("/subjects", async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json({ success: true, data: subject });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put("/subjects/:id", async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });
    res.json({ success: true, data: subject });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete("/subjects/:id", async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Subject deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put("/subjects/:id/assign-faculty", async (req, res) => {
  try {
    const { professorId } = req.body;
    const professor = await Professor.findById(professorId);
    if (!professor) return res.status(404).json({ success: false, message: "Professor not found" });
    await Subject.findByIdAndUpdate(req.params.id, { professor: professor._id });
    if (!professor.subjects.includes(req.params.id)) { professor.subjects.push(req.params.id); await professor.save(); }
    res.json({ success: true, message: "Faculty assigned" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// RESULTS
router.get("/results", async (req, res) => {
  try {
    const { department, semester, isPublished, page = 1, limit = 20 } = req.query;
    const query = {};
    if (semester)    query.semester    = semester;
    if (isPublished !== undefined) query.isPublished = isPublished === "true";
    const total   = await Result.countDocuments(query);
    const results = await Result.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).populate({ path: "student", populate: { path: "user", select: "name" } });
    res.json({ success: true, data: results, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post("/results/publish", async (req, res) => {
  try {
    const { resultIds } = req.body;
    if (!Array.isArray(resultIds)) return res.status(400).json({ success: false, message: "resultIds array required" });
    await Result.updateMany({ _id: { $in: resultIds } }, { isPublished: true, publishedAt: new Date() });
    const io = req.app.get("io");
    if (io) io.to("role:student").emit("new_notification", { type: "result", title: "Results Published", message: "Your results are now available" });
    res.json({ success: true, message: `${resultIds.length} result(s) published` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put("/results/:id/lock", async (req, res) => {
  try {
    await Result.findByIdAndUpdate(req.params.id, { isLocked: true });
    res.json({ success: true, message: "Result locked" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DATE SHEETS
router.get("/date-sheets", async (req, res) => {
  try {
    const dateSheets = await DateSheet.find().populate("department", "name code").sort({ createdAt: -1 });
    res.json({ success: true, data: dateSheets });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post("/date-sheets", async (req, res) => {
  try {
    const ds = await DateSheet.create({ ...req.body, isPublished: false });
    res.status(201).json({ success: true, data: ds });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put("/date-sheets/:id", async (req, res) => {
  try {
    const ds = await DateSheet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ds) return res.status(404).json({ success: false, message: "Date sheet not found" });
    res.json({ success: true, data: ds });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put("/date-sheets/:id/publish", async (req, res) => {
  try {
    await DateSheet.findByIdAndUpdate(req.params.id, { isPublished: true, publishedAt: new Date() });
    const io = req.app.get("io");
    if (io) io.to("role:student").emit("new_notification", { type: "notice", title: "Exam Date Sheet Published", message: "Check the exam schedule in your portal" });
    res.json({ success: true, message: "Date sheet published" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete("/date-sheets/:id", async (req, res) => {
  try {
    await DateSheet.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Date sheet deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// NOTICES
router.get("/notices", async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: notices });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post("/notices", upload.single("attachment"), async (req, res) => {
  try {
    const { title, content, targetType, priority, isForced, scheduledAt, expiresAt } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: "Title and content required" });
    const notice = await Notice.create({ title, content, createdBy: req.user.name || "Admin", createdByRef: req.user._id, targetType: targetType || "global", priority: priority || "normal", isForced: isForced === "true", scheduledAt: scheduledAt ? new Date(scheduledAt) : null, expiresAt: expiresAt ? new Date(expiresAt) : null, attachmentUrl: req.file?.path, isActive: true });
    const io = req.app.get("io");
    if (io && !scheduledAt) io.to("role:student").emit("new_notification", { type: "notice", title: notice.title, message: notice.content.slice(0, 100), isForced: notice.isForced, _id: notice._id });
    res.status(201).json({ success: true, data: notice, message: "Notice sent" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete("/notices/:id", async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Notice deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// FEES
router.get("/fees", async (req, res) => {
  try {
    const { status, semester, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status)   query.status   = status;
    if (semester) query.semester = semester;
    const total   = await FeeRecord.countDocuments(query);
    const fees    = await FeeRecord.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).populate({ path: "student", populate: { path: "user", select: "name" } });
    res.json({ success: true, data: fees, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post("/fees", async (req, res) => {
  try {
    const { studentId, semester, academicYear } = req.body;
    if (!studentId || !semester) return res.status(400).json({ success: false, message: "Student and semester required" });
    const fee = await FeeRecord.create({ student: studentId, semester, academicYear, status: "pending", paidAmount: 0 });
    res.status(201).json({ success: true, data: fee });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put("/fees/:id/payment", async (req, res) => {
  try {
    const { amount, mode, transactionId, remarks } = req.body;
    const fee = await FeeRecord.findById(req.params.id);
    if (!fee) return res.status(404).json({ success: false, message: "Fee record not found" });
    fee.paidAmount += Number(amount);
    fee.payments   = fee.payments || [];
    fee.payments.push({ amount: Number(amount), mode, transactionId, remarks, paidAt: new Date() });
    fee.status = fee.paidAmount >= fee.totalAmount ? "paid" : "partial";
    fee.lastPaymentDate = new Date();
    await fee.save();
    res.json({ success: true, data: fee, message: "Payment recorded" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// AUDIT LOGS
router.get("/audit-logs", async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const total = await AuditLog.countDocuments();
    const logs  = await AuditLog.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).populate("user", "name email role");
    res.json({ success: true, data: logs, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// SETTINGS (basic in-memory — replace with DB model if needed)
router.get("/settings", async (req, res) => {
  res.json({ success: true, data: { collegeName: "Demo College of Engineering", academicYear: "2024-25", attendanceThreshold: 75, allowLateSubmissions: true, maxFileSize: 25 } });
});

router.put("/settings", async (req, res) => {
  res.json({ success: true, message: "Settings updated", data: req.body });
});

module.exports = router;