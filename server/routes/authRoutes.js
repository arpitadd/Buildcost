import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateBody, registerSchema, loginSchema } from '../middleware/validation.js';

const router = express.Router();

// Public routes with Zod input validation
router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);

// Protected routes
router.get('/me', authenticateToken, getMe);

export default router;

