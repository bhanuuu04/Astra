'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  DEMO_STORAGE_KEY,
  DEMO_TOUR_STEP_KEY,
  DEMO_TOUR_ACTIVE_KEY,
  DEMO_STATE_KEY,
  DEMO_TENANT,
  DEMO_USER,
  DEMO_BRANDS,
  DEMO_SIGHTINGS,
  DEMO_CAMPAIGNS,
  DEMO_ROGUE_APPS,
  DEMO_RESPONSE_CASES,
  DEMO_OVERVIEW,
  DEMO_CONNECTORS,
} from '@/lib/demo-data';

// ─────────────────────────────────────────────
// TOUR STEPS DEFINITION
// ─────────────────────────────────────────────
export interface TourStep {
  id: string;
  stepNumber: number;
  totalSteps: number;
  route: string;
  title: string;
  headline: string;
  description: string;
  targetSelector?: string;        // CSS selector for spotlight element
  spotlightPadding?: number;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: string;
  accentColor?: string;
  interactionHint?: string;      // Prompt user to click something
  autoAdvanceMs?: number;
  telemetryBadge?: string;        // E.g. "Nemotron-3.5 Real-Time Analysis"
  findingsDiscovered?: string[];  // Forensic signals found in this step
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'brand-onboarding',
    stepNumber: 1,
    totalSteps: 12,
    route: '/guide',
    title: 'Brand Setup & Setup',
    headline: 'Step 1: Enrolling Brand DNA',
    description: 'Every brand\'s defense starts with registration. Here, NexBank Financial enrolled its core digital identity: official apex domain (nexbank.com), verified social handles, mobile app identifiers, and executive profiles into Astra\'s verified reference registry.',
    targetSelector: '[data-tour="onboarding-dna"]',
    tooltipPosition: 'bottom',
    icon: '✨',
    accentColor: '#0f7b6c',
    telemetryBadge: 'Brand Registry Enrolled',
    findingsDiscovered: ['Apex Domain: nexbank.com', '4 Verified channels locked', 'Cryptographic DNS anchor'],
  },
  {
    id: 'brand-registry',
    stepNumber: 2,
    totalSteps: 12,
    route: '/brands',
    title: 'Brand DNA Allowlist',
    headline: 'Step 2: Establishing the Baseline',
    description: 'Once enrolled, Astra establishes what is legitimate. 4 verified assets form NexBank\'s baseline across Web, X, Instagram, and Android. Any internet asset that mimics this identity without matching verified credentials is automatically flagged as an impersonator.',
    targetSelector: '[data-tour="brand-registry"]',
    tooltipPosition: 'bottom',
    icon: '🧬',
    accentColor: '#0f7b6c',
    telemetryBadge: 'Allowlist Active & Immutable',
    findingsDiscovered: ['4 Verified core assets', 'Delta threshold: 0.85', 'Self-flagging hard-excluded'],
  },
  {
    id: 'connectors',
    stepNumber: 3,
    totalSteps: 12,
    route: '/connectors',
    title: 'Data Ingestion',
    headline: 'Step 3: Connecting Monitored Surfaces',
    description: 'NexBank links monitored social channels via Composio OAuth brokers in seconds — no complex developer API keys required. 5 sources are actively streaming telemetry: Instagram Graph, X Enterprise, LinkedIn, Telegram, and Facebook.',
    targetSelector: '[data-tour="connectors"]',
    tooltipPosition: 'bottom',
    icon: '🔌',
    accentColor: '#0f7b6c',
    telemetryBadge: 'Composio Ingestion Streaming',
    findingsDiscovered: ['5 Active broker tunnels', 'Bi-directional webhooks', 'Zero API credential leaks'],
  },
  {
    id: 'threat-scan-hud',
    stepNumber: 4,
    totalSteps: 12,
    route: '/overview',
    title: 'Threat Detection',
    headline: 'Step 4: Real-Time Perimeter Scanner',
    description: 'Astra\'s NVIDIA Nemotron-3.5 engine sweeps the open internet 24/7. It correlates newly registered domains, scraped social profiles, and uploaded APKs against NexBank\'s Brand DNA baseline in real time.',
    targetSelector: '[data-tour="threat-hud"]',
    tooltipPosition: 'bottom',
    icon: '📡',
    accentColor: '#0f7b6c',
    telemetryBadge: 'Nemotron Perimeter Sweep Active',
    findingsDiscovered: ['Sub-second open web radar', 'Cross-platform scraper feed', 'Cryptographic hash checks'],
  },
  {
    id: 'overview-metrics',
    stepNumber: 5,
    totalSteps: 12,
    route: '/overview',
    title: 'Command Center',
    headline: 'Step 5: The Daily Security Posture',
    description: 'When the security team logs in, they see their complete threat posture: 15 active threat findings discovered in the past 24 hours across 5 surfaces, with automated severity prioritization and risk scoring.',
    targetSelector: '[data-tour="stat-cards"]',
    tooltipPosition: 'bottom',
    icon: '🛡️',
    accentColor: '#0f7b6c',
    telemetryBadge: 'Command Center Telemetry',
    findingsDiscovered: ['15 Threat findings (24h)', '5 Active hostile campaigns', '94% Aggregate risk score'],
  },
  {
    id: 'sightings',
    stepNumber: 6,
    totalSteps: 12,
    route: '/sightings',
    title: 'Findings Queue',
    headline: 'Step 6: Triaging Raw Threat Signals',
    description: 'Every suspicious finding is cataloged with full forensic telemetry. Analysts can click any row to inspect live payloads, IP addresses, WHOIS records, and sender metadata with zero latency.',
    targetSelector: '[data-tour="findings-queue"]',
    tooltipPosition: 'bottom',
    icon: '📋',
    accentColor: '#0f7b6c',
    interactionHint: 'Click a finding to inspect raw evidence',
    telemetryBadge: 'Forensic Ingestion Queue',
    findingsDiscovered: ['Live HTTP payload archive', 'WHOIS registrant attribution', 'ASN router footprinting'],
  },
  {
    id: 'alerts',
    stepNumber: 7,
    totalSteps: 12,
    route: '/alerts',
    title: 'Risk Alerts',
    headline: 'Step 7: Real-Time Incident Alerts',
    description: 'High-risk detections immediately trigger actionable alerts. Notice the active allowlist: official handles and executive accounts are hard-excluded so analysts never waste time on self-flagged alerts.',
    targetSelector: '[data-tour="alert-list"]',
    tooltipPosition: 'bottom',
    icon: '🔔',
    accentColor: '#eb5757',
    telemetryBadge: 'Real-Time Alert Dispatch',
    findingsDiscovered: ['Critical alerts prioritized', 'Official profiles whitelisted', 'Zero alert fatigue'],
  },
  {
    id: 'lookalike-tags',
    stepNumber: 8,
    totalSteps: 12,
    route: '/alerts',
    title: 'AI Analysis',
    headline: 'Step 8: Character-Level Homoglyph Detection',
    description: 'Astra\'s NIM engine spots deceptive variations human eyes miss: "@NexBànk_Help" uses the accented character à (U+00E0) to impersonate customer support. All variations are tagged and exportable to CSV.',
    targetSelector: '[data-tour="lookalike-tags"]',
    tooltipPosition: 'top',
    icon: '🔍',
    accentColor: '#0f7b6c',
    interactionHint: 'Try clicking Export CSV',
    telemetryBadge: 'Character Homoglyph Analysis',
    findingsDiscovered: ['Accented char U+00E0 flag', 'Visual distance score: 0.94', 'Exportable CSV dossier'],
  },
  {
    id: 'campaigns-overview',
    stepNumber: 9,
    totalSteps: 12,
    route: '/overview',
    title: 'Campaign Intelligence',
    headline: 'Step 9: Correlating Threat Infrastructure',
    description: 'Rather than treating threats as isolated incidents, Astra clusters them into campaigns. "Operation ShadowBank" links 8 phishing domains and a rogue APK to the same hostile actor.',
    targetSelector: '[data-tour="priority-campaigns"]',
    tooltipPosition: 'top',
    icon: '🕸️',
    accentColor: '#eb5757',
    interactionHint: 'Click Investigate to explore the attack graph',
    telemetryBadge: 'Threat Clustering Engine',
    findingsDiscovered: ['Operation ShadowBank', '8 Linked domain nodes', 'Cross-surface actor map'],
  },
  {
    id: 'campaign-graph',
    stepNumber: 10,
    totalSteps: 12,
    route: '/campaigns/demo-camp-001',
    title: 'Attack Graph',
    headline: 'Step 10: Visualizing the Attack Network',
    description: 'Interactive attack graphs reveal the hidden network: shared IP blocks (185.220.101.47), registrar footprints, and C2 beacons. Analysts have full audit controls to confirm or reject AI link proposals.',
    targetSelector: '[data-tour="campaign-graph"]',
    tooltipPosition: 'right',
    icon: '🗺️',
    accentColor: '#0f7b6c',
    telemetryBadge: 'Interactive Attack Topology',
    findingsDiscovered: ['Shared IP: 185.220.101.47', 'Fast-flux DNS beaconing', 'Human-in-the-loop review'],
  },
  {
    id: 'app-radar',
    stepNumber: 11,
    totalSteps: 12,
    route: '/apps',
    title: 'Mobile App Radar',
    headline: 'Step 11: Intercepting Cloned Banking APKs',
    description: 'Rogue mobile apps pose extreme risk. Astra scans third-party stores and Telegram channels, detecting malicious APKs with SMS-intercept permissions and SHA-256 certificate mismatches before customers are defrauded.',
    targetSelector: '[data-tour="app-radar"]',
    tooltipPosition: 'bottom',
    icon: '📱',
    accentColor: '#eb5757',
    interactionHint: 'Click a rogue app to inspect permissions',
    telemetryBadge: 'Rogue Mobile APK Scanner',
    findingsDiscovered: ['3 Cloned banking APKs', 'SMS-intercept permissions', 'SHA-256 cert mismatch'],
  },
  {
    id: 'responses',
    stepNumber: 12,
    totalSteps: 12,
    route: '/responses',
    title: 'Remediation',
    headline: 'Step 12: One-Click Verified Takedowns',
    description: 'The lifecycle culminates in one-click remediation: pre-compiled abuse reports with cryptographic SHA-256 evidence packets submitted directly to Cloudflare, Meta, and registrars under human governance.',
    targetSelector: '[data-tour="response-cases"]',
    tooltipPosition: 'bottom',
    icon: '⚡',
    accentColor: '#0f7b6c',
    interactionHint: 'Click "Approve" to simulate takedown dispatch',
    telemetryBadge: 'Cryptographic Takedown Suite',
    findingsDiscovered: ['SHA-256 evidence bundle', 'Cloudflare & Meta templates', '1-Click verified dispatch'],
  },
];

// ─────────────────────────────────────────────
// DEMO STATE TYPES
// ─────────────────────────────────────────────
export interface DemoInteractionState {
  whitelistedDomains: Set<string>;
  dismissedAlerts: Set<string>;
  triggeredTakedowns: Set<string>;
  inspectedFindings: Set<string>;
  simulatedActions: { id: string; type: string; timestamp: string }[];
}

export interface DemoContextValue {
  isDemoMode: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  resetDemo: () => void;

  // Tour state
  tourActive: boolean;
  tourStep: number;
  currentTourStep: TourStep | null;
  startTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  skipTour: () => void;
  goToStep: (n: number) => void;

  // Demo interactions
  interactions: DemoInteractionState;
  whitelistDomain: (domain: string) => void;
  dismissAlert: (id: string) => void;
  triggerTakedown: (id: string) => void;
  inspectFinding: (id: string) => void;
  addSimulatedAction: (type: string) => void;

  // Data
  brands: typeof DEMO_BRANDS;
  sightings: typeof DEMO_SIGHTINGS;
  campaigns: typeof DEMO_CAMPAIGNS;
  rogueApps: typeof DEMO_ROGUE_APPS;
  responseCases: typeof DEMO_RESPONSE_CASES;
  overview: typeof DEMO_OVERVIEW;
  connectors: typeof DEMO_CONNECTORS;
  tenant: typeof DEMO_TENANT;
  user: typeof DEMO_USER;
}

// ─────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────
const DemoContext = createContext<DemoContextValue | null>(null);

function loadInteractions(): DemoInteractionState {
  if (typeof window === 'undefined') return { whitelistedDomains: new Set(), dismissedAlerts: new Set(), triggeredTakedowns: new Set(), inspectedFindings: new Set(), simulatedActions: [] };
  try {
    const raw = localStorage.getItem(DEMO_STATE_KEY);
    if (!raw) return { whitelistedDomains: new Set(), dismissedAlerts: new Set(), triggeredTakedowns: new Set(), inspectedFindings: new Set(), simulatedActions: [] };
    const parsed = JSON.parse(raw);
    return {
      whitelistedDomains: new Set(parsed.whitelistedDomains || []),
      dismissedAlerts: new Set(parsed.dismissedAlerts || []),
      triggeredTakedowns: new Set(parsed.triggeredTakedowns || []),
      inspectedFindings: new Set(parsed.inspectedFindings || []),
      simulatedActions: parsed.simulatedActions || [],
    };
  } catch { return { whitelistedDomains: new Set(), dismissedAlerts: new Set(), triggeredTakedowns: new Set(), inspectedFindings: new Set(), simulatedActions: [] }; }
}

function saveInteractions(state: DemoInteractionState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEMO_STATE_KEY, JSON.stringify({
      whitelistedDomains: Array.from(state.whitelistedDomains),
      dismissedAlerts: Array.from(state.dismissedAlerts),
      triggeredTakedowns: Array.from(state.triggeredTakedowns),
      inspectedFindings: Array.from(state.inspectedFindings),
      simulatedActions: state.simulatedActions,
    }));
  } catch {}
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem(DEMO_STORAGE_KEY) === 'true';
      const hasCookie = typeof document !== 'undefined' && document.cookie.includes('astra_demo_mode=true');
      const hasParam = window.location.search.includes('demo=true') || window.location.pathname.startsWith('/demo');
      return stored || hasCookie || hasParam;
    } catch {
      return false;
    }
  });
  const [tourActive, setTourActive] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const demoActive = localStorage.getItem(DEMO_STORAGE_KEY) === 'true';
      const storedActive = localStorage.getItem(DEMO_TOUR_ACTIVE_KEY);
      if (storedActive !== null) {
        return storedActive === 'true';
      }
      return demoActive;
    } catch {
      return false;
    }
  });
  const [tourStep, setTourStep] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      return parseInt(localStorage.getItem(DEMO_TOUR_STEP_KEY) || '0', 10);
    } catch {
      return 0;
    }
  });
  const [interactions, setInteractions] = useState<DemoInteractionState>(() => loadInteractions());

  // Synchronize across tabs or custom storage triggers
  useEffect(() => {
    const handleStorage = () => {
      try {
        const active = localStorage.getItem(DEMO_STORAGE_KEY) === 'true';
        const savedStep = parseInt(localStorage.getItem(DEMO_TOUR_STEP_KEY) || '0', 10);
        const storedActive = localStorage.getItem(DEMO_TOUR_ACTIVE_KEY);
        setIsDemoMode(active);
        if (active) {
          setTourStep(savedStep);
          if (storedActive !== null) {
            setTourActive(storedActive === 'true');
          }
        } else {
          setTourActive(false);
        }
      } catch {}
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const enterDemoMode = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEMO_STORAGE_KEY, 'true');
      localStorage.setItem(DEMO_TOUR_STEP_KEY, '0');
      localStorage.setItem(DEMO_TOUR_ACTIVE_KEY, 'true');
      // Set demo auth session
      localStorage.setItem('astra_active_user', JSON.stringify(DEMO_USER));
      localStorage.setItem('astra_active_tenant', JSON.stringify(DEMO_TENANT));
      localStorage.setItem('astra_auth_token', 'demo-token-bytexl-2026');
      localStorage.setItem('astra_onboarding_completed', 'true');
    }
    if (typeof document !== 'undefined') {
      document.cookie = 'astra_demo_mode=true; path=/; max-age=86400; SameSite=Lax';
    }
    setIsDemoMode(true);
    setTourStep(0);
    setTourActive(true);
  }, []);

  // Auto-activate demo mode if URL contains demo=true or is on /demo route
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.search.includes('demo=true') || window.location.pathname.startsWith('/demo')) {
      enterDemoMode();
    }
  }, [enterDemoMode]);

  const exitDemoMode = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DEMO_STORAGE_KEY);
      localStorage.removeItem(DEMO_TOUR_STEP_KEY);
      localStorage.removeItem(DEMO_TOUR_ACTIVE_KEY);
      localStorage.removeItem(DEMO_STATE_KEY);
      localStorage.removeItem('astra_active_user');
      localStorage.removeItem('astra_active_tenant');
      localStorage.removeItem('astra_auth_token');
      localStorage.removeItem('astra_onboarding_completed');
      localStorage.removeItem('astra_user_role');
      localStorage.removeItem('astra_intended_account_type');
      localStorage.removeItem('astra_current_brand_dna');
      localStorage.removeItem('astra_configured_brand');
    }
    if (typeof document !== 'undefined') {
      document.cookie = 'astra_demo_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    }
    setIsDemoMode(false);
    setTourActive(false);
    setTourStep(0);
  }, []);

  const resetDemo = useCallback(() => {
    const fresh: DemoInteractionState = { whitelistedDomains: new Set(), dismissedAlerts: new Set(), triggeredTakedowns: new Set(), inspectedFindings: new Set(), simulatedActions: [] };
    setInteractions(fresh);
    saveInteractions(fresh);
    setTourStep(0);
    setTourActive(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEMO_TOUR_STEP_KEY, '0');
      localStorage.setItem(DEMO_TOUR_ACTIVE_KEY, 'true');
    }
  }, []);

  const startTour = useCallback(() => {
    setTourStep(0);
    setTourActive(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEMO_TOUR_STEP_KEY, '0');
      localStorage.setItem(DEMO_TOUR_ACTIVE_KEY, 'true');
    }
  }, []);

  const nextTourStep = useCallback(() => {
    setTourStep((prev) => {
      const next = Math.min(prev + 1, TOUR_STEPS.length - 1);
      if (typeof window !== 'undefined') {
        localStorage.setItem(DEMO_TOUR_STEP_KEY, String(next));
        localStorage.setItem(DEMO_TOUR_ACTIVE_KEY, 'true');
      }
      if (next >= TOUR_STEPS.length - 1 && prev === TOUR_STEPS.length - 1) {
        setTourActive(false);
        if (typeof window !== 'undefined') localStorage.setItem(DEMO_TOUR_ACTIVE_KEY, 'false');
      }
      return next;
    });
  }, []);

  const prevTourStep = useCallback(() => {
    setTourStep((prev) => {
      const next = Math.max(prev - 1, 0);
      if (typeof window !== 'undefined') {
        localStorage.setItem(DEMO_TOUR_STEP_KEY, String(next));
        localStorage.setItem(DEMO_TOUR_ACTIVE_KEY, 'true');
      }
      return next;
    });
  }, []);

  const skipTour = useCallback(() => {
    setTourActive(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEMO_TOUR_ACTIVE_KEY, 'false');
    }
  }, []);

  const goToStep = useCallback((n: number) => {
    const clamped = Math.max(0, Math.min(n, TOUR_STEPS.length - 1));
    setTourStep(clamped);
    setTourActive(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEMO_TOUR_STEP_KEY, String(clamped));
      localStorage.setItem(DEMO_TOUR_ACTIVE_KEY, 'true');
    }
  }, []);

  const mutateInteractions = useCallback((fn: (prev: DemoInteractionState) => DemoInteractionState) => {
    setInteractions((prev) => {
      const next = fn(prev);
      saveInteractions(next);
      return next;
    });
  }, []);

  const whitelistDomain = useCallback((domain: string) => {
    mutateInteractions((prev) => ({ ...prev, whitelistedDomains: new Set([...prev.whitelistedDomains, domain]) }));
  }, [mutateInteractions]);

  const dismissAlert = useCallback((id: string) => {
    mutateInteractions((prev) => ({ ...prev, dismissedAlerts: new Set([...prev.dismissedAlerts, id]) }));
  }, [mutateInteractions]);

  const triggerTakedown = useCallback((id: string) => {
    mutateInteractions((prev) => ({ ...prev, triggeredTakedowns: new Set([...prev.triggeredTakedowns, id]) }));
  }, [mutateInteractions]);

  const inspectFinding = useCallback((id: string) => {
    mutateInteractions((prev) => ({ ...prev, inspectedFindings: new Set([...prev.inspectedFindings, id]) }));
  }, [mutateInteractions]);

  const addSimulatedAction = useCallback((type: string) => {
    mutateInteractions((prev) => ({
      ...prev,
      simulatedActions: [...prev.simulatedActions, { id: `action-${Date.now()}`, type, timestamp: new Date().toISOString() }],
    }));
  }, [mutateInteractions]);

  const currentTourStep = tourActive && isDemoMode ? (TOUR_STEPS[tourStep] ?? null) : null;

  const value: DemoContextValue = {
    isDemoMode, enterDemoMode, exitDemoMode, resetDemo,
    tourActive, tourStep, currentTourStep, startTour, nextTourStep, prevTourStep, skipTour, goToStep,
    interactions, whitelistDomain, dismissAlert, triggerTakedown, inspectFinding, addSimulatedAction,
    brands: DEMO_BRANDS,
    sightings: DEMO_SIGHTINGS,
    campaigns: DEMO_CAMPAIGNS,
    rogueApps: DEMO_ROGUE_APPS,
    responseCases: DEMO_RESPONSE_CASES,
    overview: DEMO_OVERVIEW,
    connectors: DEMO_CONNECTORS,
    tenant: DEMO_TENANT,
    user: DEMO_USER,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used inside <DemoProvider>');
  return ctx;
}

export function useDemoSafe(): DemoContextValue | null {
  return useContext(DemoContext);
}
