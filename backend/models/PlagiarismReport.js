const mongoose = require("mongoose");

/**
 * Plagiarism detection report for submissions
 */
const plagiarismReportSchema = new mongoose.Schema(
  {
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true
    },
    overallSimilarity: {
      type: Number,
      min: 0,
      max: 100
    },
    suspiciousLevel: {
      type: String,
      enum: ["low", "moderate", "high", "very_high"]
    },
    matches: [
      {
        matchedWithSubmission: mongoose.Schema.Types.ObjectId,
        matchedWithStudent: String,
        similarity: Number,
        matchedPhrases: [String]
      }
    ],
    isPlagiarized: Boolean,
    confidence: Number,
    recommendedAction: String,
    professorReview: {
      reviewed: Boolean,
      reviewedBy: mongoose.Schema.Types.ObjectId,
      reviewedAt: Date,
      verdict: { type: String, enum: ["confirmed", "false_positive", "pending"] },
      notes: String
    },
    metadataSuspicions: [
      {
        pattern: String,
        severity: String,
        details: String
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlagiarismReport", plagiarismReportSchema);
