const mongoose = require("mongoose");

const feeRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    feeStructure: {
      tuitionFee: { type: Number, default: 0 },
      examFee: { type: Number, default: 0 },
      developmentFee: { type: Number, default: 0 },
      libraryFee: { type: Number, default: 0 },
      labFee: { type: Number, default: 0 },
      otherFees: { type: Number, default: 0 },
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "partial", "paid", "overdue"],
      default: "pending",
    },
    transactions: [
      {
        transactionId: String,
        amount: Number,
        method: {
          type: String,
          enum: ["online", "cash", "cheque", "dd"],
        },
        paidAt: { type: Date, default: Date.now },
        receiptUrl: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeeRecord", feeRecordSchema);