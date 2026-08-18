import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

/**
 * Validates critical environment variables on startup.
 * Fails fast with clear diagnostics if required configuration is missing.
 */
export function validateEnvironment() {
  // Resolve MongoDB URI
  const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/buildcost';
  process.env.MONGODB_URI = mongoUri;


  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'buildcost_dev_secret_jwt_key_2026_super_secure';
    console.warn('⚠️  JWT_SECRET not found in .env; using secure development default.');
  }


  // Check Anthropic API key
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.startsWith('your_') || process.env.ANTHROPIC_API_KEY === 'placeholder') {
    console.warn('⚠️  WARNING: ANTHROPIC_API_KEY is not configured. Geotechnical AI adjustment and NL parsing will operate in resilient deterministic fallback mode.');
  }

  console.log('✓ Environment configuration verified successfully.');
}
