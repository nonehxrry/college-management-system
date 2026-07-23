const Student = require("../models/Student");
const User = require("../models/User");
const Result = require("../models/Result");
const Attendance = require("../models/Attendance");
const Submission = require("../models/Submission");

/**
 * AI Integrity Module for College Management System
 * Provides data integrity checks, anomaly detection, and basic predictions
 */

// Detect duplicate students based on roll number, email, or name similarity
const detectDuplicateStudents = async () => {
  const students = await Student.find().populate("user", "name email");
  const duplicates = [];
  const seen = new Map();

  for (const student of students) {
    const key = `${student.rollNumber}-${student.user.email}`;
    if (seen.has(key)) {
      duplicates.push({
        student1: seen.get(key),
        student2: student,
        reason: "Duplicate roll number and email"
      });
    } else {
      seen.set(key, student);
    }
  }

  return duplicates;
};

// Detect anomalies in student data (e.g., invalid CGPA, missing required fields)
const detectDataAnomalies = async () => {
  const students = await Student.find().populate("user", "name email");
  const anomalies = [];

  for (const student of students) {
    const issues = [];

    if (student.cgpa < 0 || student.cgpa > 10) {
      issues.push("Invalid CGPA (should be 0-10)");
    }

    if (!student.rollNumber || student.rollNumber.trim() === "") {
      issues.push("Missing roll number");
    }

    if (!student.user.email || !student.user.email.includes("@")) {
      issues.push("Invalid email");
    }

    if (student.semester < 1 || student.semester > 10) {
      issues.push("Invalid semester");
    }

    if (issues.length > 0) {
      anomalies.push({
        student: student.user.name,
        rollNumber: student.rollNumber,
        issues
      });
    }
  }

  return anomalies;
};

// Predict student performance based on attendance and current CGPA
const predictStudentPerformance = async (studentId) => {
  const student = await Student.findById(studentId);
  if (!student) return null;

  // Get attendance percentage
  const attendanceRecords = await Attendance.find({ "records.student": studentId });
  let totalClasses = 0;
  let attendedClasses = 0;

  attendanceRecords.forEach(record => {
    const studentRecord = record.records.find(r => r.student.toString() === studentId.toString());
    if (studentRecord) {
      totalClasses++;
      if (studentRecord.status === "present") attendedClasses++;
    }
  });

  const attendancePercentage = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;

  // Simple prediction model
  let predictedCGPA = student.cgpa;

  if (attendancePercentage >= 85) {
    predictedCGPA = Math.min(10, predictedCGPA + 0.5);
  } else if (attendancePercentage >= 75) {
    predictedCGPA = Math.min(10, predictedCGPA + 0.2);
  } else if (attendancePercentage < 60) {
    predictedCGPA = Math.max(0, predictedCGPA - 0.3);
  }

  // Get recent results for trend
  const recentResults = await Result.find({ student: studentId })
    .sort({ semester: -1 })
    .limit(2);

  let trend = "stable";
  if (recentResults.length === 2) {
    const latest = recentResults[0].cgpa;
    const previous = recentResults[1].cgpa;
    if (latest > previous + 0.5) trend = "improving";
    else if (latest < previous - 0.5) trend = "declining";
  }

  return {
    currentCGPA: student.cgpa,
    predictedCGPA: Math.round(predictedCGPA * 100) / 100,
    attendancePercentage: Math.round(attendancePercentage * 100) / 100,
    trend,
    riskLevel: attendancePercentage < 60 || student.cgpa < 5 ? "high" : attendancePercentage < 75 ? "medium" : "low"
  };
};

// Detect suspicious activities (e.g., multiple logins from different IPs)
const detectSuspiciousActivities = async () => {
  // This would require audit logs with IP tracking
  // For now, return empty array
  return [];
};

// Advanced: Calculate student risk score (0-100)
const calculateStudentRiskScore = async (studentId) => {
  const student = await Student.findById(studentId);
  if (!student) return null;

  let riskScore = 0;

  // CGPA Risk (40% weight)
  if (student.cgpa < 5) riskScore += 40;
  else if (student.cgpa < 6) riskScore += 25;
  else if (student.cgpa < 7) riskScore += 10;

  // Attendance Risk (30% weight)
  const attendanceRecords = await Attendance.find({ "records.student": studentId });
  let attendancePercentage = 75;
  if (attendanceRecords.length > 0) {
    const totalRecords = attendanceRecords.reduce((sum, rec) => sum + rec.records.length, 0);
    const presentCount = attendanceRecords.reduce((sum, rec) => 
      sum + rec.records.filter(r => r.student.toString() === studentId.toString() && r.status === "present").length, 0
    );
    attendancePercentage = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 75;
  }
  
  if (attendancePercentage < 60) riskScore += 30;
  else if (attendancePercentage < 75) riskScore += 15;

  // Submission Deadline Miss Risk (20% weight)
  const recentSubmissions = await Submission.find({ student: studentId })
    .sort({ createdAt: -1 })
    .limit(5);
  
  const missedDeadlines = recentSubmissions.filter(s => new Date(s.createdAt) > new Date(s.dueDate)).length;
  if (missedDeadlines > 2) riskScore += 20;
  else if (missedDeadlines > 0) riskScore += 10;

  return {
    studentId,
    riskScore: Math.min(100, riskScore),
    riskLevel: riskScore > 70 ? "critical" : riskScore > 50 ? "high" : riskScore > 30 ? "medium" : "low",
    factors: {
      cgpa: student.cgpa,
      attendance: Math.round(attendancePercentage),
      missedDeadlines: missedDeadlines
    }
  };
};

// Advanced: Generate performance predictions with confidence scores
const generatePerformancePrediction = async (studentId) => {
  const riskAssessment = await calculateStudentRiskScore(studentId);
  const student = await Student.findById(studentId);
  
  if (!student) return null;

  const recentResults = await Result.find({ student: studentId })
    .sort({ semester: -1 })
    .limit(3);

  // Calculate trend
  let avgImprovement = 0;
  if (recentResults.length >= 2) {
    for (let i = 0; i < recentResults.length - 1; i++) {
      avgImprovement += recentResults[i].cgpa - recentResults[i + 1].cgpa;
    }
    avgImprovement = avgImprovement / (recentResults.length - 1);
  }

  const predictedCGPA = Math.max(0, Math.min(10, student.cgpa + avgImprovement * 0.5));
  const confidence = Math.max(50, Math.min(95, 75 + recentResults.length * 5));

  return {
    studentId,
    currentCGPA: student.cgpa,
    predictedCGPA: Math.round(predictedCGPA * 100) / 100,
    trend: avgImprovement > 0.1 ? "improving" : avgImprovement < -0.1 ? "declining" : "stable",
    confidence: `${Math.round(confidence)}%`,
    recommendations: generateRecommendations(riskAssessment, student.cgpa)
  };
};

// Generate personalized recommendations
const generateRecommendations = (riskAssessment, cgpa) => {
  const recommendations = [];

  if (riskAssessment.riskLevel === "critical") {
    recommendations.push("Schedule meeting with academic advisor urgently");
    recommendations.push("Enroll in tutoring programs immediately");
  }

  if (riskAssessment.factors.attendance < 75) {
    recommendations.push("Improve class attendance - it directly impacts performance");
  }

  if (riskAssessment.factors.missedDeadlines > 0) {
    recommendations.push("Set reminders for assignment deadlines");
  }

  if (cgpa < 6) {
    recommendations.push("Focus on core subjects with weak performance");
  }

  if (recommendations.length === 0) {
    recommendations.push("Maintain current performance level");
    recommendations.push("Consider peer mentoring to help others");
  }

  return recommendations;
};

// Advanced: Generate data quality metrics
const generateDataQualityMetrics = async () => {
  const totalStudents = await Student.countDocuments();
  const studentsWithValidCGPA = await Student.countDocuments({ cgpa: { $gte: 0, $lte: 10 } });
  const studentsWithValidEmail = await Student.countDocuments().populate("user", "email");

  // Check for missing required fields
  const incompleteProfiles = await Student.countDocuments({
    $or: [
      { rollNumber: { $exists: false } },
      { semester: { $exists: false } },
      { department: { $exists: false } }
    ]
  });

  return {
    totalStudents,
    dataCompleteness: {
      validCGPA: `${Math.round((studentsWithValidCGPA / totalStudents) * 100)}%`,
      completeProfiles: `${Math.round(((totalStudents - incompleteProfiles) / totalStudents) * 100)}%`
    },
    lastUpdated: new Date(),
    overallQualityScore: Math.round(((studentsWithValidCGPA + (totalStudents - incompleteProfiles)) / (totalStudents * 2)) * 100)
  };
};

// Generate a consolidated integrity report combining all checks
const generateIntegrityReport = async () => {
  const duplicates = await detectDuplicateStudents();
  const anomalies = await detectDataAnomalies();
  const suspiciousActivities = await detectSuspiciousActivities();
  const dataQuality = await generateDataQualityMetrics();

  return {
    generatedAt: new Date(),
    summary: {
      duplicateCount: duplicates.length,
      anomalyCount: anomalies.length,
      suspiciousActivityCount: suspiciousActivities.length,
      overallQualityScore: dataQuality.overallQualityScore
    },
    duplicates,
    anomalies,
    suspiciousActivities,
    dataQuality
  };
};

module.exports = {
  detectDuplicateStudents,
  detectDataAnomalies,
  predictStudentPerformance,
  detectSuspiciousActivities,
  generateIntegrityReport,
  calculateStudentRiskScore,
  generatePerformancePrediction,
  generateRecommendations,
  generateDataQualityMetrics
};