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
  BellRing,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
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
    href: '/overview',
    icon: LayoutDashboard,
    status: 'active',
  },
  {
    id: 'findings',
    label: 'Findings Queue',
    href: '/sightings',
    icon: Search,
    status: 'active',
  },
  {
    id: 'mobile-radar',
    label: 'Mobile App Radar',
    href: '/apps',
    icon: Smartphone,
    status: 'active',
  },
  {
    id: 'campaigns',
    label: 'Campaign Clusters',
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
    id: 'alerts',
    label: 'Alert Feed',
    href: '/alerts',
    icon: BellRing,
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

export function MainNavigation({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="w-full space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === '/overview' 
          ? pathname === '/overview' || pathname === '/'
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.id}
            href={item.status === 'active' ? item.href : '#'}
            onClick={onNavClick}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors',
              isActive && 'bg-cyan-500/10 text-cyan-200 border border-cyan-500/20',
              !isActive && item.status === 'active' && 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60',
              item.status === 'planned' && 'text-slate-600 cursor-not-allowed'
            )}
          >
            <Icon className={cn('w-4 h-4', isActive ? 'text-cyan-400' : 'text-slate-400')} />
            <span className="flex-1">{item.label}</span>
            
            {item.status === 'planned' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 uppercase font-mono">
                Planned
              </span>
            )}
            
            {item.badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold font-mono">
                {item.badge}
              </span>
            )}

            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
