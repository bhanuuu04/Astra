'use client';

import React, { useState, useEffect } from 'react';
import { 
  DEFAULT_BRAND_REGISTRY, 
  DEFAULT_CONNECTORS, 
  INITIAL_ROGUE_APPS, 
  buildInitialSocialMessages 
} from '@/lib/store';
import { 
  BrandAssetRegistry, 
  ConnectorCredential, 
  RogueAppListing, 
  SocialMessage, 
  SocialPlatform 
} from '@/types/threat';
import { analyzeSocialMessage } from '@/lib/threat-engine';

import { Navbar } from '@/components/Navbar';
import { Sidebar, MainNavTab } from '@/components/Sidebar';
import { OverviewDashboard } from '@/components/OverviewDashboard';
import { ThreatsPage } from '@/components/ThreatsPage';
import { ImpersonationPage } from '@/components/ImpersonationPage';
import { ScamLinksPage } from '@/components/ScamLinksPage';
import { DomainsPage } from '@/components/DomainsPage';
import { TakedownsPage } from '@/components/TakedownsPage';
import { BrandAssetsPage } from '@/components/BrandAssetsPage';
import { TeamPage } from '@/components/TeamPage';
import { SettingsPage } from '@/components/SettingsPage';
import { ThreatInbox } from '@/components/ThreatInbox';
import { MessageDetailView } from '@/components/MessageDetailView';
import { ConnectorsManager } from '@/components/ConnectorsManager';
import { RogueAppsRadar } from '@/components/RogueAppsRadar';
import { AnalyticsView } from '@/components/AnalyticsView';
import { BrandRegistryModal } from '@/components/BrandRegistryModal';
import { ManualAnalyzerModal } from '@/components/ManualAnalyzerModal';
import { TakedownDossierModal } from '@/components/TakedownDossierModal';
import { CampaignGraphView } from '@/components/graph/CampaignGraphView';

export default function Home() {
  const [brand, setBrand] = useState<BrandAssetRegistry>(DEFAULT_BRAND_REGISTRY);
  const [messages, setMessages] = useState<SocialMessage[]>([]);
  const [connectors, setConnectors] = useState<ConnectorCredential[]>(DEFAULT_CONNECTORS);
  const [rogueApps, setRogueApps] = useState<RogueAppListing[]>(INITIAL_ROGUE_APPS);
  const [activeTab, setActiveTab] = useState<MainNavTab>('overview');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // Modals
  const [isBrandRegistryOpen, setIsBrandRegistryOpen] = useState(false);
  const [isManualAnalyzerOpen, setIsManualAnalyzerOpen] = useState(false);
  const [takedownTargetMessage, setTakedownTargetMessage] = useState<SocialMessage | null>(null);

  useEffect(() => {
    const initial = buildInitialSocialMessages();
    setMessages(initial);
    if (initial.length > 0) {
      setSelectedMessageId(initial[0].id);
    }
  }, []);

  const selectedMessage = messages.find(m => m.id === selectedMessageId) || messages[0] || null;

  const handleSelectMessage = (msg: SocialMessage) => {
    setSelectedMessageId(msg.id);
  };

  const handleUpdateStatus = (messageId: string, status: SocialMessage['status']) => {
    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, status } : m))
    );
  };

  const handleUpdateConnector = (platform: SocialPlatform, credentials: any, enabled: boolean) => {
    setConnectors(prev =>
      prev.map(c =>
        c.platform === platform
          ? {
              ...c,
              credentials: { ...c.credentials, ...credentials },
              enabled,
              status: enabled ? 'connected' : 'disconnected',
              lastSyncedAt: new Date().toISOString()
            }
          : c
      )
    );
  };

  const handleInjectTestMessage = (
    platform: SocialPlatform,
    customContent?: string,
    customUsername?: string
  ) => {
    const rawContent = customContent || 'URGENT: Your brand account is being suspended for violating Meta Trademark standards. Download the official Astra Security mobile compliance update immediately: https://astra-support-patch.xyz/files/AstraProtect_v3.4.apk or confirm your master seed phrase.';
    const rawUsername = customUsername || 'astra_security_compliance_team';

    const sender = {
      id: `sim-${Date.now()}`,
      platform,
      username: rawUsername,
      displayName: 'Astra Compliance & Safety ✓',
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      bio: 'Official compliance department for Astra accounts.',
      followerCount: 22,
      followingCount: 1100,
      accountCreatedAt: new Date(Date.now() - 1000 * 3600 * 24 * 2).toISOString(),
      isVerifiedBadge: false,
      isFakeBadgeEmoji: true
    };

    const analysis = analyzeSocialMessage(rawContent, sender, brand);

    const newMessage: SocialMessage = {
      id: `msg-live-${Date.now()}`,
      platform,
      brandAccountId: brand.id,
      sender,
      content: rawContent,
      timestamp: new Date().toISOString(),
      analysis,
      status: analysis.severity === 'critical' ? 'quarantined' : 'new'
    };

    setMessages(prev => [newMessage, ...prev]);
    setSelectedMessageId(newMessage.id);
    setActiveTab('threats');

    if (analysis.fakeMobileAppDetected) {
      const apkArtifact = analysis.extractedArtifacts.find(a => a.type === 'apk');
      const newRogueApp: RogueAppListing = {
        id: `rogue-auto-${Date.now()}`,
        appName: apkArtifact ? apkArtifact.value : 'Astra Compliance Update APK',
        packageName: 'com.astra.compliance.updater',
        sourcePlatform: `${platform}_dm` as any,
        detectedInMessageId: newMessage.id,
        discoveredAt: new Date().toISOString(),
        downloadUrl: analysis.extractedArtifacts.find(a => a.type === 'url')?.value || 'https://astra-mobile-patch.xyz/app.apk',
        riskScore: analysis.riskScore,
        status: 'active_threat',
        targetBrand: brand.brandName,
        impersonationDetails: `Automatically ingested from ${platform.toUpperCase()} DM via handle @${sender.username}`
      };
      setRogueApps(prev => [newRogueApp, ...prev]);
    }
  };

  const handleUpdateAppStatus = (id: string, status: RogueAppListing['status']) => {
    setRogueApps(prev =>
      prev.map(app => (app.id === id ? { ...app, status } : app))
    );
  };

  const handleAddRogueApp = (partial: Partial<RogueAppListing>) => {
    const newApp: RogueAppListing = {
      id: `rogue-manual-${Date.now()}`,
      appName: partial.appName || 'Unknown App',
      packageName: partial.packageName || 'com.fake.app',
      sourcePlatform: partial.sourcePlatform || 'third_party_apk',
      discoveredAt: partial.discoveredAt || new Date().toISOString(),
      downloadUrl: partial.downloadUrl || '',
      riskScore: partial.riskScore || 90,
      status: partial.status || 'active_threat',
      targetBrand: brand.brandName,
      impersonationDetails: partial.impersonationDetails || ''
    };
    setRogueApps(prev => [newApp, ...prev]);
  };

  const handleOpenTakedownFromOverview = (threatItem: any) => {
    const foundMsg = messages.find(m => 
      threatItem.title && m.sender.username.toLowerCase().includes(threatItem.title.replace('@', '').toLowerCase())
    );
    if (foundMsg) {
      setTakedownTargetMessage(foundMsg);
    } else if (messages.length > 0) {
      setTakedownTargetMessage(messages[0]);
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        threatsCount={messages.filter(m => m.analysis.severity === 'critical' || m.analysis.severity === 'high').length || 12}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          brand={brand}
          onOpenBrandRegistry={() => setIsBrandRegistryOpen(true)}
          onOpenManualAnalyzer={() => setIsManualAnalyzerOpen(true)}
          notificationCount={1}
        />

        {/* Prototype / Demo Sandbox Notice */}
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-300 font-medium shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span><strong>Prototype Simulator Sandbox:</strong> Offline scenario laboratory with local sample messages. For database-backed campaigns and verified live evidence, visit the <a href="/overview" className="underline font-semibold hover:text-amber-100">Live SOC Deck</a>.</span>
          </div>
          <a href="/overview" className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 font-semibold text-amber-200 transition-colors">Switch to Live Overview &rarr;</a>
        </div>

        {/* Dynamic Route Body */}
        <main className="flex-1 flex min-w-0 min-h-0 overflow-hidden bg-slate-950 text-slate-100">
          {/* 1. OVERVIEW */}
          {activeTab === 'overview' && (
            <OverviewDashboard
              onSelectThreat={(id) => {
                setActiveTab('threats');
                if (id) setSelectedMessageId(id);
              }}
              onOpenTakedown={handleOpenTakedownFromOverview}
              onNavigateToTab={(tab) => setActiveTab(tab as MainNavTab)}
            />
          )}

          {/* 2. CAMPAIGN GRAPH */}
          {activeTab === 'campaign_graph' && (
            <CampaignGraphView />
          )}

          {/* 3. THREATS */}
          {activeTab === 'threats' && (
            <ThreatsPage
              messages={messages}
              onOpenTakedown={(msg) => setTakedownTargetMessage(msg)}
              onUpdateStatus={handleUpdateStatus}
              onSelectMessageDetail={(msg) => {
                setSelectedMessageId(msg.id);
                setActiveTab('social_monitoring');
              }}
            />
          )}

          {/* 3. IMPERSONATION */}
          {activeTab === 'impersonation' && (
            <ImpersonationPage
              onOpenTakedown={handleOpenTakedownFromOverview}
            />
          )}

          {/* 4. FAKE APPS */}
          {activeTab === 'fake_apps' && (
            <RogueAppsRadar
              rogueApps={rogueApps}
              brand={brand}
              onUpdateAppStatus={handleUpdateAppStatus}
              onAddRogueApp={handleAddRogueApp}
            />
          )}

          {/* 5. SCAM LINKS */}
          {activeTab === 'scam_links' && (
            <ScamLinksPage
              onOpenTakedown={handleOpenTakedownFromOverview}
            />
          )}

          {/* 6. SOCIAL MONITORING (Live Message Center & Webhook Ingest) */}
          {activeTab === 'social_monitoring' && (
            <div className="flex-1 flex flex-col lg:flex-row min-w-0 min-h-0 overflow-hidden bg-white">
              <div className="w-full lg:w-[420px] xl:w-[460px] h-full shrink-0 flex flex-col border-r border-slate-200/80 bg-white">
                <ThreatInbox
                  messages={messages}
                  selectedMessageId={selectedMessageId}
                  onSelectMessage={handleSelectMessage}
                />
              </div>

              <div className="flex-1 h-full min-w-0 overflow-hidden flex flex-col bg-slate-50/50">
                {selectedMessage ? (
                  <MessageDetailView
                    message={selectedMessage}
                    brand={brand}
                    onOpenTakedown={(msg) => setTakedownTargetMessage(msg)}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-400 font-mono text-xs">
                    Select an inbound direct message to inspect forensic profile
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 7. DOMAINS */}
          {activeTab === 'domains' && (
            <DomainsPage
              onOpenTakedown={handleOpenTakedownFromOverview}
            />
          )}

          {/* 8. TAKEDOWNS */}
          {activeTab === 'takedowns' && (
            <TakedownsPage
              onOpenNewTakedown={() => {
                if (messages.length > 0) setTakedownTargetMessage(messages[0]);
              }}
            />
          )}

          {/* 9. REPORTS */}
          {activeTab === 'reports' && (
            <AnalyticsView
              messages={messages}
              rogueApps={rogueApps}
              connectors={connectors}
            />
          )}

          {/* 10. BRAND ASSETS */}
          {activeTab === 'brand_assets' && (
            <BrandAssetsPage
              brand={brand}
              onSaveBrand={(updated) => {
                setBrand(updated);
                setMessages(prev =>
                  prev.map(m => ({
                    ...m,
                    analysis: analyzeSocialMessage(m.content, m.sender, updated)
                  }))
                );
              }}
            />
          )}

          {/* 11. TEAM */}
          {activeTab === 'team' && (
            <TeamPage />
          )}

          {/* 12. SETTINGS */}
          {activeTab === 'settings' && (
            <div className="flex-1 flex flex-col overflow-y-auto">
              <SettingsPage />
              <div className="p-6 lg:p-8 pt-0">
                <ConnectorsManager
                  connectors={connectors}
                  onUpdateConnector={handleUpdateConnector}
                  onInjectTestMessage={handleInjectTestMessage}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {isBrandRegistryOpen && (
        <BrandRegistryModal
          brand={brand}
          onSave={(updated) => {
            setBrand(updated);
            setMessages(prev =>
              prev.map(m => ({
                ...m,
                analysis: analyzeSocialMessage(m.content, m.sender, updated)
              }))
            );
          }}
          onClose={() => setIsBrandRegistryOpen(false)}
        />
      )}

      {isManualAnalyzerOpen && (
        <ManualAnalyzerModal
          brand={brand}
          onClose={() => setIsManualAnalyzerOpen(false)}
          onIngestAsNewMessage={(newMsg) => {
            setMessages(prev => [newMsg, ...prev]);
            setSelectedMessageId(newMsg.id);
            setActiveTab('threats');
          }}
        />
      )}

      {takedownTargetMessage && (
        <TakedownDossierModal
          message={takedownTargetMessage}
          brand={brand}
          onClose={() => setTakedownTargetMessage(null)}
          onConfirmTakedown={(messageId) => {
            handleUpdateStatus(messageId, 'takedown_requested');
          }}
        />
      )}
    </div>
  );
}
