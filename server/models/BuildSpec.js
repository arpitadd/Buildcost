import mongoose from 'mongoose';

const buildSpecSchema = new mongoose.Schema(
  {
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      unique: true,
      index: true,
    },
    build_type: {
      type: String,
      required: true,
      trim: true,
    },
    floors: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    total_sqft: {
      type: Number,
      required: true,
      min: 0,
    },
    material_tier: {
      type: String,
      required: true,
      trim: true,
    },
    timeline_months: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

export const BuildSpec = mongoose.models.BuildSpec || mongoose.model('BuildSpec', buildSpecSchema);
export default BuildSpec;
