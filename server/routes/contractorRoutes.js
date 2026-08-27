import express from 'express';
import {
  listContractors,
  getContractorById,
  createQuoteRequest,
  getUserQuoteRequests,
} from '../controllers/contractorController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateBody, quoteRequestSchema } from '../middleware/validation.js';

const router = express.Router();

// All contractor routes require authentication
router.use(authenticateToken);

// List / search / filter contractors
// GET /api/contractors?region=IN-KA&project_type=Residential+House&sort=rating&page=1&limit=20
router.get('/', listContractors);

// Get a single contractor's full profile
// GET /api/contractors/:id
router.get('/:id', getContractorById);

// Submit a quote / contact request to a contractor
// POST /api/contractors/:id/quote
router.post('/:id/quote', validateBody(quoteRequestSchema), createQuoteRequest);

// List the authenticated user's own quote requests
// GET /api/quote-requests  (mounted separately in server.js)
export { getUserQuoteRequests };

export default router;
