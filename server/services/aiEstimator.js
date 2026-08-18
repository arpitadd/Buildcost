/**
 * ==============================================================================
 * AI Estimator Service (Anthropic Claude API Integration)
 * Description: Auxiliary layer for site-specific risk assessment, regional nuance
 * adjustments, and natural language explanations.
 * 
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * 1. AI NEVER invents raw baseline numbers from scratch.
 * 2. AI ONLY provides percentage adjustments and plain-English context.
 * 3. All JSON output is strictly validated against schemas with retry and fallback.
 * ==============================================================================
 */

import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

// In-memory cache keyed by `${projectId}_v${versionNumber}`
export const aiResponseCache = new Map();

/**
 * Helper to get Anthropic client instance
 */
function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.startsWith('your_') || apiKey === 'placeholder') {
    return null;
  }
  return new Anthropic({ apiKey });
}

/**
 * Validates AI adjustment response against expected schema.
 * 
 * @param {Object} data 
 * @param {Array} expectedCategories 
 * @returns {boolean}
 */
export function validateAdjustmentSchema(data, expectedCategories) {
  if (!data || typeof data !== 'object') return false;
  if (!data.category_adjustments || typeof data.category_adjustments !== 'object') return false;
  if (!Array.isArray(data.risk_flags)) return false;
  if (typeof data.confidence_score !== 'number' || data.confidence_score < 0 || data.confidence_score > 1) {
    return false;
  }

  // Validate categories
  for (const cat of expectedCategories) {
    const adj = data.category_adjustments[cat];
    if (adj) {
      if (typeof adj.percentage !== 'number' || isNaN(adj.percentage) || adj.percentage < -50 || adj.percentage > 100) {
        return false;
      }
      if (typeof adj.reason !== 'string') {
        return false;
      }
    }
  }

  return true;
}

/**
 * Fallback generator when AI API is unavailable, malformed, or unconfigured.
 * Applies conservative, deterministic heuristics based on site conditions.
 */
function generateFallbackAdjustments(landDetails, expectedCategories) {
  console.warn('⚠️  Using fallback site-condition adjustments (AI service unavailable or bypassed).');
  const adjustments = {};
  const riskFlags = [];

  const topo = (landDetails?.topography || '').toLowerCase();
  const soil = (landDetails?.soil_type || '').toLowerCase();
  const utilities = (landDetails?.utilities_status || '').toLowerCase();
  const hasRoad = landDetails?.has_access_road;

  // Foundation & labor adjustments for sloped / bedrock terrain
  if (topo.includes('slope') || topo.includes('hill') || topo.includes('steep')) {
    adjustments['foundation'] = { percentage: 12, reason: 'Sloped topography requires stepped footings and site grading.' };
    riskFlags.push('Sloped terrain increases excavation and retaining wall expenditure.');
  }

  if (soil.includes('rock') || soil.includes('bedrock') || soil.includes('clay')) {
    adjustments['foundation'] = adjustments['foundation'] || { percentage: 8, reason: 'Challenging soil profile requires reinforced foundation.' };
    adjustments['labor_general'] = { percentage: 6, reason: 'Dense soil / rock conditions increase labor hours during site prep.' };
    riskFlags.push('Soil composition may necessitate specialized excavation equipment.');
  }

  // Utilities adjustment
  if (utilities.includes('off') || utilities.includes('distant') || utilities.includes('none') || !utilities.includes('connected')) {
    adjustments['electrical'] = { percentage: 10, reason: 'Off-site utilities require utility line extension to property boundary.' };
    adjustments['plumbing'] = { percentage: 10, reason: 'Utility hookup distance adds lateral trenching and pipe installation costs.' };
    riskFlags.push('Utility connection logistics may extend project timeline.');
  }

  // Access road adjustment
  if (!hasRoad) {
    adjustments['labor_general'] = adjustments['labor_general'] || { percentage: 8, reason: 'Lack of paved access road increases transport logistics for materials.' };
    adjustments['permits'] = { percentage: 5, reason: 'Access road easement and right-of-way permitting required.' };
    riskFlags.push('Unpaved access will increase heavy equipment transport logistics.');
  }

  // Fill in neutral 0% for other categories
  for (const cat of expectedCategories) {
    if (!adjustments[cat]) {
      adjustments[cat] = { percentage: 0, reason: 'Standard site conditions apply.' };
    }
  }

  return {
    category_adjustments: adjustments,
    risk_flags: riskFlags.length > 0 ? riskFlags : ['Standard construction parameters apply with minimal site-specific risk.'],
    confidence_score: 0.90,
    source_method: 'deterministic_fallback',
  };
}

/**
 * Requests AI-driven category adjustments from Claude.
 * 
 * @param {Object} params
 * @param {Object} params.project
 * @param {Object} params.landDetails
 * @param {Object} params.buildSpecs
 * @param {Array} params.baselineItems
 * @returns {Promise<Object>}
 */
export async function generateAiAdjustments({ project, landDetails, buildSpecs, baselineItems }) {
  const expectedCategories = baselineItems.map((i) => i.category);
  const client = getAnthropicClient();

  if (!client) {
    return generateFallbackAdjustments(landDetails, expectedCategories);
  }

  const prompt = `You are a construction estimation and geotechnical risk assessment AI expert specializing in the Indian Construction & Real Estate Industry.
Evaluate the following project baseline estimates (in Indian Rupees ₹) and site/land conditions to recommend per-category percentage adjustments (+/-%) and risk flags.

CRITICAL INSTRUCTIONS:
- You must NOT invent raw baseline rupee figures.
- You must output ONLY a valid JSON object matching the exact format specified below.
- Do not output markdown codeblocks, text headers, or conversational text.
- Adjustments must be reasonable percentage integers or floats between -30% and +50%.

PROJECT SPECIFICATIONS:
- Name: ${project.name}
- Region: ${project.region_code}
- Location: ${project.location_text}
- Total Build Area: ${buildSpecs.total_sqft} sqft (Built-up Area)
- Build Type: ${buildSpecs.build_type}
- Floors: ${buildSpecs.floors}
- Material Tier: ${buildSpecs.material_tier}

LAND & SITE DETAILS:
- Topography: ${landDetails.topography}
- Soil Type: ${landDetails.soil_type}
- Utilities Status: ${landDetails.utilities_status}
- Access Road Available: ${landDetails.has_access_road ? 'Yes (Paved Road)' : 'No (Unpaved/Narrow Gali)'}

BASELINE CATEGORIES TO EVALUATE:
${baselineItems.map((item) => `- ${item.category}: ₹${item.estimated_cost} baseline (${item.unit})`).join('\n')}

EXPECTED JSON SCHEMA:
{
  "category_adjustments": {
    ${expectedCategories.map((c) => `"${c}": { "percentage": <number>, "reason": "<one sentence reason>" }`).join(',\n    ')}
  },
  "risk_flags": [
    "<risk flag 1>",
    "<risk flag 2>"
  ],
  "confidence_score": <number between 0.0 and 1.0>
}`;

  // Execute with 1 retry on malformed JSON
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }],
      });

      const rawContent = response.content[0]?.text || '';
      const cleanJson = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (validateAdjustmentSchema(parsed, expectedCategories)) {
        parsed.source_method = 'claude_api';
        return parsed;
      } else {
        console.warn(`[Attempt ${attempt}/2] AI response failed schema validation. Retrying...`);
      }
    } catch (err) {
      console.warn(`[Attempt ${attempt}/2] AI request failed:`, err.message);
    }
  }

  // Fallback if all attempts fail
  return generateFallbackAdjustments(landDetails, expectedCategories);
}

/**
 * Requests a plain-English 3-4 sentence summary of the estimate and risk factors in Indian context.
 * Decoupled from numeric estimation.
 * 
 * @param {Object} params
 * @returns {Promise<string>}
 */
export async function generateEstimateExplanation({ project, summary, items, riskFlags }) {
  const cacheKey = `${project._id}_v${summary.version_number}_explain`;
  if (aiResponseCache.has(cacheKey)) {
    return aiResponseCache.get(cacheKey);
  }

  const inrTotal = Number(summary.total_expected).toLocaleString('en-IN');
  const client = getAnthropicClient();
  if (!client) {
    const fallbackText = `This estimate projects an expected expenditure of ₹${inrTotal} for ${project.name} (${project.region_code}). Key site considerations include ${riskFlags.slice(0, 2).join(' and ')}. A contingency buffer of 15% is recommended to account for localized material and cement/steel price volatility.`;
    aiResponseCache.set(cacheKey, fallbackText);
    return fallbackText;
  }

  const prompt = `Provide a concise, professional 3-4 sentence plain-English executive summary for this Indian residential construction estimate.

PROJECT:
- Name: ${project.name}
- Region: ${project.region_code}
- Total Expected Cost: ₹${inrTotal} (Range: ₹${Number(summary.total_low).toLocaleString('en-IN')} - ₹${Number(summary.total_high).toLocaleString('en-IN')})
- Identified Site Risks: ${riskFlags.join('; ')}

Focus on key Indian cost drivers (RCC slab/column structure, cement/steel rates, site soil condition), geotechnical risks, and practical budget advice in clean, confident prose. Use Indian Rupees (₹) where relevant. Do not include markdown headers or bullet points.`;

  try {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0]?.text || '').trim();
    aiResponseCache.set(cacheKey, text);
    return text;
  } catch (err) {
    console.warn('AI explanation failed, returning deterministic summary:', err.message);
    const fallback = `This estimate projects an expected expenditure of ₹${inrTotal} for ${project.name}. The cost profile incorporates site adjustments for terrain, utilities, and material specifications. A buffer of 15% is recommended to manage unforeseen site contingencies.`;
    aiResponseCache.set(cacheKey, fallback);
    return fallback;
  }
}

/**
 * Parses freeform natural language project descriptions into structured schema objects with Indian context.
 * 
 * @param {string} descriptionText 
 * @returns {Promise<Object>}
 */
export async function parseProjectDescription(descriptionText) {
  if (!descriptionText || typeof descriptionText !== 'string') {
    throw new Error('Description text is required and must be a string.');
  }

  const client = getAnthropicClient();
  if (!client) {
    return generateFallbackParsedDescription(descriptionText);
  }

  const prompt = `You are an expert Indian architectural estimator and civil engineering specification parser.
Parse the following user project description into structured project, land_details, and build_specs data matching our Indian construction schema.

USER DESCRIPTION:
"${descriptionText}"

SCHEMA REQUIREMENTS & ALLOWED VALUES:
- project:
  - name: string (e.g., "3 BHK Independent Villa Build")
  - location_text: string (e.g., "Whitefield, Bengaluru" or Indian city/locality)
  - region_code: one of ["IN-KA-BLR", "IN-MH-MUM", "IN-DL-NCR", "IN-TS-HYD", "IN-TN-CHE"] (choose closest match or default to "IN-KA-BLR")
  - land_size_sqft: number (convert units: 30x40 site = 1200 sqft, 40x60 site = 2400 sqft, 1 gunta = 1089 sqft, 1 cent = 435.6 sqft, 1 ground = 2400 sqft, 1 sq yard = 9 sqft, 1 acre = 43560 sqft)
  - zoning_type: string (e.g., "BBMP Approved Residential", "BDA Layout", "DTCP Approved", "Gram Panchayat")

- land_details:
  - topography: string (e.g., "Flat Deccan Plateau", "Sloped Terrain", "Hilly / Ghats", "Low-Lying / Water-Logging")
  - soil_type: string (e.g., "Red Soil / Gravel", "Black Cotton Soil", "Rocky / Bedrock", "Sandy Loam")
  - utilities_status: string (e.g., "Bescom/KPTCL & BWSSB Connected", "Borewell & Grid Power", "Off-Grid / Unconnected")
  - has_access_road: boolean (true if paved tar road, false if unpaved/narrow alley)

- build_specs:
  - build_type: string (e.g., "Independent Residential Villa", "G+1 Duplex House", "Multi-Unit Apartment")
  - floors: number (integer >= 1, e.g. G+1 = 2 floors, G+2 = 3 floors)
  - total_sqft: number (built-up area, e.g. 2 BHK ~ 1200 sqft, 3 BHK ~ 2200 sqft, 4 BHK ~ 3200 sqft)
  - material_tier: one of ["economy", "standard", "premium", "luxury"]
  - timeline_months: number (integer, typically 8-18 months in India)

LOW CONFIDENCE IDENTIFICATION:
Any field that was NOT explicitly stated in the description and had to be guessed, assumed, or approximated MUST have a confidence score below 0.75 and be added to "low_confidence_fields" with a clear reason why the user should confirm or correct it.

OUTPUT FORMAT:
Output ONLY a strict, valid JSON object with NO markdown formatting:
{
  "project": {
    "name": "...",
    "location_text": "...",
    "region_code": "...",
    "land_size_sqft": 0,
    "zoning_type": "..."
  },
  "land_details": {
    "topography": "...",
    "soil_type": "...",
    "utilities_status": "...",
    "has_access_road": true
  },
  "build_specs": {
    "build_type": "...",
    "floors": 1,
    "total_sqft": 0,
    "material_tier": "standard",
    "timeline_months": 12
  },
  "low_confidence_fields": [
    {
      "field": "build_specs.total_sqft",
      "value": 2200,
      "confidence": 0.5,
      "reason": "Estimated 2,200 sqft based on 3 BHK configuration."
    }
  ],
  "confidence_score": 0.85
}`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
      });

      const rawContent = response.content[0]?.text || '';
      const cleanJson = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (parsed.project && parsed.land_details && parsed.build_specs && Array.isArray(parsed.low_confidence_fields)) {
        parsed.source_method = 'claude_api';
        return parsed;
      }
    } catch (err) {
      console.warn(`[Attempt ${attempt}/2] Natural language parsing failed:`, err.message);
    }
  }

  return generateFallbackParsedDescription(descriptionText);
}

/**
 * Deterministic rule-based NLP extractor for Indian construction descriptions.
 */
function generateFallbackParsedDescription(text) {
  const lower = text.toLowerCase();
  const lowConfidence = [];

  // 1. BHK / Bedroom / Sqft heuristics for India
  let totalSqft = 2000;
  let bhkCount = null;
  const bhkMatch = lower.match(/(\d+)[\s-]*(?:bhk|bed|bedroom|br)/);
  if (bhkMatch) {
    bhkCount = parseInt(bhkMatch[1], 10);
    // Typical Indian built-up area: 1 BHK ~ 650 sqft, 2 BHK ~ 1200 sqft, 3 BHK ~ 2200 sqft, 4 BHK ~ 3200 sqft
    totalSqft = bhkCount === 1 ? 650 : bhkCount === 2 ? 1200 : bhkCount === 3 ? 2200 : bhkCount * 800;
    lowConfidence.push({
      field: 'build_specs.total_sqft',
      value: totalSqft,
      confidence: 0.70,
      reason: `Approximated ${totalSqft.toLocaleString('en-IN')} sqft built-up area based on ${bhkCount} BHK configuration.`,
    });
  } else {
    lowConfidence.push({
      field: 'build_specs.total_sqft',
      value: totalSqft,
      confidence: 0.40,
      reason: 'No BHK or square footage specified; defaulted to 2,000 sqft built-up area.',
    });
  }

  // 2. Indian Land Size heuristics (30x40 site, 40x60 site, guntas, cents, sq yards, acres)
  let landSqft = 2400;
  if (lower.includes('30x40') || lower.includes('30*40') || lower.includes('1200 sqft')) {
    landSqft = 1200;
  } else if (lower.includes('40x60') || lower.includes('40*60') || lower.includes('2400 sqft')) {
    landSqft = 2400;
  } else if (lower.includes('30x50') || lower.includes('30*50') || lower.includes('1500 sqft')) {
    landSqft = 1500;
  } else if (lower.includes('50x80') || lower.includes('4000 sqft')) {
    landSqft = 4000;
  } else if (lower.includes('gunta')) {
    const gMatch = lower.match(/([\d.]+)\s*gunta/);
    landSqft = gMatch ? Math.round(parseFloat(gMatch[1]) * 1089) : 1089;
  } else if (lower.includes('cent')) {
    const cMatch = lower.match(/([\d.]+)\s*cent/);
    landSqft = cMatch ? Math.round(parseFloat(cMatch[1]) * 435.6) : 436;
  } else if (lower.includes('yard') || lower.includes('gaj')) {
    const yMatch = lower.match(/([\d.]+)\s*(?:sq\s*yard|yard|gaj)/);
    landSqft = yMatch ? Math.round(parseFloat(yMatch[1]) * 9) : 1800;
  } else if (lower.includes('half acre') || lower.includes('half-acre') || lower.includes('0.5 acre')) {
    landSqft = 21780;
  } else if (lower.includes('acre')) {
    const aMatch = lower.match(/([\d.]+)\s*acre/);
    landSqft = aMatch ? Math.round(parseFloat(aMatch[1]) * 43560) : 43560;
  } else {
    lowConfidence.push({
      field: 'project.land_size_sqft',
      value: landSqft,
      confidence: 0.50,
      reason: 'Plot dimension not specified; defaulted to standard 40x60 plot (2,400 sqft).',
    });
  }

  // 3. Indian Topography
  let topography = 'Flat Deccan Plateau';
  if (lower.includes('slop') || lower.includes('hill') || lower.includes('ghat')) {
    topography = 'Sloped / Western Ghats Terrain';
  } else if (lower.includes('low lying') || lower.includes('water') || lower.includes('lake')) {
    topography = 'Low-Lying Buffer Zone';
  }

  // 4. Material Finish Tier
  let materialTier = 'standard';
  if (lower.includes('luxury') || lower.includes('italian marble') || lower.includes('ultra')) {
    materialTier = 'luxury';
  } else if (lower.includes('premium') || lower.includes('teak wood') || lower.includes('high end')) {
    materialTier = 'premium';
  } else if (lower.includes('budget') || lower.includes('economy') || lower.includes('low cost')) {
    materialTier = 'economy';
  } else if (!lower.includes('standard') && !lower.includes('finish')) {
    lowConfidence.push({
      field: 'build_specs.material_tier',
      value: 'standard',
      confidence: 0.60,
      reason: 'Material finish tier not stated; defaulted to standard architectural finish.',
    });
  }

  // 5. Indian States & Cities Mapping
  let regionCode = 'IN-KA';
  let locationText = 'Bengaluru, Karnataka';

  if (lower.includes('mumbai') || lower.includes('pune') || lower.includes('nagpur') || lower.includes('thane') || lower.includes('maharashtra')) {
    regionCode = 'IN-MH';
    locationText = 'Mumbai / Pune, Maharashtra';
  } else if (lower.includes('delhi') || lower.includes('ncr')) {
    regionCode = 'IN-DL';
    locationText = 'Delhi (NCT)';
  } else if (lower.includes('gurgaon') || lower.includes('gurugram') || lower.includes('faridabad') || lower.includes('haryana') || lower.includes('panipat')) {
    regionCode = 'IN-HR';
    locationText = 'Gurugram / Haryana';
  } else if (lower.includes('hyderabad') || lower.includes('telangana') || lower.includes('gachibowli') || lower.includes('warangal')) {
    regionCode = 'IN-TS';
    locationText = 'Hyderabad, Telangana';
  } else if (lower.includes('chennai') || lower.includes('tamil') || lower.includes('coimbatore') || lower.includes('madurai')) {
    regionCode = 'IN-TN';
    locationText = 'Chennai, Tamil Nadu';
  } else if (lower.includes('kerala') || lower.includes('kochi') || lower.includes('trivandrum') || lower.includes('thiruvananthapuram') || lower.includes('calicut')) {
    regionCode = 'IN-KL';
    locationText = 'Kochi, Kerala';
  } else if (lower.includes('gujarat') || lower.includes('ahmedabad') || lower.includes('surat') || lower.includes('vadodara')) {
    regionCode = 'IN-GJ';
    locationText = 'Ahmedabad, Gujarat';
  } else if (lower.includes('noida') || lower.includes('lucknow') || lower.includes('kanpur') || lower.includes('varanasi') || lower.includes('uttar pradesh') || lower.includes('up')) {
    regionCode = 'IN-UP';
    locationText = 'Noida / Lucknow, Uttar Pradesh';
  } else if (lower.includes('kolkata') || lower.includes('bengal') || lower.includes('siliguri') || lower.includes('west bengal')) {
    regionCode = 'IN-WB';
    locationText = 'Kolkata, West Bengal';
  } else if (lower.includes('jaipur') || lower.includes('rajasthan') || lower.includes('udaipur') || lower.includes('jodhpur')) {
    regionCode = 'IN-RJ';
    locationText = 'Jaipur, Rajasthan';
  } else if (lower.includes('andhra') || lower.includes('vizag') || lower.includes('visakhapatnam') || lower.includes('vijayawada')) {
    regionCode = 'IN-AP';
    locationText = 'Visakhapatnam, Andhra Pradesh';
  } else if (lower.includes('goa') || lower.includes('panaji') || lower.includes('margao')) {
    regionCode = 'IN-GA';
    locationText = 'Goa';
  } else if (lower.includes('punjab') || lower.includes('ludhiana') || lower.includes('amritsar')) {
    regionCode = 'IN-PB';
    locationText = 'Ludhiana, Punjab';
  } else if (lower.includes('madhya pradesh') || lower.includes('indore') || lower.includes('bhopal') || lower.includes('mp')) {
    regionCode = 'IN-MP';
    locationText = 'Indore, Madhya Pradesh';
  } else if (lower.includes('bihar') || lower.includes('patna')) {
    regionCode = 'IN-BR';
    locationText = 'Patna, Bihar';
  } else if (lower.includes('odisha') || lower.includes('orissa') || lower.includes('bhubaneswar')) {
    regionCode = 'IN-OR';
    locationText = 'Bhubaneswar, Odisha';
  } else if (lower.includes('assam') || lower.includes('guwahati')) {
    regionCode = 'IN-AS';
    locationText = 'Guwahati, Assam';
  } else if (lower.includes('chhattisgarh') || lower.includes('raipur')) {
    regionCode = 'IN-CG';
    locationText = 'Raipur, Chhattisgarh';
  } else if (lower.includes('jharkhand') || lower.includes('ranchi') || lower.includes('jamshedpur')) {
    regionCode = 'IN-JH';
    locationText = 'Ranchi, Jharkhand';
  } else if (lower.includes('uttarakhand') || lower.includes('dehradun') || lower.includes('haridwar') || lower.includes('rishikesh')) {
    regionCode = 'IN-UK';
    locationText = 'Dehradun, Uttarakhand';
  } else if (lower.includes('himachal') || lower.includes('shimla') || lower.includes('manali') || lower.includes('dharamshala')) {
    regionCode = 'IN-HP';
    locationText = 'Shimla, Himachal Pradesh';
  } else if (lower.includes('kashmir') || lower.includes('srinagar') || lower.includes('jammu')) {
    regionCode = 'IN-JK';
    locationText = 'Srinagar, Jammu & Kashmir';
  } else if (lower.includes('ladakh') || lower.includes('leh')) {
    regionCode = 'IN-LA';
    locationText = 'Leh, Ladakh';
  } else if (lower.includes('chandigarh')) {
    regionCode = 'IN-CH';
    locationText = 'Chandigarh (UT)';
  } else if (lower.includes('puducherry') || lower.includes('pondicherry')) {
    regionCode = 'IN-PY';
    locationText = 'Puducherry (UT)';
  } else if (lower.includes('sikkim') || lower.includes('gangtok')) {
    regionCode = 'IN-SK';
    locationText = 'Gangtok, Sikkim';
  } else if (lower.includes('bangalore') || lower.includes('bengaluru') || lower.includes('karnataka') || lower.includes('mysuru')) {
    regionCode = 'IN-KA';
    locationText = 'Bengaluru, Karnataka';
  } else {
    lowConfidence.push({
      field: 'project.region_code',
      value: regionCode,
      confidence: 0.45,
      reason: 'State not identified; defaulted to Karnataka (IN-KA) rates.',
    });
  }


  // 6. Soil profile in India (Black Cotton, Red Gravel, Rocky, Sandy)
  let soilType = 'Red Gravel Soil';
  if (lower.includes('black cotton') || lower.includes('clay')) {
    soilType = 'Black Cotton Soil (Expansive)';
  } else if (lower.includes('rock') || lower.includes('granite') || lower.includes('bedrock')) {
    soilType = 'Hard Granite Bedrock';
  } else if (lower.includes('sand') || lower.includes('coast')) {
    soilType = 'Coastal Sandy Loam';
  }

  // 7. Indian Utilities & Water
  let utilitiesStatus = 'Bescom Grid & BWSSB Water Line';
  if (lower.includes('borewell') || lower.includes('tanker')) {
    utilitiesStatus = 'Borewell & Grid Power';
  } else if (lower.includes('off grid') || lower.includes('unconnected')) {
    utilitiesStatus = 'Off-Grid / Solar & Tanker';
  } else {
    lowConfidence.push({
      field: 'land_details.utilities_status',
      value: utilitiesStatus,
      confidence: 0.60,
      reason: 'Utility status assumed municipal grid; verify borewell/sanction status.',
    });
  }

  // 8. Floors & Timeline (G+1, G+2, etc.)
  let floors = 2; // G+1 standard in India
  if (lower.includes('g+2') || lower.includes('3 story') || lower.includes('3 floors') || lower.includes('three floors')) {
    floors = 3;
  } else if (lower.includes('g+1') || lower.includes('2 story') || lower.includes('2 floors') || lower.includes('duplex')) {
    floors = 2;
  } else if (lower.includes('single floor') || lower.includes('1 floor') || lower.includes('ground floor only')) {
    floors = 1;
  }

  return {
    project: {
      name: `${bhkCount ? bhkCount + ' BHK ' : ''}Residential House`,
      location_text: locationText,
      region_code: regionCode,
      land_size_sqft: landSqft,
      zoning_type: 'BBMP / BDA Approved Residential',
    },
    land_details: {
      topography,
      soil_type: soilType,
      utilities_status: utilitiesStatus,
      has_access_road: !lower.includes('no road') && !lower.includes('narrow gali'),
    },
    build_specs: {
      build_type: 'Independent Residential Villa',
      floors,
      total_sqft: totalSqft,
      material_tier: materialTier,
      timeline_months: floors > 2 ? 16 : 12,
    },
    low_confidence_fields: lowConfidence,
    confidence_score: lowConfidence.length > 2 ? 0.72 : 0.90,
    source_method: 'rule_based_fallback',
  };
}

export default {
  generateAiAdjustments,
  generateEstimateExplanation,
  validateAdjustmentSchema,
  parseProjectDescription,
  aiResponseCache,
};


