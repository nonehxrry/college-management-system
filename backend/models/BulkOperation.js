const mongoose = require("mongoose");

/**
 * Tracks bulk operations like CSV imports/exports
 */
const bulkOperationSchema = new mongoose.Schema(
  {
    operationType: {
      type: String,
      enum: ["import_students", "export_students", "import_professors", "export_results"],
      required: true
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "failed"],
      default: "pending"
    },
    fileInfo: {
      fileName: String,
      fileSize: Number,
      mimeType: String,
      uploadedAt: { type: Date, default: Date.now }
    },
    statistics: {
      totalRecords: Number,
      successfulRecords: Number,
      failedRecords: Number,
      duplicateRecords: Number,
      warningRecords: Number
    },
    errors: [
      {
        row: Number,
        field: String,
        message: String
      }
    ],
    result: {
      importedIds: [mongoose.Schema.Types.ObjectId],
      updatedIds: [mongoose.Schema.Types.ObjectId],
      failedIds: [mongoose.Schema.Types.ObjectId]
    },
    completedAt: Date,
    duration: Number // in milliseconds
  },
  { timestamps: true }
);

module.exports = mongoose.model("BulkOperation", bulkOperationSchema);
