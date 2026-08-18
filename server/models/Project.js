import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location_text: {
      type: String,
      required: true,
      trim: true,
    },
    region_code: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    land_size_sqft: {
      type: Number,
      required: true,
      min: 0,
    },
    zoning_type: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

export const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
export default Project;
