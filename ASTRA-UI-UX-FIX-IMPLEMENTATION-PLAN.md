# ASTRA UI/UX Fix Implementation Plan
## Frontend Trust & Transparency Enhancements

**Document Version:** 1.0.0  
**Status:** Ready for Implementation  
**Target Completion:** 10 Weeks  
**Dependencies:** Phase 0 & 1 Backend Complete ✅

---

## Executive Summary

Backend DRP foundation ab production-ready hai with complete data integrity, audit trails, and workflow state machines. Frontend ko ab backend ke capabilities properly reflect karne ki zaroorat hai—especially around data transparency, triage states, aur trust indicators.

### Critical Issues to Fix
1. **P0:** Demo/Live data confusion
2. **P0:** Unreviewed findings ko "malicious" label
3. **P0:** Non-persistent App Radar actions
4. **P0:** Backend/Frontend API contract mismatches
5. **P1:** Fixed formula values in campaigns
6. **P1:** Inconsistent navigation
7. **P1:** False "real-time" claims

---

## Week 1-2: Data Mode Badges & Triage State Display

### Task 1.1: Create Reusable Badge Components

**File:** `apps/web/src/components/ui/DataModeBadge.tsx`

```typescript
'use client';

import React from 'react';
import { Signal, TestTube, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DataMode = 'live' | 'synthetic_demo' | 'manual_upload';

interface DataModeBadgeProps {
  mode: DataMode;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const MODE_CONFIG = {
  live: {
    label: 'LIVE',
    icon: Signal,
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    pulse: true,
  },
  synthetic_demo: {
    label: 'DEMO',
    icon: TestTube,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    pulse: false,
  },
  manual_upload: {
    label: 'MANUAL',
    icon: Upload,
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    pulse: false,
  },
};

export function DataModeBadge({ 
  mode, 
  showLabel = true, 
  size = 'md',
  className 
}: DataModeBadgeProps) {
  const config = MODE_CONFIG[mode];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded border font-semibold uppercase tracking-wider',
        config.bg,
        config.border,
        config.text,
        sizeClasses[size],
        className
      )}
    >
      {config.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      )}
      <Icon className="w-3 h-3" />
      {showLabel && <span>{config.label}</span>}
    </div>
  );
}
```

**File:** `apps/web/src/components/ui/TriageStatusBadge.tsx`

```typescript
'use client';

import React from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  HelpCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type TriageStatus = 
  | 'pending' 
  | 'investigating' 
  | 'confirmed_threat' 
  | 'false_positive' 
  | 'needs_evidence';

interface TriageStatusBadgeProps {
  status: TriageStatus;
  showIcon?: boolean;
  className?: string;
}

const STATUS_CONFIG = {
  pending: {
    label: 'Unreviewed',
    icon: Clock,
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
  },
  investigating: {
    label: 'Investigating',
    icon: Search,
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  confirmed_threat: {
    label: 'Confirmed Threat',
    icon: AlertCircle,
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
  },
  false_positive: {
    label: 'False Positive',
    icon: CheckCircle,
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  needs_evidence: {
    label: 'Needs Evidence',
    icon: HelpCircle,
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
};

export function TriageStatusBadge({ 
  status, 
  showIcon = true,
  className 
}: TriageStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium',
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      <span>{config.label}</span>
    </div>
  );
}
```

### Task 1.2: Update Finding List Component

**File:** `apps/web/src/components/findings/FindingListItem.tsx`

```typescript
'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { DataModeBadge } from '@/components/ui/DataModeBadge';
import { TriageStatusBadge } from '@/components/ui/TriageStatusBadge';
import { ExternalLink, Shield } from 'lucide-react';

interface FindingListItemProps {
  finding: {
    id: string;
    target_identifier: string;
    surface: string;
    data_mode: 'live' | 'synthetic_demo' | 'manual_upload';
    triage_status: string;
    triage_priority: number;
    observed_at: string;
    brand_id: string;
  };
  onSelect: (id: string) => void;
}

export function FindingListItem({ finding, onSelect }: FindingListItemProps) {
  const priorityColor = 
    finding.triage_priority >= 0.8 ? 'text-rose-400' :
    finding.triage_priority >= 0.5 ? 'text-amber-400' :
    'text-blue-400';

  return (
    <div
      onClick={() => onSelect(finding.id)}
      className="p-4 border border-slate-800 rounded-lg bg-slate-900/40 hover:bg-slate-900/60 cursor-pointer transition-colors"
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <DataModeBadge mode={finding.data_mode} size="sm" />
            <TriageStatusBadge status={finding.triage_status as any} />
          </div>
          
          <h3 className="text-sm font-semibold text-slate-200 truncate">
            {finding.target_identifier}
          </h3>
          
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span className="uppercase">{finding.surface}</span>
            <span>•</span>
            <span>
              {formatDistanceToNow(new Date(finding.observed_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Priority Score */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <Shield className={`w-4 h-4 ${priorityColor}`} />
            <span className={`text-sm font-bold ${priorityColor}`}>
              {(finding.triage_priority * 100).toFixed(0)}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 uppercase">Priority</span>
        </div>
      </div>

      {/* Warning for Demo Data */}
      {finding.data_mode === 'synthetic_demo' && (
        <div className="mt-2 p-2 rounded bg-amber-500/5 border border-amber-500/20">
          <p className="text-xs text-amber-400/80">
            ⚠️ Demo data for testing purposes only
          </p>
        </div>
      )}
    </div>
  );
}
```

### Task 1.3: Add Source Attribution Footer

**File:** `apps/web/src/components/findings/FindingSourceInfo.tsx`

```typescript
'use client';

import React from 'react';
import { Database, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FindingSourceInfoProps {
  finding: {
    data_mode: string;
    collected_at: string;
    observed_at: string;
    connector_id?: string;
    raw_evidence_id?: string;
  };
  connector?: {
    name: string;
    status: string;
    last_successful_sync_at?: string;
  };
}

export function FindingSourceInfo({ finding, connector }: FindingSourceInfoProps) {
  return (
    <div className="border-t border-slate-800 pt-4 mt-4">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Source & Provenance
      </h4>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Data Source */}
        <div className="flex items-start gap-2">
          <Database className="w-4 h-4 text-slate-500 mt-0.5" />
          <div>
            <p className="text-xs text-slate-500">Source</p>
            <p className="text-sm text-slate-300 font-medium">
              {connector?.name || 'Manual Upload'}
            </p>
            {connector && (
              <div className="flex items-center gap-1 mt-1">
                {connector.status === 'active' ? (
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-amber-400" />
                )}
                <span className="text-xs text-slate-500 capitalize">
                  {connector.status}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Timestamps */}
        <div className="flex items-start gap-2">
          <Clock className="w-4 h-4 text-slate-500 mt-0.5" />
          <div>
            <p className="text-xs text-slate-500">Observed</p>
            <p className="text-sm text-slate-300">
              {formatDistanceToNow(new Date(finding.observed_at), { addSuffix: true })}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Collected {formatDistanceToNow(new Date(finding.collected_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>

      {/* Evidence Hash */}
      {finding.raw_evidence_id && (
        <div className="mt-3 p-2 rounded bg-slate-800/40 border border-slate-700/50">
          <p className="text-[10px] text-slate-500 uppercase mb-1">Evidence ID</p>
          <p className="text-xs font-mono text-slate-400 break-all">
            {finding.raw_evidence_id}
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## Week 3-4: Response Workflow UI & State Timeline

### Task 2.1: Response Case State Timeline Component

**File:** `apps/web/src/components/responses/ResponseCaseTimeline.tsx`

```typescript
'use client';

import React from 'react';
import { Check, Clock, X, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

type LifecycleState = 
  | 'draft' 
  | 'pending_approval' 
  | 'approved' 
  | 'submitted' 
  | 'acknowledged' 
  | 'resolved' 
  | 'rejected';

interface ResponseCase {
  lifecycle_state: LifecycleState;
  created_at: string;
  drafted_by: string;
  approved_by?: string;
  approved_at?: string;
  submitted_at?: string;
  resolved_at?: string;
  target_provider: string;
}

interface TimelineStep {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'pending' | 'rejected';
  timestamp?: string;
  actor?: string;
  detail?: string;
}

export function ResponseCaseTimeline({ responseCase }: { responseCase: ResponseCase }) {
  const steps: TimelineStep[] = [
    {
      id: 'draft',
      label: 'Draft Created',
      status: 'completed',
      timestamp: responseCase.created_at,
      actor: responseCase.drafted_by,
      detail: 'Response case initiated',
    },
    {
      id: 'approval',
      label: 'Reviewer Approval',
      status: 
        responseCase.lifecycle_state === 'rejected' ? 'rejected' :
        ['approved', 'submitted', 'acknowledged', 'resolved'].includes(responseCase.lifecycle_state) ? 'completed' :
        responseCase.lifecycle_state === 'pending_approval' ? 'current' :
        'pending',
      timestamp: responseCase.approved_at,
      actor: responseCase.approved_by,
      detail: responseCase.approved_by ? 'Approved by reviewer' : 'Awaiting approval',
    },
    {
      id: 'dispatch',
      label: 'Dispatched',
      status:
        ['submitted', 'acknowledged', 'resolved'].includes(responseCase.lifecycle_state) ? 'completed' :
        responseCase.lifecycle_state === 'approved' ? 'current' :
        'pending',
      timestamp: responseCase.submitted_at,
      detail: `To ${responseCase.target_provider}`,
    },
    {
      id: 'outcome',
      label: 'Outcome Recorded',
      status: responseCase.lifecycle_state === 'resolved' ? 'completed' : 'pending',
      timestamp: responseCase.resolved_at,
      detail: responseCase.resolved_at ? 'Case closed' : 'Awaiting provider response',
    },
  ];

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={step.id} className="relative">
          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                'absolute left-4 top-8 w-0.5 h-full',
                step.status === 'completed' ? 'bg-emerald-500/30' : 'bg-slate-700'
              )}
            />
          )}

          {/* Step Content */}
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={cn(
                'relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2',
                step.status === 'completed' && 'bg-emerald-500/10 border-emerald-500',
                step.status === 'current' && 'bg-blue-500/10 border-blue-500 animate-pulse',
                step.status === 'pending' && 'bg-slate-800 border-slate-700',
                step.status === 'rejected' && 'bg-rose-500/10 border-rose-500'
              )}
            >
              {step.status === 'completed' && <Check className="w-4 h-4 text-emerald-400" />}
              {step.status === 'current' && <Clock className="w-4 h-4 text-blue-400" />}
              {step.status === 'pending' && <div className="w-2 h-2 rounded-full bg-slate-600" />}
              {step.status === 'rejected' && <X className="w-4 h-4 text-rose-400" />}
            </div>

            {/* Details */}
            <div className="flex-1 pb-8">
              <div className="flex items-center justify-between mb-1">
                <h4 className={cn(
                  'text-sm font-semibold',
                  step.status === 'completed' && 'text-emerald-400',
                  step.status === 'current' && 'text-blue-400',
                  step.status === 'pending' && 'text-slate-500',
                  step.status === 'rejected' && 'text-rose-400'
                )}>
                  {step.label}
                </h4>
                {step.timestamp && (
                  <span className="text-xs text-slate-500">
                    {formatDistanceToNow(new Date(step.timestamp), { addSuffix: true })}
                  </span>
                )}
              </div>
              
              <p className="text-xs text-slate-400 mb-1">{step.detail}</p>
              
              {step.actor && (
                <p className="text-xs text-slate-500">by {step.actor}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Task 2.2: Response Case Action Buttons

**File:** `apps/web/src/components/responses/ResponseCaseActions.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import { Check, Send, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResponseCaseActionsProps {
  caseId: string;
  lifecycleState: string;
  onApprove: (id: string) => Promise<void>;
  onDispatch: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

export function ResponseCaseActions({
  caseId,
  lifecycleState,
  onApprove,
  onDispatch,
  onReject,
}: ResponseCaseActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: () => Promise<void>) => {
    setLoading(true);
    try {
      await action();
    } finally {
      setLoading(false);
    }
  };

  // Draft state: Show approve/reject
  if (lifecycleState === 'draft') {
    return (
      <div className="flex items-center gap-3">
        <Button
          onClick={() => handleAction(() => onApprove(caseId))}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Check className="w-4 h-4 mr-2" />
          Approve for Dispatch
        </Button>
        <Button
          onClick={() => handleAction(() => onReject(caseId))}
          disabled={loading}
          variant="outline"
          className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Reject
        </Button>
      </div>
    );
  }

  // Approved state: Show dispatch
  if (lifecycleState === 'approved') {
    return (
      <Button
        onClick={() => handleAction(() => onDispatch(caseId))}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Send className="w-4 h-4 mr-2" />
        Dispatch to Provider
      </Button>
    );
  }

  // Submitted/Resolved: Show status only
  return (
    <div className="px-4 py-2 rounded-lg bg-slate-800/40 border border-slate-700">
      <p className="text-sm text-slate-400">
        {lifecycleState === 'submitted' && '⏳ Awaiting provider response'}
        {lifecycleState === 'acknowledged' && '✅ Acknowledged by provider'}
        {lifecycleState === 'resolved' && '✅ Case resolved'}
      </p>
    </div>
  );
}
```

---

## Week 5-6: Connector Health Dashboard

### Task 3.1: Connector Status Card

**File:** `apps/web/src/components/connectors/ConnectorStatusCard.tsx`

```typescript
'use client';

import React from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Activity,
  Clock 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ConnectorStatusCardProps {
  connector: {
    id: string;
    name: string;
    connector_type: string;
    status: 'active' | 'degraded' | 'error' | 'unconfigured';
    last_successful_sync_at?: string;
    last_health_check_at?: string;
    error_message?: string;
    rate_limit_rpm: number;
  };
  onHealthCheck: (id: string) => void;
}

const STATUS_CONFIG = {
  active: {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    label: 'Active',
  },
  degraded: {
    icon: AlertCircle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    label: 'Degraded',
  },
  error: {
    icon: XCircle,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    label: 'Error',
  },
  unconfigured: {
    icon: Activity,
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    label: 'Unconfigured',
  },
};

export function ConnectorStatusCard({ connector, onHealthCheck }: ConnectorStatusCardProps) {
  const config = STATUS_CONFIG[connector.status];
  const Icon = config.icon;

  return (
    <div className={cn(
      'p-4 rounded-lg border',
      config.bg,
      config.border
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            config.bg
          )}>
            <Icon className={cn('w-5 h-5', config.color)} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              {connector.name}
            </h3>
            <p className="text-xs text-slate-500 uppercase">
              {connector.connector_type.replace('_', ' ')}
            </p>
          </div>
        </div>

        <span className={cn(
          'px-2 py-1 rounded text-xs font-semibold uppercase',
          config.bg,
          config.color,
          config.border,
          'border'
        )}>
          {config.label}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-slate-500 mb-1">Last Sync</p>
          <p className="text-sm text-slate-300">
            {connector.last_successful_sync_at ? (
              formatDistanceToNow(new Date(connector.last_successful_sync_at), { 
                addSuffix: true 
              })
            ) : (
              'Never'
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Rate Limit</p>
          <p className="text-sm text-slate-300">
            {connector.rate_limit_rpm} req/min
          </p>
        </div>
      </div>

      {/* Error Message */}
      {connector.error_message && (
        <div className="p-2 rounded bg-rose-500/5 border border-rose-500/20 mb-3">
          <p className="text-xs text-rose-400">{connector.error_message}</p>
        </div>
      )}

      {/* Actions */}
      <button
        onClick={() => onHealthCheck(connector.id)}
        className="w-full px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 transition-colors"
      >
        <Clock className="w-3 h-3 inline mr-2" />
        Run Health Check
      </button>
    </div>
  );
}
```

---

## Week 7-8: Campaign Graph Visualization

### Task 4.1: Install React Flow

```bash
npm install reactflow @xyflow/react
```

### Task 4.2: Campaign Graph Component

**File:** `apps/web/src/components/campaigns/CampaignGraph.tsx`

```typescript
'use client';

import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface CampaignGraphProps {
  findings: Array<{
    id: string;
    target_identifier: string;
    surface: string;
    triage_priority: number;
  }>;
  edges: Array<{
    source_finding_id: string;
    target_finding_id: string;
    shared_indicator_type: string;
    shared_indicator_value: string;
    link_confidence: number;
    analyst_review_status: string;
  }>;
}

export function CampaignGraph({ findings, edges: edgeData }: CampaignGraphProps) {
  // Convert findings to nodes
  const initialNodes: Node[] = findings.map((finding, index) => ({
    id: finding.id,
    type: 'default',
    position: { 
      x: Math.cos((index / findings.length) * 2 * Math.PI) * 300 + 400,
      y: Math.sin((index / findings.length) * 2 * Math.PI) * 300 + 300,
    },
    data: { 
      label: (
        <div className="text-xs">
          <div className="font-semibold truncate max-w-[150px]">
            {finding.target_identifier}
          </div>
          <div className="text-slate-500 text-[10px] uppercase">
            {finding.surface}
          </div>
        </div>
      ),
    },
    style: {
      background: finding.triage_priority >= 0.8 ? '#dc2626' :
                  finding.triage_priority >= 0.5 ? '#f59e0b' :
                  '#3b82f6',
      color: 'white',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '8px',
      padding: '8px',
    },
  }));

  // Convert edges
  const initialEdges: Edge[] = edgeData.map((edge, index) => ({
    id: `edge-${index}`,
    source: edge.source_finding_id,
    target: edge.target_finding_id,
    label: edge.shared_indicator_type,
    type: 'smoothstep',
    animated: edge.analyst_review_status === 'proposed',
    style: {
      stroke: edge.analyst_review_status === 'accepted' ? '#10b981' :
              edge.analyst_review_status === 'rejected' ? '#ef4444' :
              '#6b7280',
      strokeWidth: 2,
    },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="h-[600px] bg-slate-900 rounded-lg border border-slate-800">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
```

---

## Week 9-10: Navigation Standardization & Polish

### Task 5.1: Unified Navigation Component

**File:** `apps/web/src/components/layout/MainNavigation.tsx`

```typescript
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  Smartphone,
  Shield,
  GitBranch,
  Send,
  Settings,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  status: 'active' | 'planned';
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    status: 'active',
  },
  {
    id: 'findings',
    label: 'Findings',
    href: '/findings',
    icon: Search,
    status: 'active',
  },
  {
    id: 'mobile-radar',
    label: 'Mobile App Radar',
    href: '/apps/radar',
    icon: Smartphone,
    status: 'active',
  },
  {
    id: 'campaigns',
    label: 'Campaigns',
    href: '/campaigns',
    icon: GitBranch,
    status: 'active',
  },
  {
    id: 'responses',
    label: 'Response Cases',
    href: '/responses',
    icon: Send,
    status: 'active',
  },
  {
    id: 'brands',
    label: 'Brand DNA',
    href: '/brands',
    icon: Shield,
    status: 'active',
  },
  {
    id: 'connectors',
    label: 'Connectors',
    href: '/connectors',
    icon: Database,
    status: 'active',
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    status: 'active',
  },
];

export function MainNavigation() {
  const pathname = usePathname();

  return (
    <nav className="w-64 bg-slate-900 border-r border-slate-800 p-4">
      <div className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.status === 'active' ? item.href : '#'}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive && 'bg-slate-800 text-slate-100',
                !isActive && item.status === 'active' && 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50',
                item.status === 'planned' && 'text-slate-600 cursor-not-allowed'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
              
              {item.status === 'planned' && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 uppercase">
                  Planned
                </span>
              )}
              
              {item.badge && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-rose-500 text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

---

## API Integration Checklist

### ✅ Backend APIs Already Implemented

```typescript
// Findings API
GET    /api/v1/findings                          // List findings
GET    /api/v1/findings/{id}?include_signals=true // Get with signals
POST   /api/v1/findings/ingest                   // Ingest new
PATCH  /api/v1/findings/{id}/triage              // Update status

// Mobile App Radar API
GET    /api/v1/apps/radar                        // List apps
POST   /api/v1/apps/{id}/scan-package            // Queue scan

// Response Cases API
POST   /api/v1/responses/draft                   // Create draft
GET    /api/v1/responses                         // List cases
GET    /api/v1/responses/{id}                    // Get detail
POST   /api/v1/responses/{id}/approve            // Approve
POST   /api/v1/responses/{id}/dispatch           // Dispatch
POST   /api/v1/responses/{id}/resolve            // Resolve

// Connectors API
POST   /api/v1/connectors                        // Create connector
GET    /api/v1/connectors                        // List connectors
GET    /api/v1/connectors/{id}                   // Get detail
PATCH  /api/v1/connectors/{id}                   // Update
POST   /api/v1/connectors/{id}/health            // Health check
DELETE /api/v1/connectors/{id}                   // Delete
```

### Frontend Integration Pattern

```typescript
// app/lib/api/findings.ts
export async function getFindings(params: {
  brand_id?: string;
  surface?: string;
  triage_status?: string;
  data_mode?: string;
  min_priority?: number;
  limit?: number;
  offset?: number;
}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) searchParams.append(key, String(value));
  });

  const response = await fetch(`/api/v1/findings?${searchParams}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` },
  });

  if (!response.ok) throw new Error('Failed to fetch findings');
  return response.json();
}
```

---

## Testing Strategy

### Component Tests
```typescript
// DataModeBadge.test.tsx
import { render, screen } from '@testing-library/react';
import { DataModeBadge } from './DataModeBadge';

describe('DataModeBadge', () => {
  it('shows LIVE badge with pulse animation', () => {
    render(<DataModeBadge mode="live" />);
    expect(screen.getByText('LIVE')).toBeInTheDocument();
    expect(screen.getByText('LIVE').parentElement).toHaveClass('animate-ping');
  });

  it('shows DEMO badge without pulse', () => {
    render(<DataModeBadge mode="synthetic_demo" />);
    expect(screen.getByText('DEMO')).toBeInTheDocument();
  });
});
```

### Integration Tests
```typescript
// findings-list.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { FindingsList } from './FindingsList';
import { mockFindings } from '@/test/fixtures';

describe('FindingsList', () => {
  it('displays data mode badges for each finding', async () => {
    render(<FindingsList />);
    
    await waitFor(() => {
      expect(screen.getAllByText('LIVE')).toHaveLength(3);
      expect(screen.getAllByText('DEMO')).toHaveLength(2);
    });
  });

  it('shows unreviewed status for pending findings', async () => {
    render(<FindingsList />);
    
    await waitFor(() => {
      expect(screen.getByText('Unreviewed')).toBeInTheDocument();
    });
  });
});
```

---

## Success Metrics & Acceptance Criteria

### Week 1-2 Completion Criteria
- [ ] All finding list items show data_mode badges
- [ ] Triage status displays "Unreviewed" instead of "Malicious"
- [ ] Demo data warnings appear where applicable
- [ ] Source attribution footer on finding details

### Week 3-4 Completion Criteria
- [ ] Response case timeline shows all workflow states
- [ ] Action buttons only appear for valid state transitions
- [ ] Draft state shows approve/reject options
- [ ] Approved state shows dispatch button
- [ ] Submitted state shows "awaiting response" message

### Week 5-6 Completion Criteria
- [ ] Connector health dashboard displays all connectors
- [ ] Status indicators (active/degraded/error) accurate
- [ ] Last sync timestamps display correctly
- [ ] Health check button triggers API call

### Week 7-8 Completion Criteria
- [ ] Campaign graph renders with React Flow
- [ ] Nodes positioned automatically
- [ ] Edges show indicator types
- [ ] Proposed edges animate
- [ ] Accepted edges show green, rejected show red

### Week 9-10 Completion Criteria
- [ ] Unified navigation component deployed
- [ ] All navigation items link correctly
- [ ] Active state highlights current page
- [ ] Planned features clearly marked
- [ ] No broken/dead links

---

## Rollout Plan

### Phase 1: Internal Testing (Week 1-4)
- Deploy to staging environment
- Internal team testing
- Gather feedback on badge visibility
- Validate state transitions

### Phase 2: Beta Testing (Week 5-8)
- Select 3-5 BFSI customers for beta
- Focus on findings queue + response workflow
- Collect trust/confusion metrics
- Iterate based on feedback

### Phase 3: Production Rollout (Week 9-10)
- Feature flag rollout to 25% traffic
- Monitor error rates and user behavior
- Gradual increase to 100%
- Post-launch survey

---

## Conclusion

Backend DRP foundation (Phase 0 & 1) complete hai ✅. Ab frontend ko backend capabilities properly reflect karni chahiye. Is 10-week plan ke baad:

1. ✅ Data mode transparency complete (LIVE/DEMO/MANUAL badges everywhere)
2. ✅ Triage states accurate (Unreviewed → Investigating → Confirmed)
3. ✅ Response workflow visual (Timeline with state machine)
4. ✅ Connector health visible (Status dashboard)
5. ✅ Campaign graph interactive (React Flow)
6. ✅ Navigation consistent (Canonical structure)

**Result:** BFSI/Fintech analysts ke liye trustworthy, reliable DRP workflow ready for production pilot! 🎯
