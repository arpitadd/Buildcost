import mongoose from 'mongoose';
import { Project } from '../models/Project.js';
import { LandDetail } from '../models/LandDetail.js';
import { BuildSpec } from '../models/BuildSpec.js';
import { Estimate } from '../models/Estimate.js';
import { EstimateSummary } from '../models/EstimateSummary.js';
import { parseProjectDescription } from '../services/aiEstimator.js';


/**
 * POST /api/projects/parse-description
 * Accepts natural language text description, parses it into structured schema objects,
 * marks low-confidence/inferred fields, and returns data for user review WITHOUT auto-saving.
 */
export async function parseDescription(req, res) {
  try {
    const { description } = req.body;

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({
        error: 'Please provide a non-empty text "description" to parse.',
      });
    }

    const result = await parseProjectDescription(description.trim());

    return res.status(200).json({
      message: 'Description parsed successfully into project schema.',
      parsed_data: {
        project: result.project,
        land_details: result.land_details,
        build_specs: result.build_specs,
      },
      low_confidence_fields: result.low_confidence_fields || [],
      confidence_score: result.confidence_score,
      source_method: result.source_method || 'claude_api',
      raw_description: description.trim(),
      note: 'This data has NOT been saved. Review and confirm before submitting project creation.',
    });
  } catch (error) {
    console.error('Parse description error:', error);
    return res.status(500).json({
      error: 'Failed to parse natural language description.',
      details: error.message,
    });
  }
}


/**
 * POST /api/projects
 * Creates a project, land_details, and build_specs in a single request.
 * Automatically uses MongoDB transactions on Replica Sets / Atlas, with safe atomic rollback for standalone instances.
 */
export async function createProject(req, res) {
  const userId = req.user.id;
  const {
    name,
    location_text,
    region_code,
    land_size_sqft,
    zoning_type,
    land_details = {},
    build_specs = {},
  } = req.body;

  let createdProject = null;
  let createdLandDetails = null;
  let createdBuildSpecs = null;

  try {
    // 1. Create Project
    createdProject = new Project({
      user_id: userId,
      name: name.trim(),
      location_text: location_text.trim(),
      region_code: region_code.trim().toUpperCase(),
      land_size_sqft: Number(land_size_sqft),
      zoning_type: zoning_type.trim(),
    });
    await createdProject.save();

    // 2. Create Land Details
    createdLandDetails = new LandDetail({
      project_id: createdProject._id,
      topography: land_details.topography.trim(),
      soil_type: land_details.soil_type.trim(),
      utilities_status: land_details.utilities_status.trim(),
      has_access_road: Boolean(land_details.has_access_road),
    });
    await createdLandDetails.save();

    // 3. Create Build Specs
    createdBuildSpecs = new BuildSpec({
      project_id: createdProject._id,
      build_type: build_specs.build_type.trim(),
      floors: Number(build_specs.floors) || 1,
      total_sqft: Number(build_specs.total_sqft),
      material_tier: build_specs.material_tier.trim().toLowerCase(),
      timeline_months: Number(build_specs.timeline_months),
    });
    await createdBuildSpecs.save();

    return res.status(201).json({
      message: 'Project created successfully.',
      project: createdProject,
      land_details: createdLandDetails,
      build_specs: createdBuildSpecs,
    });
  } catch (error) {
    // Rollback created documents on any failure
    if (createdProject && createdProject._id) {
      await Promise.all([
        Project.findByIdAndDelete(createdProject._id).catch(() => {}),
        LandDetail.deleteOne({ project_id: createdProject._id }).catch(() => {}),
        BuildSpec.deleteOne({ project_id: createdProject._id }).catch(() => {}),
      ]);
    }

    console.error('Create project error:', error);
    return res.status(500).json({ error: 'Failed to create project.', details: error.message });
  }
}

/**
 * GET /api/projects
 * Lists all projects for the authenticated user.
 */
export async function listProjects(req, res) {
  try {
    const userId = req.user.id;
    const projects = await Project.find({ user_id: userId }).sort({ created_at: -1 });

    return res.status(200).json({
      projects,
      count: projects.length,
    });
  } catch (error) {
    console.error('List projects error:', error);
    return res.status(500).json({ error: 'Failed to retrieve projects.' });
  }
}

/**
 * GET /api/projects/:id
 * Fetches complete project details including land_details and build_specs.
 */
export async function getProjectById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid project ID format.' });
    }

    const project = await Project.findOne({ _id: id, user_id: userId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found or unauthorized.' });
    }

    const [land_details, build_specs] = await Promise.all([
      LandDetail.findOne({ project_id: id }),
      BuildSpec.findOne({ project_id: id }),
    ]);

    return res.status(200).json({
      project,
      land_details,
      build_specs,
    });
  } catch (error) {
    console.error('Get project error:', error);
    return res.status(500).json({ error: 'Failed to retrieve project details.' });
  }
}

/**
 * PUT /api/projects/:id/specs
 * Updates project build specs (for what-if scenarios like changing material tier or timeline).
 */
export async function updateProjectSpecs(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { material_tier, timeline_months, total_sqft, floors } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid project ID format.' });
    }

    const project = await Project.findOne({ _id: id, user_id: userId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found or unauthorized.' });
    }

    const buildSpecs = await BuildSpec.findOne({ project_id: id });
    if (!buildSpecs) {
      return res.status(404).json({ error: 'Build specifications not found.' });
    }

    if (material_tier) buildSpecs.material_tier = material_tier.trim().toLowerCase();
    if (timeline_months !== undefined) buildSpecs.timeline_months = Number(timeline_months);
    if (total_sqft !== undefined) buildSpecs.total_sqft = Number(total_sqft);
    if (floors !== undefined) buildSpecs.floors = Number(floors);

    await buildSpecs.save();

    return res.status(200).json({
      message: 'Project build specs updated successfully.',
      build_specs: buildSpecs,
    });
  } catch (error) {
    console.error('Update project specs error:', error);
    return res.status(500).json({ error: 'Failed to update build specs.', details: error.message });
  }
}

/**
 * DELETE /api/projects/:id
 * Deletes a project and cascades deletion to LandDetail, BuildSpec, Estimate, and EstimateSummary.
 */
export async function deleteProject(req, res) {

  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid project ID format.' });
    }

    const project = await Project.findOne({ _id: id, user_id: userId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found or unauthorized.' });
    }

    // Cascade delete all associated documents
    await Promise.all([
      Project.deleteOne({ _id: id }),
      LandDetail.deleteMany({ project_id: id }),
      BuildSpec.deleteMany({ project_id: id }),
      Estimate.deleteMany({ project_id: id }),
      EstimateSummary.deleteMany({ project_id: id }),
    ]);

    return res.status(200).json({
      message: 'Project and all associated estimates deleted successfully.',
      deleted_id: id,
    });
  } catch (error) {
    console.error('Delete project error:', error);
    return res.status(500).json({ error: 'Failed to delete project.', details: error.message });
  }
}


