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

// ───────────────────────────────────────────────────────────────────────────────
// NEW FEATURES: ADVANCED AI INSIGHTS FOR PROFESSOR PANEL
// ───────────────────────────────────────────────────────────────────────────────

const {
  detectPlagiarism,
  analyzeCodeSimilarity
} = require("../utils/plagiarismDetection");

const PlagiarismReport = require("../models/PlagiarismReport");

/**
 * Get advanced analytics dashboard for professor
 */
router.get("/ai/dashboard", async (req, res) => {
  try {
    const professor = await getProfessor(req.user._id);

    // Get submissions statistics
    const totalSubmissions = await Submission.countDocuments({ professor: professor._id });
    const gradedSubmissions = await Submission.countDocuments({ professor: professor._id, marksObtained: { $exists: true } });
    const pendingGrading = totalSubmissions - gradedSubmissions;

    // Get average grades
    const gradeStats = await Submission.aggregate([
      { $match: { professor: professor._id, marksObtained: { $exists: true } } },
      { $group: { _id: null, avgMarks: { $avg: "$marksObtained" }, maxMarks: { $max: "$maxMarks" } } }
    ]);

    // Get assignment performance trends
    const assignments = await Assignment.find({ professor: professor._id }).limit(10);
    const assignmentStats = await Promise.all(
      assignments.map(async (a) => {
        const submissions = await Submission.find({ assignment: a._id, marksObtained: { $exists: true } });
        const avgScore = submissions.length > 0
          ? (submissions.reduce((sum, s) => sum + s.marksObtained, 0) / submissions.length).toFixed(2)
          : 0;
        return {
          assignmentId: a._id,
          title: a.title,
          submissionCount: submissions.length,
          averageScore: avgScore
        };
      })
    );

    res.json({
      success: true,
      data: {
        submissions: {
          total: totalSubmissions,
          graded: gradedSubmissions,
          pending: pendingGrading,
          gradingPercentage: totalSubmissions > 0 ? ((gradedSubmissions / totalSubmissions) * 100).toFixed(1) : 0
        },
        grades: gradeStats[0] || { avgMarks: 0, maxMarks: 0 },
        assignmentPerformance: assignmentStats,
        recommendations: generateProfessorRecommendations(pendingGrading, totalSubmissions)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get student-wise performance analysis for a subject
 */
router.get("/ai/analytics/subject/:subjectId/students", async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);
    if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });

    const students = await Student.find({ subjects: req.params.subjectId })
      .populate("user", "name email")
      .select("_id user rollNumber semester cgpa");

    // Analyze each student's performance
    const studentAnalytics = await Promise.all(
      students.map(async (student) => {
        // Get results for this student in this subject
        const results = await Result.find({ student: student._id, "subjects.subject": req.params.subjectId });
        const grades = results.flatMap(r => 
          r.subjects.filter(s => s.subject.toString() === req.params.subjectId).map(s => s.grade || 0)
        );

        // Get attendance
        const attendance = await Attendance.find({ subject: req.params.subjectId, "records.student": student._id });
        const presentDays = attendance.filter(a => 
          a.records.some(r => r.student.toString() === student._id && r.status === "present")
        ).length;
        const attendancePercentage = attendance.length > 0 ? ((presentDays / attendance.length) * 100).toFixed(1) : 0;

        // Get submissions
        const submissions = await Submission.find({ student: student._id });
        const gradedSubmissions = submissions.filter(s => s.marksObtained !== undefined);
        const averageSubmissionScore = gradedSubmissions.length > 0
          ? (gradedSubmissions.reduce((sum, s) => sum + (s.marksObtained || 0), 0) / gradedSubmissions.length).toFixed(2)
          : 0;

        return {
          studentId: student._id,
          name: student.user.name,
          rollNumber: student.rollNumber,
          examGrades: grades,
          averageGrade: grades.length > 0 ? (grades.reduce((a, b) => a + b) / grades.length).toFixed(2) : "N/A",
          attendance: parseFloat(attendancePercentage),
          assignmentAverage: parseFloat(averageSubmissionScore),
          performanceLevel: getPerformanceLevel(grades, attendancePercentage),
          riskIndicators: getRiskIndicators(grades, attendancePercentage, gradedSubmissions.length)
        };
      })
    );

    // Sort by performance
    studentAnalytics.sort((a, b) => {
      const scoreA = parseFloat(a.averageGrade) || 0;
      const scoreB = parseFloat(b.averageGrade) || 0;
      return scoreB - scoreA;
    });

    res.json({
      success: true,
      data: studentAnalytics,
      summary: {
        totalStudents: studentAnalytics.length,
        averagePerformance: (studentAnalytics.reduce((sum, s) => sum + (parseFloat(s.averageGrade) || 0), 0) / studentAnalytics.length).toFixed(2),
        topPerformers: studentAnalytics.filter(s => s.performanceLevel === "excellent").length,
        needsHelp: studentAnalytics.filter(s => s.performanceLevel === "poor").length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get assignment quality analysis and insights
 */
router.get("/ai/analytics/assignments/:assignmentId/quality", async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });

    const submissions = await Submission.find({ assignment: req.params.assignmentId })
      .populate({ path: "student", populate: { path: "user", select: "name" } });

    // Analyze grade distribution
    const grades = submissions
      .filter(s => s.marksObtained !== undefined)
      .map(s => s.marksObtained);

    const gradeRanges = {
      excellent: grades.filter(g => g >= (assignment.maxMarks * 0.8)).length,
      good: grades.filter(g => g >= (assignment.maxMarks * 0.6) && g < (assignment.maxMarks * 0.8)).length,
      average: grades.filter(g => g >= (assignment.maxMarks * 0.4) && g < (assignment.maxMarks * 0.6)).length,
      below_average: grades.filter(g => g < (assignment.maxMarks * 0.4)).length
    };

    const avgScore = grades.length > 0 ? (grades.reduce((a, b) => a + b) / grades.length).toFixed(2) : 0;

    // Late submissions analysis
    const lateSubmissions = submissions.filter(s => 
      s.submittedAt > new Date(assignment.deadline)
    ).length;

    res.json({
      success: true,
      data: {
        assignment: {
          title: assignment.title,
          maxMarks: assignment.maxMarks,
          deadline: assignment.deadline
        },
        statistics: {
          totalSubmissions: submissions.length,
          gradedSubmissions: grades.length,
          averageScore: avgScore,
          onTimeSubmissions: submissions.length - lateSubmissions,
          lateSubmissions,
          lateSubmissionRate: submissions.length > 0 ? ((lateSubmissions / submissions.length) * 100).toFixed(1) : 0
        },
        gradeDistribution: gradeRanges,
        recommendations: generateAssignmentRecommendations(gradeRanges, lateSubmissions, submissions.length),
        strugglingStudents: submissions
          .filter(s => s.marksObtained !== undefined && s.marksObtained < (assignment.maxMarks * 0.4))
          .map(s => ({
            name: s.student.user.name,
            score: s.marksObtained,
            percentage: ((s.marksObtained / assignment.maxMarks) * 100).toFixed(1),
            needsSupport: true
          }))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Analyze class performance and engagement
 */
router.get("/ai/analytics/class-performance/:subjectId", async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);
    if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });

    // Get all students in class
    const students = await Student.find({ subjects: req.params.subjectId });

    // Attendance analysis
    const attendanceRecords = await Attendance.find({ subject: req.params.subjectId });
    const totalClasses = attendanceRecords.length;

    let totalAttendance = 0;
    let lowAttendanceStudents = 0;
    students.forEach(student => {
      const presentDays = attendanceRecords.filter(a =>
        a.records.some(r => r.student.toString() === student._id && r.status === "present")
      ).length;
      const percentage = totalClasses > 0 ? (presentDays / totalClasses) * 100 : 0;
      totalAttendance += percentage;
      if (percentage < 75) lowAttendanceStudents++;
    });

    const avgAttendance = students.length > 0 ? (totalAttendance / students.length).toFixed(1) : 0;

    // Assignment engagement
    const assignments = await Assignment.find({ subject: req.params.subjectId });
    const allSubmissions = await Submission.find({
      assignment: { $in: assignments.map(a => a._id) }
    });

    const submissionRate = allSubmissions.length > 0
      ? (allSubmissions.length / (assignments.length * students.length) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        subject: {
          name: subject.name,
          code: subject.code,
          studentCount: students.length,
          totalClasses
        },
        attendance: {
          averagePercentage: parseFloat(avgAttendance),
          studentsWithLowAttendance: lowAttendanceStudents,
          riskLevel: avgAttendance < 75 ? "high" : avgAttendance < 85 ? "medium" : "low"
        },
        assignments: {
          total: assignments.length,
          totalSubmissions: allSubmissions.length,
          submissionRate: parseFloat(submissionRate),
          averageGrade: allSubmissions.length > 0
            ? (allSubmissions.reduce((sum, s) => sum + (s.marksObtained || 0), 0) / allSubmissions.length).toFixed(2)
            : 0
        },
        classEngagement: {
          level: submissionRate > 80 ? "high" : submissionRate > 60 ? "moderate" : "low",
          engagementScore: parseFloat(submissionRate)
        },
        recommendations: generateClassRecommendations(avgAttendance, submissionRate, students.length, lowAttendanceStudents)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Plagiarism detection for assignment submissions
 */
router.post("/ai/plagiarism/check-assignment/:assignmentId", async (req, res) => {
  try {
    const submissions = await Submission.find({ assignment: req.params.assignmentId })
      .populate("student");

    const plagiarismResults = [];

    // Check each submission against others
    for (let i = 0; i < submissions.length; i++) {
      for (let j = i + 1; j < submissions.length; j++) {
        const result = await detectPlagiarism(submissions[i], [submissions[j]]);
        if (result.overallSimilarity > 70) {
          plagiarismResults.push({
            submission1: {
              id: submissions[i]._id,
              studentName: submissions[i].student.user?.name
            },
            submission2: {
              id: submissions[j]._id,
              studentName: submissions[j].student.user?.name
            },
            similarity: result.overallSimilarity,
            suspiciousLevel: result.suspiciousLevel
          });
        }
      }
    }

    // Sort by similarity
    plagiarismResults.sort((a, b) => b.similarity - a.similarity);

    res.json({
      success: true,
      data: {
        totalSubmissions: submissions.length,
        suspiciousMatches: plagiarismResults.length,
        results: plagiarismResults.slice(0, 10),
        recommendation: plagiarismResults.length > 0 ? "Review flagged submissions" : "No suspicious matches found"
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Helper Functions ─────────────────────────────────────────────────────────

const generateProfessorRecommendations = (pending, total) => {
  const recommendations = [];
  
  if (pending > 10) {
    recommendations.push("High number of pending submissions - prioritize grading");
  }
  
  if (total > 0 && (pending / total) > 0.3) {
    recommendations.push("Consider extending grading deadline or getting assistance");
  }
  
  return recommendations;
};

const getPerformanceLevel = (grades, attendance) => {
  const avgGrade = grades.length > 0 ? grades.reduce((a, b) => a + b) / grades.length : 0;
  const att = parseFloat(attendance) || 0;
  
  if (avgGrade >= 3.5 && att >= 90) return "excellent";
  if (avgGrade >= 3.0 && att >= 80) return "good";
  if (avgGrade >= 2.0 && att >= 75) return "average";
  return "poor";
};

const getRiskIndicators = (grades, attendance, submissionCount) => {
  const risks = [];
  const avgGrade = grades.length > 0 ? grades.reduce((a, b) => a + b) / grades.length : 0;
  const att = parseFloat(attendance) || 0;
  
  if (att < 75) risks.push("Low attendance");
  if (avgGrade < 2.0) risks.push("Low exam scores");
  if (submissionCount === 0) risks.push("No assignment submissions");
  
  return risks;
};

const generateAssignmentRecommendations = (distribution, lateCount, total) => {
  const recommendations = [];
  
  if (distribution.below_average > (total * 0.3)) {
    recommendations.push("Many students scoring below 40% - review teaching approach");
  }
  
  if ((lateCount / total) > 0.2) {
    recommendations.push("High late submission rate - consider extension");
  }
  
  if (distribution.excellent === 0) {
    recommendations.push("No excellent scores - assignment might be too difficult");
  }
  
  return recommendations;
};

const generateClassRecommendations = (attendance, engagement, studentCount, lowAttendance) => {
  const recommendations = [];
  
  if (attendance < 75) {
    recommendations.push(`${lowAttendance} students have attendance below 75% - follow up required`);
  }
  
  if (engagement < 60) {
    recommendations.push("Low assignment engagement - consider incentives or easier tasks");
  }
  
  return recommendations;
};

module.exports = router;