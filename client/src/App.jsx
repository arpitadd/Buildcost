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

  // ── Navigation / View State ────────────────────────────────────────────────
  // 'dashboard' | 'contractors' | 'contractor_detail' | 'quote_requests'
  const [activeView, setActiveView] = useState('dashboard');

  // ── Contractor Discovery State ─────────────────────────────────────────────
  // Context injected from a project/estimate (pre-populates filters)
  const [contractorProjectContext, setContractorProjectContext] = useState(null);
  const [contractors, setContractors] = useState([]);
  const [contractorTotal, setContractorTotal] = useState(0);
  const [loadingContractors, setLoadingContractors] = useState(false);
  const [contractorFilters, setContractorFilters] = useState({
    search: '',
    region: '',
    project_type: '',
    specialty: '',
    budget_min: '',
    budget_max: '',
    size_min: '',
    size_max: '',
  });
  const [contractorSort, setContractorSort] = useState('rating');

  // ── Contractor Detail State ────────────────────────────────────────────────
  const [selectedContractorId, setSelectedContractorId] = useState(null);
  const [contractorDetail, setContractorDetail] = useState(null);
  const [loadingContractorDetail, setLoadingContractorDetail] = useState(false);

  // ── Quote Request State ────────────────────────────────────────────────────
  const [quoteModal, setQuoteModal] = useState({ open: false, contractorId: null, contractorName: '' });
  const [quoteMessage, setQuoteMessage] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [quoteRequests, setQuoteRequests] = useState([]);
  const [loadingQuoteRequests, setLoadingQuoteRequests] = useState(false);

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
    setActiveView('dashboard');
  };

  // ── Contractor API Functions ──────────────────────────────────────────────

  const fetchContractors = useCallback(async (filters = {}, sort = 'rating', projectId = null) => {
    setLoadingContractors(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      if (sort) params.set('sort', sort);

      // If we have a project ID, use the project-based matching endpoint
      const endpoint = projectId
        ? `${API_BASE}/api/projects/${projectId}/contractors?${params}`
        : `${API_BASE}/api/contractors?${params}`;

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch contractors');
      setContractors(data.contractors || []);
      setContractorTotal(data.total || 0);
    } catch (err) {
      showToast(`Contractors: ${err.message}`);
      setContractors([]);
    } finally {
      setLoadingContractors(false);
    }
  }, [token, showToast]);

  const fetchContractorDetail = async (id) => {
    setLoadingContractorDetail(true);
    setContractorDetail(null);
    try {
      const res = await fetch(`${API_BASE}/api/contractors/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch contractor');
      setContractorDetail(data.contractor);
    } catch (err) {
      showToast(`Contractor detail: ${err.message}`);
    } finally {
      setLoadingContractorDetail(false);
    }
  };

  const handleOpenContractorDetail = async (id) => {
    setSelectedContractorId(id);
    setActiveView('contractor_detail');
    await fetchContractorDetail(id);
  };

  const handleFindContractorsForProject = () => {
    // Pre-populate context from the current project and estimate
    const context = projectDetails ? {
      projectId: projectDetails.project._id,
      projectName: projectDetails.project.name,
      region_code: projectDetails.project.region_code,
      location_text: projectDetails.project.location_text,
      build_type: projectDetails.build_specs?.build_type || '',
      total_sqft: projectDetails.build_specs?.total_sqft || null,
      total_budget_lakh: activeEstimate?.summary?.total_expected
        ? Math.round(activeEstimate.summary.total_expected / 100000 * 10) / 10
        : null,
    } : null;

    // Pre-populate filters from context
    if (context) {
      setContractorProjectContext(context);
      setContractorFilters(prev => ({
        ...prev,
        region: context.region_code || '',
        project_type: context.build_type || '',
      }));
      setContractorSort('relevance');
    }

    setActiveView('contractors');
    // Trigger fetch with project context
    fetchContractors(
      {
        region: context?.region_code || '',
        project_type: context?.build_type || '',
      },
      'relevance',
      context?.projectId || null
    );
  };

  const handleNavigateToContractors = () => {
    // Browse without project context
    setContractorProjectContext(null);
    setContractorFilters({ search: '', region: '', project_type: '', specialty: '', budget_min: '', budget_max: '', size_min: '', size_max: '' });
    setContractorSort('rating');
    setActiveView('contractors');
    fetchContractors({}, 'rating', null);
  };

  const handleApplyContractorFilters = () => {
    fetchContractors(
      contractorFilters,
      contractorSort,
      contractorProjectContext?.projectId || null
    );
  };

  const submitQuoteRequest = async () => {
    if (!quoteModal.contractorId) return;
    setSubmittingQuote(true);
    try {
      const body = {
        message: quoteMessage,
        project_id: contractorProjectContext?.projectId || undefined,
      };
      const res = await fetch(`${API_BASE}/api/contractors/${quoteModal.contractorId}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit request');
      setQuoteModal({ open: false, contractorId: null, contractorName: '' });
      setQuoteMessage('');
      showToast(`Quote request sent to ${quoteModal.contractorName}!`, 'success');
    } catch (err) {
      showToast(`Quote request error: ${err.message}`);
    } finally {
      setSubmittingQuote(false);
    }
  };

  const fetchQuoteRequests = async () => {
    setLoadingQuoteRequests(true);
    try {
      const res = await fetch(`${API_BASE}/api/quote-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch quote requests');
      setQuoteRequests(data.quote_requests || []);
    } catch (err) {
      showToast(`Quote requests: ${err.message}`);
    } finally {
      setLoadingQuoteRequests(false);
    }
  };

  const handleNavigateToQuoteRequests = () => {
    setActiveView('quote_requests');
    fetchQuoteRequests();
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
            <div className="flex items-center gap-2">
              <button
                onClick={handleGoHome}
                className={`text-xs px-2.5 py-1 rounded transition cursor-pointer ${
                  activeView === 'dashboard' && !selectedProjectId
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                🏠 Home
              </button>
              <button
                onClick={handleNavigateToContractors}
                className={`text-xs px-2.5 py-1 rounded transition cursor-pointer hidden sm:inline-flex items-center gap-1 ${
                  activeView === 'contractors' || activeView === 'contractor_detail'
                    ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                🔍 Find Contractors
              </button>
              <button
                onClick={handleNavigateToQuoteRequests}
                className={`text-xs px-2.5 py-1 rounded transition cursor-pointer hidden md:inline-flex items-center gap-1 ${
                  activeView === 'quote_requests'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                📋 My Requests
              </button>
              <span className="text-xs text-slate-600 font-medium hidden lg:inline">{currentUser.email}</span>
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
        ) : activeView === 'contractors' ? (
          /* ── Contractor Discovery View ─────────────────────────────────── */
          <ContractorDiscoveryView
            contractors={contractors}
            contractorTotal={contractorTotal}
            loading={loadingContractors}
            filters={contractorFilters}
            setFilters={setContractorFilters}
            sort={contractorSort}
            setSort={setContractorSort}
            onApplyFilters={handleApplyContractorFilters}
            onViewDetail={handleOpenContractorDetail}
            onRequestQuote={(id, name) => setQuoteModal({ open: true, contractorId: id, contractorName: name })}
            projectContext={contractorProjectContext}
            onBack={() => setActiveView('dashboard')}
            regions={REGIONS}
          />
        ) : activeView === 'contractor_detail' ? (
          /* ── Contractor Detail View ─────────────────────────────────────── */
          <ContractorDetailView
            contractor={contractorDetail}
            loading={loadingContractorDetail}
            projectContext={contractorProjectContext}
            onBack={() => setActiveView('contractors')}
            onRequestQuote={(id, name) => setQuoteModal({ open: true, contractorId: id, contractorName: name })}
          />
        ) : activeView === 'quote_requests' ? (
          /* ── Quote Requests View ────────────────────────────────────────── */
          <QuoteRequestsView
            quoteRequests={quoteRequests}
            loading={loadingQuoteRequests}
            onBack={() => setActiveView('dashboard')}
            onViewContractor={handleOpenContractorDetail}
          />
        ) : (
          /* ── Main Dashboard (default) ───────────────────────────────────── */
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

                        {/* ── Find Contractors CTA Banner ─────────────────── */}
                        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-base shrink-0">
                              🔍
                            </div>
                            <div>
                              <div className="text-sm font-bold text-emerald-900">Ready to find contractors?</div>
                              <p className="text-xs text-emerald-700 mt-0.5">
                                Discover contractors suited to your{' '}
                                <strong>{projectDetails.project.name}</strong> project.
                                Filters will be pre-filled from your project specs.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={handleFindContractorsForProject}
                            className="shrink-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shadow-sm cursor-pointer flex items-center gap-2"
                          >
                            Find Contractors for This Project →
                          </button>
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

      {/* ── Quote Request Modal ─────────────────────────────────────────── */}
      {quoteModal.open && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Request Quote</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Contact <strong>{quoteModal.contractorName}</strong>
                </p>
              </div>
              <button
                onClick={() => { setQuoteModal({ open: false, contractorId: null, contractorName: '' }); setQuoteMessage(''); }}
                className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer"
              >✕</button>
            </div>

            {contractorProjectContext && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
                <div className="font-semibold text-emerald-800 flex items-center gap-1.5">
                  📋 Project context will be shared
                </div>
                <div className="text-emerald-700 space-y-0.5">
                  <div><strong>{contractorProjectContext.projectName}</strong> — {contractorProjectContext.location_text}</div>
                  {contractorProjectContext.build_type && <div>Type: {contractorProjectContext.build_type}</div>}
                  {contractorProjectContext.total_sqft && <div>Area: {contractorProjectContext.total_sqft.toLocaleString('en-IN')} sqft</div>}
                  {contractorProjectContext.total_budget_lakh && <div>Est. Budget: ₹{contractorProjectContext.total_budget_lakh} Lakh</div>}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Message (optional)
              </label>
              <textarea
                rows={4}
                value={quoteMessage}
                onChange={(e) => setQuoteMessage(e.target.value)}
                placeholder="Briefly describe your requirements, preferred timeline, or any specific questions..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setQuoteModal({ open: false, contractorId: null, contractorName: '' }); setQuoteMessage(''); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitQuoteRequest}
                disabled={submittingQuote}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                {submittingQuote ? 'Sending...' : '✓ Send Quote Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Components
// ─────────────────────────────────────────────────────────────────────────────

function MatchBadge({ match }) {
  if (!match || !match.label) return null;
  const colors = {
    'Excellent Match': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'Good Match': 'bg-blue-100 text-blue-800 border-blue-300',
    'Partial Match': 'bg-amber-100 text-amber-800 border-amber-300',
  };
  const cls = colors[match.label] || 'bg-slate-100 text-slate-700 border-slate-300';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
      ✦ {match.label} ({match.score}%)
    </span>
  );
}

function StarRating({ rating }) {
  const full = Math.floor(rating || 0);
  const half = (rating || 0) - full >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= full ? 'text-amber-400' : i === full + 1 && half ? 'text-amber-300' : 'text-slate-200'}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function ContractorCard({ contractor, onViewDetail, onRequestQuote, projectContext }) {
  const match = contractor._match || null;
  const budgetLabel =
    contractor.budget_min_lakh && contractor.budget_max_lakh
      ? `₹${contractor.budget_min_lakh}–${contractor.budget_max_lakh}L`
      : contractor.budget_min_lakh
      ? `₹${contractor.budget_min_lakh}L+`
      : null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all group flex flex-col justify-between gap-3">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 text-sm leading-snug truncate">{contractor.business_name}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
              <span>📍</span>
              <span className="truncate">{contractor.location_text}</span>
            </p>
          </div>
          {projectContext && match && <MatchBadge match={match} />}
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-3">
          {contractor.description}
        </p>

        {/* Specialties */}
        {contractor.specialties?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {contractor.specialties.slice(0, 4).map((s) => (
              <span key={s} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded border border-slate-200 capitalize">
                {s}
              </span>
            ))}
            {contractor.specialties.length > 4 && (
              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded border border-slate-200">
                +{contractor.specialties.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <div className="bg-slate-50 rounded p-1.5 text-center border border-slate-100">
            <div className="font-bold text-slate-900">{contractor.experience_years}yr</div>
            <div className="text-slate-500">Experience</div>
          </div>
          <div className="bg-slate-50 rounded p-1.5 text-center border border-slate-100">
            <div className="font-bold text-slate-900">{contractor.completed_projects}</div>
            <div className="text-slate-500">Projects</div>
          </div>
          <div className="bg-slate-50 rounded p-1.5 text-center border border-slate-100">
            <div className="flex items-center justify-center gap-0.5">
              <span className="font-bold text-slate-900">{contractor.rating?.toFixed(1)}</span>
              <span className="text-amber-400">★</span>
            </div>
            <div className="text-slate-500">{contractor.review_count} reviews</div>
          </div>
        </div>

        {budgetLabel && (
          <p className="text-[11px] text-slate-500 mt-2">
            💰 Typical budget: <span className="font-semibold text-slate-700">{budgetLabel}</span>
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={() => onViewDetail(contractor._id)}
          className="flex-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition cursor-pointer"
        >
          View Profile
        </button>
        <button
          onClick={() => onRequestQuote(contractor._id, contractor.business_name)}
          className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer shadow-xs"
        >
          Request Quote
        </button>
      </div>
    </div>
  );
}

// ── Contractor Discovery View ──────────────────────────────────────────────
function ContractorDiscoveryView({
  contractors, contractorTotal, loading, filters, setFilters, sort, setSort,
  onApplyFilters, onViewDetail, onRequestQuote, projectContext, onBack, regions,
}) {
  const PROJECT_TYPES = [
    'Residential House', 'Villa', 'Duplex', 'Apartment Unit', 'Row House', 'Farm House',
  ];
  const SORT_OPTIONS = [
    { value: 'rating', label: 'Highest Rated' },
    { value: 'relevance', label: 'Best Match' },
    { value: 'experience', label: 'Most Experienced' },
    { value: 'projects', label: 'Most Projects' },
  ];

  return (
    <div className="space-y-4">
      {/* Breadcrumb / Back */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button onClick={onBack} className="hover:text-slate-800 cursor-pointer flex items-center gap-1">
          ← Back
        </button>
        <span>/</span>
        <span className="text-slate-700 font-medium">Find Contractors</span>
        {projectContext && (
          <>
            <span>/</span>
            <span className="text-emerald-700 font-medium">{projectContext.projectName}</span>
          </>
        )}
      </div>

      {/* Project Context Banner */}
      {projectContext && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs flex items-center gap-3">
          <span className="text-emerald-600 text-base">🎯</span>
          <div>
            <span className="font-semibold text-emerald-900">Showing contractors matched to: </span>
            <span className="text-emerald-800">
              {projectContext.projectName} • {projectContext.location_text}
              {projectContext.build_type && ` • ${projectContext.build_type}`}
              {projectContext.total_sqft && ` • ${projectContext.total_sqft.toLocaleString('en-IN')} sqft`}
              {projectContext.total_budget_lakh && ` • ₹${projectContext.total_budget_lakh}L budget`}
            </span>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filter & Search</span>
          <button
            onClick={() => setFilters({ search: '', region: '', project_type: '', specialty: '', budget_min: '', budget_max: '', size_min: '', size_max: '' })}
            className="text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer underline"
          >
            Clear all
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {/* Search */}
          <div className="sm:col-span-2 md:col-span-3">
            <input
              type="text"
              placeholder="Search by name, description, or location..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && onApplyFilters()}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 text-xs"
            />
          </div>

          {/* Region */}
          <div>
            <label className="block text-slate-600 font-medium mb-1">State / Region</label>
            <select
              value={filters.region}
              onChange={(e) => setFilters({ ...filters, region: e.target.value })}
              className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All States</option>
              {regions.map((r) => (
                <option key={r.code} value={r.code}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Project Type */}
          <div>
            <label className="block text-slate-600 font-medium mb-1">Project Type</label>
            <select
              value={filters.project_type}
              onChange={(e) => setFilters({ ...filters, project_type: e.target.value })}
              className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Types</option>
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-slate-600 font-medium mb-1">Sort By</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-slate-600 font-medium mb-1">Budget Min (₹ Lakh)</label>
            <input
              type="number"
              placeholder="e.g. 20"
              value={filters.budget_min}
              onChange={(e) => setFilters({ ...filters, budget_min: e.target.value })}
              className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium mb-1">Budget Max (₹ Lakh)</label>
            <input
              type="number"
              placeholder="e.g. 200"
              value={filters.budget_max}
              onChange={(e) => setFilters({ ...filters, budget_max: e.target.value })}
              className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Project Size */}
          <div>
            <label className="block text-slate-600 font-medium mb-1">Min Area (sqft)</label>
            <input
              type="number"
              placeholder="e.g. 1000"
              value={filters.size_min}
              onChange={(e) => setFilters({ ...filters, size_min: e.target.value })}
              className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <button
          onClick={onApplyFilters}
          disabled={loading}
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
        >
          {loading ? 'Searching...' : '🔍 Search Contractors'}
        </button>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>
          {loading ? 'Loading...' : `${contractorTotal} contractor${contractorTotal !== 1 ? 's' : ''} found`}
        </span>
        {projectContext && contractorTotal > 0 && (
          <span className="text-emerald-700 font-medium">Sorted by match score</span>
        )}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-10 bg-slate-100 rounded" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-12 bg-slate-100 rounded" />
                <div className="h-12 bg-slate-100 rounded" />
                <div className="h-12 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : contractors.length === 0 ? (
        <div className="p-10 bg-white border border-slate-200 rounded-xl text-center shadow-xs space-y-3">
          <div className="text-4xl">🏗️</div>
          <h3 className="text-sm font-bold text-slate-800">No contractors found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your filters, clearing the region or project type, or broadening your budget range.
          </p>
          <button
            onClick={() => {
              setFilters({ search: '', region: '', project_type: '', specialty: '', budget_min: '', budget_max: '', size_min: '', size_max: '' });
              onApplyFilters();
            }}
            className="px-4 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contractors.map((c) => (
            <ContractorCard
              key={c._id}
              contractor={c}
              onViewDetail={onViewDetail}
              onRequestQuote={onRequestQuote}
              projectContext={projectContext}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Contractor Detail View ─────────────────────────────────────────────────
function ContractorDetailView({ contractor, loading, projectContext, onBack, onRequestQuote }) {
  if (loading) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer flex items-center gap-1">
          ← Back to results
        </button>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/2" />
          <div className="h-4 bg-slate-100 rounded w-1/3" />
          <div className="h-24 bg-slate-100 rounded" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-16 bg-slate-100 rounded" />
            <div className="h-16 bg-slate-100 rounded" />
            <div className="h-16 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer flex items-center gap-1">
          ← Back to results
        </button>
        <div className="p-10 bg-white border border-slate-200 rounded-xl text-center shadow-xs">
          <p className="text-sm text-slate-600">Contractor not found.</p>
        </div>
      </div>
    );
  }

  const budgetLabel =
    contractor.budget_min_lakh && contractor.budget_max_lakh
      ? `₹${contractor.budget_min_lakh} Lakh – ₹${contractor.budget_max_lakh} Lakh`
      : contractor.budget_min_lakh ? `₹${contractor.budget_min_lakh} Lakh and above` : 'Not specified';

  const sizeLabel =
    contractor.project_size_min_sqft && contractor.project_size_max_sqft
      ? `${contractor.project_size_min_sqft.toLocaleString('en-IN')} – ${contractor.project_size_max_sqft.toLocaleString('en-IN')} sqft`
      : contractor.project_size_min_sqft ? `${contractor.project_size_min_sqft.toLocaleString('en-IN')} sqft+` : 'Not specified';

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button onClick={onBack} className="hover:text-slate-800 cursor-pointer">← Results</button>
        <span>/</span>
        <span className="text-slate-700 font-medium truncate">{contractor.business_name}</span>
      </div>

      {/* Profile Header */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-lg font-bold text-slate-900">{contractor.business_name}</h1>
              {contractor.is_demo_data && (
                <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 border border-amber-300 rounded font-medium">
                  Demo Data
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
              <span>📍</span>{contractor.location_text}
            </p>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <StarRating rating={contractor.rating} />
                <span className="font-semibold text-slate-800">{contractor.rating?.toFixed(1)}</span>
                <span className="text-slate-500">({contractor.review_count} reviews)</span>
              </div>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600">{contractor.completed_projects} projects completed</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600">{contractor.experience_years} years experience</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => onRequestQuote(contractor._id, contractor.business_name)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer transition"
            >
              📩 Request Quote
            </button>
            {contractor.phone && (
              <a
                href={`tel:${contractor.phone}`}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl cursor-pointer transition text-center"
              >
                📞 {contractor.phone}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* About */}
        <div className="md:col-span-2 space-y-4">
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">About</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{contractor.description}</p>
          </div>

          {/* Specialties & Project Types */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Specializations</h2>
            <div className="flex flex-wrap gap-1.5">
              {(contractor.specialties || []).map((s) => (
                <span key={s} className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] rounded-full capitalize font-medium">
                  {s}
                </span>
              ))}
            </div>

            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider pt-1">Project Types</h2>
            <div className="flex flex-wrap gap-1.5">
              {(contractor.project_types || []).map((t) => (
                <span key={t} className="px-2 py-1 bg-blue-50 text-blue-800 border border-blue-200 text-[11px] rounded-full font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Service Areas */}
          {contractor.region_codes?.length > 0 && (
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Service Areas</h2>
              <div className="flex flex-wrap gap-1.5">
                {contractor.region_codes.map((code) => (
                  <span key={code} className="px-2 py-1 bg-slate-100 text-slate-700 border border-slate-200 text-[11px] rounded font-mono">
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Key Stats */}
        <div className="space-y-4">
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Project Range</h2>

            <div className="space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Typical Budget</span>
                <span className="font-semibold text-slate-900 text-right">{budgetLabel}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Project Size</span>
                <span className="font-semibold text-slate-900 text-right">{sizeLabel}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Experience</span>
                <span className="font-semibold text-slate-900">{contractor.experience_years} years</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Completed</span>
                <span className="font-semibold text-slate-900">{contractor.completed_projects} projects</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500">Available</span>
                <span className={`font-semibold ${contractor.is_available ? 'text-emerald-700' : 'text-red-600'}`}>
                  {contractor.is_available ? '✓ Yes' : '✗ Currently Busy'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          {(contractor.phone || contractor.email || contractor.website) && (
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2 text-xs">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Contact</h2>
              {contractor.phone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <span>📞</span><span>{contractor.phone}</span>
                </div>
              )}
              {contractor.email && (
                <div className="flex items-center gap-2 text-slate-600">
                  <span>✉️</span><span className="break-all">{contractor.email}</span>
                </div>
              )}
              {contractor.website && (
                <div className="flex items-center gap-2 text-slate-600">
                  <span>🌐</span>
                  <a href={contractor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                    Website
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          {contractor.is_demo_data && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 leading-relaxed">
              ℹ️ This is <strong>demo/seed data</strong> for development purposes only. Contact details are fictitious.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Quote Requests View ────────────────────────────────────────────────────
function QuoteRequestsView({ quoteRequests, loading, onBack, onViewContractor }) {
  const STATUS_COLORS = {
    pending: 'bg-amber-100 text-amber-800 border-amber-300',
    contacted: 'bg-blue-100 text-blue-800 border-blue-300',
    accepted: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    declined: 'bg-red-100 text-red-800 border-red-300',
    completed: 'bg-slate-100 text-slate-700 border-slate-300',
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button onClick={onBack} className="hover:text-slate-800 cursor-pointer">← Home</button>
        <span>/</span>
        <span className="text-slate-700 font-medium">My Quote Requests</span>
      </div>

      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900">My Quote Requests</h2>
          <span className="text-xs text-slate-500">{quoteRequests.length} total</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : quoteRequests.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <div className="text-4xl">📋</div>
            <h3 className="text-sm font-bold text-slate-700">No requests yet</h3>
            <p className="text-xs text-slate-500">
              Find contractors and submit a quote request to see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {quoteRequests.map((req) => {
              const contractor = req.contractor_id;
              const statusCls = STATUS_COLORS[req.status] || STATUS_COLORS.pending;
              return (
                <div key={req._id} className="p-3.5 border border-slate-200 rounded-lg hover:border-slate-300 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-slate-900 text-xs">
                          {contractor?.business_name || 'Unknown Contractor'}
                        </span>
                        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full border capitalize ${statusCls}`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        📍 {contractor?.location_text || '—'}
                      </p>
                      {req.project_snapshot && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          📁 {req.project_snapshot.project_name}
                          {req.project_snapshot.total_sqft && ` · ${req.project_snapshot.total_sqft.toLocaleString('en-IN')} sqft`}
                          {req.project_snapshot.estimated_total_inr && ` · ₹${Math.round(req.project_snapshot.estimated_total_inr / 100000)}L est.`}
                        </p>
                      )}
                      {req.message && (
                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 italic">"{req.message}"</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-[10px] text-slate-400">
                        {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {contractor?._id && (
                        <button
                          onClick={() => onViewContractor(contractor._id)}
                          className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                        >
                          View Profile
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
