/**
 * ==============================================================================
 * Contractor Matching Service — contractorMatcher.js
 *
 * Pure deterministic scoring. No AI. Modular — can be replaced or enhanced later.
 *
 * Total: 100 points
 *   Region/service-area match : 35 pts
 *   Project type match         : 25 pts
 *   Specialization match       : 15 pts
 *   Project size in range      : 10 pts
 *   Budget in range            : 10 pts
 *   Experience bonus (>10 yr)  :  5 pts
 * ==============================================================================
 */

/**
 * Score a single contractor against a project context.
 *
 * @param {Object} contractor  — Mongoose document or plain object
 * @param {Object} context     — Project context derived from project + estimate
 * @param {string} context.region_code      — e.g. 'IN-KA'
 * @param {string} context.build_type       — e.g. 'Residential House'
 * @param {string[]} context.specialties    — e.g. ['residential']
 * @param {number} context.total_sqft       — built-up area
 * @param {number} context.total_budget_lakh— estimated total cost in Lakh
 * @returns {{ score: number, label: string, breakdown: Object }}
 */
export function scoreContractor(contractor, context) {
  let score = 0;
  const breakdown = {};

  // ── 1. Region / service-area match (35 pts) ───────────────────────────────
  const contractorRegions = (contractor.region_codes || []).map((r) => r.toUpperCase());
  const projectRegion = (context.region_code || '').toUpperCase();

  if (projectRegion && contractorRegions.includes(projectRegion)) {
    breakdown.region = 35;
    score += 35;
  } else if (projectRegion) {
    // Partial credit for same major geographic zone
    // e.g. southern states share some overlap
    const zones = {
      south: ['IN-KA', 'IN-TN', 'IN-KL', 'IN-AP', 'IN-TS', 'IN-GA', 'IN-PY'],
      north: ['IN-DL', 'IN-HR', 'IN-PB', 'IN-UP', 'IN-UK', 'IN-HP', 'IN-JK', 'IN-LA', 'IN-CH'],
      west: ['IN-MH', 'IN-GJ', 'IN-RJ'],
      east: ['IN-WB', 'IN-OR', 'IN-JH', 'IN-BR', 'IN-AS', 'IN-TR', 'IN-ML', 'IN-MN', 'IN-NL', 'IN-MZ', 'IN-AR', 'IN-SK', 'IN-CG', 'IN-MP'],
    };
    const projectZone = Object.keys(zones).find((z) => zones[z].includes(projectRegion));
    const contractorInSameZone =
      projectZone && contractorRegions.some((r) => zones[projectZone]?.includes(r));
    if (contractorInSameZone) {
      breakdown.region = 15;
      score += 15;
    } else {
      breakdown.region = 0;
    }
  } else {
    breakdown.region = 0;
  }

  // ── 2. Project type match (25 pts) ────────────────────────────────────────
  const buildType = (context.build_type || '').toLowerCase();
  const contractorProjectTypes = (contractor.project_types || []).map((t) => t.toLowerCase());

  if (buildType && contractorProjectTypes.some((t) => t.includes(buildType) || buildType.includes(t))) {
    breakdown.project_type = 25;
    score += 25;
  } else if (buildType && contractorProjectTypes.some((t) =>
    // Fuzzy match common residential synonyms
    (buildType.includes('residential') && t.includes('residential')) ||
    (buildType.includes('villa') && t.includes('villa')) ||
    (buildType.includes('duplex') && t.includes('duplex')) ||
    (buildType.includes('apartment') && t.includes('apartment'))
  )) {
    breakdown.project_type = 25;
    score += 25;
  } else if (!buildType) {
    // No project context, partial credit
    breakdown.project_type = 12;
    score += 12;
  } else {
    breakdown.project_type = 0;
  }

  // ── 3. Specialization match (15 pts) ─────────────────────────────────────
  const contextSpecialties = (context.specialties || []).map((s) => s.toLowerCase());
  const contractorSpecialties = (contractor.specialties || []).map((s) => s.toLowerCase());

  if (contextSpecialties.length === 0) {
    breakdown.specialties = 8; // partial credit when no context
    score += 8;
  } else {
    const matches = contextSpecialties.filter((s) =>
      contractorSpecialties.some((cs) => cs.includes(s) || s.includes(cs))
    );
    const specialtyScore = Math.round((matches.length / contextSpecialties.length) * 15);
    breakdown.specialties = specialtyScore;
    score += specialtyScore;
  }

  // ── 4. Project size in range (10 pts) ─────────────────────────────────────
  const sqft = context.total_sqft;
  const minSqft = contractor.project_size_min_sqft;
  const maxSqft = contractor.project_size_max_sqft;

  if (!sqft || (minSqft == null && maxSqft == null)) {
    breakdown.size = 5;
    score += 5;
  } else if (sqft >= (minSqft || 0) && sqft <= (maxSqft || Infinity)) {
    breakdown.size = 10;
    score += 10;
  } else {
    // Partial credit if within 50% of range boundary
    const nearMin = minSqft && sqft >= minSqft * 0.5;
    const nearMax = maxSqft && sqft <= maxSqft * 1.5;
    if (nearMin || nearMax) {
      breakdown.size = 4;
      score += 4;
    } else {
      breakdown.size = 0;
    }
  }

  // ── 5. Budget in range (10 pts) ───────────────────────────────────────────
  const budgetLakh = context.total_budget_lakh;
  const minBudget = contractor.budget_min_lakh;
  const maxBudget = contractor.budget_max_lakh;

  if (!budgetLakh || (minBudget == null && maxBudget == null)) {
    breakdown.budget = 5;
    score += 5;
  } else if (budgetLakh >= (minBudget || 0) && budgetLakh <= (maxBudget || Infinity)) {
    breakdown.budget = 10;
    score += 10;
  } else {
    const nearMin = minBudget && budgetLakh >= minBudget * 0.6;
    const nearMax = maxBudget && budgetLakh <= maxBudget * 1.4;
    if (nearMin || nearMax) {
      breakdown.budget = 4;
      score += 4;
    } else {
      breakdown.budget = 0;
    }
  }

  // ── 6. Experience bonus (5 pts) ───────────────────────────────────────────
  if ((contractor.experience_years || 0) >= 10) {
    breakdown.experience = 5;
    score += 5;
  } else {
    breakdown.experience = 0;
  }

  // ── Label ─────────────────────────────────────────────────────────────────
  let label = null;
  if (score >= 85) {
    label = 'Excellent Match';
  } else if (score >= 70) {
    label = 'Good Match';
  } else if (score >= 50) {
    label = 'Partial Match';
  }
  // Below 50 — no badge

  return {
    score,
    label,
    breakdown,
  };
}

/**
 * Score and rank a list of contractors against a project context.
 * Returns contractors sorted by score descending, with match info attached.
 *
 * @param {Array} contractors
 * @param {Object} context
 * @returns {Array} — contractors with `_match` field attached, sorted
 */
export function rankContractors(contractors, context) {
  return contractors
    .map((contractor) => {
      const match = scoreContractor(contractor, context);
      const plain = typeof contractor.toObject === 'function'
        ? contractor.toObject()
        : { ...contractor };
      return { ...plain, _match: match };
    })
    .sort((a, b) => b._match.score - a._match.score);
}

export default { scoreContractor, rankContractors };
