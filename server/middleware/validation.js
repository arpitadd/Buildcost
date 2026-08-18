import { z } from 'zod';

/**
 * Higher-order middleware to validate req.body against a Zod schema.
 */
export function validateBody(schema) {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated; // Assign sanitized/parsed data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      return res.status(400).json({ error: 'Invalid request body.' });
    }
  };
}

// -----------------------------------------------------------------------------
// Auth Schemas
// -----------------------------------------------------------------------------
export const registerSchema = z.object({
  email: z.string().email('Invalid email address format.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format.'),
  password: z.string().min(1, 'Password is required.'),
});

// -----------------------------------------------------------------------------
// Project Schemas
// -----------------------------------------------------------------------------
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required.').max(100),
  location_text: z.string().min(1, 'Location description is required.').max(200),
  region_code: z.string().min(1, 'Region code is required.'),
  land_size_sqft: z.number().positive('Land size must be greater than 0.'),
  zoning_type: z.string().min(1, 'Zoning type is required.').max(100),
  land_details: z.object({
    topography: z.string().min(1, 'Topography is required.'),
    soil_type: z.string().min(1, 'Soil type is required.'),
    utilities_status: z.string().min(1, 'Utilities status is required.'),
    has_access_road: z.boolean().default(false),
  }),
  build_specs: z.object({
    build_type: z.string().min(1, 'Build type is required.'),
    floors: z.number().int().min(1).max(20).default(1),
    total_sqft: z.number().positive('Total square footage must be greater than 0.'),
    material_tier: z.enum(['economy', 'standard', 'premium', 'luxury']),
    timeline_months: z.number().int().min(1).max(60),
  }),
});

export const updateProjectSpecsSchema = z.object({
  material_tier: z.enum(['economy', 'standard', 'premium', 'luxury']).optional(),
  timeline_months: z.number().int().min(1).max(60).optional(),
  total_sqft: z.number().positive().optional(),
  floors: z.number().int().min(1).max(20).optional(),
});

export const parseDescriptionSchema = z.object({
  description: z.string().min(5, 'Description must be at least 5 characters.').max(1000),
});
