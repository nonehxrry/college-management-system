const mongoose = require("mongoose");

/**
 * Tracks AI-based predictions and recommendations for students
 */
const studentAnalyticsSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      unique: true
    },
    performancePrediction: {
      predictedCGPA: Number,
      currentCGPA: Number,
      trend: { type: String, enum: ["improving", "declining", "stable"] },
      riskLevel: { type: String, enum: ["low", "medium", "high"] },
      confidence: Number,
      lastUpdated: { type: Date, default: Date.now }
    },
    attendanceAnalysis: {
      percentage: Number,
      weeklyPattern: Object,
      trend: String,
      riskOfWarning: Boolean,
      lastUpdated: { type: Date, default: Date.now }
    },
    stressIndicators: {
      stressScore: Number,
      stressLevel: { type: String, enum: ["low", "moderate", "high"] },
      factors: Array,
      lastAssessment: { type: Date, default: Date.now }
    },
    courseRecommendations: [
      {
        name: String,
        matchScore: Number,
        reason: String
      }
    ],
    recommendedActions: [String],
    lastAnalyzedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudentAnalytics", studentAnalyticsSchema);
