/**
 * ==============================================================================
 * Seed Script: seed_cost_rates.js (All Indian States & Union Territories)
 * Description: Populates baseline cost rates for all 28 Indian States & 5 major UTs.
 * ==============================================================================
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../connection.js';
import { CostRate } from '../../models/CostRate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

// Standard regional rate baselines (₹ / sqft) for every Indian State & UT
export const INDIAN_STATES_RATES_CONFIG = [
  // 1. Karnataka
  { code: 'IN-KA', name: 'Karnataka (Bengaluru/Mysuru)', base: { foundation: 320, framing: 490, roofing: 140, electrical: 160, plumbing: 170, interior: 340, exterior: 190, permits: 60, labor: 390 } },
  // 2. Maharashtra
  { code: 'IN-MH', name: 'Maharashtra (Mumbai/Pune/Nagpur)', base: { foundation: 420, framing: 640, roofing: 190, electrical: 210, plumbing: 220, interior: 450, exterior: 260, permits: 110, labor: 520 } },
  // 3. Delhi NCR
  { code: 'IN-DL', name: 'Delhi (NCT / Delhi NCR)', base: { foundation: 360, framing: 540, roofing: 160, electrical: 180, plumbing: 190, interior: 380, exterior: 220, permits: 80, labor: 440 } },
  // 4. Telangana
  { code: 'IN-TS', name: 'Telangana (Hyderabad/Warangal)', base: { foundation: 300, framing: 460, roofing: 130, electrical: 150, plumbing: 160, interior: 320, exterior: 180, permits: 60, labor: 370 } },
  // 5. Tamil Nadu
  { code: 'IN-TN', name: 'Tamil Nadu (Chennai/Coimbatore)', base: { foundation: 310, framing: 480, roofing: 140, electrical: 155, plumbing: 165, interior: 330, exterior: 185, permits: 65, labor: 380 } },
  // 6. Gujarat
  { code: 'IN-GJ', name: 'Gujarat (Ahmedabad/Surat/Vadodara)', base: { foundation: 290, framing: 450, roofing: 130, electrical: 145, plumbing: 155, interior: 310, exterior: 175, permits: 55, labor: 360 } },
  // 7. Kerala
  { code: 'IN-KL', name: 'Kerala (Kochi/Thiruvananthapuram)', base: { foundation: 350, framing: 520, roofing: 160, electrical: 170, plumbing: 180, interior: 360, exterior: 210, permits: 70, labor: 460 } },
  // 8. Uttar Pradesh
  { code: 'IN-UP', name: 'Uttar Pradesh (Noida/Lucknow/Kanpur)', base: { foundation: 280, framing: 430, roofing: 120, electrical: 140, plumbing: 150, interior: 300, exterior: 170, permits: 50, labor: 350 } },
  // 9. Haryana
  { code: 'IN-HR', name: 'Haryana (Gurugram/Faridabad/Panipat)', base: { foundation: 340, framing: 520, roofing: 150, electrical: 170, plumbing: 180, interior: 360, exterior: 210, permits: 75, labor: 420 } },
  // 10. West Bengal
  { code: 'IN-WB', name: 'West Bengal (Kolkata/Siliguri)', base: { foundation: 280, framing: 430, roofing: 125, electrical: 140, plumbing: 150, interior: 290, exterior: 165, permits: 50, labor: 350 } },
  // 11. Rajasthan
  { code: 'IN-RJ', name: 'Rajasthan (Jaipur/Udaipur/Jodhpur)', base: { foundation: 270, framing: 420, roofing: 120, electrical: 135, plumbing: 145, interior: 310, exterior: 170, permits: 45, labor: 340 } },
  // 12. Andhra Pradesh
  { code: 'IN-AP', name: 'Andhra Pradesh (Visakhapatnam/Vijayawada)', base: { foundation: 290, framing: 440, roofing: 130, electrical: 145, plumbing: 155, interior: 305, exterior: 175, permits: 50, labor: 360 } },
  // 13. Madhya Pradesh
  { code: 'IN-MP', name: 'Madhya Pradesh (Indore/Bhopal)', base: { foundation: 270, framing: 410, roofing: 120, electrical: 135, plumbing: 145, interior: 290, exterior: 165, permits: 45, labor: 340 } },
  // 14. Punjab
  { code: 'IN-PB', name: 'Punjab (Ludhiana/Amritsar/Jalandhar)', base: { foundation: 310, framing: 480, roofing: 140, electrical: 160, plumbing: 170, interior: 340, exterior: 190, permits: 60, labor: 390 } },
  // 15. Bihar
  { code: 'IN-BR', name: 'Bihar (Patna/Gaya)', base: { foundation: 265, framing: 410, roofing: 115, electrical: 130, plumbing: 140, interior: 285, exterior: 160, permits: 40, labor: 335 } },
  // 16. Odisha
  { code: 'IN-OR', name: 'Odisha (Bhubaneswar/Cuttack)', base: { foundation: 270, framing: 420, roofing: 120, electrical: 135, plumbing: 145, interior: 290, exterior: 165, permits: 45, labor: 340 } },
  // 17. Goa
  { code: 'IN-GA', name: 'Goa (Panaji/Margao)', base: { foundation: 360, framing: 550, roofing: 170, electrical: 180, plumbing: 190, interior: 390, exterior: 230, permits: 80, labor: 470 } },
  // 18. Assam
  { code: 'IN-AS', name: 'Assam (Guwahati/Dibrugarh)', base: { foundation: 300, framing: 460, roofing: 135, electrical: 150, plumbing: 160, interior: 320, exterior: 180, permits: 55, labor: 380 } },
  // 19. Chhattisgarh
  { code: 'IN-CG', name: 'Chhattisgarh (Raipur/Bilaspur)', base: { foundation: 260, framing: 395, roofing: 115, electrical: 130, plumbing: 140, interior: 280, exterior: 155, permits: 40, labor: 325 } },
  // 20. Jharkhand
  { code: 'IN-JH', name: 'Jharkhand (Ranchi/Jamshedpur)', base: { foundation: 265, framing: 405, roofing: 120, electrical: 130, plumbing: 140, interior: 285, exterior: 160, permits: 40, labor: 335 } },
  // 21. Uttarakhand
  { code: 'IN-UK', name: 'Uttarakhand (Dehradun/Haridwar)', base: { foundation: 330, framing: 500, roofing: 150, electrical: 165, plumbing: 175, interior: 350, exterior: 200, permits: 65, labor: 410 } },
  // 22. Himachal Pradesh
  { code: 'IN-HP', name: 'Himachal Pradesh (Shimla/Dharamshala)', base: { foundation: 360, framing: 540, roofing: 165, electrical: 175, plumbing: 185, interior: 380, exterior: 220, permits: 75, labor: 450 } },
  // 23. Jammu & Kashmir
  { code: 'IN-JK', name: 'Jammu & Kashmir (Srinagar/Jammu)', base: { foundation: 350, framing: 530, roofing: 160, electrical: 170, plumbing: 180, interior: 370, exterior: 215, permits: 70, labor: 440 } },
  // 24. Ladakh
  { code: 'IN-LA', name: 'Ladakh (Leh/Kargil)', base: { foundation: 400, framing: 610, roofing: 190, electrical: 200, plumbing: 210, interior: 420, exterior: 250, permits: 80, labor: 510 } },
  // 25. Chandigarh
  { code: 'IN-CH', name: 'Chandigarh (UT)', base: { foundation: 330, framing: 505, roofing: 145, electrical: 165, plumbing: 175, interior: 350, exterior: 200, permits: 70, labor: 410 } },
  // 26. Puducherry
  { code: 'IN-PY', name: 'Puducherry (UT)', base: { foundation: 290, framing: 445, roofing: 130, electrical: 145, plumbing: 155, interior: 305, exterior: 175, permits: 50, labor: 360 } },
  // 27. Tripura
  { code: 'IN-TR', name: 'Tripura (Agartala)', base: { foundation: 310, framing: 470, roofing: 140, electrical: 155, plumbing: 165, interior: 330, exterior: 185, permits: 55, labor: 390 } },
  // 28. Meghalaya
  { code: 'IN-ML', name: 'Meghalaya (Shillong)', base: { foundation: 340, framing: 515, roofing: 155, electrical: 170, plumbing: 180, interior: 360, exterior: 210, permits: 65, labor: 430 } },
  // 29. Manipur
  { code: 'IN-MN', name: 'Manipur (Imphal)', base: { foundation: 330, framing: 505, roofing: 150, electrical: 165, plumbing: 175, interior: 350, exterior: 200, permits: 60, labor: 420 } },
  // 30. Nagaland
  { code: 'IN-NL', name: 'Nagaland (Kohima/Dimapur)', base: { foundation: 340, framing: 515, roofing: 155, electrical: 170, plumbing: 180, interior: 360, exterior: 210, permits: 65, labor: 430 } },
  // 31. Mizoram
  { code: 'IN-MZ', name: 'Mizoram (Aizawl)', base: { foundation: 350, framing: 525, roofing: 160, electrical: 175, plumbing: 185, interior: 370, exterior: 215, permits: 65, labor: 440 } },
  // 32. Arunachal Pradesh
  { code: 'IN-AR', name: 'Arunachal Pradesh (Itanagar)', base: { foundation: 350, framing: 530, roofing: 160, electrical: 175, plumbing: 185, interior: 370, exterior: 220, permits: 65, labor: 445 } },
  // 33. Sikkim
  { code: 'IN-SK', name: 'Sikkim (Gangtok)', base: { foundation: 360, framing: 540, roofing: 165, electrical: 175, plumbing: 185, interior: 380, exterior: 220, permits: 70, labor: 450 } },
];

export async function seedCostRates() {
  console.log('🌱 Starting MongoDB seeding for all Indian States & UTs...');
  await connectDB();

  await CostRate.deleteMany({});

  const records = [];
  for (const state of INDIAN_STATES_RATES_CONFIG) {
    const { code, base } = state;
    records.push(
      { region_code: code, category: 'foundation', unit: 'sqft', unit_cost: base.foundation },
      { region_code: code, category: 'framing', unit: 'sqft', unit_cost: base.framing },
      { region_code: code, category: 'roofing', unit: 'sqft', unit_cost: base.roofing },
      { region_code: code, category: 'electrical', unit: 'sqft', unit_cost: base.electrical },
      { region_code: code, category: 'plumbing', unit: 'sqft', unit_cost: base.plumbing },
      { region_code: code, category: 'interior_finish', unit: 'sqft', unit_cost: base.interior },
      { region_code: code, category: 'exterior_finish', unit: 'sqft', unit_cost: base.exterior },
      { region_code: code, category: 'permits', unit: 'sqft', unit_cost: base.permits },
      { region_code: code, category: 'labor_general', unit: 'sqft', unit_cost: base.labor }
    );
  }

  await CostRate.insertMany(records);
  console.log(`✓ Successfully seeded ${records.length} rate records covering ${INDIAN_STATES_RATES_CONFIG.length} Indian States & Union Territories into MongoDB.`);
  await mongoose.disconnect();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedCostRates()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Failed to seed Indian states cost rates:', err);
      process.exit(1);
    });
}

export default seedCostRates;
