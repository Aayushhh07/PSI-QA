import mongoose from '../db/mongo';

const ChoiceAiLogSchema = new mongoose.Schema(
  {
    executionId: { type: String, index: true, required: true },
    websiteId: { type: String, default: 'choice-ai', index: true },
    logs: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const ChoiceAiLogModel =
  mongoose.models.ChoiceAiLog || mongoose.model('ChoiceAiLog', ChoiceAiLogSchema);



