import mongoose from '../db/mongo';

const ExecutionResultSchema = new mongoose.Schema(
  {
    statusCode: Number,
    success: { type: Boolean, required: true },
    error: String,
    screenshotPath: String,
    videoPath: String,
    logs: { type: [String], default: [] },
    performance: {
      loadTime: Number,
      domContentLoaded: Number,
      firstContentfulPaint: Number,
    },
  },
  { _id: false }
);

const TestExecutionSchema = new mongoose.Schema(
  {
    executionId: { type: String, index: true },
    websiteId: { type: String, index: true },
    routeId: String,
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
      default: 'completed',
    },
    startTime: Date,
    endTime: Date,
    duration: Number,
    result: { type: ExecutionResultSchema, required: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export const TestExecutionModel =
  mongoose.models.TestExecution || mongoose.model('TestExecution', TestExecutionSchema);


