import mongoose from 'mongoose';

export const QUOTE_STATUSES = ['pending', 'contacted', 'accepted', 'declined', 'completed'];

const quoteRequestSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contractor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contractor',
      required: true,
      index: true,
    },
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },

    /**
     * Denormalized snapshot of the project/estimate at the time of request.
     * Preserves the context even if the project is later modified or deleted.
     */
    project_snapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    message: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },

    status: {
      type: String,
      enum: QUOTE_STATUSES,
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Compound index so we can efficiently query by user and status
quoteRequestSchema.index({ user_id: 1, status: 1 });
quoteRequestSchema.index({ user_id: 1, contractor_id: 1 });

export const QuoteRequest =
  mongoose.models.QuoteRequest || mongoose.model('QuoteRequest', quoteRequestSchema);
export default QuoteRequest;
