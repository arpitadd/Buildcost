# Security Policy & Architecture Guardrails

## 1. Authentication & JWT Policy
- **Token Expiry**: JWT access tokens are signed using `HS256` with a strict `7-day` expiration window (`expiresIn: '7d'`).
- **Signature Verification**: All protected API endpoints (`/api/projects/*`, `/api/auth/me`) verify token signatures and check user tenant isolation so users can only access their own projects.
- **Password Security**: Passwords are never stored in plaintext. They are salted and hashed using `bcryptjs` with a cost factor of 10.

## 2. AI Output Safety & Schema Validation
- **No Direct AI Writes**: Generative AI (Anthropic Claude) is **NEVER** allowed to write raw or unvalidated JSON directly to the database.
- **Strict Schema Enforcement**: All AI responses for site adjustments (`/api/projects/:id/estimate/aiadjust`) and natural language parsing (`/api/projects/parse-description`) are validated against runtime schemas.
- **Resilient Fallback**: If an AI payload fails schema validation, the system retries once. If it fails again or the AI service is unreachable, the system triggers deterministic geotechnical fallback heuristics. Malformed AI output will never crash the request or corrupt stored data.
- **Deterministic Baseline Preservation**: AI models are mathematically barred from inventing raw baseline numbers; they only provide percentage modifiers on top of deterministic rate tables.

## 3. Cost Rates Data Integrity Notice
> [!IMPORTANT]
> **PLACEHOLDER DATA WARNING**:
> The seed data currently located in `server/db/seeds/seed_cost_rates.js` consists of **synthetic test rates** intended solely for development, testing, and interface demonstration.
> 
> **Action Required Before Production**:
> Before any production or real-world financial planning use, all unit costs must be reviewed, verified, and replaced with sourced, localized construction cost indices (e.g. RSMeans, local trade contractor surveys, or municipal building trade standards).

## 4. Input Validation & API Protection
- **Request Body Validation**: All incoming requests on `POST`, `PUT`, and `PATCH` routes are sanitized and validated using **Zod** schemas.
- **Rate Limiting**: AI endpoints are rate-limited via `express-rate-limit` (30 requests per 15-minute window per IP) to prevent denial-of-service and API budget exhaustion.
- **Startup Config Fail-Fast**: The server verifies essential environment variables (`MONGODB_URI`, `JWT_SECRET`) at startup and terminates immediately with diagnostics if configuration is incomplete.
