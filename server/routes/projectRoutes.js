import express from 'express';
import {
  createProject,
  listProjects,
  getProjectById,
  updateProjectSpecs,
  deleteProject,
  parseDescription,
} from '../controllers/projectController.js';
import {
  createBaselineEstimate,
  createAiAdjustedEstimate,
  explainEstimateVersion,
  getEstimateByVersion,
} from '../controllers/estimateController.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  validateBody,
  createProjectSchema,
  updateProjectSpecsSchema,
  parseDescriptionSchema,
} from '../middleware/validation.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply auth middleware to all project routes
router.use(authenticateToken);

// Natural-language parsing endpoint (Phase 5) - Rate limited & Validated
router.post('/parse-description', aiRateLimiter, validateBody(parseDescriptionSchema), parseDescription);

// Project management routes
router.post('/', validateBody(createProjectSchema), createProject);
router.get('/', listProjects);
router.get('/:id', getProjectById);
router.put('/:id/specs', validateBody(updateProjectSpecsSchema), updateProjectSpecs);
router.delete('/:id', deleteProject);


// Estimate calculation and retrieval routes
router.post('/:id/estimate/baseline', createBaselineEstimate);
router.post('/:id/estimate/aiadjust', aiRateLimiter, createAiAdjustedEstimate);
router.post('/:id/estimate/:version/explain', aiRateLimiter, explainEstimateVersion);
router.get('/:id/estimate/:version', getEstimateByVersion);

export default router;

