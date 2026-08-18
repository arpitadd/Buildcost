import rateLimit from 'express-rate-limit';

/**
 * Rate limiter specifically configured for expensive AI endpoints (AI adjust, Explain, NL parse).
 * Limits to 30 AI requests per 15-minute window per IP.
 */
export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    error: 'AI request limit reached for this IP. Please wait a few minutes before submitting additional AI requests.',
  },
});
