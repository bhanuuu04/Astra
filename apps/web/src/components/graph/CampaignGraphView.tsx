'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  Edge,
  Connection,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ProfileNode } from './ProfileNode';
import { WebAssetNode } from './WebAssetNode';
import { AppNode } from './AppNode';
import { IndicatorNode } from './IndicatorNode';
import { EdgeReviewDrawer } from './EdgeReviewDrawer';
import { ResponsePacketModal } from '../responses/ResponsePacketModal';
import { 
  CampaignDetail, 
  CampaignEdge, 
  ResponsePacket, 
  submitEdgeDecision, 
  generateResponsePacket 
} from '@/lib/api';
import { 
  Network, 
  Sparkles, 
  Filter, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  CheckCircle2, 
  ShieldCheck, 
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  History
} from 'lucide-react';

const TIMELINE_MILESTONES = [
  {
    step: 1,
    time: 'T-0h',
    title: 'Initial Sighting: Instagram Handle',
    description: 'DM lure spotted impersonating official brand with homoglyph username and fake emoji verification.',
    activeNodeIds: ['node-profile-1'],
  },
  {
    step: 2,
    time: 'T+2h',
    title: 'Lookalike Web Infrastructure',
    description: 'Registered phishing domain astra-mobile-update.top hosting fake support landing form.',
    activeNodeIds: ['node-profile-1', 'node-web-1'],
  },
  {
    step: 3,
    time: 'T+6h',
    title: 'Trojanized APK Distribution',
    description: 'Malicious payload com.astra.security.patch.updater detected with credential/SMS harvesting permissions.',
    activeNodeIds: ['node-profile-1', 'node-web-1', 'node-app-1'],
  },
  {
    step: 4,
    time: 'T+12h',
    title: 'Cross-Surface UPI Correlation',
    description: 'Shared payment invariant fraudster@okhdfcbank linked across Twitter and Instagram extortion messages.',
    activeNodeIds: ['node-profile-1', 'node-web-1', 'node-app-1', 'node-profile-2', 'node-indicator-upi'],
  },
  {
    step: 5,
    time: 'T+18h',
    title: 'Unified Campaign & Response Dossier',
    description: 'High-confidence multi-endpoint threat campaign synthesized; multi-recipient takedowns generated.',
    activeNodeIds: ['node-profile-1', 'node-web-1', 'node-app-1', 'node-profile-2', 'node-indicator-upi', 'node-indicator-wallet'],
  },
];

const nodeTypes = {
  profile: ProfileNode,
  webAsset: WebAssetNode,
  app: AppNode,
  indicator: IndicatorNode,
};

interface CampaignGraphViewProps {
  campaignDetail?: CampaignDetail | null;
  onRefresh?: () => void;
}

export function CampaignGraphView({
  campaignDetail,
  onRefresh,
}: CampaignGraphViewProps) {
  const [selectedEdge, setSelectedEdge] = useState<CampaignEdge | null>(null);
  const [responsePacket, setResponsePacket] = useState<ResponsePacket | null>(null);
  const [isGeneratingPacket, setIsGeneratingPacket] = useState(false);
  const [packetError, setPacketError] = useState<string | null>(null);

  // Fallback demo graph state if no backend detail loaded yet
  /* Static demo graph removed from rendering; campaign nodes must come from API records.
  const defaultInitialNodes: Node[] = useMemo(() => [
    {
      id: 'node-profile-1',
      type: 'profile',
      position: { x: 80, y: 80 },
      data: {
        label: 'Astra Mobile Support ✓',
        username: 'astra_mobile_security_patch',
        platform: 'instagram',
        surface: 'instagram',
        riskScore: 98,
        severity: 'critical',
        isFakeBadge: true,
      },
    },
    {
      id: 'node-profile-2',
      type: 'profile',
      position: { x: 80, y: 320 },
      data: {
        label: 'Astra HelpDesk Center',
        username: 'astrà_support_desk',
        platform: 'x_twitter',
        surface: 'x_twitter',
        riskScore: 92,
        severity: 'critical',
      },
    },
    {
      id: 'node-app-1',
      type: 'app',
      position: { x: 440, y: 60 },
      data: {
        label: 'Astra Patch v4.2.1',
        appName: 'Astra Mobile Security Patch APK',
        packageName: 'com.astra.security.patch.updater',
        sha256: '9f83e204c3210b4105aef89d1b702ec45819024f2b1c8a147e83492750e26d83',
        riskScore: 98,
      },
    },
    {
      id: 'node-web-1',
      type: 'webAsset',
      position: { x: 440, y: 340 },
      data: {
        label: 'Lookalike Domain',
        domain: 'astra-mobile-update.top',
        url: 'https://astra-mobile-update.top/downloads',
        riskScore: 94,
        isLookalike: true,
      },
    },
    {
      id: 'node-indicator-upi',
      type: 'indicator',
      position: { x: 260, y: 200 },
      data: {
        label: 'fraudster@okhdfcbank',
        indicatorType: 'upi',
        value: 'fraudster@okhdfcbank',
      },
    },
    {
      id: 'node-indicator-wallet',
      type: 'indicator',
      position: { x: 500, y: 220 },
      data: {
        label: '0x71C949A4C78D2c99b82F995a9757659560f4C221',
        indicatorType: 'crypto_wallet',
        value: '0x71C9...4C221',
      },
    },
  ], []);

  const defaultInitialEdges: Edge[] = useMemo(() => [
    {
      id: 'edge-1',
      source: 'node-profile-1',
      target: 'node-app-1',
      label: 'Distributes APK',
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 },
    },
    {
      id: 'edge-2',
      source: 'node-profile-1',
      target: 'node-indicator-upi',
      label: 'UPI Pivot: 1.0',
      style: { stroke: '#10b981', strokeWidth: 2.5 },
    },
    {
      id: 'edge-3',
      source: 'node-profile-2',
      target: 'node-indicator-upi',
      label: 'UPI Pivot: 1.0',
      style: { stroke: '#10b981', strokeWidth: 2.5 },
    },
    {
      id: 'edge-4',
      source: 'node-app-1',
      target: 'node-web-1',
      label: 'Hosted on Domain',
      style: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5,5' },
    },
    {
      id: 'edge-5',
      source: 'node-web-1',
      target: 'node-indicator-wallet',
      label: 'Wallet Drainer',
      style: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5,5' },
    },
  ], []);
  */

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Sync with campaignDetail if provided
  useEffect(() => {
    if (!campaignDetail) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const dynamicNodes: Node[] = [];
    const dynamicEdges: Edge[] = [];

    // 1. Build member sighting nodes
    const members = campaignDetail.members || [];
    members.forEach((m, idx) => {
      const payload = m.normalized_payload || {};
      const sender = payload.sender || {};
      const content = payload.content || '';
      const isApk = content.includes('.apk') || m.surface === 'apk';
      const isWeb = m.surface === 'web' || content.includes('http');

      const xPos = 80 + (idx % 3) * 320;
      const yPos = 80 + Math.floor(idx / 3) * 220;

      if (isApk) {
        dynamicNodes.push({
          id: `sighting-${m.id}`,
          type: 'app',
          position: { x: xPos, y: yPos },
          data: {
            label: m.raw_ref || 'Counterfeit APK',
            appName: payload.app_name || m.raw_ref || 'Mobile app finding',
            packageName: payload.package_name || 'Not provided',
            riskScore: payload.risk_score ?? 0,
          },
        });
      } else if (isWeb && m.surface === 'web') {
        dynamicNodes.push({
          id: `sighting-${m.id}`,
          type: 'webAsset',
          position: { x: xPos, y: yPos },
          data: {
            label: m.raw_ref || 'Phishing Landing',
            domain: m.raw_ref || 'Web finding',
            url: content.substring(0, 40),
            riskScore: payload.risk_score ?? 0,
            isLookalike: Boolean(payload.is_lookalike),
          },
        });
      } else {
        dynamicNodes.push({
          id: `sighting-${m.id}`,
          type: 'profile',
          position: { x: xPos, y: yPos },
          data: {
            label: sender.displayName || m.surface,
            username: sender.username || `actor_${strSlice(m.id)}`,
            platform: m.surface,
            surface: m.surface,
            riskScore: payload.risk_score ?? 0,
            severity: payload.threat_severity || 'unknown',
            isFakeBadge: sender.isFakeBadgeEmoji,
          },
        });
      }
    });

    // 2. Build candidate edges
    const endpointToNodeId = new Map(
      members.map((member) => [
        `${member.surface}:${member.raw_ref || member.id.substring(0, 8)}`,
        `sighting-${member.id}`,
      ]),
    );
    const rawEdges = campaignDetail.edges || [];
    rawEdges.forEach((e, i) => {
      const source = endpointToNodeId.get(e.from_endpoint);
      const target = endpointToNodeId.get(e.to_endpoint);
      if (!source || !target) return;
      const isConfirmed = e.review_status === 'confirmed';
      const isRejected = e.review_status === 'rejected';

      const strokeColor = isConfirmed ? '#10b981' : isRejected ? '#ef4444' : '#f59e0b';
      const strokeWidth = isConfirmed ? 2.5 : 2;

      dynamicEdges.push({
        id: e.id,
        source,
        target,
        label: `${e.pivot_type.toUpperCase()} (${Math.round(e.confidence * 100)}%)`,
        animated: e.review_status === 'proposed',
        style: {
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray: isConfirmed ? undefined : '5,5',
        },
        data: e,
      });
    });

    if (dynamicNodes.length > 0) {
      setNodes(dynamicNodes);
    }
    if (dynamicEdges.length > 0) {
      setEdges(dynamicEdges);
    }
  }, [campaignDetail, setNodes, setEdges]);

  const strSlice = (id: string) => id ? id.substring(0, 6) : '000000';

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    if (edge.data) {
      setSelectedEdge(edge.data as CampaignEdge);
    }
  }, []);

  const handleDecision = async (edgeId: string, decision: 'confirm' | 'reject', reason: string) => {
    if (campaignDetail?.campaign?.id) {
      await submitEdgeDecision(campaignDetail.campaign.id, edgeId, decision, reason);
    }
    // Update edge local visual style
    setEdges(prev =>
      prev.map(e => {
        if (e.id === edgeId) {
          const isConfirmed = decision === 'confirm';
          return {
            ...e,
            style: {
              ...e.style,
              stroke: isConfirmed ? '#10b981' : '#ef4444',
              strokeWidth: isConfirmed ? 2.5 : 1.5,
              strokeDasharray: isConfirmed ? undefined : '4,4',
            },
            data: e.data ? { ...e.data, review_status: isConfirmed ? 'confirmed' : 'rejected' } : undefined,
          };
        }
        return e;
      })
    );
    if (onRefresh) onRefresh();
  };

  const handleOpenResponsePacket = async () => {
    setIsGeneratingPacket(true);
    setPacketError(null);
    try {
      const campId = campaignDetail?.campaign?.id;
      let packet: ResponsePacket | null = null;
      if (campId) {
        packet = await generateResponsePacket(campId);
      }
      if (!packet) {
        setResponsePacket(null);
      } else {
        setResponsePacket(packet);
      }
      /*
            {
              recipient_type: 'meta',
              recipient_name: 'Meta Rights Manager / Instagram Abuse Desk',
              subject: '[DMCA / URGENT TAKEDOWN] Brand Impersonation & Phishing attacking Astra Security',
              body_text: `ATTN: Meta Trust & Safety Operations\n\nWe formally report unauthorized fraudulent accounts impersonating 'Astra Security' on Meta platforms:\nOffending Handles: @astra_mobile_security_patch (instagram)\nViolations: Brand Impersonation, Credential Harvesting, Distribution of Malicious Links.\nAstra Forensic Risk Score: 98/100 [CRITICAL]\n\nEvidence Manifest attached: 3 cryptographically hashed captures.\nPlease remove immediately pursuant to Meta Trademark & Impersonation Policies.`,
              contact_email: 'ip@instagram.com',
              portal_url: 'https://help.instagram.com/contact/636276399721841',
              policy_reference: 'Meta Brand Rights Protection & Impersonation Policy',
            },
            {
              recipient_type: 'x_twitter',
              recipient_name: 'X Safety Operations Desk',
              subject: '[TRADEMARK INFRINGEMENT] Deceptive Account Revocation Request: @astrà_support_desk',
              body_text: `ATTN: X Brand Safety & Trust Operations\n\nThe following accounts mimic official enterprise handle 'Astra Security' using homoglyphs & fake verification:\nOffending Accounts: @astrà_support_desk (x_twitter)\nAttack Vector: Direct message extortion & trademark infringement fraud.\n\nWe demand immediate handle suspension and revocation under X Impersonation Policy.`,
              contact_email: 'safety@x.com',
              portal_url: 'https://help.x.com/forms/impersonation',
              policy_reference: 'X Brand Impersonation & Deceptive Identity Policy',
            },
            {
              recipient_type: 'google_play',
              recipient_name: 'Google Play Protect & Abuse Registrar',
              subject: '[MALWARE BULLETIN] Trojanized Mobile APK Mimicking Astra Security',
              body_text: `ATTN: Google Play Protect Android Security Team\n\nWe have identified an active malicious campaign distributing counterfeit Android APKs falsely labeled as Astra Security:\nRogue Payload: AstraSecurity_Patch_v4.2.1.apk\nPackage: com.astra.security.patch.updater\nHosting Infrastructure: astra-mobile-update.top\n\nThe APK mimics official brand package and extracts SMS/TOTP authentication tokens.\nRequest: Add SHA-256 signatures to Play Protect blacklist and flag hosting domain in Safe Browsing.`,
              contact_email: 'googleplay-developer-support@google.com',
              portal_url: 'https://support.google.com/googleplay/android-developer/contact/takedown',
              policy_reference: 'Google Play Malware & Counterfeit Application Policy',
            },
            {
              recipient_type: 'icann_registrar',
              recipient_name: 'ICANN Domain Registrar WHOIS Abuse Desk',
              subject: '[PHISHING TAKEDOWN] Malicious Lookalike Domain: astra-mobile-update.top',
              body_text: `ATTN: Registrar Abuse Contact\n\nUnauthorized phishing landing domain mimicking Astra Security:\nTarget Domain: astra-mobile-update.top\nHarm: Hosting malware payloads and credential phishing landing pages.\n\nPursuant to ICANN RAA obligations, suspend DNS delegation immediately.`,
              contact_email: 'abuse@registrar-whois.org',
              portal_url: 'https://www.icann.org/compliance/complaints/abuse',
              policy_reference: 'ICANN Registrar Accreditation Agreement Phishing Takedown',
            },
            {
              recipient_type: 'payment_rail',
              recipient_name: 'Payment Rail & Bank Cyber Fraud Operations',
              subject: '[FRAUD ACCOUNT FREEZE] Scam UPI Identifier: fraudster@okhdfcbank',
              body_text: `ATTN: Bank Fraud Risk Management Desk\n\nA fraudulent payment identifier is actively soliciting extortion fees under brand impersonation:\nFlagged Payment Identifier: fraudster@okhdfcbank\n\nRequest: Place temporary debit freeze and file suspicious transaction report with I4C / CERT-In.`,
              contact_email: 'fraud-risk@npci.org.in',
              portal_url: 'https://cybercrime.gov.in',
              policy_reference: 'National Cyber Fraud Reporting Portal Protocol',
            },
            {
              recipient_type: 'customer_advisory',
              recipient_name: 'Brand Customer Safety Bulletin',
              subject: 'SECURITY ALERT: Active Impersonation Scam Warning for Astra Security Customers',
              body_text: `CUSTOMER SECURITY NOTICE:\n\nOur CyberDefense Threat Radar has identified scammers circulating fraudulent messages offering fake updates.\nOfficial Reminder:\n- Astra Security will NEVER ask you to download .apk files via Instagram or Twitter DMs.\n- Official updates are ONLY published on verified Google Play Store and Apple App Store.\n- If you receive a message from @astra_mobile_security_patch, block immediately and report.`,
              contact_email: 'support@astrasecurity.com',
              portal_url: null,
              policy_reference: 'Enterprise Customer Trust & Disclosure Standard',
            },
          ],
          manifest: [
            {
              id: 'ev-1',
              name: 'Instagram-DM-Capture.png',
              media_type: 'image/png',
              sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
              captured_at: new Date().toISOString(),
              source_reference: 'DM telemetry capture #8492',
              included: true,
            },
            {
              id: 'ev-2',
              name: 'AstraProtect_v3.4.apk',
              media_type: 'application/vnd.android.package-archive',
              sha256: '9f83e204c3210b4105aef89d1b702ec45819024f2b1c8a147e83492750e26d83',
              captured_at: new Date().toISOString(),
              source_reference: 'Decompiled byte artifact',
              included: true,
            },
            {
              id: 'ev-3',
              name: 'Phishing_Landing_DOM.html',
              media_type: 'text/html',
              sha256: '5d41402abc4b2a76b9719d911017c592b02a24564506c8b9199d9b626493b89b',
              captured_at: new Date().toISOString(),
              source_reference: 'https://astra-mobile-update.top/downloads',
              included: true,
            },
          ],
        };
      }
      */
    } catch (e) {
      setPacketError(e instanceof Error ? e.message : 'Response packet could not be generated.');
    } finally {
      setIsGeneratingPacket(false);
    }
  };

  const [timelineStep, setTimelineStep] = useState(5);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isPlayingTimeline) {
      interval = setInterval(() => {
        setTimelineStep((prev) => (prev >= 5 ? 1 : prev + 1));
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPlayingTimeline]);

  const currentMilestone = TIMELINE_MILESTONES.find((m) => m.step === timelineStep) || TIMELINE_MILESTONES[4];

  const styledNodes = useMemo(() => {
    const activeSet = new Set(currentMilestone.activeNodeIds);
    return nodes.map((n) => ({
      ...n,
      style: {
        ...n.style,
        opacity: activeSet.has(n.id) || timelineStep === 5 ? 1 : 0.2,
        filter: activeSet.has(n.id) || timelineStep === 5 ? 'none' : 'grayscale(100%)',
        transition: 'all 0.4s ease',
      },
    }));
  }, [nodes, currentMilestone, timelineStep]);

  return (
    <div className="flex-1 h-full flex flex-col bg-[#f7f6f3] relative overflow-hidden select-none">
      {/* Top Controls Toolbar */}
      <div className="h-14 border-b border-[#e3e2e0] bg-white px-5 flex items-center justify-between shrink-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-[6px] bg-[#0f7b6c]/10 text-[#0f7b6c] border border-[#0f7b6c]/20">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[#37352f]">
                {campaignDetail?.campaign?.title || 'Campaign graph'}
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-[4px] bg-[#eb5757]/10 text-[#eb5757] border border-[#eb5757]/30 flex items-center gap-1 font-mono">
                <ShieldAlert className="w-3 h-3 text-[#eb5757]" />
                {campaignDetail ? `RISK ${campaignDetail.campaign.risk_score}%` : 'No campaign selected'}
              </span>
            </div>
            <p className="text-xs text-[#787774]">
              Cross-surface correlation powered by shared pivots (UPI, Phone, APK Hash, Lookalike DNS)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenResponsePacket}
            disabled={isGeneratingPacket || !campaignDetail?.campaign?.id}
            className="px-3.5 py-1.5 rounded-[6px] bg-[#0f7b6c] hover:bg-[#0c6357] text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {isGeneratingPacket ? 'Drafting...' : 'Response Packet'}
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-[6px] border border-[#e3e2e0] hover:bg-[#f7f6f3] text-[#37352f] text-xs flex items-center gap-1 font-medium transition-colors cursor-pointer"
              title="Refresh Graph"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync
            </button>
          )}

          <div className="px-2.5 py-1 rounded-[4px] bg-[#f7f6f3] border border-[#e3e2e0] text-[#787774] text-xs font-mono font-medium">
            Nodes: {nodes.length} · Edges: {edges.length}
          </div>
        </div>
      </div>
      {packetError && <div role="alert" className="border-b border-[#eb5757]/30 bg-[#eb5757]/10 px-5 py-2 text-xs text-[#eb5757]">Response packet unavailable: {packetError}</div>}

      {/* Main Flow Canvas and Side Drawer */}
      <div className="flex-1 flex min-h-0 relative bg-[#f7f6f3]">
        <div className="flex-1 h-full w-full relative">
          <ReactFlow
            nodes={styledNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={2}
          >
            <Background gap={22} size={1.5} color="#e3e2e0" />
            <Controls showInteractive={false} className="!bg-white !border-[#e3e2e0] !text-[#37352f] !shadow-xs !rounded-[6px]" />
            <MiniMap
              nodeStrokeColor="#e3e2e0"
              nodeColor="#ffffff"
              className="!border !border-[#e3e2e0] !rounded-[8px] !bg-white/95 !shadow-xs"
            />
          </ReactFlow>

          {/* Graph Legend Overlay */}
          <div className="absolute top-4 left-4 p-2.5 rounded-[8px] bg-white/95 border border-[#e3e2e0] shadow-xs backdrop-blur-xs flex items-center gap-3.5 text-xs font-medium text-[#37352f] z-10">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0f7b6c]" /> Profile
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]" /> Web Asset
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#eb5757]" /> Rogue APK
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2eaadc]" /> Shared Pivot
            </div>
          </div>

          {/* Campaign Timeline Scrubber & Replay Bar */}
          <div className="hidden absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-md z-10 flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
                  className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
                  title={isPlayingTimeline ? 'Pause Replay' : 'Play Campaign Timeline Replay'}
                >
                  {isPlayingTimeline ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => { setIsPlayingTimeline(false); setTimelineStep(1); }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  title="Reset to T-0h"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <div className="text-xs">
                  <span className="font-bold text-white font-mono">{currentMilestone.time}:</span>{' '}
                  <span className="font-semibold text-indigo-300">{currentMilestone.title}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {TIMELINE_MILESTONES.map((m) => (
                  <button
                    key={m.step}
                    onClick={() => { setIsPlayingTimeline(false); setTimelineStep(m.step); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer shrink-0 ${
                      timelineStep === m.step
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : timelineStep > m.step
                        ? 'bg-slate-800 text-indigo-300 border border-slate-700'
                        : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {m.time}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-400 line-clamp-1 border-t border-slate-800/80 pt-1.5">
              {currentMilestone.description}
            </p>
          </div>
        </div>

        {/* Edge Review Side Drawer */}
        {selectedEdge && (
          <EdgeReviewDrawer
            edge={selectedEdge}
            campaignId={campaignDetail?.campaign?.id || 'demo-camp-01'}
            onClose={() => setSelectedEdge(null)}
            onDecision={handleDecision}
          />
        )}
      </div>

      {/* Multi-Recipient Response Packet Modal */}
      {responsePacket && (
        <ResponsePacketModal
          packet={responsePacket}
          onClose={() => setResponsePacket(null)}
          onActionSimulated={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}
