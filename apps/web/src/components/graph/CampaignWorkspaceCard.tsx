'use client';

import React from 'react';
import { CampaignGraphView } from './CampaignGraphView';
import { Network, ExternalLink } from 'lucide-react';

export function CampaignWorkspaceCard() {
  return (
    <section className="panel-card" style={{ height: '560px', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
      <div className="panel-heading" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Network style={{ width: '1.1rem', height: '1.1rem', color: '#4f46e5' }} />
            <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              Live Campaign Intelligence Graph
            </h2>
          </div>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
            Interactive cross-surface threat correlation connected via shared pivots (UPI, Phone, APK Hash, Lookalike DNS). Click edges to review.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '9999px', background: '#ecfdf5', color: '#047857' }}>
            PHASE 4 ACTIVE
          </span>
          <a
            href="/console"
            style={{ fontSize: '0.75rem', color: '#4f46e5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600' }}
          >
            Full Console <ExternalLink style={{ width: '0.75rem', height: '0.75rem' }} />
          </a>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <CampaignGraphView />
      </div>
    </section>
  );
}
