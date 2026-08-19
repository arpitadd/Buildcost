import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './db/connection.js';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import { validateEnvironment } from './config/envCheck.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root or server .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

// Validate environment variables (fail fast)
validateEnvironment();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const allowedOrigins = [CLIENT_ORIGIN, /\.vercel\.app$/];

// Restrict CORS to configured client origin only
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// Ensure MongoDB is connected on every request (serverless-safe)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection failed:', err.message);
    res.status(503).json({ error: 'Database unavailable. Please try again.' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Project & Estimation routes
app.use('/api/projects', projectRoutes);

// Connect to MongoDB and start server (local dev only)
if (process.env.NODE_ENV !== 'production') {
  async function startServer() {
    try {
      await connectDB();
    } catch (error) {
      console.warn('⚠️  Warning: MongoDB connection could not be established immediately.', error.message);
    }
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  }
  startServer();
}

export default app;
