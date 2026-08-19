import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ErrorBoundary from './components/ErrorBoundary.jsx';

const API_BASE = import.meta.env.VITE_API_URL || '';


// Complete Indian States & Union Territories Construction Rate Indices
const REGIONS = [
  { code: 'IN-KA', name: 'Karnataka (Bengaluru/Mysuru)', tier: '₹2,190/sqft' },
  { code: 'IN-MH', name: 'Maharashtra (Mumbai/Pune/Nagpur)', tier: '₹2,840/sqft' },
  { code: 'IN-DL', name: 'Delhi (NCT / NCR)', tier: '₹2,430/sqft' },
  { code: 'IN-TS', name: 'Telangana (Hyderabad/Warangal)', tier: '₹2,060/sqft' },
  { code: 'IN-TN', name: 'Tamil Nadu (Chennai/Coimbatore)', tier: '₹2,130/sqft' },
  { code: 'IN-GJ', name: 'Gujarat (Ahmedabad/Surat)', tier: '₹2,000/sqft' },
  { code: 'IN-KL', name: 'Kerala (Kochi/Trivandrum)', tier: '₹2,300/sqft' },
  { code: 'IN-UP', name: 'Uttar Pradesh (Noida/Lucknow)', tier: '₹1,950/sqft' },
  { code: 'IN-HR', name: 'Haryana (Gurugram/Faridabad)', tier: '₹2,350/sqft' },
  { code: 'IN-WB', name: 'West Bengal (Kolkata/Siliguri)', tier: '₹1,900/sqft' },
  { code: 'IN-RJ', name: 'Rajasthan (Jaipur/Udaipur)', tier: '₹1,900/sqft' },
  { code: 'IN-AP', name: 'Andhra Pradesh (Visakhapatnam)', tier: '₹1,950/sqft' },
  { code: 'IN-MP', name: 'Madhya Pradesh (Indore/Bhopal)', tier: '₹1,850/sqft' },
  { code: 'IN-PB', name: 'Punjab (Ludhiana/Amritsar)', tier: '₹2,150/sqft' },
  { code: 'IN-BR', name: 'Bihar (Patna/Gaya)', tier: '₹1,850/sqft' },
  { code: 'IN-OR', name: 'Odisha (Bhubaneswar/Cuttack)', tier: '₹1,850/sqft' },
  { code: 'IN-GA', name: 'Goa (Panaji/Margao)', tier: '₹2,450/sqft' },
  { code: 'IN-AS', name: 'Assam (Guwahati/Dibrugarh)', tier: '₹2,050/sqft' },
  { code: 'IN-CG', name: 'Chhattisgarh (Raipur/Bilaspur)', tier: '₹1,750/sqft' },
  { code: 'IN-JH', name: 'Jharkhand (Ranchi/Jamshedpur)', tier: '₹1,800/sqft' },
  { code: 'IN-UK', name: 'Uttarakhand (Dehradun/Haridwar)', tier: '₹2,200/sqft' },
  { code: 'IN-HP', name: 'Himachal Pradesh (Shimla/Manali)', tier: '₹2,400/sqft' },
  { code: 'IN-JK', name: 'Jammu & Kashmir (Srinagar/Jammu)', tier: '₹2,350/sqft' },
  { code: 'IN-LA', name: 'Ladakh (Leh/Kargil)', tier: '₹2,700/sqft' },
  { code: 'IN-CH', name: 'Chandigarh (UT)', tier: '₹2,250/sqft' },
  { code: 'IN-PY', name: 'Puducherry (UT)', tier: '₹1,950/sqft' },
  { code: 'IN-TR', name: 'Tripura (Agartala)', tier: '₹2,100/sqft' },
  { code: 'IN-ML', name: 'Meghalaya (Shillong)', tier: '₹2,300/sqft' },
  { code: 'IN-MN', name: 'Manipur (Imphal)', tier: '₹2,250/sqft' },
  { code: 'IN-NL', name: 'Nagaland (Kohima/Dimapur)', tier: '₹2,300/sqft' },
  { code: 'IN-MZ', name: 'Mizoram (Aizawl)', tier: '₹2,350/sqft' },
  { code: 'IN-AR', name: 'Arunachal Pradesh (Itanagar)', tier: '₹2,350/sqft' },
  { code: 'IN-SK', name: 'Sikkim (Gangtok)', tier: '₹2,400/sqft' },
];

const MATERIAL_TIERS = [
  { value: 'economy', label: 'Economy (0.8x)', desc: 'Basic tiles, standard paint, builder fixtures' },
  { value: 'standard', label: 'Standard (1.0x)', desc: '2x2 vitrified tiles, emulsion paint, Jaquar/Cera fittings' },
  { value: 'premium', label: 'Premium (1.4x)', desc: '4x2 GVT tiles, teakwood doors, Kohler/Grohe fittings' },
  { value: 'luxury', label: 'Luxury (1.8x)', desc: 'Italian marble, custom teak joinery, luxury sanitaryware' },
];

const CATEGORY_NAMES = {
  foundation: 'Foundation & Earthwork',
  framing: 'RCC Structure & Framing',
  roofing: 'Terrace & Waterproofing',
  electrical: 'Concealed Electrical & DB',
  plumbing: 'Plumbing & Drainage',
  interior_finish: 'Flooring, Plaster & Putty',
  exterior_finish: 'Exterior Elevation & Paint',
  permits: 'Municipal & Plan Sanctions',
  labor_general: 'Labor & Thekedaar Charges',
};

const CATEGORY_COLORS = {
  foundation: '#64748b',
  framing: '#2563eb',
  roofing: '#0284c7',
  electrical: '#d97706',
  plumbing: '#0d9488',
  interior_finish: '#16a34a',
  exterior_finish: '#7c3aed',
  permits: '#94a3b8',
  labor_general: '#e11d48',
};

function formatINR(amount, compact = false) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  const num = Number(amount);

  if (compact) {
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} Lakh`;
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

export default function App() {
  // Authentication State
  const [token, setToken] = useState(() => localStorage.getItem('buildcost_token'));
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Projects & Estimation Data State
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectDetails, setProjectDetails] = useState(null);
  const [baselineEstimate, setBaselineEstimate] = useState(null);
  const [aiEstimate, setAiEstimate] = useState(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [loadingAiAdjust, setLoadingAiAdjust] = useState(false);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [aiExplanationText, setAiExplanationText] = useState('');
  const [viewMode, setViewMode] = useState('ai_adjusted'); // 'baseline', 'ai_adjusted', 'compare'
  // Toast Notification State
  const [toast, setToast] = useState(null); // { type: 'error'|'success'|'warning', message: string }

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const [deletingId, setDeletingId] = useState(null);

  // What-If Scenario State
  const [whatIfTier, setWhatIfTier] = useState('standard');
  const [whatIfTimeline, setWhatIfTimeline] = useState(12);
  const [whatIfSqft, setWhatIfSqft] = useState(2400);
  const [recalculatingWhatIf, setRecalculatingWhatIf] = useState(false);

  // Modal & Project Creation State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creationMode, setCreationMode] = useState('wizard');
  const [wizardStep, setWizardStep] = useState(1);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Natural Language State
  const [nlInput, setNlInput] = useState('');
  const [nlLoading, setNlLoading] = useState(false);
  const [nlExtractedData, setNlExtractedData] = useState(null);
  const [nlLowConfidence, setNlLowConfidence] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '3 BHK Residential House',
    location_text: 'Whitefield, Bengaluru',
    region_code: 'IN-KA',
    land_size_sqft: 2400,
    zoning_type: 'BBMP / BDA Approved',
    topography: 'Flat Terrain',
    soil_type: 'Red Soil',
    utilities_status: 'Connected',
    has_access_road: true,
    build_type: 'Residential House',
    floors: 2,
    total_sqft: 2400,
    material_tier: 'standard',
    timeline_months: 12,
  });

  // Navigate Home (Clears active project selection)
  const handleGoHome = () => {
    setSelectedProjectId(null);
    setProjectDetails(null);
    setBaselineEstimate(null);
    setAiEstimate(null);
    setAiExplanationText('');
  };

  const verifySession = useCallback(async (authToken) => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCurrentUser(data.user);
      fetchProjects(authToken);
    } catch {
      handleLogout();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProjects = async (authToken = token) => {
    try {
      const res = await fetch(`${API_BASE}/api/projects`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  const loadProject = async (id, authToken = token) => {
    setSelectedProjectId(id);
    setBaselineEstimate(null);
    setAiEstimate(null);
    setAiExplanationText('');
    try {
      const res = await fetch(`${API_BASE}/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setProjectDetails(data);
        if (data.build_specs) {
          setWhatIfTier(data.build_specs.material_tier || 'standard');
          setWhatIfTimeline(data.build_specs.timeline_months || 12);
          setWhatIfSqft(data.build_specs.total_sqft || 2400);
        }
        // Fetch latest versions dynamically instead of hardcoding v1/v2
        await fetchLatestEstimates(id, authToken);
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    }
  };

  const openDeleteModal = (id, name, e) => {
    if (e) e.stopPropagation();
    setDeleteTarget({ id, name });
  };

  const executeDeleteProject = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete project');

      setDeleteTarget(null);
      if (selectedProjectId === id) {
        handleGoHome();
      }
      await fetchProjects(token);
    } catch (err) {
      showToast(`Delete Error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };


  /**
   * Fetches the latest baseline (rate_table) and AI-adjusted estimates dynamically.
   * Instead of hardcoding version 1 and 2, we fetch all summaries and pick the
   * latest by version_number for each source.
   */
  const fetchLatestEstimates = async (projId, authToken = token) => {
    try {
      // Fetch version 1 as baseline (always the first run)
      const baseRes = await fetch(`${API_BASE}/api/projects/${projId}/estimate/1`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (baseRes.ok) {
        const baseData = await baseRes.json();
        setBaselineEstimate(baseData);

        // Fetch the latest non-baseline version (highest version > 1)
        // We probe upward from version 2 to find the latest AI-adjusted run
        let latestAiVersion = null;
        let probe = 2;
        while (probe <= 20) { // safety cap at version 20
          const aiRes = await fetch(`${API_BASE}/api/projects/${projId}/estimate/${probe}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          if (!aiRes.ok) break;
          const aiData = await aiRes.json();
          latestAiVersion = aiData;
          probe++;
        }
        if (latestAiVersion) {
          setAiEstimate(latestAiVersion);
          setAiExplanationText(latestAiVersion.summary?.ai_explanation || '');
        }
      }
    } catch (e) {
      console.warn('Failed to fetch estimates:', e);
    }
  };

  const fetchBaselineEstimate = async (projId, authToken = token) => {
    try {
      const res = await fetch(`${API_BASE}/api/projects/${projId}/estimate/1`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok) setBaselineEstimate(data);
    } catch (e) {
      console.warn('No baseline found:', e);
    }
  };

  const fetchAiAdjustedEstimate = async (projId, authToken = token) => {
    try {
      const res = await fetch(`${API_BASE}/api/projects/${projId}/estimate/2`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAiEstimate(data);
        setAiExplanationText(data.summary?.ai_explanation || '');
      }
    } catch (e) {
      console.warn('No AI estimate found:', e);
    }
  };

  const handleGenerateBaseline = async () => {
    if (!selectedProjectId) return;
    setLoadingEstimate(true);
    try {
      const res = await fetch(`${API_BASE}/api/projects/${selectedProjectId}/estimate/baseline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Baseline estimation failed');
      setBaselineEstimate(data);
      showToast('Baseline estimate generated successfully.', 'success');
    } catch (err) {
      showToast(`Baseline Error: ${err.message}`);
    } finally {
      setLoadingEstimate(false);
    }
  };

  const handleGenerateAiAdjust = async () => {
    if (!selectedProjectId) return;
    setLoadingAiAdjust(true);
    try {
      const res = await fetch(`${API_BASE}/api/projects/${selectedProjectId}/estimate/aiadjust`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI Adjustment failed');
      setAiEstimate(data);
      setAiExplanationText(data.summary?.ai_explanation || '');
      setViewMode('ai_adjusted');
      showToast('AI-adjusted estimate generated successfully.', 'success');
    } catch (err) {
      showToast(`AI Adjust Error: ${err.message}`);
    } finally {
      setLoadingAiAdjust(false);
    }
  };

  const handleRequestExplanation = async (version = 2) => {
    if (!selectedProjectId) return;
    setLoadingExplanation(true);
    try {
      const res = await fetch(`${API_BASE}/api/projects/${selectedProjectId}/estimate/${version}/explain`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate explanation');
      setAiExplanationText(data.explanation);
    } catch (err) {
      showToast(`Explanation Error: ${err.message}`);
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleRecalculateWhatIf = async () => {
    if (!selectedProjectId) return;
    setRecalculatingWhatIf(true);
    try {
      // Fix: check PUT response before proceeding
      const specsRes = await fetch(`${API_BASE}/api/projects/${selectedProjectId}/specs`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          material_tier: whatIfTier,
          timeline_months: whatIfTimeline,
          total_sqft: whatIfSqft,
        }),
      });
      if (!specsRes.ok) {
        const specsErr = await specsRes.json();
        throw new Error(specsErr.error || 'Failed to update project specs');
      }

      const baseRes = await fetch(`${API_BASE}/api/projects/${selectedProjectId}/estimate/baseline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const baseData = await baseRes.json();
      if (!baseRes.ok) throw new Error(baseData.error || 'Baseline re-calculation failed');
      setBaselineEstimate(baseData);

      const aiRes = await fetch(`${API_BASE}/api/projects/${selectedProjectId}/estimate/aiadjust`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const aiData = await aiRes.json();
      if (!aiRes.ok) throw new Error(aiData.error || 'AI re-calculation failed');
      setAiEstimate(aiData);
      setAiExplanationText(aiData.summary?.ai_explanation || '');

      showToast('Scenario recalculated successfully.', 'success');
      loadProject(selectedProjectId, token);
    } catch (err) {
      showToast(`Recalculation error: ${err.message}`);
    } finally {
      setRecalculatingWhatIf(false);
    }
  };

  const handleParseNlDescription = async () => {
    if (!nlInput.trim()) return;
    setNlLoading(true);
    setCreateError(null);
    try {
      const res = await fetch(`${API_BASE}/api/projects/parse-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ description: nlInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse description');

      setNlExtractedData(data.parsed_data);
      setNlLowConfidence(data.low_confidence_fields || []);

      const { project, land_details, build_specs } = data.parsed_data;
      setFormData({
        name: project.name || '',
        location_text: project.location_text || '',
        region_code: project.region_code || 'IN-KA',
        land_size_sqft: project.land_size_sqft || 2400,
        zoning_type: project.zoning_type || 'BBMP / BDA Approved',
        topography: land_details.topography || 'Flat Terrain',
        soil_type: land_details.soil_type || 'Red Soil',
        utilities_status: land_details.utilities_status || 'Connected',
        has_access_road: land_details.has_access_road !== undefined ? land_details.has_access_road : true,
        build_type: build_specs.build_type || 'Residential House',
        floors: build_specs.floors || 2,
        total_sqft: build_specs.total_sqft || 2400,
        material_tier: build_specs.material_tier || 'standard',
        timeline_months: build_specs.timeline_months || 12,
      });
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setNlLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    if (e) e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    const payload = {
      name: formData.name,
      location_text: formData.location_text,
      region_code: formData.region_code,
      land_size_sqft: Number(formData.land_size_sqft),
      zoning_type: formData.zoning_type,
      land_details: {
        topography: formData.topography,
        soil_type: formData.soil_type,
        utilities_status: formData.utilities_status,
        has_access_road: Boolean(formData.has_access_road),
      },
      build_specs: {
        build_type: formData.build_type,
        floors: Number(formData.floors),
        total_sqft: Number(formData.total_sqft),
        material_tier: formData.material_tier,
        timeline_months: Number(formData.timeline_months),
      },
    };

    try {
      const res = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create project');

      setShowCreateModal(false);
      setWizardStep(1);
      setNlExtractedData(null);
      setNlInput('');
      await fetchProjects(token);
      await loadProject(data.project._id, token);
      showToast('Project created successfully!', 'success');
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    const endpoint = authMode === 'register' ? `${API_BASE}/api/auth/register` : `${API_BASE}/api/auth/login`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      setToken(data.token);
      localStorage.setItem('buildcost_token', data.token);
      setCurrentUser(data.user);
      setPassword('');
      fetchProjects(data.token);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    setProjects([]);
    setSelectedProjectId(null);
    setProjectDetails(null);
    setBaselineEstimate(null);
    setAiEstimate(null);
    localStorage.removeItem('buildcost_token');
  };

  useEffect(() => {
    if (token) verifySession(token);
  }, [token, verifySession]);

  const activeEstimate = useMemo(() => {
    if (viewMode === 'baseline') return baselineEstimate;
    return aiEstimate || baselineEstimate;
  }, [viewMode, baselineEstimate, aiEstimate]);

  const breakdownItems = useMemo(() => {
    return activeEstimate?.itemized_breakdown || [];
  }, [activeEstimate]);

  const totalCost = useMemo(() => {
    return Number(activeEstimate?.summary?.total_expected || 0);
  }, [activeEstimate]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased text-sm">
      {/* Toast Notification System */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] max-w-sm w-full p-3.5 rounded-lg shadow-xl border flex items-start gap-3 animate-in slide-in-from-top-2 duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : toast.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <span className="text-lg shrink-0">
            {toast.type === 'success' ? '✓' : toast.type === 'warning' ? '⚠️' : '✕'}
          </span>
          <p className="text-xs leading-relaxed flex-1">{toast.message}</p>
          <button
            onClick={() => setToast(null)}
            className="text-current opacity-50 hover:opacity-100 shrink-0 cursor-pointer"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}
      {/* Clean White Header with Home Click */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Clickable Logo and Brand Name Navigates Home */}
          <button
            onClick={handleGoHome}
            title="Click to go to Home Dashboard"
            className="flex items-center gap-3 text-left hover:opacity-85 transition cursor-pointer group"
          >
            {/* BuildCost Logo Mark */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 group-hover:bg-blue-700 flex items-center justify-center text-white shadow-xs transition">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 21h18" />
                  <path d="M5 21V9l7-5 7 5v12" />
                  <path d="M9 13h6" />
                  <path d="M9 17h6" />
                  <path d="M12 9v12" />
                </svg>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-base tracking-tight group-hover:text-blue-600 transition">
                  BuildCost
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200/60">
                  India
                </span>
              </div>
            </div>
            <span className="hidden sm:inline-block text-xs text-slate-500 border-l border-slate-200 pl-3">
              Residential Construction Estimator (INR ₹)
            </span>
          </button>

          {currentUser ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleGoHome}
                className={`text-xs px-2.5 py-1 rounded transition cursor-pointer ${
                  !selectedProjectId
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                🏠 Home
              </button>
              <span className="text-xs text-slate-600 font-medium hidden md:inline">{currentUser.email}</span>
              <button
                onClick={handleLogout}
                className="px-2.5 py-1 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuthMode('login')}
                className={`px-3 py-1 text-xs rounded transition cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-blue-600 text-white font-medium shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthMode('register')}
                className={`px-3 py-1 text-xs rounded transition cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-blue-600 text-white font-medium shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                }`}
              >
                Register
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
        {/* Subtle Light Notice */}
        <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-md text-xs text-amber-900 flex items-center justify-between">
          <span>
            <strong>Planning Notice:</strong> Estimates in INR (₹) reflect standard baseline rates. Final project cost varies by contractor and market volatility.
          </span>
          <span className="text-amber-700/80 font-mono text-[11px]">33 States &amp; UTs Supported</span>
        </div>

        {!currentUser ? (
          /* Clean White Auth Form */
          <div className="max-w-sm mx-auto my-12 p-6 bg-white border border-slate-200 rounded-lg shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              {authMode === 'register' ? 'Create an Account' : 'Sign In'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Access your saved residential construction projects and cost estimates.
            </p>

            {authError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-xs rounded transition shadow-xs cursor-pointer"
              >
                {authLoading ? 'Please wait...' : authMode === 'register' ? 'Register' : 'Sign In'}
              </button>
            </form>
          </div>
        ) : (
          /* Clean White Two-Column Dashboard */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left Sidebar: Projects List */}
            <div className="md:col-span-4 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Projects</span>
                <button
                  onClick={() => {
                    setShowCreateModal(true);
                    setWizardStep(1);
                    setNlExtractedData(null);
                  }}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition shadow-xs cursor-pointer"
                >
                  + New Project
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="p-4 bg-white border border-slate-200 rounded text-center text-xs text-slate-500 shadow-xs">
                  No projects yet. Click <strong>+ New Project</strong> to create your first estimate.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {projects.map((proj) => (
                    <div
                      key={proj._id}
                      onClick={() => loadProject(proj._id)}
                      className={`w-full text-left p-3 rounded-md border transition cursor-pointer group flex items-start justify-between ${
                        selectedProjectId === proj._id
                          ? 'bg-blue-50/70 border-blue-300 text-blue-900 font-medium shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-semibold truncate max-w-[150px]">{proj.name}</span>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {proj.region_code}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex justify-between">
                          <span className="truncate max-w-[130px]">{proj.location_text}</span>
                          <span>{proj.land_size_sqft?.toLocaleString('en-IN')} sqft</span>
                        </div>
                      </div>

                      {/* Subtle Trash Button */}
                      <button
                        type="button"
                        onClick={(e) => openDeleteModal(proj._id, proj.name, e)}
                        title="Delete project"
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition cursor-pointer"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Pane: Project Details or Home Overview */}
            <div className="md:col-span-8 space-y-4">
              {projectDetails ? (
                <>
                  {/* Clean White Project Summary Header with Delete Option */}
                  <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <h1 className="text-base font-bold text-slate-900">{projectDetails.project.name}</h1>
                        <p className="text-xs text-slate-500">
                          {projectDetails.project.location_text} &bull; {projectDetails.project.region_code} &bull; {projectDetails.project.land_size_sqft?.toLocaleString('en-IN')} sqft plot
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleGenerateBaseline}
                          disabled={loadingEstimate}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded border border-slate-300 transition cursor-pointer"
                        >
                          {loadingEstimate ? 'Calculating...' : 'Run Baseline'}
                        </button>
                        <button
                          onClick={handleGenerateAiAdjust}
                          disabled={loadingAiAdjust}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition shadow-xs cursor-pointer"
                        >
                          {loadingAiAdjust ? 'Analyzing...' : 'Run AI Adjustment'}
                        </button>
                        {/* Project Delete Button */}
                        <button
                          onClick={(e) => openDeleteModal(projectDetails.project._id, projectDetails.project.name, e)}
                          className="px-2.5 py-1.5 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-medium rounded border border-red-200 transition cursor-pointer flex items-center gap-1"
                          title="Permanently delete this project"
                        >
                          <span>🗑️</span>
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>


                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs">
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-slate-500 block text-[11px]">Built-up Area</span>
                        <span className="font-semibold text-slate-900">{projectDetails.build_specs?.total_sqft?.toLocaleString('en-IN')} sqft</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-slate-500 block text-[11px]">Finish Tier</span>
                        <span className="font-semibold capitalize text-slate-900">{projectDetails.build_specs?.material_tier}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-slate-500 block text-[11px]">Terrain</span>
                        <span className="font-semibold text-slate-900 truncate block">{projectDetails.land_details?.topography}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-slate-500 block text-[11px]">Soil Type</span>
                        <span className="font-semibold text-slate-900 truncate block">{projectDetails.land_details?.soil_type}</span>
                      </div>
                    </div>
                  </div>

                  <ErrorBoundary onFallback={() => setViewMode('baseline')}>
                    {activeEstimate ? (
                      <div className="space-y-4">
                        {/* View Switcher */}
                        <div className="flex items-center justify-between p-1 bg-white border border-slate-200 rounded-md shadow-xs">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setViewMode('baseline')}
                              className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer ${
                                viewMode === 'baseline'
                                  ? 'bg-slate-900 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                              }`}
                            >
                              Baseline
                            </button>
                            <button
                              onClick={() => setViewMode('ai_adjusted')}
                              className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer ${
                                viewMode === 'ai_adjusted'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                              }`}
                            >
                              AI Adjusted
                            </button>
                            <button
                              onClick={() => setViewMode('compare')}
                              className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer ${
                                viewMode === 'compare'
                                  ? 'bg-slate-900 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                              }`}
                            >
                              Compare Delta
                            </button>
                          </div>
                          <span className="text-xs text-slate-500 font-mono pr-2">
                            v{activeEstimate.version_number || (viewMode === 'baseline' ? 1 : 2)}
                          </span>
                        </div>

                        {/* Three Clean White Budget Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-3.5 bg-white border border-slate-200 rounded-md shadow-xs">
                            <span className="text-[11px] font-medium text-slate-500 block mb-1">Conservative (-10%)</span>
                            <div className="text-lg font-bold text-slate-700">{formatINR(activeEstimate.summary?.total_low, true)}</div>
                            <span className="text-[11px] text-slate-400 font-mono block mt-0.5">{formatINR(activeEstimate.summary?.total_low)}</span>
                          </div>

                          <div className="p-3.5 bg-white border-2 border-blue-600 rounded-md shadow-sm">
                            <span className="text-[11px] font-bold text-blue-600 block mb-1">Expected Budget</span>
                            <div className="text-xl font-bold text-slate-900">{formatINR(activeEstimate.summary?.total_expected, true)}</div>
                            <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                              {formatINR(activeEstimate.summary?.total_expected)} (~₹{Math.round(activeEstimate.summary?.total_expected / (projectDetails.build_specs?.total_sqft || 2400))}/sqft)
                            </span>
                          </div>

                          <div className="p-3.5 bg-white border border-slate-200 rounded-md shadow-xs">
                            <span className="text-[11px] font-medium text-slate-500 block mb-1">Contingency (+15%)</span>
                            <div className="text-lg font-bold text-slate-700">{formatINR(activeEstimate.summary?.total_high, true)}</div>
                            <span className="text-[11px] text-slate-400 font-mono block mt-0.5">{formatINR(activeEstimate.summary?.total_high)}</span>
                          </div>
                        </div>

                        {/* Plain English Summary */}
                        <div className="p-4 bg-white border border-slate-200 rounded-md shadow-xs">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-800">Executive Summary</span>
                            <button
                              onClick={() => handleRequestExplanation(activeEstimate.version_number || 2)}
                              disabled={loadingExplanation}
                              className="text-[11px] text-blue-600 hover:text-blue-700 font-medium underline cursor-pointer"
                            >
                              {loadingExplanation ? 'Updating...' : 'Regenerate'}
                            </button>
                          </div>
                          <p className="text-xs leading-relaxed text-slate-600">
                            {aiExplanationText || activeEstimate.summary?.ai_explanation || 'No summary available.'}
                          </p>
                        </div>

                        {/* Risk Flags if any */}
                        {activeEstimate.risk_flags && activeEstimate.risk_flags.length > 0 && (
                          <div className="p-4 bg-white border border-slate-200 rounded-md shadow-xs space-y-2">
                            <span className="text-xs font-bold text-slate-800">Site Risk Factors</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {activeEstimate.risk_flags.map((flag, idx) => (
                                <div key={idx} className="p-2 bg-amber-50/60 border border-amber-200 text-amber-900 rounded">
                                  &bull; {flag}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Trade Distribution Bar */}
                        <div className="p-4 bg-white border border-slate-200 rounded-md shadow-xs space-y-3">
                          <span className="text-xs font-bold text-slate-800">Cost Breakdown by Trade</span>
                          <div className="h-3 w-full rounded overflow-hidden flex bg-slate-100">
                            {breakdownItems.map((item) => {
                              const pct = totalCost > 0 ? (item.estimated_cost / totalCost) * 100 : 0;
                              return (
                                <div
                                  key={item.category}
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: CATEGORY_COLORS[item.category] || '#64748b',
                                  }}
                                  title={`${CATEGORY_NAMES[item.category] || item.category}: ${formatINR(item.estimated_cost)} (${pct.toFixed(1)}%)`}
                                />
                              );
                            })}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            {breakdownItems.map((item) => {
                              const pct = totalCost > 0 ? (item.estimated_cost / totalCost) * 100 : 0;
                              return (
                                <div key={item.category} className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                  <div className="flex items-center gap-1.5 truncate max-w-[120px]">
                                    <span
                                      className="w-2 h-2 rounded-full shrink-0"
                                      style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#64748b' }}
                                    />
                                    <span className="truncate font-medium">{CATEGORY_NAMES[item.category] || item.category}</span>
                                  </div>
                                  <span className="font-mono text-slate-900 font-semibold">{pct.toFixed(0)}%</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Itemized Table */}
                        <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
                          <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800">
                            Itemized Trade Estimates
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-100/60 text-slate-600 border-b border-slate-200">
                                <tr>
                                  <th className="py-2.5 px-3 font-semibold">Trade Component</th>
                                  {viewMode === 'compare' && <th className="py-2.5 px-3 font-semibold">Baseline (₹)</th>}
                                  {viewMode !== 'baseline' && <th className="py-2.5 px-3 font-semibold">Adjustment</th>}
                                  <th className="py-2.5 px-3 font-semibold">Estimated Cost (₹)</th>
                                  <th className="py-2.5 px-3 font-semibold">Site Reason</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700">
                                {breakdownItems.map((item, idx) => {
                                  const baselineMatch = baselineEstimate?.itemized_breakdown?.find(b => b.category === item.category);
                                  const baseCost = baselineMatch ? baselineMatch.estimated_cost : item.baseline_cost;
                                  return (
                                    <tr key={idx} className="hover:bg-slate-50 transition">
                                      <td className="py-2 px-3 font-medium text-slate-900">
                                        {CATEGORY_NAMES[item.category] || item.category}
                                      </td>
                                      {viewMode === 'compare' && (
                                        <td className="py-2 px-3 font-mono text-slate-600">{formatINR(baseCost)}</td>
                                      )}
                                      {viewMode !== 'baseline' && (
                                        <td className="py-2 px-3 font-mono">
                                          {item.adjustment_percentage ? (
                                            <span className={`font-semibold ${item.adjustment_percentage > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                              {item.adjustment_percentage > 0 ? `+${item.adjustment_percentage}%` : `${item.adjustment_percentage}%`}
                                            </span>
                                          ) : (
                                            <span className="text-slate-400">0%</span>
                                          )}
                                        </td>
                                      )}
                                      <td className="py-2 px-3 font-bold text-slate-900 font-mono">{formatINR(item.estimated_cost)}</td>
                                      <td className="py-2 px-3 text-slate-500 text-[11px] max-w-xs truncate">
                                        {item.adjustment_reason || 'Standard state baseline rate'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* What-If Live Simulation */}
                        <div className="p-4 bg-white border border-slate-200 rounded-md shadow-xs space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div>
                              <span className="text-xs font-bold text-slate-900 block">Scenario Adjustment</span>
                              <span className="text-[11px] text-slate-500">Modify finish quality, timeline, or built-up area.</span>
                            </div>
                            <button
                              onClick={handleRecalculateWhatIf}
                              disabled={recalculatingWhatIf}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded transition shadow-xs cursor-pointer"
                            >
                              {recalculatingWhatIf ? 'Calculating...' : 'Recalculate (₹)'}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div>
                              <label className="block text-slate-700 font-medium mb-1">Finish Quality Tier</label>
                              <select
                                value={whatIfTier}
                                onChange={(e) => setWhatIfTier(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600"
                              >
                                {MATERIAL_TIERS.map(t => (
                                  <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <div className="flex justify-between text-slate-700 font-medium mb-1">
                                <span>Timeline</span>
                                <span className="text-blue-600 font-mono font-bold">{whatIfTimeline} mo</span>
                              </div>
                              <input
                                type="range"
                                min={6}
                                max={24}
                                step={1}
                                value={whatIfTimeline}
                                onChange={(e) => setWhatIfTimeline(Number(e.target.value))}
                                className="w-full accent-blue-600 cursor-pointer"
                              />
                            </div>
                            <div>
                              <div className="flex justify-between text-slate-700 font-medium mb-1">
                                <span>Built-Up Area</span>
                                <span className="text-blue-600 font-mono font-bold">{whatIfSqft.toLocaleString('en-IN')} sqft</span>
                              </div>
                              <input
                                type="range"
                                min={800}
                                max={8000}
                                step={100}
                                value={whatIfSqft}
                                onChange={(e) => setWhatIfSqft(Number(e.target.value))}
                                className="w-full accent-blue-600 cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 bg-white border border-slate-200 rounded-md text-center space-y-3 shadow-xs">
                        <h3 className="text-sm font-bold text-slate-900">Generate Estimate</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Calculate baseline construction costs using state rate tables, then apply geotechnical AI adjustments.
                        </p>
                        <button
                          onClick={handleGenerateBaseline}
                          disabled={loadingEstimate}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition shadow-xs cursor-pointer"
                        >
                          {loadingEstimate ? 'Calculating...' : 'Generate Baseline Estimate (₹)'}
                        </button>
                      </div>
                    )}
                  </ErrorBoundary>
                </>
              ) : (
                /* Home Overview Dashboard */
                <div className="space-y-5">
                  {/* Home Hero Welcome Card */}
                  <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-xs space-y-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Welcome to BuildCost India</h2>
                      <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                        Accurate residential house construction estimates (in INR ₹) across all 33 Indian States &amp; Union Territories. Factor RCC columns, soil profiles, and finish quality with AI geotechnical adjustments.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <button
                        onClick={() => {
                          setShowCreateModal(true);
                          setCreationMode('wizard');
                          setWizardStep(1);
                        }}
                        className="p-4 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 text-left transition cursor-pointer group"
                      >
                        <div className="font-bold text-blue-900 text-sm mb-1 group-hover:text-blue-700 flex items-center justify-between">
                          <span>📋 Multi-Step Project Form</span>
                          <span>&rarr;</span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Step-by-step wizard for plot dimensions (30x40, 40x60), state rates, and RCC specs.
                        </p>
                      </button>

                      <button
                        onClick={() => {
                          setShowCreateModal(true);
                          setCreationMode('nl');
                        }}
                        className="p-4 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-50 hover:border-purple-300 text-left transition cursor-pointer group"
                      >
                        <div className="font-bold text-purple-900 text-sm mb-1 group-hover:text-purple-700 flex items-center justify-between">
                          <span>✨ Natural Language AI Intake</span>
                          <span>&rarr;</span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Describe in plain English (e.g. <em>"3 BHK duplex in Bengaluru with borewell"</em>) to extract fields.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Recent Projects Card Grid with Delete Action */}
                  {projects.length > 0 && (
                    <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Your Saved Projects</h3>
                        <span className="text-xs text-slate-500">{projects.length} Total</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {projects.slice(0, 6).map((proj) => (
                          <div
                            key={proj._id}
                            onClick={() => loadProject(proj._id)}
                            className="p-3.5 rounded-md border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition cursor-pointer flex flex-col justify-between group"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="font-semibold text-slate-900 text-xs truncate max-w-[170px]">{proj.name}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                  {proj.region_code}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => openDeleteModal(proj._id, proj.name, e)}
                                  title="Delete project"
                                  className="text-slate-400 hover:text-red-600 p-0.5 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span className="truncate max-w-[140px]">📍 {proj.location_text}</span>
                              <span>📐 {proj.land_size_sqft?.toLocaleString('en-IN')} sqft</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* State Rate Quick Reference Table */}
                  <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Indian Construction Rates Index</h3>
                      <span className="text-xs text-slate-500 font-mono">33 States &amp; UTs</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {REGIONS.slice(0, 9).map((r) => (
                        <div key={r.code} className="p-2 bg-slate-50 rounded border border-slate-100 flex items-center justify-between">
                          <span className="text-slate-700 font-medium truncate max-w-[110px]">{r.name.split('(')[0]}</span>
                          <span className="font-mono text-blue-700 font-bold text-[11px]">{r.tier}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Expanded Full-Featured Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl max-w-3xl w-full p-6 space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">New House Project</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer">
                ✕
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setCreationMode('wizard')}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition cursor-pointer ${
                  creationMode === 'wizard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Standard Form
              </button>
              <button
                type="button"
                onClick={() => setCreationMode('nl')}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition cursor-pointer ${
                  creationMode === 'nl' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Natural Language Input
              </button>
            </div>

            {createError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                {createError}
              </div>
            )}

            {creationMode === 'nl' ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Describe your house project:</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. 3 BHK duplex on a 30x40 plot in Bengaluru with standard finish"
                    value={nlInput}
                    onChange={(e) => setNlInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleParseNlDescription}
                  disabled={nlLoading || !nlInput.trim()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium cursor-pointer"
                >
                  {nlLoading ? 'Extracting...' : 'Parse Description'}
                </button>

                {nlExtractedData && (
                  <div className="space-y-3 pt-2">
                    <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-[11px]">
                      Extracted successfully. Review fields before saving:
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-600 block text-[10px] font-medium">Name</span>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900"
                        />
                      </div>
                      <div>
                        <span className="text-slate-600 block text-[10px] font-medium">Built-Up Area (sqft)</span>
                        <input
                          type="number"
                          value={formData.total_sqft}
                          onChange={(e) => setFormData({ ...formData, total_sqft: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900"
                        />
                      </div>
                      <div>
                        <span className="text-slate-600 block text-[10px] font-medium">State</span>
                        <select
                          value={formData.region_code}
                          onChange={(e) => setFormData({ ...formData, region_code: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900"
                        >
                          {REGIONS.map(r => (
                            <option key={r.code} value={r.code}>{r.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <span className="text-slate-600 block text-[10px] font-medium">Finish Tier</span>
                        <select
                          value={formData.material_tier}
                          onChange={(e) => setFormData({ ...formData, material_tier: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900"
                        >
                          {MATERIAL_TIERS.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateProject}
                        disabled={createLoading}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded cursor-pointer"
                      >
                        {createLoading ? 'Saving...' : 'Save & Create'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleCreateProject} className="space-y-5 text-xs">

                {/* Section 1: Project Info */}
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">📌 Project Info</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Project Name</label>
                      <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. 3 BHK Residential House" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">City / Locality</label>
                      <input type="text" required value={formData.location_text} onChange={(e) => setFormData({ ...formData, location_text: e.target.value })} placeholder="e.g. Whitefield, Bengaluru" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">State / Rate Index</label>
                      <select value={formData.region_code} onChange={(e) => setFormData({ ...formData, region_code: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500">
                        {REGIONS.map(r => (<option key={r.code} value={r.code}>{r.name} ({r.tier})</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Build Type</label>
                      <select value={formData.build_type} onChange={(e) => setFormData({ ...formData, build_type: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500">
                        <option>Residential House</option>
                        <option>Villa</option>
                        <option>Duplex</option>
                        <option>Apartment Unit</option>
                        <option>Row House</option>
                        <option>Farm House</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Land Details */}
                <div className="pt-1 border-t border-slate-100">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">🏔️ Land Details</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Plot Area (sqft)</label>
                      <input type="number" required min={100} value={formData.land_size_sqft} onChange={(e) => setFormData({ ...formData, land_size_sqft: e.target.value })} placeholder="e.g. 2400" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Terrain</label>
                      <select value={formData.topography} onChange={(e) => setFormData({ ...formData, topography: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500">
                        <option>Flat Terrain</option>
                        <option>Gentle Slope</option>
                        <option>Steep Slope</option>
                        <option>Hilly</option>
                        <option>Rocky</option>
                        <option>Waterlogged</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Soil Type</label>
                      <select value={formData.soil_type} onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500">
                        <option>Red Soil</option>
                        <option>Black Cotton Soil</option>
                        <option>Alluvial Soil</option>
                        <option>Sandy Soil</option>
                        <option>Laterite Soil</option>
                        <option>Rocky / Hard</option>
                        <option>Clay Soil</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Utilities</label>
                      <select value={formData.utilities_status} onChange={(e) => setFormData({ ...formData, utilities_status: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500">
                        <option>Connected</option>
                        <option>Partial</option>
                        <option>None</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Zoning / Approval</label>
                      <select value={formData.zoning_type} onChange={(e) => setFormData({ ...formData, zoning_type: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500">
                        <option>BBMP / BDA Approved</option>
                        <option>HMDA / GHMC Approved</option>
                        <option>DTCP Approved</option>
                        <option>Gram Panchayat</option>
                        <option>RERA Registered</option>
                        <option>NA Plot</option>
                      </select>
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.has_access_road} onChange={(e) => setFormData({ ...formData, has_access_road: e.target.checked })} className="w-4 h-4 accent-blue-600 rounded" />
                        <span className="text-slate-700 font-medium">Has Access Road</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Section 3: Build Specifications */}
                <div className="pt-1 border-t border-slate-100">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">🏗️ Build Specifications</h3>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Built-Up (sqft)</label>
                      <input type="number" required min={100} value={formData.total_sqft} onChange={(e) => setFormData({ ...formData, total_sqft: e.target.value })} placeholder="e.g. 2400" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">No. of Floors</label>
                      <input type="number" required min={1} max={10} value={formData.floors} onChange={(e) => setFormData({ ...formData, floors: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Finish Tier</label>
                      <select value={formData.material_tier} onChange={(e) => setFormData({ ...formData, material_tier: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500">
                        {MATERIAL_TIERS.map(t => (<option key={t.value} value={t.value}>{t.label} — {t.desc}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Timeline (months)</label>
                      <input type="number" required min={3} max={60} value={formData.timeline_months} onChange={(e) => setFormData({ ...formData, timeline_months: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer font-medium">
                    Cancel
                  </button>
                  <button type="submit" disabled={createLoading} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg cursor-pointer shadow-sm">
                    {createLoading ? 'Creating...' : '✓ Create Project'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}


      {/* Custom UI Warning / Confirmation Dialog for Delete */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl scale-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0 text-lg">
                ⚠️
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Delete Project?</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to permanently delete <strong className="text-slate-900">"{deleteTarget.name}"</strong>?
                </p>
              </div>
            </div>

            <div className="p-3 bg-red-50/70 border border-red-200/80 rounded-lg text-xs text-red-800 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <span>✕</span> Irreversible Action
              </div>
              <p className="text-[11px] text-red-700">
                All associated baseline rates, geotechnical AI adjustments, site specifications, and calculation histories will be permanently removed.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deletingId === deleteTarget.id}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-lg border border-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteProject}
                disabled={deletingId === deleteTarget.id}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1.5"
              >
                <span>{deletingId === deleteTarget.id ? 'Deleting Project...' : 'Yes, Delete Project'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

