import mongoose from 'mongoose';

const contractorSchema = new mongoose.Schema(
  {
    // Identity
    business_name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },

    // Contact
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    website: {
      type: String,
      trim: true,
    },

    // Location & Service Areas
    location_text: {
      type: String,
      required: true,
      trim: true,
    },
    // Array of region codes (IN-KA, IN-MH, etc.) for service areas
    region_codes: {
      type: [String],
      required: true,
      default: [],
      index: true,
    },

    // Capabilities
    specialties: {
      type: [String],
      default: [],
    },
    project_types: {
      type: [String],
      default: [],
    },
    experience_years: {
      type: Number,
      required: true,
      min: 0,
    },

    // Project Budget Range (in ₹ Lakh)
    budget_min_lakh: {
      type: Number,
      min: 0,
    },
    budget_max_lakh: {
      type: Number,
      min: 0,
    },

    // Project Size Range (in sqft)
    project_size_min_sqft: {
      type: Number,
      min: 0,
    },
    project_size_max_sqft: {
      type: Number,
      min: 0,
    },

    // Social Proof
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    review_count: {
      type: Number,
      min: 0,
      default: 0,
    },
    completed_projects: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Portfolio
    portfolio_refs: {
      type: [String],
      default: [],
    },

    // Status
    is_verified: {
      type: Boolean,
      default: false,
    },
    is_available: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Data integrity flag — true for all seed/demo records
    is_demo_data: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Text index for full-text search on name and description
contractorSchema.index({
  business_name: 'text',
  description: 'text',
  location_text: 'text',
  specialties: 'text',
});

export const Contractor =
  mongoose.models.Contractor || mongoose.model('Contractor', contractorSchema);
export default Contractor;
