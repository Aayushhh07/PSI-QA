import mongoose from '../db/mongo';

const SummarySchema = new mongoose.Schema(
  {
    totalTests: Number,
    passed: Number,
    failed: Number,
    successRate: Number,
    averageDuration: Number,
  },
  { _id: false }
);

const TestReportSchema = new mongoose.Schema(
  {
    websiteId: String,
    executionId: { type: String, index: true },
    summary: { type: SummarySchema, required: true },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const TestReportModel =
  mongoose.models.TestReport || mongoose.model('TestReport', TestReportSchema);



