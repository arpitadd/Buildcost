import mongoose from 'mongoose';

export const COST_CATEGORIES = [
  'foundation',
  'framing',
  'roofing',
  'electrical',
  'plumbing',
  'interior_finish',
  'exterior_finish',
  'permits',
  'labor_general',
];

const costRateSchema = new mongoose.Schema(
  {
    region_code: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      enum: COST_CATEGORIES,
    },
    unit: {
      type: String,
      required: true,
      default: 'sqft',
      trim: true,
    },
    unit_cost: {
      type: Number,
      required: true,
      min: 0,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: 'updated_at' },
  }
);

// Ensure unique constraint per region and category
costRateSchema.index({ region_code: 1, category: 1 }, { unique: true });

export const CostRate = mongoose.models.CostRate || mongoose.model('CostRate', costRateSchema);
export default CostRate;
