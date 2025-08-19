import mongoose from '../db/mongo';

const NyaayAiLogSchema = new mongoose.Schema(
  {
    executionId: { type: String, required: true, index: true },
    logs: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const NyaayAiLogModel =
  mongoose.models.NyaayAiLog || mongoose.model('NyaayAiLog', NyaayAiLogSchema);
