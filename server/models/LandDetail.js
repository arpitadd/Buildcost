import mongoose from 'mongoose';

const landDetailSchema = new mongoose.Schema(
  {
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      unique: true,
      index: true,
    },
    topography: {
      type: String,
      required: true,
      trim: true,
    },
    soil_type: {
      type: String,
      required: true,
      trim: true,
    },
    utilities_status: {
      type: String,
      required: true,
      trim: true,
    },
    has_access_road: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

export const LandDetail = mongoose.models.LandDetail || mongoose.model('LandDetail', landDetailSchema);
export default LandDetail;
