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
    title: 'Brand DNA Baseline',
    headline: 'Onboard Brand DNA',
    description: 'Locking in official apex domains & verified handles. If it’s not on this allowlist, it’s fake. Zero cap.',
    targetSelector: '[data-tour="onboarding-dna"]',
    tooltipPosition: 'bottom',
    icon: '✨',
    accentColor: '#0f7b6c',
    telemetryBadge: 'DNA Locked In',
    findingsDiscovered: ['Apex: nexbank.com', 'Verified handles', 'DNS anchored'],
  },
  {
    id: 'brand-registry',
    stepNumber: 2,
    totalSteps: 12,
    route: '/brands',
    title: 'Brand Allowlist',
    headline: 'Ground-Truth Assets',
    description: 'Official roster across Web, X, and IG. Any lookalike trying to clone this gets flagged on sight.',
    targetSelector: '[data-tour="brand-registry"]',
    tooltipPosition: 'bottom',
    icon: '🧬',
    accentColor: '#0f7b6c',
    telemetryBadge: 'Baseline Active',
    findingsDiscovered: ['4 Core assets', 'Self-flagging excluded', 'Delta: 0.85'],
  },
  {
    id: 'connectors',
    stepNumber: 3,
    totalSteps: 12,
    route: '/connectors',
    title: 'Data Ingestion',
    headline: 'Live Surface Tunnels',
    description: 'Hooked up to X, IG, LinkedIn & Telegram via Composio. 24/7 telemetry streams with zero API key leaks.',
    targetSelector: '[data-tour="connectors"]',
    tooltipPosition: 'bottom',
    icon: '🔌',
    accentColor: '#0f7b6c',
    telemetryBadge: 'Composio Streaming',
    findingsDiscovered: ['5 Live brokers', 'Bi-directional webhooks', 'Zero leaks'],
  },
  {
    id: 'threat-scan-hud',
    stepNumber: 4,
    totalSteps: 12,
    route: '/overview',
    title: 'Threat Scanner',
    headline: 'Perimeter Radar',
    description: 'NVIDIA Nemotron sweeping the open web 24/7. Spotting clone accounts and typosquats in real time.',
    targetSelector: '[data-tour="threat-hud"]',
    tooltipPosition: 'bottom',
    icon: '📡',
    accentColor: '#0f7b6c',
    telemetryBadge: 'Nemotron Active',
    findingsDiscovered: ['Sub-sec radar', 'Cross-platform', 'Hash matched'],
  },
  {
    id: 'overview-metrics',
    stepNumber: 5,
    totalSteps: 12,
    route: '/overview',
    title: 'Command Center',
    headline: 'Security Posture',
    description: '15 sus threats caught in the last 24h. Prioritized by risk so analysts don’t waste seconds on noise.',
    targetSelector: '[data-tour="stat-cards"]',
    tooltipPosition: 'bottom',
    icon: '🛡️',
    accentColor: '#0f7b6c',
    telemetryBadge: 'Live Threat Feed',
    findingsDiscovered: ['15 Threats (24h)', '5 Hostile rings', '94% Risk index'],
  },
  {
    id: 'sightings',
    stepNumber: 6,
    totalSteps: 12,
    route: '/sightings',
    title: 'Findings Queue',
    headline: 'Raw Telemetry Queue',
    description: 'Every sus finding logged with WHOIS, live payloads, and IP origins. Zero lag, straight receipts.',
    targetSelector: '[data-tour="findings-queue"]',
    tooltipPosition: 'bottom',
    icon: '📋',
    accentColor: '#0f7b6c',
    interactionHint: 'Click a finding to inspect raw evidence',
    telemetryBadge: 'Forensic Archive',
    findingsDiscovered: ['Live payload archive', 'WHOIS receipts', 'ASN tracing'],
  },
  {
    id: 'alerts',
    stepNumber: 7,
    totalSteps: 12,
    route: '/alerts',
    title: 'Risk Alerts',
    headline: 'Real-Time Incidents',
    description: 'Instant dispatch on high-risk impersonators. Real executive accounts are hard-whitelisted — zero false alarms.',
    targetSelector: '[data-tour="alert-list"]',
    tooltipPosition: 'bottom',
    icon: '🔔',
    accentColor: '#eb5757',
    telemetryBadge: 'Alert Dispatch',
    findingsDiscovered: ['Critical alerts only', 'Execs whitelisted', 'Zero false alarms'],
  },
  {
    id: 'lookalike-tags',
    stepNumber: 8,
    totalSteps: 12,
    route: '/alerts',
    title: 'AI Analysis',
    headline: 'Homoglyph Detection',
    description: 'Spotted "@NexBànk_Help" using the sneaky accented "à". Human eyes miss it, our NIM engine caught it in 4k.',
    targetSelector: '[data-tour="lookalike-tags"]',
    tooltipPosition: 'top',
    icon: '🔍',
    accentColor: '#0f7b6c',
    interactionHint: 'Try clicking Export CSV',
    telemetryBadge: 'Homoglyph Caught',
    findingsDiscovered: ['Accented char flag', 'Visual match: 0.94', 'Exportable dossier'],
  },
  {
    id: 'campaigns-overview',
    stepNumber: 9,
    totalSteps: 12,
    route: '/overview',
    title: 'Campaign Intel',
    headline: 'Threat Clustering',
    description: 'Connecting the dots. Operation ShadowBank linked 8 phishing sites and a rogue APK to one threat actor.',
    targetSelector: '[data-tour="priority-campaigns"]',
    tooltipPosition: 'top',
    icon: '🕸️',
    accentColor: '#eb5757',
    interactionHint: 'Click Investigate to explore the attack graph',
    telemetryBadge: 'Campaign Clustered',
    findingsDiscovered: ['ShadowBank mapped', '8 Linked nodes', '1 Actor tied'],
  },
  {
    id: 'campaign-graph',
    stepNumber: 10,
    totalSteps: 12,
    route: '/campaigns/demo-camp-001',
    title: 'Attack Graph',
    headline: 'Attack Topology',
    description: 'Visualizing the hostile network: shared IPs, fast-flux DNS, and C2 beacons. Full analyst audit control.',
    targetSelector: '[data-tour="campaign-graph"]',
    tooltipPosition: 'right',
    icon: '🗺️',
    accentColor: '#0f7b6c',
    telemetryBadge: 'Network Graph',
    findingsDiscovered: ['Shared IP: 185.220.101', 'DNS beacon mapped', 'Analyst approved'],
  },
  {
    id: 'app-radar',
    stepNumber: 11,
    totalSteps: 12,
    route: '/apps',
    title: 'App Radar',
    headline: 'Rogue Mobile APKs',
    description: 'Intercepted fake banking APKs on Telegram with SMS-stealing spyware and bad certs before users got scammed.',
    targetSelector: '[data-tour="app-radar"]',
    tooltipPosition: 'bottom',
    icon: '📱',
    accentColor: '#eb5757',
    interactionHint: 'Click a rogue app to inspect permissions',
    telemetryBadge: 'Malicious APKs Blocked',
    findingsDiscovered: ['3 Cloned APKs', 'SMS permissions', 'Cert mismatch'],
  },
  {
    id: 'responses',
    stepNumber: 12,
    totalSteps: 12,
    route: '/responses',
    title: 'Remediation',
    headline: 'One-Click Takedowns',
    description: 'Cryptographic evidence packets dispatched to Cloudflare and Meta in one tap. Threat neutralised.',
    targetSelector: '[data-tour="response-cases"]',
    tooltipPosition: 'bottom',
    icon: '⚡',
    accentColor: '#0f7b6c',
    interactionHint: 'Click "Approve" to simulate takedown dispatch',
    telemetryBadge: 'Takedown Dispatched',
    findingsDiscovered: ['SHA-256 evidence packet', 'Cloudflare & Meta templates', '1-Tap dispatch'],
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
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [tourActive, setTourActive] = useState<boolean>(false);
  const [tourStep, setTourStep] = useState<number>(0);
  const [interactions, setInteractions] = useState<DemoInteractionState>({
    whitelistedDomains: new Set(),
    dismissedAlerts: new Set(),
    triggeredTakedowns: new Set(),
    inspectedFindings: new Set(),
    simulatedActions: [],
  });

  // Client-side initial hydration from storage/cookies/URL
  useEffect(() => {
    try {
      const stored =
        localStorage.getItem(DEMO_STORAGE_KEY) === 'true' ||
        localStorage.getItem('astra_demo_mode') === 'true';
      const hasCookie = typeof document !== 'undefined' && document.cookie.includes('astra_demo_mode=true');
      const hasParam = window.location.search.includes('demo=true') || window.location.pathname.startsWith('/demo');
      const active = stored || hasCookie || hasParam;

      if (active) {
        setIsDemoMode(true);
        const savedStep = parseInt(localStorage.getItem(DEMO_TOUR_STEP_KEY) || '0', 10);
        const storedActive = localStorage.getItem(DEMO_TOUR_ACTIVE_KEY);
        setTourStep(savedStep);
        setTourActive(storedActive !== null ? storedActive === 'true' : true);
        setInteractions(loadInteractions());
      }
    } catch {}
  }, []);

  // Synchronize across tabs or custom storage triggers
  useEffect(() => {
    const handleStorage = () => {
      try {
        const active =
          localStorage.getItem(DEMO_STORAGE_KEY) === 'true' ||
          localStorage.getItem('astra_demo_mode') === 'true';
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
