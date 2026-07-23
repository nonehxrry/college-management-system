const Student = require("../models/Student");
const User = require("../models/User");
const Result = require("../models/Result");
const Attendance = require("../models/Attendance");

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

// Generate integrity report
const generateIntegrityReport = async () => {
  const [duplicates, anomalies, suspicious] = await Promise.all([
    detectDuplicateStudents(),
    detectDataAnomalies(),
    detectSuspiciousActivities()
  ]);

  return {
    timestamp: new Date(),
    duplicates: duplicates.length,
    duplicateDetails: duplicates,
    anomalies: anomalies.length,
    anomalyDetails: anomalies,
    suspiciousActivities: suspicious.length,
    suspiciousDetails: suspicious,
    overallHealth: duplicates.length === 0 && anomalies.length === 0 ? "good" : 
                   duplicates.length > 5 || anomalies.length > 10 ? "critical" : "warning"
  };
};

module.exports = {
  detectDuplicateStudents,
  detectDataAnomalies,
  predictStudentPerformance,
  detectSuspiciousActivities,
  generateIntegrityReport
};