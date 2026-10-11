'use client';

import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export interface CampaignGraphFinding {
  id: string;
  target_identifier: string;
  surface: string;
  triage_priority: number;
}

export interface CampaignGraphEdge {
  source_finding_id: string;
  target_finding_id: string;
  shared_indicator_type: string;
  shared_indicator_value?: string;
  link_confidence?: number;
  analyst_review_status?: 'proposed' | 'accepted' | 'rejected' | string;
}

interface CampaignGraphProps {
  findings: CampaignGraphFinding[];
  edges: CampaignGraphEdge[];
}

export function CampaignGraph({ findings, edges: edgeData }: CampaignGraphProps) {
  // Convert findings to nodes
  const initialNodes: Node[] = useMemo(() => {
    const count = Math.max(findings.length, 1);
    return findings.map((finding, index) => ({
      id: finding.id,
      type: 'default',
      position: { 
        x: Math.cos((index / count) * 2 * Math.PI) * 260 + 350,
        y: Math.sin((index / count) * 2 * Math.PI) * 200 + 250,
      },
      data: { 
        label: (
          <div className="text-xs p-1">
            <div className="font-bold truncate max-w-[140px] text-white">
              {finding.target_identifier}
            </div>
            <div className="text-slate-300 text-[10px] uppercase font-mono mt-0.5">
              {finding.surface} • {(finding.triage_priority * 100).toFixed(0)}%
            </div>
          </div>
        ),
      },
      style: {
        background: finding.triage_priority >= 0.8 ? '#991b1b' :
                    finding.triage_priority >= 0.5 ? '#92400e' :
                    '#1e3a8a',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '8px',
        padding: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      },
    }));
  }, [findings]);

  // Convert edges
  const initialEdges: Edge[] = useMemo(() => {
    return edgeData.map((edge, index) => ({
      id: `edge-${index}-${edge.source_finding_id}-${edge.target_finding_id}`,
      source: edge.source_finding_id,
      target: edge.target_finding_id,
      label: edge.shared_indicator_type,
      type: 'smoothstep',
      animated: edge.analyst_review_status === 'proposed',
      style: {
        stroke: edge.analyst_review_status === 'accepted' ? '#10b981' :
                edge.analyst_review_status === 'rejected' ? '#ef4444' :
                '#64748b',
        strokeWidth: 2,
      },
    }));
  }, [edgeData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="h-[600px] w-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background color="#1e293b" gap={16} />
        <Controls className="bg-slate-900 border-slate-700 text-white fill-white" />
        <MiniMap 
          nodeColor={(n) => (n.style?.background as string) || '#3b82f6'} 
          className="bg-slate-900 border border-slate-800" 
        />
      </ReactFlow>
    </div>
  );
}
