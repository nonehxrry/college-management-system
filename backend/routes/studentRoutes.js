const express = require("express");
const path = require("path");
const fs = require("fs");
const router  = express.Router();
const { protect }   = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const uploadMiddleware = require("../middleware/uploadMiddleware");
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

router.get("/attendance/summary", async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    const records = await Attendance.find({ "records.student": student._id }).populate("subject", "name code");
    const totalClasses = records.length;
    const presentCount = records.reduce((sum, record) => {
      const studentRecord = record.records.find((r) => r.student.toString() === student._id.toString());
      return sum + (studentRecord?.status === "present" ? 1 : 0);
    }, 0);
    const overall = totalClasses > 0 ? parseFloat(((presentCount / totalClasses) * 100).toFixed(2)) : 0;
    const bySubject = {};
    records.forEach((record) => {
      const studentRecord = record.records.find((r) => r.student.toString() === student._id.toString());
      if (!studentRecord) return;
      const subjectId = record.subject._id.toString();
      if (!bySubject[subjectId]) bySubject[subjectId] = { subject: record.subject, total: 0, present: 0 };
      bySubject[subjectId].total += 1;
      if (studentRecord.status === "present") bySubject[subjectId].present += 1;
    });
    res.json({
      success: true,
      data: {
        overall,
        totalClasses,
        presentCount,
        absentCount: totalClasses - presentCount,
        perSubject: Object.values(bySubject).map((item) => ({
          subject: item.subject,
          total: item.total,
          present: item.present,
          percentage: item.total > 0 ? Math.round((item.present / item.total) * 100) : 0
        }))
      }
    });
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

router.post("/assignments/:id/submit", uploadMiddleware.single("file"), async (req, res) => {
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

router.put("/profile", uploadMiddleware.single("photo"), async (req, res) => {
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

router.post("/upload/medical", uploadMiddleware.single("file"), async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    if (!req.file) return res.status(400).json({ success: false, message: "File required" });
    const certificate = { url: req.file.path, uploadedAt: new Date(), description: req.body.description || "Medical certificate" };
    student.medicalCertificates = student.medicalCertificates || [];
    student.medicalCertificates.push(certificate);
    await student.save();
    res.status(201).json({ success: true, data: certificate, message: "Medical certificate uploaded" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post("/upload/internship", uploadMiddleware.single("file"), async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    if (!req.file) return res.status(400).json({ success: false, message: "File required" });
    const proof = { url: req.file.path, uploadedAt: new Date(), companyName: req.body.companyName || "Unknown", duration: req.body.duration || "Unknown" };
    student.internshipProofs = student.internshipProofs || [];
    student.internshipProofs.push(proof);
    await student.save();
    res.status(201).json({ success: true, data: proof, message: "Internship proof uploaded" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/profile/idcard", async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    if (!student.idCardUrl) return res.status(404).json({ success: false, message: "Student ID card not available" });
    const cardPath = path.isAbsolute(student.idCardUrl) ? student.idCardUrl : path.join(__dirname, "..", student.idCardUrl);
    if (fs.existsSync(cardPath)) {
      return res.sendFile(cardPath);
    }
    res.status(404).json({ success: false, message: "ID card file not found" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get("/date-sheets/:id/hallticket", async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    const dateSheet = await DateSheet.findById(req.params.id).populate("course department");
    if (!dateSheet || !dateSheet.isPublished) return res.status(404).json({ success: false, message: "Date sheet not available" });
    const hallTicketData = {
      student: {
        name: student.user.name,
        rollNumber: student.rollNumber,
        department: student.department?.name,
        course: student.course?.name,
        semester: student.semester,
        section: student.section,
      },
      examSchedule: dateSheet.exams,
      issuedAt: new Date()
    };
    res.json({ success: true, data: hallTicketData });
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

// ───────────────────────────────────────────────────────────────────────────────
// NEW FEATURES: AI-POWERED STUDENT DASHBOARD & PERSONALIZED RECOMMENDATIONS
// ───────────────────────────────────────────────────────────────────────────────

const {
  predictStudentPerformance,
  analyzeAttendancePatterns,
  recommendCourses,
  detectStudentStress,
  analyzeExamDifficulty
} = require("../utils/advancedAI");

const StudentAnalytics = require("../models/StudentAnalytics");

/**
 * Get comprehensive AI-powered student insights
 */
router.get("/ai/insights", async (req, res) => {
  try {
    const student = await getStudent(req.user._id);

    // Get performance prediction
    const performance = await predictStudentPerformance(student._id);
    
    // Get attendance analysis
    const attendance = await analyzeAttendancePatterns(student._id);
    
    // Get stress indicators
    const stress = await detectStudentStress(student._id);
    
    // Get personalized recommendations
    const recommendations = await recommendCourses(student._id);

    // Save analytics for later retrieval
    await StudentAnalytics.findOneAndUpdate(
      { student: student._id },
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
        recommendations,
        lastUpdated: new Date()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get personalized learning recommendations
 */
router.get("/ai/learning-path", async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    const results = await Result.find({ student: student._id }).sort({ createdAt: -1 }).limit(3);
    
    // Identify weak subjects
    const weakSubjects = [];
    results.forEach(result => {
      result.subjects.forEach(sub => {
        if ((sub.grade || 0) < 2.5) {
          weakSubjects.push(sub.name);
        }
      });
    });

    // Generate learning plan
    const learningPlan = {
      focusAreas: weakSubjects.slice(0, 3),
      studyPlan: generateStudyPlan(weakSubjects),
      resources: generateLearningResources(weakSubjects),
      practiceTopics: generatePracticeTopics(weakSubjects),
      estimatedTimeToImprovement: "4-6 weeks",
      successRate: 85
    };

    res.json({
      success: true,
      data: learningPlan
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get progress tracking dashboard
 */
router.get("/ai/progress", async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    
    // Get all results
    const results = await Result.find({ student: student._id }).sort({ semester: 1 });
    
    // Calculate CGPA trend
    const cgpaTrend = results.map(r => ({
      semester: r.semester,
      cgpa: r.cgpa,
      timestamp: r.createdAt
    }));

    // Get submission rates
    const assignments = await Assignment.find({ subject: { $in: student.subjects } });
    const submissions = await Submission.find({ student: student._id });
    const submissionRate = assignments.length > 0 
      ? ((submissions.length / assignments.length) * 100).toFixed(1)
      : 0;

    // Attendance trend
    const attendanceRecords = await Attendance.find({ "records.student": student._id }).sort({ date: 1 });
    const months = {};
    attendanceRecords.forEach(record => {
      const month = new Date(record.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      if (!months[month]) months[month] = { present: 0, total: 0 };
      months[month].total++;
      if (record.records.some(r => r.student.toString() === student._id && r.status === "present")) {
        months[month].present++;
      }
    });

    const attendanceTrend = Object.entries(months).map(([month, data]) => ({
      month,
      percentage: data.total > 0 ? ((data.present / data.total) * 100).toFixed(1) : 0
    }));

    res.json({
      success: true,
      data: {
        currentCGPA: student.cgpa,
        cgpaTrend,
        submissionRate: parseFloat(submissionRate),
        attendanceTrend,
        overallProgress: calculateOverallProgress(student.cgpa, parseFloat(submissionRate), attendanceTrend),
        improvements: identifyImprovements(results)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get mental health & well-being recommendations
 */
router.get("/ai/wellness", async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    const stress = await detectStudentStress(student._id);

    const wellnessRecommendations = {
      stressLevel: stress.stressLevel,
      recommendations: stress.recommendations,
      supportResources: stress.supportResources,
      wellnessPrograms: stress.wellnessPrograms,
      tips: getWellnessTips(stress.stressLevel),
      counselingRecommended: stress.counselingRecommended,
      emergencyContacts: {
        mentalHealth: "counseling@college.edu",
        supportLine: "+1-800-SUPPORT",
        emergency: "+1-911"
      }
    };

    res.json({
      success: true,
      data: wellnessRecommendations
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get subject-wise performance comparison
 */
router.get("/ai/performance/by-subject", async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    const results = await Result.find({ student: student._id });

    const subjectPerformance = {};
    results.forEach(result => {
      result.subjects.forEach(sub => {
        if (!subjectPerformance[sub.name]) {
          subjectPerformance[sub.name] = {
            name: sub.name,
            grades: [],
            average: 0
          };
        }
        subjectPerformance[sub.name].grades.push(sub.grade || 0);
      });
    });

    // Calculate averages
    Object.keys(subjectPerformance).forEach(subject => {
      const grades = subjectPerformance[subject].grades;
      subjectPerformance[subject].average = (grades.reduce((a, b) => a + b) / grades.length).toFixed(2);
      subjectPerformance[subject].trend = grades[grades.length - 1] > grades[0] ? "improving" : "declining";
    });

    // Sort by performance
    const sorted = Object.values(subjectPerformance)
      .sort((a, b) => parseFloat(b.average) - parseFloat(a.average));

    res.json({
      success: true,
      data: {
        subjects: sorted,
        bestPerformingSubjects: sorted.slice(0, 3),
        needsImprovementSubjects: sorted.slice(-3).reverse(),
        overallComparison: {
          averageGrade: (sorted.reduce((sum, s) => sum + parseFloat(s.average), 0) / sorted.length).toFixed(2),
          bestSubject: sorted[0],
          worstSubject: sorted[sorted.length - 1]
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get peer comparison (anonymized)
 */
router.get("/ai/peer-comparison", async (req, res) => {
  try {
    const student = await getStudent(req.user._id);
    const allStudents = await Student.find({ semester: student.semester, section: student.section });
    
    const classPerformance = [];
    for (const s of allStudents) {
      const result = await Result.findOne({ student: s._id, isPublished: true }).sort({ createdAt: -1 });
      if (result) {
        classPerformance.push({
          cgpa: result.cgpa,
          semester: result.semester
        });
      }
    }

    const studentCGPA = student.cgpa;
    const classCGPAs = classPerformance.map(p => p.cgpa).sort((a, b) => b - a);
    const percentile = classCGPAs.length > 0
      ? ((classCGPAs.filter(c => c < studentCGPA).length / classCGPAs.length) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        yourPerformance: {
          cgpa: studentCGPA,
          percentile: parseFloat(percentile),
          ranking: classCGPAs.filter(c => c > studentCGPA).length + 1
        },
        classStatistics: {
          totalStudents: allStudents.length,
          averageCGPA: (classCGPAs.reduce((a, b) => a + b) / classCGPAs.length).toFixed(2),
          topCGPA: classCGPAs[0],
          minCGPA: classCGPAs[classCGPAs.length - 1]
        },
        performanceLevel: getPerformanceCategory(percentile),
        message: generatePerformanceMessage(percentile)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Helper Functions ─────────────────────────────────────────────────────────

const generateStudyPlan = (weakSubjects) => {
  return [
    { week: "Week 1-2", focus: "Fundamentals", hours: 10 },
    { week: "Week 3-4", focus: "Core Concepts", hours: 12 },
    { week: "Week 5-6", focus: "Problem Solving", hours: 15 }
  ];
};

const generateLearningResources = (subjects) => {
  return [
    { type: "Video Lectures", platform: "YouTube", estimated_time: "20 hours" },
    { type: "Textbooks", recommended: "NCERT + Reference", estimated_time: "30 hours" },
    { type: "Practice Tests", platform: "Online Judge", estimated_time: "25 hours" },
    { type: "Peer Study Groups", frequency: "3x per week", estimated_time: "9 hours" }
  ];
};

const generatePracticeTopics = (subjects) => {
  return [
    "Basic Concepts",
    "Intermediate Problems",
    "Advanced Challenges",
    "Previous Year Questions"
  ];
};

const calculateOverallProgress = (cgpa, submissionRate, attendance) => {
  const cgpaScore = (cgpa / 4) * 100;
  const submissionScore = submissionRate;
  const avgAttendance = attendance.length > 0
    ? attendance.reduce((sum, a) => sum + parseFloat(a.percentage), 0) / attendance.length
    : 0;

  return parseFloat(((cgpaScore * 0.5 + submissionScore * 0.25 + avgAttendance * 0.25) / 100 * 100).toFixed(1));
};

const identifyImprovements = (results) => {
  if (results.length < 2) return [];

  const improvements = [];
  const latest = results[results.length - 1];
  const previous = results[results.length - 2];

  if (latest.cgpa > previous.cgpa) {
    improvements.push({
      type: "CGPA Improvement",
      change: (latest.cgpa - previous.cgpa).toFixed(2),
      positive: true
    });
  }

  return improvements;
};

const getWellnessTips = (stressLevel) => {
  const tips = {
    low: [
      "Keep up the great work!",
      "Maintain your current study-life balance",
      "Help peers who are struggling"
    ],
    moderate: [
      "Try time management techniques",
      "Take short breaks during study sessions",
      "Join a study group for support",
      "Practice meditation or yoga"
    ],
    high: [
      "Seek immediate support from counselor",
      "Break tasks into smaller chunks",
      "Practice deep breathing exercises",
      "Reach out to friends/family",
      "Consider medical consultation if needed"
    ]
  };
  return tips[stressLevel] || tips.moderate;
};

const getPerformanceCategory = (percentile) => {
  const p = parseFloat(percentile);
  if (p >= 90) return "Excellent";
  if (p >= 75) return "Good";
  if (p >= 50) return "Average";
  return "Below Average";
};

const generatePerformanceMessage = (percentile) => {
  const p = parseFloat(percentile);
  if (p >= 90) return "Outstanding performance! You're among the top performers.";
  if (p >= 75) return "Great job! Keep up this performance.";
  if (p >= 50) return "You're performing at the average level. Consider focusing on weak areas.";
  return "You need improvement. Seek help and focus on fundamentals.";
};

module.exports = router;