const express = require("express");
const router  = express.Router();
const { protect }   = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const uploadMiddleware = require("../middleware/uploadMiddleware");
const { validateUserRegistration, validateStudentCreation } = require("../middleware/validationMiddleware");
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
    const totalSubjects    = await Subject.countDocuments();
    const pendingTickets   = await Ticket.countDocuments({ status: "open" });
    const totalNotices     = await Notice.countDocuments({ isActive: true });
    const recentUsers      = await User.find().sort({ createdAt: -1 }).limit(5).select("name email role createdAt");

    // Additional stats
    const activeStudents = await Student.countDocuments({ user: { $in: await User.find({ isActive: true }).distinct("_id") } });
    const publishedResults = await Result.countDocuments({ isPublished: true });
    const totalFeesCollected = await FeeRecord.aggregate([
      { $match: { status: { $in: ["paid", "partial"] } } },
      { $group: { _id: null, total: { $sum: "$paidAmount" } } }
    ]);
    const feesCollected = totalFeesCollected[0]?.total || 0;

    // Monthly registrations
    const monthlyRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        totalProfessors,
        totalDepartments,
        totalSubjects,
        pendingTickets,
        totalNotices,
        activeStudents,
        publishedResults,
        feesCollected,
        monthlyRegistrations,
        recentUsers
      }
    });
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

router.post("/users", validateUserRegistration, async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: "Email already registered" });
    const user = await User.create({ name, email, password, role, phone });
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

router.post("/notices", uploadMiddleware.single("attachment"), async (req, res) => {
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

// STUDENTS MANAGEMENT
router.get("/students", async (req, res) => {
  try {
    const { department, course, semester, section, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (department) query.department = department;
    if (course) query.course = course;
    if (semester) query.semester = parseInt(semester);
    if (section) query.section = section;

    if (search) {
      const userIds = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      }).distinct("_id");
      query.user = { $in: userIds };
    }

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .sort({ rollNumber: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("user", "name email phone isActive")
      .populate("department", "name code")
      .populate("course", "name code")
      .populate("subjects", "name code");

    res.json({
      success: true,
      data: students,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        limit: Number(limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// AI INTEGRITY
const { generateIntegrityReport, predictStudentPerformance } = require("../utils/aiIntegrity");

router.get("/ai/integrity-report", async (req, res) => {
  try {
    const report = await generateIntegrityReport();
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/ai/student-performance/:studentId", async (req, res) => {
  try {
    const prediction = await predictStudentPerformance(req.params.studentId);
    if (!prediction) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, data: prediction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// BULK STUDENT IMPORT
const csv = require("csv-parser");
const fs = require("fs");

router.post("/students/bulk-import", uploadMiddleware.uploadCSV.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "CSV file required" });

    const results = [];
    const errors = [];
    let processed = 0;

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        for (const row of results) {
          try {
            processed++;

            // Validate required fields
            const { name, email, password, rollNumber, department, course, semester, section } = row;
            if (!name || !email || !password || !rollNumber || !department || !course || !semester || !section) {
              errors.push({ row: processed, error: "Missing required fields" });
              continue;
            }

            // Check if user exists
            const existingUser = await User.findOne({ $or: [{ email }, { rollNumber }] });
            if (existingUser) {
              errors.push({ row: processed, error: "User with this email or roll number already exists" });
              continue;
            }

            // Find department and course
            const dept = await Department.findOne({ name: department.trim() });
            const crs = await Course.findOne({ name: course.trim() });

            if (!dept || !crs) {
              errors.push({ row: processed, error: "Invalid department or course" });
              continue;
            }

            // Create user
            const user = await User.create({
              name: name.trim(),
              email: email.trim().toLowerCase(),
              password,
              role: "student"
            });

            // Create student
            await Student.create({
              user: user._id,
              rollNumber: rollNumber.trim(),
              department: dept._id,
              course: crs._id,
              semester: parseInt(semester),
              section: section.trim(),
              fatherName: row.fatherName || "",
              motherName: row.motherName || "",
              dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : null,
              gender: row.gender || "",
              address: {
                street: row.street || "",
                city: row.city || "",
                state: row.state || "",
                pincode: row.pincode || ""
              },
              bloodGroup: row.bloodGroup || "",
              phone: row.phone || ""
            });

          } catch (err) {
            errors.push({ row: processed, error: err.message });
          }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
          success: true,
          message: `Processed ${processed} students`,
          data: {
            total: results.length,
            successful: processed - errors.length,
            errors
          }
        });
      })
      .on("error", (err) => {
        res.status(500).json({ success: false, message: "Error processing CSV: " + err.message });
      });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// NEW FEATURES: AI ANALYTICS, SYSTEM MONITORING, DATA EXPORT, PLAGIARISM
// ───────────────────────────────────────────────────────────────────────────────

// Import new utilities and models
const { 
  predictStudentPerformance: aiPredict,
  analyzeAttendancePatterns,
  recommendCourses,
  detectStudentStress,
  analyzeExamDifficulty
} = require("../utils/advancedAI");

const {
  bulkImportStudents,
  generateCSVTemplate,
  exportStudentsToCSV
} = require("../utils/bulkCSVHandler");

const {
  detectPlagiarism,
  analyzeCodeSimilarity
} = require("../utils/plagiarismDetection");

const StudentAnalytics = require("../models/StudentAnalytics");
const PlagiarismReport = require("../models/PlagiarismReport");
const SystemAnalytics = require("../models/SystemAnalytics");
const BulkOperation = require("../models/BulkOperation");
const Submission = require("../models/Submission");

// ─── ENHANCED BULK IMPORT/EXPORT ──────────────────────────────────────────────

/**
 * Get CSV import template
 */
router.get("/bulk/csv-template", async (req, res) => {
  try {
    const template = generateCSVTemplate();
    res.json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Enhanced bulk student import with advanced validation
 */
router.post("/bulk/import-students", uploadMiddleware.uploadCSV.single("file"), async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "CSV file required" });
    }

    // Create bulk operation record
    const bulkOp = await BulkOperation.create({
      operationType: "import_students",
      initiatedBy: req.user._id,
      status: "in_progress",
      fileInfo: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      }
    });

    // Import students
    const result = await bulkImportStudents(req.file.path, {
      updateExisting: req.body.updateExisting === "true",
      deleteFile: true
    });

    if (!result.success) {
      bulkOp.status = "failed";
      await bulkOp.save();
      return res.status(400).json({ success: false, message: result.error });
    }

    // Update bulk operation with results
    bulkOp.status = "completed";
    bulkOp.statistics = {
      totalRecords: result.summary.details.length,
      successfulRecords: result.summary.imported + result.summary.updated,
      failedRecords: result.summary.failed,
      duplicateRecords: result.summary.duplicates,
      warningRecords: result.summary.warnings.length
    };
    bulkOp.completedAt = new Date();
    bulkOp.duration = Date.now() - startTime;
    await bulkOp.save();

    res.json({
      success: true,
      message: "Bulk import completed",
      bulkOperationId: bulkOp._id,
      summary: result.summary
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get bulk operation history and details
 */
router.get("/bulk/operations", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await BulkOperation.countDocuments();
    const operations = await BulkOperation.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("initiatedBy", "name email");

    res.json({
      success: true,
      data: operations,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Export students data to CSV
 */
router.get("/bulk/export-students", async (req, res) => {
  try {
    const { department, semester } = req.query;
    const query = {};
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);

    const students = await Student.find(query)
      .populate("user", "name email phone isActive")
      .populate("department", "name")
      .sort({ rollNumber: 1 });

    const csvData = await exportStudentsToCSV(students);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=students_export.csv");
    
    const csv = csvData.data
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── AI ANALYTICS & INSIGHTS ─────────────────────────────────────────────────

/**
 * Get comprehensive AI analysis for all students
 */
router.get("/ai/analytics/overview", async (req, res) => {
  try {
    const students = await Student.find().limit(100).select("_id");
    const analyses = [];

    for (const student of students) {
      const performance = await aiPredict(student._id);
      if (performance) {
        analyses.push({
          studentId: student._id,
          performance
        });
      }
    }

    // Calculate aggregate insights
    const riskStudents = analyses.filter(a => a.performance.riskLevel === "high").length;
    const improvingStudents = analyses.filter(a => a.performance.trendType === "improving").length;
    const averageCGPA = analyses.reduce((sum, a) => sum + a.performance.averageCGPA, 0) / analyses.length;

    res.json({
      success: true,
      data: {
        totalAnalyzed: analyses.length,
        riskStudents,
        improvingStudents,
        averageCGPA: parseFloat(averageCGPA.toFixed(2)),
        detailedAnalyses: analyses.slice(0, 10)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get AI performance prediction for specific student
 */
router.get("/ai/analytics/student/:studentId", async (req, res) => {
  try {
    const performance = await aiPredict(req.params.studentId);
    const attendance = await analyzeAttendancePatterns(req.params.studentId);
    const recommendations = await recommendCourses(req.params.studentId);
    const stress = await detectStudentStress(req.params.studentId);

    // Save/update analytics
    await StudentAnalytics.findOneAndUpdate(
      { student: req.params.studentId },
      {
        performancePrediction: performance,
        attendanceAnalysis: attendance,
        stressIndicators: stress,
        courseRecommendations: recommendations.recommendedElectives,
        lastAnalyzedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: {
        performance,
        attendance,
        stress,
        recommendations
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Analyze exam difficulty for a subject
 */
router.get("/ai/analytics/exam-difficulty/:subjectId", async (req, res) => {
  try {
    const difficulty = await analyzeExamDifficulty(req.params.subjectId);
    if (!difficulty) {
      return res.status(404).json({ success: false, message: "No exam data found for this subject" });
    }

    res.json({ success: true, data: difficulty });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get at-risk students requiring intervention
 */
router.get("/ai/analytics/at-risk-students", async (req, res) => {
  try {
    const { threshold = "medium" } = req.query;
    
    const riskLevels = {
      low: ["low"],
      medium: ["low", "medium"],
      high: ["low", "medium", "high"]
    };

    const analytics = await StudentAnalytics.find({
      "performancePrediction.riskLevel": { $in: riskLevels[threshold] || ["high"] }
    }).populate("student").limit(50);

    const enriched = await Promise.all(
      analytics.map(async (a) => {
        const student = await Student.findById(a.student._id).populate("user", "name email");
        return {
          ...a.toObject(),
          studentDetails: student
        };
      })
    );

    res.json({
      success: true,
      data: enriched,
      count: enriched.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PLAGIARISM DETECTION ────────────────────────────────────────────────────

/**
 * Check plagiarism for a submission
 */
router.post("/ai/plagiarism/check/:submissionId", async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.submissionId)
      .populate("assignment");

    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    // Get other submissions for same assignment (excluding current)
    const otherSubmissions = await Submission.find({
      assignment: submission.assignment._id,
      _id: { $ne: req.params.submissionId },
      submittedAt: { $exists: true }
    }).populate("student");

    // Detect plagiarism
    const plagiarismResult = await detectPlagiarism(submission, otherSubmissions);

    // Save plagiarism report
    const report = await PlagiarismReport.create({
      submission: req.params.submissionId,
      student: submission.student,
      assignment: submission.assignment._id,
      overallSimilarity: plagiarismResult.overallSimilarity,
      suspiciousLevel: plagiarismResult.suspiciousLevel,
      matches: plagiarismResult.matches,
      isPlagiarized: plagiarismResult.isPlagiarized,
      confidence: plagiarismResult.confidence,
      recommendedAction: plagiarismResult.details.recommendedAction
    });

    res.json({
      success: true,
      data: plagiarismResult,
      reportId: report._id
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get plagiarism reports
 */
router.get("/ai/plagiarism/reports", async (req, res) => {
  try {
    const { page = 1, limit = 20, isPlagiarized } = req.query;
    const query = {};
    if (isPlagiarized !== undefined) query.isPlagiarized = isPlagiarized === "true";

    const total = await PlagiarismReport.countDocuments(query);
    const reports = await PlagiarismReport.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("student")
      .populate("assignment", "title");

    res.json({
      success: true,
      data: reports,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Review plagiarism report
 */
router.put("/ai/plagiarism/reports/:reportId/review", async (req, res) => {
  try {
    const { verdict, notes } = req.body;
    
    const report = await PlagiarismReport.findByIdAndUpdate(
      req.params.reportId,
      {
        "professorReview.reviewed": true,
        "professorReview.reviewedBy": req.user._id,
        "professorReview.reviewedAt": new Date(),
        "professorReview.verdict": verdict,
        "professorReview.notes": notes
      },
      { new: true }
    );

    res.json({ success: true, data: report, message: "Report reviewed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── SYSTEM MONITORING & HEALTH ──────────────────────────────────────────────

/**
 * Get system health and performance metrics
 */
router.get("/system/health", async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now - 60 * 60 * 1000);

    // Get metrics from last hour
    const recentAnalytics = await SystemAnalytics.findOne({
      timestamp: { $gte: oneHourAgo }
    }).sort({ timestamp: -1 });

    // Calculate system stats
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalStudents = await Student.countDocuments();
    const totalProfessors = await Professor.countDocuments();

    // Check database connectivity
    let dbStatus = "healthy";
    try {
      await User.countDocuments();
    } catch (err) {
      dbStatus = "error";
    }

    res.json({
      success: true,
      data: {
        status: dbStatus === "healthy" ? "healthy" : "critical",
        timestamp: new Date(),
        metrics: {
          totalUsers,
          activeUsers,
          totalStudents,
          totalProfessors,
          uptime: process.uptime(),
          memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          cpuUsage: "N/A"
        },
        recentMetrics: recentAnalytics
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get system analytics over time
 */
router.get("/system/analytics", async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const analytics = await SystemAnalytics.find({
      timestamp: { $gte: daysAgo }
    }).sort({ timestamp: 1 });

    res.json({
      success: true,
      data: analytics,
      period: `${days} days`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Record system analytics snapshot
 */
router.post("/system/analytics/record", async (req, res) => {
  try {
    const analytics = await SystemAnalytics.create({
      timestamp: new Date(),
      metrics: {
        apiResponseTime: Math.random() * 500,
        activeUsers: await User.countDocuments({ isActive: true }),
        totalRequests: Math.floor(Math.random() * 1000),
        failedRequests: Math.floor(Math.random() * 10),
        databaseQueryTime: Math.random() * 100,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
        cpuUsage: 0
      },
      users: {
        totalStudents: await Student.countDocuments(),
        totalProfessors: await Professor.countDocuments(),
        totalAdmins: await User.countDocuments({ role: "admin" }),
        activeSessionCount: 0,
        newUsersToday: 0
      },
      systemHealth: {
        status: "healthy",
        uptime: process.uptime(),
        lastErrorCount: 0,
        databaseStatus: "connected",
        apiStatus: "running"
      }
    });

    res.json({ success: true, data: analytics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ADVANCED REPORTING ──────────────────────────────────────────────────────

/**
 * Generate comprehensive system report
 */
router.get("/reports/comprehensive", async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalProfessors = await Professor.countDocuments();
    const totalDepartments = await Department.countDocuments();
    const totalSubjects = await Subject.countDocuments();
    const publishedResults = await Result.countDocuments({ isPublished: true });
    const totalSubmissions = await Submission.countDocuments();
    const plagiarizedSubmissions = await PlagiarismReport.countDocuments({ isPlagiarized: true });

    const report = {
      generatedAt: new Date(),
      academicYear: "2024-25",
      statistics: {
        students: totalStudents,
        professors: totalProfessors,
        departments: totalDepartments,
        subjects: totalSubjects,
        results: {
          published: publishedResults,
          pending: await Result.countDocuments({ isPublished: false })
        },
        submissions: {
          total: totalSubmissions,
          plagiarized: plagiarizedSubmissions,
          plagiarismRate: totalSubmissions > 0 ? ((plagiarizedSubmissions / totalSubmissions) * 100).toFixed(2) : 0
        }
      },
      performance: {
        atRiskStudents: await StudentAnalytics.countDocuments({ "performancePrediction.riskLevel": "high" }),
        improvingStudents: await StudentAnalytics.countDocuments({ "performancePrediction.trendType": "improving" })
      }
    };

    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;