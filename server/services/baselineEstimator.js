/**
 * ==============================================================================
 * Baseline Estimator Service
 * Description: Pure deterministic calculation engine for construction expenditure.
 * 
 * Formula:
 * Category Cost = total_sqft * unit_cost * material_tier_multiplier
 * 
 * CRITICAL CONSTRAINT:
 * This module uses ONLY deterministic arithmetic and verified database rates.
 * No generative AI is used here.
 * ==============================================================================
 */

export const MATERIAL_TIER_MULTIPLIERS = {
  economy: 0.8,
  standard: 1.0,
  premium: 1.4,
  luxury: 1.8,
};

export const DEFAULT_MULTIPLIER = 1.0;

/**
 * Calculates a baseline estimate for a project based on its build specs and regional rates.
 * 
 * @param {Object} params
 * @param {Object} params.project - Project entity with region_code
 * @param {Object} params.buildSpec - BuildSpec entity with total_sqft and material_tier
 * @param {Array} params.costRates - Array of CostRate entities for the region
 * @returns {Object} Calculated itemized breakdown and summary
 */
export function calculateBaselineEstimate({ project, buildSpec, costRates }) {
  if (!project || !buildSpec || !costRates || costRates.length === 0) {
    throw new Error('Missing required inputs for baseline calculation (project, buildSpec, and costRates are required).');
  }

  const totalSqft = Number(buildSpec.total_sqft);
  if (isNaN(totalSqft) || totalSqft <= 0) {
    throw new Error('Invalid total_sqft in build specs.');
  }

  const rawTier = (buildSpec.material_tier || 'standard').toLowerCase().trim();
  const materialMultiplier = MATERIAL_TIER_MULTIPLIERS[rawTier] || DEFAULT_MULTIPLIER;

  let totalExpected = 0;

  // Calculate itemized categories
  const itemizedBreakdown = costRates.map((rate) => {
    const unitCost = Number(rate.unit_cost);
    const categoryCost = Math.round(totalSqft * unitCost * materialMultiplier * 100) / 100;
    totalExpected += categoryCost;

    return {
      category: rate.category,
      unit: rate.unit || 'sqft',
      base_unit_cost: unitCost,
      multiplier: materialMultiplier,
      adjusted_unit_cost: Math.round(unitCost * materialMultiplier * 100) / 100,
      estimated_cost: categoryCost,
      confidence_score: 1.0,
      source: 'rate_table',
    };
  });

  totalExpected = Math.round(totalExpected * 100) / 100;
  const totalLow = Math.round(totalExpected * 0.90 * 100) / 100;   // -10% variance
  const totalHigh = Math.round(totalExpected * 1.15 * 100) / 100;  // +15% variance

  const summary = {
    total_low: totalLow,
    total_expected: totalExpected,
    total_high: totalHigh,
    material_tier: rawTier,
    multiplier: materialMultiplier,
    total_sqft: totalSqft,
    region_code: project.region_code,
    category_count: itemizedBreakdown.length,
    ai_explanation: `Deterministic baseline calculated for ${totalSqft.toLocaleString()} sqft in region ${project.region_code} using ${rawTier} tier (${materialMultiplier}x multiplier).`,
  };

  return {
    itemizedBreakdown,
    summary,
  };
}

export default calculateBaselineEstimate;
