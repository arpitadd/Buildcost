import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBaselineEstimate,
  MATERIAL_TIER_MULTIPLIERS,
} from '../services/baselineEstimator.js';

test('Baseline Estimator - Indian Construction Rate Tests', async (t) => {
  const mockProject = {
    _id: 'mock_proj_blr_123',
    name: '3 BHK Villa Bengaluru',
    region_code: 'IN-KA',
  };


  const mockCostRates = [
    { category: 'foundation', unit: 'sqft', unit_cost: 320 },
    { category: 'framing', unit: 'sqft', unit_cost: 480 },
    { category: 'electrical', unit: 'sqft', unit_cost: 150 },
  ];

  await t.test('calculates correct baseline in INR for standard tier (1.0x multiplier)', () => {
    const mockBuildSpec = {
      total_sqft: 2000,
      material_tier: 'standard',
    };

    const result = calculateBaselineEstimate({
      project: mockProject,
      buildSpec: mockBuildSpec,
      costRates: mockCostRates,
    });

    assert.equal(result.itemizedBreakdown.length, 3);

    // Foundation: 2000 * ₹320 * 1.0 = ₹6,40,000
    const foundation = result.itemizedBreakdown.find((i) => i.category === 'foundation');
    assert.equal(foundation.estimated_cost, 640000);
    assert.equal(foundation.source, 'rate_table');
    assert.equal(foundation.confidence_score, 1.0);

    // Framing: 2000 * ₹480 * 1.0 = ₹9,60,000
    const framing = result.itemizedBreakdown.find((i) => i.category === 'framing');
    assert.equal(framing.estimated_cost, 960000);

    // Electrical: 2000 * ₹150 * 1.0 = ₹3,00,000
    const electrical = result.itemizedBreakdown.find((i) => i.category === 'electrical');
    assert.equal(electrical.estimated_cost, 300000);

    // Total expected = 640000 + 960000 + 300000 = ₹19,00,000
    assert.equal(result.summary.total_expected, 1900000);
    // Total low (-10%) = ₹17,10,000
    assert.equal(result.summary.total_low, 1710000);
    // Total high (+15%) = ₹21,85,000
    assert.equal(result.summary.total_high, 2185000);
  });

  await t.test('applies luxury Italian marble tier correctly (1.8x multiplier)', () => {
    const mockBuildSpec = {
      total_sqft: 1000,
      material_tier: 'luxury',
    };

    const result = calculateBaselineEstimate({
      project: mockProject,
      buildSpec: mockBuildSpec,
      costRates: mockCostRates,
    });

    // Foundation: 1000 * 320 * 1.8 = ₹5,76,000
    const foundation = result.itemizedBreakdown.find((i) => i.category === 'foundation');
    assert.equal(foundation.estimated_cost, 576000);
    assert.equal(foundation.multiplier, 1.8);
  });

  await t.test('applies economy tier correctly (0.8x multiplier)', () => {
    const mockBuildSpec = {
      total_sqft: 1000,
      material_tier: 'economy',
    };

    const result = calculateBaselineEstimate({
      project: mockProject,
      buildSpec: mockBuildSpec,
      costRates: mockCostRates,
    });

    // Foundation: 1000 * 320 * 0.8 = ₹2,56,000
    const foundation = result.itemizedBreakdown.find((i) => i.category === 'foundation');
    assert.equal(foundation.estimated_cost, 256000);
    assert.equal(foundation.multiplier, 0.8);
  });

  await t.test('throws descriptive error on invalid or missing inputs', () => {
    assert.throws(() => {
      calculateBaselineEstimate({ project: null, buildSpec: {}, costRates: [] });
    }, /Missing required inputs/);

    assert.throws(() => {
      calculateBaselineEstimate({
        project: mockProject,
        buildSpec: { total_sqft: -500 },
        costRates: mockCostRates,
      });
    }, /Invalid total_sqft/);
  });
});
