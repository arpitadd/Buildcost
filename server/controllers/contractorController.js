import mongoose from 'mongoose';
import { Contractor } from '../models/Contractor.js';
import { QuoteRequest } from '../models/QuoteRequest.js';
import { Project } from '../models/Project.js';
import { BuildSpec } from '../models/BuildSpec.js';
import { EstimateSummary } from '../models/EstimateSummary.js';
import { rankContractors, scoreContractor } from '../services/contractorMatcher.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a Mongoose query filter from URL query params.
 * Validates and sanitizes all filter inputs.
 */
function buildContractorFilter(query) {
  const filter = { is_available: true };

  // Region filter (single code or comma-separated)
  if (query.region) {
    const regions = query.region.split(',').map((r) => r.trim().toUpperCase()).filter(Boolean);
    if (regions.length > 0) {
      filter.region_codes = { $in: regions };
    }
  }

  // Project type filter
  if (query.project_type) {
    const pt = query.project_type.trim();
    filter.project_types = { $regex: pt, $options: 'i' };
  }

  // Specialty filter
  if (query.specialty) {
    const sp = query.specialty.trim();
    filter.specialties = { $regex: sp, $options: 'i' };
  }

  // Budget range filter (in Lakh)
  if (query.budget_min || query.budget_max) {
    const budgetMin = parseFloat(query.budget_min) || null;
    const budgetMax = parseFloat(query.budget_max) || null;
    if (budgetMin !== null) filter.budget_max_lakh = { $gte: budgetMin };
    if (budgetMax !== null) filter.budget_min_lakh = { ...(filter.budget_min_lakh || {}), $lte: budgetMax };
  }

  // Project size filter (in sqft)
  if (query.size_min || query.size_max) {
    const sizeMin = parseFloat(query.size_min) || null;
    const sizeMax = parseFloat(query.size_max) || null;
    if (sizeMin !== null) filter.project_size_max_sqft = { $gte: sizeMin };
    if (sizeMax !== null) filter.project_size_min_sqft = { ...(filter.project_size_min_sqft || {}), $lte: sizeMax };
  }

  // Text search (name, description, location)
  if (query.search && query.search.trim()) {
    filter.$text = { $search: query.search.trim() };
  }

  return filter;
}

/**
 * Build a Mongoose sort object from sort query param.
 */
function buildContractorSort(sortParam) {
  switch (sortParam) {
    case 'rating':
      return { rating: -1, review_count: -1 };
    case 'experience':
      return { experience_years: -1 };
    case 'projects':
      return { completed_projects: -1 };
    case 'name':
      return { business_name: 1 };
    default:
      // Default: rating then experience
      return { rating: -1, experience_years: -1 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Controller: GET /api/contractors
// ─────────────────────────────────────────────────────────────────────────────
export async function listContractors(req, res) {
  try {
    const { sort, page = 1, limit = 20, ...filterQuery } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter = buildContractorFilter(filterQuery);
    const sortObj = buildContractorSort(sort);

    const [contractors, total] = await Promise.all([
      Contractor.find(filter).sort(sortObj).skip(skip).limit(limitNum).lean(),
      Contractor.countDocuments(filter),
    ]);

    return res.status(200).json({
      contractors,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('List contractors error:', error);
    return res.status(500).json({ error: 'Failed to retrieve contractors.' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Controller: GET /api/contractors/:id
// ─────────────────────────────────────────────────────────────────────────────
export async function getContractorById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid contractor ID format.' });
    }

    const contractor = await Contractor.findById(id).lean();
    if (!contractor) {
      return res.status(404).json({ error: 'Contractor not found.' });
    }

    return res.status(200).json({ contractor });
  } catch (error) {
    console.error('Get contractor error:', error);
    return res.status(500).json({ error: 'Failed to retrieve contractor details.' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Controller: GET /api/projects/:id/contractors
// Project-based contractor matching with deterministic scoring
// ─────────────────────────────────────────────────────────────────────────────
export async function findContractorsForProject(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { sort, page = 1, limit = 20, ...filterQuery } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid project ID format.' });
    }

    // Verify project ownership
    const project = await Project.findOne({ _id: id, user_id: userId }).lean();
    if (!project) {
      return res.status(404).json({ error: 'Project not found or unauthorized.' });
    }

    // Load build specs and latest estimate summary
    const [buildSpec, estimateSummary] = await Promise.all([
      BuildSpec.findOne({ project_id: id }).lean(),
      EstimateSummary.findOne({ project_id: id }).sort({ version_number: -1 }).lean(),
    ]);

    // Build project context for matching
    const totalBudgetLakh = estimateSummary
      ? estimateSummary.total_expected / 100000
      : null;

    const context = {
      region_code: project.region_code,
      build_type: buildSpec?.build_type || '',
      specialties: buildSpec?.build_type
        ? [buildSpec.build_type.toLowerCase().split(' ')[0]] // e.g. 'residential'
        : [],
      total_sqft: buildSpec?.total_sqft || null,
      total_budget_lakh: totalBudgetLakh,
    };

    // Fetch all available contractors (with optional base filters)
    const baseFilter = buildContractorFilter(filterQuery);
    const allContractors = await Contractor.find(baseFilter).lean();

    // Rank using deterministic matcher
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

    let ranked = rankContractors(allContractors, context);

    // If sort param is explicitly set (not 'relevance'), re-sort
    if (sort && sort !== 'relevance') {
      const sortObj = buildContractorSort(sort);
      const sortKey = Object.keys(sortObj)[0];
      const sortDir = Object.values(sortObj)[0];
      ranked.sort((a, b) => (a[sortKey] - b[sortKey]) * (sortDir === -1 ? -1 : 1));
    }

    const total = ranked.length;
    const paged = ranked.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    return res.status(200).json({
      contractors: paged,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
      project_context: context,
    });
  } catch (error) {
    console.error('Find contractors for project error:', error);
    return res.status(500).json({ error: 'Failed to find contractors for this project.' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Controller: POST /api/contractors/:id/quote
// ─────────────────────────────────────────────────────────────────────────────
export async function createQuoteRequest(req, res) {
  try {
    const { id: contractorId } = req.params;
    const userId = req.user.id;
    const { project_id, message = '' } = req.body;

    if (!mongoose.Types.ObjectId.isValid(contractorId)) {
      return res.status(400).json({ error: 'Invalid contractor ID format.' });
    }

    const contractor = await Contractor.findById(contractorId).lean();
    if (!contractor) {
      return res.status(404).json({ error: 'Contractor not found.' });
    }

    // Build project snapshot if a project_id is provided
    let projectSnapshot = null;
    if (project_id) {
      if (!mongoose.Types.ObjectId.isValid(project_id)) {
        return res.status(400).json({ error: 'Invalid project ID format.' });
      }

      const [project, buildSpec, estimateSummary] = await Promise.all([
        Project.findOne({ _id: project_id, user_id: userId }).lean(),
        BuildSpec.findOne({ project_id }).lean(),
        EstimateSummary.findOne({ project_id }).sort({ version_number: -1 }).lean(),
      ]);

      if (!project) {
        return res.status(404).json({ error: 'Project not found or unauthorized.' });
      }

      projectSnapshot = {
        project_name: project.name,
        location_text: project.location_text,
        region_code: project.region_code,
        land_size_sqft: project.land_size_sqft,
        zoning_type: project.zoning_type,
        build_type: buildSpec?.build_type,
        floors: buildSpec?.floors,
        total_sqft: buildSpec?.total_sqft,
        material_tier: buildSpec?.material_tier,
        timeline_months: buildSpec?.timeline_months,
        estimated_total_inr: estimateSummary?.total_expected || null,
        snapshot_date: new Date().toISOString(),
      };
    }

    // Prevent duplicate pending requests
    const existingRequest = await QuoteRequest.findOne({
      user_id: userId,
      contractor_id: contractorId,
      status: 'pending',
    });

    if (existingRequest) {
      return res.status(409).json({
        error: 'You already have a pending quote request with this contractor.',
        existing_request_id: existingRequest._id,
      });
    }

    const quoteRequest = new QuoteRequest({
      user_id: userId,
      contractor_id: contractorId,
      project_id: project_id || null,
      project_snapshot: projectSnapshot,
      message: message.trim(),
      status: 'pending',
    });

    await quoteRequest.save();

    return res.status(201).json({
      message: 'Quote request submitted successfully.',
      quote_request: quoteRequest,
    });
  } catch (error) {
    console.error('Create quote request error:', error);
    return res.status(500).json({ error: 'Failed to submit quote request.', details: error.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Controller: GET /api/quote-requests
// Fetch the authenticated user's quote requests
// ─────────────────────────────────────────────────────────────────────────────
export async function getUserQuoteRequests(req, res) {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const filter = { user_id: userId };
    if (status && ['pending', 'contacted', 'accepted', 'declined', 'completed'].includes(status)) {
      filter.status = status;
    }

    const requests = await QuoteRequest.find(filter)
      .populate('contractor_id', 'business_name location_text rating specialties is_verified phone email')
      .sort({ created_at: -1 })
      .lean();

    return res.status(200).json({
      quote_requests: requests,
      count: requests.length,
    });
  } catch (error) {
    console.error('Get quote requests error:', error);
    return res.status(500).json({ error: 'Failed to retrieve quote requests.' });
  }
}
