import mongoose from 'mongoose';

const estimateSummarySchema = new mongoose.Schema(
  {
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    version_number: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    total_low: {
      type: Number,
      required: true,
      min: 0,
    },
    total_expected: {
      type: Number,
      required: true,
      min: 0,
    },
    total_high: {
      type: Number,
      required: true,
      min: 0,
    },
    ai_explanation: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

estimateSummarySchema.index({ project_id: 1, version_number: 1 }, { unique: true });

export const EstimateSummary = mongoose.models.EstimateSummary || mongoose.model('EstimateSummary', estimateSummarySchema);
export default EstimateSummary;
