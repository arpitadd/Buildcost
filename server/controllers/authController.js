import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'buildcost_fallback_jwt_secret';
const JWT_EXPIRES_IN = '7d';

// Helper to generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Helper to format user response
function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    created_at: user.created_at,
  };
}

/**
 * POST /api/auth/register
 */
export async function register(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: emailTrimmed });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user in MongoDB
    const user = new User({
      email: emailTrimmed,
      password_hash,
    });
    await user.save();

    const token = generateToken(user);

    return res.status(201).json({
      message: 'User registered successfully.',
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const emailTrimmed = email.trim().toLowerCase();

    // Find user by email
    const user = await User.findOne({ email: emailTrimmed });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: 'Login successful.',
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
}

/**
 * GET /api/auth/me (Protected)
 */
export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id).select('-password_hash');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Failed to retrieve user profile.' });
  }
}
