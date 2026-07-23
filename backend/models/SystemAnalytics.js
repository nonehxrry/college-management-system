const mongoose = require("mongoose");

/**
 * System Analytics - tracks system health, performance metrics, and usage
 */
const systemAnalyticsSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    metrics: {
      apiResponseTime: Number,
      activeUsers: Number,
      totalRequests: Number,
      failedRequests: Number,
      databaseQueryTime: Number,
      memoryUsage: Number,
      cpuUsage: Number
    },
    users: {
      totalStudents: Number,
      totalProfessors: Number,
      totalAdmins: Number,
      activeSessionCount: Number,
      newUsersToday: Number
    },
    activities: {
      assignmentsSubmitted: Number,
      attendanceMarked: Number,
      resultsPublished: Number,
      noticesPosted: Number
    },
    systemHealth: {
      status: { type: String, enum: ["healthy", "warning", "critical"] },
      uptime: Number,
      lastErrorCount: Number,
      databaseStatus: String,
      apiStatus: String
    },
    performance: {
      pageLoadTime: Number,
      apiEndpointStats: [
        {
          endpoint: String,
          avgResponseTime: Number,
          errorRate: Number,
          callCount: Number
        }
      ]
    }
  },
  { timestamps: true }
);

// TTL index - keep analytics for 90 days
systemAnalyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model("SystemAnalytics", systemAnalyticsSchema);
