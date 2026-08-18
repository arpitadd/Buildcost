import mongoose from 'mongoose';

export const ESTIMATE_SOURCES = ['rate_table', 'ai_adjusted'];

const estimateSchema = new mongoose.Schema(
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
    category: {
      type: String,
      required: true,
      trim: true,
    },
    estimated_cost: {
      type: Number,
      required: true,
      min: 0,
    },
    confidence_score: {
      type: Number,
      required: true,
      default: 1.0,
      min: 0.0,
      max: 1.0,
    },
    source: {
      type: String,
      required: true,
      enum: ESTIMATE_SOURCES,
      default: 'rate_table',
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

estimateSchema.index({ project_id: 1, version_number: 1 });

export const Estimate = mongoose.models.Estimate || mongoose.model('Estimate', estimateSchema);
export default Estimate;
