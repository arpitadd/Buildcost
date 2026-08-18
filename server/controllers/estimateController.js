import mongoose from 'mongoose';
import { Project } from '../models/Project.js';
import { LandDetail } from '../models/LandDetail.js';
import { BuildSpec } from '../models/BuildSpec.js';
import { CostRate } from '../models/CostRate.js';
import { Estimate } from '../models/Estimate.js';
import { EstimateSummary } from '../models/EstimateSummary.js';
import { calculateBaselineEstimate } from '../services/baselineEstimator.js';
import { generateAiAdjustments, generateEstimateExplanation, aiResponseCache } from '../services/aiEstimator.js';

/**
 * POST /api/projects/:id/estimate/baseline
 * Generates a deterministic baseline cost estimate from cost_rates and build_specs.
 */
export async function createBaselineEstimate(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid project ID format.' });
    }

    // 1. Fetch project and verify ownership
    const project = await Project.findOne({ _id: id, user_id: userId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found or unauthorized.' });
    }

    // 2. Fetch build specs
    const buildSpec = await BuildSpec.findOne({ project_id: id });
    if (!buildSpec) {
      return res.status(400).json({ error: 'Project build specs not found.' });
    }

    // 3. Fetch regional cost rates from rate table
    const costRates = await CostRate.find({ region_code: project.region_code });
    if (!costRates || costRates.length === 0) {
      return res.status(404).json({
        error: `No baseline cost rates found for region code: '${project.region_code}'. Please ensure rates are seeded for this region.`,
      });
    }

    // 4. Calculate deterministic baseline estimate
    const { itemizedBreakdown, summary } = calculateBaselineEstimate({
      project,
      buildSpec,
      costRates,
    });

    // 5. Determine version number
    const latestSummary = await EstimateSummary.findOne({ project_id: id }).sort({ version_number: -1 });
    const versionNumber = latestSummary ? latestSummary.version_number + 1 : 1;

    // 6. Save itemized estimates in DB
    const estimateDocs = itemizedBreakdown.map((item) => ({
      project_id: project._id,
      version_number: versionNumber,
      category: item.category,
      estimated_cost: item.estimated_cost,
      confidence_score: item.confidence_score,
      source: item.source,
    }));

    await Estimate.insertMany(estimateDocs);

    // 7. Save estimate summary in DB
    const summaryDoc = await EstimateSummary.create({
      project_id: project._id,
      version_number: versionNumber,
      total_low: summary.total_low,
      total_expected: summary.total_expected,
      total_high: summary.total_high,
      ai_explanation: summary.ai_explanation,
    });

    return res.status(201).json({
      message: 'Baseline estimate generated successfully.',
      project_id: project._id,
      version_number: versionNumber,
      summary: {
        total_low: summaryDoc.total_low,
        total_expected: summaryDoc.total_expected,
        total_high: summaryDoc.total_high,
        material_tier: summary.material_tier,
        multiplier: summary.multiplier,
        total_sqft: summary.total_sqft,
        region_code: summary.region_code,
        ai_explanation: summaryDoc.ai_explanation,
        created_at: summaryDoc.created_at,
      },
      itemized_breakdown: itemizedBreakdown,
    });
  } catch (error) {
    console.error('Create baseline estimate error:', error);
    return res.status(500).json({ error: 'Failed to generate baseline estimate.', details: error.message });
  }
}

/**
 * POST /api/projects/:id/estimate/aiadjust
 * Takes existing baseline estimate + land details and applies validated AI percentage adjustments.
 */
export async function createAiAdjustedEstimate(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid project ID format.' });
    }

    // 1. Fetch project and verify ownership
    const project = await Project.findOne({ _id: id, user_id: userId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found or unauthorized.' });
    }

    // 2. Fetch land details and build specs
    const [landDetails, buildSpecs] = await Promise.all([
      LandDetail.findOne({ project_id: id }),
      BuildSpec.findOne({ project_id: id }),
    ]);

    if (!landDetails || !buildSpecs) {
      return res.status(400).json({ error: 'Project land details or build specs missing.' });
    }

    // 3. Fetch latest baseline estimate items
    let baselineItems = await Estimate.find({
      project_id: id,
      source: 'rate_table',
    }).sort({ version_number: -1 });

    if (!baselineItems || baselineItems.length === 0) {
      // If baseline has not been run yet, generate it first
      const costRates = await CostRate.find({ region_code: project.region_code });
      const { itemizedBreakdown } = calculateBaselineEstimate({ project, buildSpec: buildSpecs, costRates });
      await Estimate.insertMany(
        itemizedBreakdown.map((i) => ({ project_id: id, version_number: 1, ...i }))
      );
      baselineItems = await Estimate.find({ project_id: id, version_number: 1 });
    } else {
      const latestVer = baselineItems[0].version_number;
      baselineItems = baselineItems.filter((b) => b.version_number === latestVer);
    }

    // 4. Request AI adjustments
    const aiAdjustmentResult = await generateAiAdjustments({
      project,
      landDetails,
      buildSpecs,
      baselineItems,
    });

    const { category_adjustments = {}, risk_flags = [], confidence_score = 0.85 } = aiAdjustmentResult;

    // 5. Compute new adjusted amounts deterministically
    let totalExpected = 0;
    const adjustedBreakdown = baselineItems.map((baseItem) => {
      const adj = category_adjustments[baseItem.category] || { percentage: 0, reason: 'No site adjustment needed.' };
      const pct = Number(adj.percentage) || 0;
      const adjustedCost = Math.round(baseItem.estimated_cost * (1 + pct / 100) * 100) / 100;
      totalExpected += adjustedCost;

      return {
        category: baseItem.category,
        baseline_cost: baseItem.estimated_cost,
        adjustment_percentage: pct,
        adjustment_reason: adj.reason,
        estimated_cost: adjustedCost,
        confidence_score: Math.round(confidence_score * 100) / 100,
        source: 'ai_adjusted',
      };
    });

    totalExpected = Math.round(totalExpected * 100) / 100;
    const totalLow = Math.round(totalExpected * 0.90 * 100) / 100;
    const totalHigh = Math.round(totalExpected * 1.15 * 100) / 100;

    // 6. Increment version number (start at 1 if no prior estimates exist)
    const latestSummary = await EstimateSummary.findOne({ project_id: id }).sort({ version_number: -1 });
    const versionNumber = latestSummary ? latestSummary.version_number + 1 : 1;

    // 7. Persist itemized records
    const estimateDocs = adjustedBreakdown.map((item) => ({
      project_id: project._id,
      version_number: versionNumber,
      category: item.category,
      estimated_cost: item.estimated_cost,
      confidence_score: item.confidence_score,
      source: 'ai_adjusted',
    }));
    await Estimate.insertMany(estimateDocs);

    // Initial explanation text with risk flags
    const explanationText = `AI-adjusted estimate (v${versionNumber}) factoring site conditions (${landDetails.topography}, ${landDetails.soil_type}). Risk flags identified: ${risk_flags.join('; ')}`;

    // 8. Persist summary
    const summaryDoc = await EstimateSummary.create({
      project_id: project._id,
      version_number: versionNumber,
      total_low: totalLow,
      total_expected: totalExpected,
      total_high: totalHigh,
      ai_explanation: explanationText,
    });

    // Cache results
    const cacheKey = `${id}_v${versionNumber}`;
    aiResponseCache.set(cacheKey, {
      summary: summaryDoc,
      itemized_breakdown: adjustedBreakdown,
      risk_flags,
      category_adjustments,
    });

    return res.status(201).json({
      message: 'AI-adjusted estimate generated successfully.',
      project_id: project._id,
      version_number: versionNumber,
      summary: {
        total_low: summaryDoc.total_low,
        total_expected: summaryDoc.total_expected,
        total_high: summaryDoc.total_high,
        material_tier: buildSpecs.material_tier,
        ai_explanation: summaryDoc.ai_explanation,
        created_at: summaryDoc.created_at,
      },
      itemized_breakdown: adjustedBreakdown,
      risk_flags,
      category_adjustments,
      source_method: aiAdjustmentResult.source_method || 'claude_api',
    });
  } catch (error) {
    console.error('Create AI adjusted estimate error:', error);
    return res.status(500).json({ error: 'Failed to generate AI adjusted estimate.', details: error.message });
  }
}

/**
 * POST /api/projects/:id/estimate/:version/explain
 * Generates a decoupled 3-4 sentence plain-English summary for a specific estimate version.
 */
export async function explainEstimateVersion(req, res) {
  try {
    const { id, version } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid project ID format.' });
    }

    const versionNum = parseInt(version, 10);
    if (isNaN(versionNum) || versionNum < 1) {
      return res.status(400).json({ error: 'Invalid version number.' });
    }

    // Verify project ownership
    const project = await Project.findOne({ _id: id, user_id: userId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found or unauthorized.' });
    }

    const [summaryDoc, items, landDetails] = await Promise.all([
      EstimateSummary.findOne({ project_id: id, version_number: versionNum }),
      Estimate.find({ project_id: id, version_number: versionNum }),
      LandDetail.findOne({ project_id: id }),
    ]);

    if (!summaryDoc) {
      return res.status(404).json({ error: `Estimate version ${versionNum} not found.` });
    }

    // Check in-memory cache
    const cacheKey = `${id}_v${versionNum}_explain`;
    if (aiResponseCache.has(cacheKey)) {
      return res.status(200).json({
        project_id: id,
        version_number: versionNum,
        explanation: aiResponseCache.get(cacheKey),
        cached: true,
      });
    }

    const riskFlags = [
      `Topography: ${landDetails?.topography || 'Standard'}`,
      `Soil: ${landDetails?.soil_type || 'Standard'}`,
      `Utilities: ${landDetails?.utilities_status || 'Connected'}`,
    ];

    const explanation = await generateEstimateExplanation({
      project,
      summary: summaryDoc,
      items,
      riskFlags,
    });

    // Update explanation in MongoDB and in-memory cache
    summaryDoc.ai_explanation = explanation;
    await summaryDoc.save();
    aiResponseCache.set(cacheKey, explanation);

    return res.status(200).json({
      project_id: id,
      version_number: versionNum,
      explanation,
      cached: false,
    });
  } catch (error) {
    console.error('Explain estimate error:', error);
    return res.status(500).json({ error: 'Failed to generate explanation.', details: error.message });
  }
}

/**
 * GET /api/projects/:id/estimate/:version
 * Fetches a stored estimate with full category breakdown.
 */
export async function getEstimateByVersion(req, res) {
  try {
    const { id, version } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid project ID format.' });
    }

    const versionNum = parseInt(version, 10);
    if (isNaN(versionNum) || versionNum < 1) {
      return res.status(400).json({ error: 'Invalid version number.' });
    }

    // Verify project ownership
    const project = await Project.findOne({ _id: id, user_id: userId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found or unauthorized.' });
    }

    const [summaryDoc, estimates] = await Promise.all([
      EstimateSummary.findOne({ project_id: id, version_number: versionNum }),
      Estimate.find({ project_id: id, version_number: versionNum }).sort({ category: 1 }),
    ]);

    if (!summaryDoc) {
      return res.status(404).json({
        error: `No estimate found for version ${versionNum}.`,
      });
    }

    return res.status(200).json({
      project_id: id,
      version_number: versionNum,
      summary: summaryDoc,
      itemized_breakdown: estimates,
    });
  } catch (error) {
    console.error('Get estimate by version error:', error);
    return res.status(500).json({ error: 'Failed to retrieve estimate.' });
  }
}
