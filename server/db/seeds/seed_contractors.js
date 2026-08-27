/**
 * ==============================================================================
 * Seed Script: seed_contractors.js
 * Description: Populates the contractors collection with realistic demo data
 *              for development and testing purposes.
 *
 * NOTE: All records have is_demo_data: true and is_verified: false.
 *       This data is purely fictional and intended for development use only.
 *       Do NOT use this data to make real contractor claims.
 * ==============================================================================
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../connection.js';
import { Contractor } from '../../models/Contractor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const DEMO_CONTRACTORS = [
  // ── Karnataka ────────────────────────────────────────────────────────────
  {
    business_name: 'Bengaluru BuildWorks Pvt. Ltd.',
    description:
      'Established residential construction firm based in Bengaluru with over 18 years of experience in RCC-framed residential buildings, villas, and duplex homes across Whitefield, Sarjapur, and North Bengaluru. Known for on-time delivery and transparent billing.',
    phone: '+91 98450 00001',
    email: 'info@blrbuildworks.example.dev',
    website: 'https://blrbuildworks.example.dev',
    location_text: 'Whitefield, Bengaluru, Karnataka',
    region_codes: ['IN-KA'],
    specialties: ['residential', 'villa', 'rcc-framed', 'duplex'],
    project_types: ['Residential House', 'Villa', 'Duplex'],
    experience_years: 18,
    budget_min_lakh: 30,
    budget_max_lakh: 250,
    project_size_min_sqft: 1200,
    project_size_max_sqft: 8000,
    rating: 4.6,
    review_count: 87,
    completed_projects: 143,
    is_verified: false,
    is_available: true,
    is_demo_data: true,
  },
  {
    business_name: 'Mysuru Premier Constructions',
    description:
      'Specialized in premium residential homes and row houses across the Mysuru region. Expertise in Laterite and Red Soil terrain. Strong network of licensed sub-contractors for MEP works.',
    phone: '+91 98450 00002',
    email: 'hello@mysurupremier.example.dev',
    location_text: 'Kuvempunagar, Mysuru, Karnataka',
    region_codes: ['IN-KA'],
    specialties: ['residential', 'row-house', 'premium-finish'],
    project_types: ['Residential House', 'Row House'],
    experience_years: 11,
    budget_min_lakh: 25,
    budget_max_lakh: 120,
    project_size_min_sqft: 1000,
    project_size_max_sqft: 4500,
    rating: 4.3,
    review_count: 52,
    completed_projects: 78,
    is_verified: false,
    is_available: true,
    is_demo_data: true,
  },

  // ── Maharashtra ──────────────────────────────────────────────────────────
  {
    business_name: 'Pune Infra Solutions',
    description:
      'Leading construction firm in Pune with deep expertise in residential apartment units, independent bungalows, and premium villas. Operates across Hinjewadi, Baner, and Kothrud. Uses IS:456 RCC standards throughout.',
    phone: '+91 98450 00003',
    email: 'contact@punfinfra.example.dev',
    location_text: 'Baner, Pune, Maharashtra',
    region_codes: ['IN-MH'],
    specialties: ['residential', 'villa', 'apartment', 'bungalow'],
    project_types: ['Residential House', 'Villa', 'Apartment Unit'],
    experience_years: 14,
    budget_min_lakh: 50,
    budget_max_lakh: 500,
    project_size_min_sqft: 1500,
    project_size_max_sqft: 12000,
    rating: 4.5,
    review_count: 119,
    completed_projects: 201,
    is_verified: false,
    is_available: true,
    is_demo_data: true,
  },
  {
    business_name: 'Mumbai Skyline Builders',
    description:
      'Specialist contractor for high-value residential projects in Mumbai Metropolitan Region. Experienced in building on Alluvial and Clay soils with pile foundation requirements. Strong focus on RERA-compliant timelines.',
    phone: '+91 98450 00004',
    email: 'projects@mumbaiskylne.example.dev',
    location_text: 'Andheri West, Mumbai, Maharashtra',
    region_codes: ['IN-MH'],
    specialties: ['residential', 'villa', 'luxury', 'pile-foundation'],
    project_types: ['Residential House', 'Villa', 'Apartment Unit'],
    experience_years: 22,
    budget_min_lakh: 80,
    budget_max_lakh: 1000,
    project_size_min_sqft: 2000,
    project_size_max_sqft: 20000,
    rating: 4.7,
    review_count: 203,
    completed_projects: 312,
    is_verified: false,
    is_available: true,
    is_demo_data: true,
  },

  // ── Delhi NCR ────────────────────────────────────────────────────────────
  {
    business_name: 'NCR Buildtech Associates',
    description:
      'Delhi NCR-based contractor specializing in independent floors, builder floors, and residential homes in Noida, Gurgaon, and Delhi. Experienced with DDA approvals, BU certificate processes, and CGPDTM norms.',
    phone: '+91 98450 00005',
    email: 'enquiry@ncrbuildtech.example.dev',
    location_text: 'Sector 62, Noida, Uttar Pradesh (NCR)',
    region_codes: ['IN-DL', 'IN-UP', 'IN-HR'],
    specialties: ['residential', 'independent-floor', 'duplex'],
    project_types: ['Residential House', 'Duplex', 'Row House'],
    experience_years: 16,
    budget_min_lakh: 40,
    budget_max_lakh: 300,
    project_size_min_sqft: 1200,
    project_size_max_sqft: 7000,
    rating: 4.2,
    review_count: 73,
    completed_projects: 128,
    is_verified: false,
    is_available: true,
    is_demo_data: true,
  },

  // ── Telangana ────────────────────────────────────────────────────────────
  {
    business_name: 'Hyderabad Home Crafters',
    description:
      'Award-winning residential construction firm operating across Hyderabad and Secunderabad. Known for systematic project management, Black Cotton Soil expertise with raft foundations, and premium interior finishes.',
    phone: '+91 98450 00006',
    email: 'info@hydhomecrafters.example.dev',
    location_text: 'Madhapur, Hyderabad, Telangana',
    region_codes: ['IN-TS', 'IN-AP'],
    specialties: ['residential', 'villa', 'raft-foundation', 'black-cotton-soil'],
    project_types: ['Residential House', 'Villa', 'Duplex'],
    experience_years: 13,
    budget_min_lakh: 35,
    budget_max_lakh: 200,
    project_size_min_sqft: 1500,
    project_size_max_sqft: 6000,
    rating: 4.4,
    review_count: 96,
    completed_projects: 167,
    is_verified: false,
    is_available: true,
    is_demo_data: true,
  },

  // ── Tamil Nadu ───────────────────────────────────────────────────────────
  {
    business_name: 'Chennai Civil Works Co.',
    description:
      'Established construction company with strong presence in Chennai, Coimbatore, and Madurai. Experienced in load-bearing and RCC structures, with particular expertise in traditional Tamilnadu-style homes and modern duplex apartments.',
    phone: '+91 98450 00007',
    email: 'works@chennaicivilworks.example.dev',
    location_text: 'Anna Nagar, Chennai, Tamil Nadu',
    region_codes: ['IN-TN'],
    specialties: ['residential', 'duplex', 'rcc-framed', 'traditional'],
    project_types: ['Residential House', 'Duplex', 'Villa'],
    experience_years: 20,
    budget_min_lakh: 30,
    budget_max_lakh: 180,
    project_size_min_sqft: 1000,
    project_size_max_sqft: 5500,
    rating: 4.5,
    review_count: 141,
    completed_projects: 234,
    is_verified: false,
    is_available: true,
    is_demo_data: true,
  },

  // ── Gujarat ──────────────────────────────────────────────────────────────
  {
    business_name: 'Ahmedabad Constructions Ltd.',
    description:
      'Well-known residential contractor in Ahmedabad and Surat. Specializes in cost-effective construction using locally sourced materials. Experienced in seismic zone III compliance (IS:1893). Strong economy and standard tier delivery.',
    phone: '+91 98450 00008',
    email: 'amdconstructions@example.dev',
    location_text: 'Satellite, Ahmedabad, Gujarat',
    region_codes: ['IN-GJ'],
    specialties: ['residential', 'economy', 'seismic-zone', 'row-house'],
    project_types: ['Residential House', 'Row House', 'Duplex'],
    experience_years: 15,
    budget_min_lakh: 20,
    budget_max_lakh: 120,
    project_size_min_sqft: 800,
    project_size_max_sqft: 4000,
    rating: 4.1,
    review_count: 58,
    completed_projects: 112,
    is_verified: false,
    is_available: true,
    is_demo_data: true,
  },

  // ── Kerala ───────────────────────────────────────────────────────────────
  {
    business_name: 'Kochi Heritage Homes Builders',
    description:
      'Premium residential construction firm based in Kochi. Known for blending traditional Kerala architecture with modern construction techniques. Expert in sloped terrain, laterite soil, and high-rainfall site conditions.',
    phone: '+91 98450 00009',
    email: 'info@kochiheritagehomes.example.dev',
    location_text: 'Kakkanad, Kochi, Kerala',
    region_codes: ['IN-KL'],
    specialties: ['residential', 'villa', 'kerala-style', 'sloped-terrain', 'laterite'],
    project_types: ['Residential House', 'Villa', 'Farm House'],
    experience_years: 17,
    budget_min_lakh: 40,
    budget_max_lakh: 300,
    project_size_min_sqft: 1200,
    project_size_max_sqft: 7000,
    rating: 4.8,
    review_count: 164,
    completed_projects: 189,
    is_verified: false,
    is_available: true,
    is_demo_data: true,
  },

  // ── Haryana ──────────────────────────────────────────────────────────────
  {
    business_name: 'Gurugram Urban Constructors',
    description:
      'High-end residential contractor operating in Gurugram, Faridabad, and Greater Noida. Specializes in builder floors, luxury villas, and large plot bungalows. Experience with DTCP Haryana and RERA Haryana compliance.',
    phone: '+91 98450 00010',
    email: 'contact@gurugurbancon.example.dev',
    location_text: 'DLF Phase 2, Gurugram, Haryana',
    region_codes: ['IN-HR', 'IN-DL'],
    specialties: ['residential', 'villa', 'luxury', 'bungalow', 'independent-floor'],
    project_types: ['Residential House', 'Villa', 'Duplex'],
    experience_years: 12,
    budget_min_lakh: 60,
    budget_max_lakh: 600,
    project_size_min_sqft: 2000,
    project_size_max_sqft: 15000,
    rating: 4.4,
    review_count: 88,
    completed_projects: 107,
    is_verified: false,
    is_available: true,
    is_demo_data: true,
  },

  // ── West Bengal ──────────────────────────────────────────────────────────
  {
    business_name: 'Kolkata City Builders',
    description:
      'Reliable construction firm with extensive experience in Kolkata and surrounding districts. Expertise in Alluvial Soil and high water table environments requiring anti-termite treatment and proper DPC layers.',
    phone: '+91 98450 00011',
    email: 'info@kolkatacitybuilders.example.dev',
    location_text: 'Salt Lake, Kolkata, West Bengal',
    region_codes: ['IN-WB'],
    specialties: ['residential', 'rcc-framed', 'alluvial-soil', 'waterproofing'],
    project_types: ['Residential House', 'Duplex', 'Apartment Unit'],
    experience_years: 19,
    budget_min_lakh: 25,
    budget_max_lakh: 150,
    project_size_min_sqft: 900,
    project_size_max_sqft: 5000,
    rating: 4.2,
    review_count: 67,
    completed_projects: 155,
    is_verified: false,
    is_available: true,
    is_demo_data: true,
  },

  // ── Rajasthan ────────────────────────────────────────────────────────────
  {
    business_name: 'Jaipur Stone & Structure',
    description:
      'Rajasthan-based construction company famed for blending Rajasthani traditional design with modern structural systems. Experienced in Sandy Soil with deep foundation requirements. Serves Jaipur, Udaipur, and Jodhpur.',
    phone: '+91 98450 00012',
    email: 'build@jaipurstone.example.dev',
    location_text: 'Vaishali Nagar, Jaipur, Rajasthan',
    region_codes: ['IN-RJ'],
    specialties: ['residential', 'villa', 'sandy-soil', 'traditional', 'premium-finish'],
    project_types: ['Residential House', 'Villa', 'Farm House'],
    experience_years: 14,
    budget_min_lakh: 28,
    budget_max_lakh: 200,
    project_size_min_sqft: 1000,
    project_size_max_sqft: 6000,
    rating: 4.3,
    review_count: 49,
    completed_projects: 91,
    is_verified: false,
    is_available: true,
    is_demo_data: true,
  },

  // ── Punjab ───────────────────────────────────────────────────────────────
  {
    business_name: 'Ludhiana Home Makers',
    description:
      'Punjab-based residential builder with strong track record in Ludhiana and Amritsar. Specializes in multi-floor residential homes and duplex constructions. Known for quality masonry and adherence to local PUDA norms.',
    phone: '+91 98450 00013',
    email: 'projects@ludhianahomemakers.example.dev',
    location_text: 'Model Town, Ludhiana, Punjab',
    region_codes: ['IN-PB', 'IN-CH'],
    specialties: ['residential', 'duplex', 'multi-floor', 'masonry'],
    project_types: ['Residential House', 'Duplex', 'Row House'],
    experience_years: 10,
    budget_min_lakh: 22,
    budget_max_lakh: 130,
    project_size_min_sqft: 800,
    project_size_max_sqft: 4000,
    rating: 4.0,
    review_count: 44,
    completed_projects: 83,
    is_verified: false,
    is_available: true,
    is_demo_data: true,
  },

  // ── Goa ──────────────────────────────────────────────────────────────────
  {
    business_name: 'Panaji Coastal Constructions',
    description:
      'Goa-based premium residential contractor specializing in coastal construction requirements. Expert in anti-corrosion treatments, sea-wind-resistant designs, and Portuguese-influenced villa aesthetics. Serves both Goa and coastal Karnataka.',
    phone: '+91 98450 00014',
    email: 'hello@panajicoastal.example.dev',
    location_text: 'Porvorim, Panaji, Goa',
    region_codes: ['IN-GA', 'IN-KA'],
    specialties: ['residential', 'villa', 'coastal', 'luxury', 'anti-corrosion'],
    project_types: ['Residential House', 'Villa', 'Farm House'],
    experience_years: 9,
    budget_min_lakh: 45,
    budget_max_lakh: 400,
    project_size_min_sqft: 1500,
    project_size_max_sqft: 8000,
    rating: 4.6,
    review_count: 37,
    completed_projects: 52,
    is_verified: false,
    is_available: true,
    is_demo_data: true,
  },

  // ── Andhra Pradesh ───────────────────────────────────────────────────────
  {
    business_name: 'Visakhapatnam Infra Developers',
    description:
      'Coastal Andhra-based construction company experienced in both urban and rural residential projects. Skilled in Hilly terrain and rocky soil profiles along the Eastern Ghats. Known for efficient labor management.',
    phone: '+91 98450 00015',
    email: 'info@vizaginfradev.example.dev',
    location_text: 'Madhurawada, Visakhapatnam, Andhra Pradesh',
    region_codes: ['IN-AP', 'IN-TS'],
    specialties: ['residential', 'villa', 'hilly-terrain', 'rocky-soil'],
    project_types: ['Residential House', 'Villa', 'Duplex'],
    experience_years: 12,
    budget_min_lakh: 25,
    budget_max_lakh: 160,
    project_size_min_sqft: 1000,
    project_size_max_sqft: 5000,
    rating: 4.1,
    review_count: 55,
    completed_projects: 98,
    is_verified: false,
    is_available: true,
    is_demo_data: true,
  },

  // ── Uttarakhand ──────────────────────────────────────────────────────────
  {
    business_name: 'Dehradun Hill Home Builders',
    description:
      'Specialist contractor for hilly and sloped terrain construction in Dehradun and Haridwar. Expert in retaining walls, anti-landslide foundations, and hill-optimized RCC design. Familiar with Uttarakhand RERA and local by-laws.',
    phone: '+91 98450 00016',
    email: 'build@dehradunhillhome.example.dev',
    location_text: 'Rajpur Road, Dehradun, Uttarakhand',
    region_codes: ['IN-UK', 'IN-HP'],
    specialties: ['residential', 'hilly-terrain', 'steep-slope', 'retaining-wall', 'rcc-framed'],
    project_types: ['Residential House', 'Villa', 'Farm House'],
    experience_years: 16,
    budget_min_lakh: 35,
    budget_max_lakh: 180,
    project_size_min_sqft: 1200,
    project_size_max_sqft: 5000,
    rating: 4.5,
    review_count: 61,
    completed_projects: 88,
    is_verified: false,
    is_available: true,
    is_demo_data: true,
  },

  // ── Madhya Pradesh ───────────────────────────────────────────────────────
  {
    business_name: 'Indore Build & Design',
    description:
      'Trusted residential construction company in Indore and Bhopal. Affordable yet quality construction across economy and standard tiers. Strong local network of material suppliers ensuring competitive rates for Black Cotton Soil foundations.',
    phone: '+91 98450 00017',
    email: 'contact@indorebuilddesign.example.dev',
    location_text: 'Vijay Nagar, Indore, Madhya Pradesh',
    region_codes: ['IN-MP', 'IN-CG'],
    specialties: ['residential', 'economy', 'black-cotton-soil', 'duplex'],
    project_types: ['Residential House', 'Duplex', 'Row House'],
    experience_years: 11,
    budget_min_lakh: 18,
    budget_max_lakh: 100,
    project_size_min_sqft: 800,
    project_size_max_sqft: 3500,
    rating: 4.0,
    review_count: 38,
    completed_projects: 72,
    is_verified: false,
    is_available: true,
    is_demo_data: true,
  },

  // ── Multi-state premium firm ─────────────────────────────────────────────
  {
    business_name: 'India Premium Homes (National)',
    description:
      'Pan-India premium residential construction group with dedicated site managers in all major metros. Specializes in luxury villas, farm houses, and high-end duplex projects across all material tiers. Offers fixed-price contracts with milestone-based payments.',
    phone: '+91 98450 00018',
    email: 'national@indiapremiumhomes.example.dev',
    website: 'https://indiapremiumhomes.example.dev',
    location_text: 'Multiple Offices — Bengaluru, Mumbai, Delhi, Hyderabad',
    region_codes: ['IN-KA', 'IN-MH', 'IN-DL', 'IN-TS', 'IN-TN', 'IN-KL', 'IN-HR', 'IN-GJ'],
    specialties: ['residential', 'villa', 'luxury', 'farm-house', 'duplex', 'premium-finish'],
    project_types: ['Residential House', 'Villa', 'Duplex', 'Farm House'],
    experience_years: 25,
    budget_min_lakh: 80,
    budget_max_lakh: 2000,
    project_size_min_sqft: 2500,
    project_size_max_sqft: 30000,
    rating: 4.8,
    review_count: 412,
    completed_projects: 628,
    is_verified: false,
    is_available: true,
    is_demo_data: true,
  },

  // ── Economy specialist ───────────────────────────────────────────────────
  {
    business_name: 'BudgetBuild India',
    description:
      'Focused on affordable residential construction for budget-conscious homeowners. Operates across Tier-2 and Tier-3 cities. Economy-tier specialist with strong buying power for bulk materials and efficient local labor deployment.',
    phone: '+91 98450 00019',
    email: 'build@budgetbuildindia.example.dev',
    location_text: 'Operates across Tier-2 Cities, India',
    region_codes: ['IN-UP', 'IN-MP', 'IN-RJ', 'IN-BR', 'IN-OR', 'IN-CG', 'IN-JH'],
    specialties: ['residential', 'economy', 'row-house', 'affordable'],
    project_types: ['Residential House', 'Row House'],
    experience_years: 8,
    budget_min_lakh: 10,
    budget_max_lakh: 60,
    project_size_min_sqft: 600,
    project_size_max_sqft: 2500,
    rating: 3.9,
    review_count: 89,
    completed_projects: 186,
    is_verified: false,
    is_available: true,
    is_demo_data: true,
  },
];

export async function seedContractors() {
  console.log('🌱 Starting MongoDB seeding for demo contractors...');
  console.log('ℹ️  Note: All seeded contractors have is_demo_data: true and is_verified: false.');
  await connectDB();

  // Remove only demo data (preserves any real contractor records)
  const deleteResult = await Contractor.deleteMany({ is_demo_data: true });
  console.log(`🗑️  Removed ${deleteResult.deletedCount} existing demo contractor records.`);

  const inserted = await Contractor.insertMany(DEMO_CONTRACTORS);
  console.log(`✓ Successfully seeded ${inserted.length} demo contractor records into MongoDB.`);

  await mongoose.disconnect();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedContractors()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Failed to seed contractors:', err);
      process.exit(1);
    });
}

export default seedContractors;
