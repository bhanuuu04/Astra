'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Activity, BarChart3, PieChart as PieIcon, Radar } from 'lucide-react';
import { type Sighting, type Campaign } from '@/lib/api';
import { GlobalThreatMap } from '@/components/analytics/GlobalThreatMap';

interface ThreatTelemetryChartsProps {
  sightings: Sighting[];
  campaigns: Campaign[];
}

const PALETTE = ['#7c78ff', '#34c6d3', '#f59e0b', '#fb7185', '#5ee0a0', '#9e8cff'];
const panel = 'rounded-xl border border-white/[0.075] bg-[#111a27] shadow-[0_12px_34px_rgba(0,0,0,0.12)]';

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-[#0b1119]/95 px-3 py-2.5 shadow-xl backdrop-blur">
      <p className="mb-1.5 text-[11px] font-medium text-slate-400">{label || payload[0].name}</p>
      {payload.map((entry: any, index: number) => (
        <div key={`${entry.dataKey}-${index}`} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
          <span className="text-slate-300">{entry.name}</span>
          <span className="ml-auto pl-4 font-mono font-semibold text-white">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function getRiskScore(sighting: Sighting) {
  const value = sighting.normalized_payload?.threat_analysis?.risk_score;
  return typeof value === 'number' ? (value <= 1 ? value * 100 : value) : null;
}

export function ThreatTelemetryCharts({ sightings, campaigns }: ThreatTelemetryChartsProps) {
  const trendData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return date;
    });
    return days.map((date) => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      const daySightings = sightings.filter((sighting) => {
        const timestamp = new Date(sighting.observed_at || sighting.created_at).getTime();
        return timestamp >= date.getTime() && timestamp < nextDay.getTime();
      });
      return {
        day: new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric' }).format(date),
        findings: daySightings.length,
        highRisk: daySightings.filter((sighting) => (getRiskScore(sighting) ?? 0) >= 80).length,
      };
    });
  }, [sightings]);

  const surfaceData = useMemo(() => {
    const counts = new Map<string, number>();
    sightings.forEach(({ surface }) => {
      const label = surface.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name, value], index) => ({
      name,
      value,
      color: PALETTE[index % PALETTE.length],
    }));
  }, [sightings]);

  const campaignRiskData = useMemo(() => {
    const groups = [
      { label: 'Critical', min: 80, max: Infinity, fill: '#fb7185' },
      { label: 'Elevated', min: 50, max: 80, fill: '#fbbf24' },
      { label: 'Watch', min: 0, max: 50, fill: '#7c78ff' },
    ];
    return groups.map((group) => ({
      stage: group.label,
      campaigns: campaigns.filter((campaign) => campaign.risk_score >= group.min && campaign.risk_score < group.max).length,
      fill: group.fill,
    }));
  }, [campaigns]);

  const highRiskFindings = sightings.filter((sighting) => (getRiskScore(sighting) ?? 0) >= 80).length;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <section className={`${panel} xl:col-span-7`}>
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded-lg border border-violet-400/15 bg-violet-400/[0.08] p-2 text-violet-300"><Activity className="h-4 w-4" /></span>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Finding activity</h2>
              <p className="mt-1 text-[11px] text-slate-500">Daily observations from available workspace records</p>
            </div>
          </div>
          <span className="rounded-md border border-white/[0.08] bg-white/[0.025] px-2 py-1 text-[10px] font-medium text-slate-400">Last 7 days</span>
        </div>
        <div className="h-[230px] px-2 pb-3 pt-4 sm:px-4">
          {sightings.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="astraFindingFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b83ff" stopOpacity={0.28} /><stop offset="100%" stopColor="#8b83ff" stopOpacity={0} /></linearGradient>
                  <linearGradient id="astraRiskFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fb7185" stopOpacity={0.2} /><stop offset="100%" stopColor="#fb7185" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 5" stroke="#263342" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="findings" name="Findings" stroke="#8b83ff" strokeWidth={2} fill="url(#astraFindingFill)" activeDot={{ r: 4, fill: '#b7b2ff', strokeWidth: 0 }} />
                <Area type="monotone" dataKey="highRisk" name="High risk" stroke="#fb7185" strokeWidth={1.8} fill="url(#astraRiskFill)" activeDot={{ r: 3, fill: '#fda4af', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="flex h-full flex-col items-center justify-center gap-2 text-center"><Activity className="h-5 w-5 text-slate-600" /><p className="text-xs text-slate-400">Activity appears when findings are ingested.</p></div>}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.06] px-5 py-3 text-[10px] text-slate-500">
          <span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-violet-400" />All findings</span>
          <span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-rose-400" />High risk · {highRiskFindings}</span>
          <span className="ml-auto">Based on observed timestamps</span>
        </div>
      </section>

      <section className={`${panel} xl:col-span-5`}>
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded-lg border border-cyan-400/15 bg-cyan-400/[0.08] p-2 text-cyan-300"><PieIcon className="h-4 w-4" /></span>
            <div><h2 className="text-sm font-semibold text-slate-100">Exposure by surface</h2><p className="mt-1 text-[11px] text-slate-500">Observed finding distribution</p></div>
          </div>
          <span className="font-mono text-xs text-slate-400">{sightings.length}</span>
        </div>
        {surfaceData.length ? <>
          <div className="relative h-[174px] px-2 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={surfaceData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value" stroke="#111a27" strokeWidth={3}>
                  {surfaceData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-2"><span className="font-mono text-xl font-semibold text-white">{sightings.length}</span><span className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-slate-500">Findings</span></div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-white/[0.06] px-5 py-3">
            {surfaceData.slice(0, 6).map((item) => <div key={item.name} className="flex min-w-0 items-center gap-2 text-[11px]"><i className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><span className="truncate text-slate-400">{item.name}</span><span className="ml-auto font-mono text-slate-200">{item.value}</span></div>)}
          </div>
        </> : <div className="flex h-[250px] flex-col items-center justify-center gap-2 text-center"><Radar className="h-5 w-5 text-slate-600" /><p className="text-xs text-slate-400">Surface breakdown appears when findings are ingested.</p></div>}
      </section>

      <section className={`${panel} xl:col-span-12`}>
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-3"><span className="rounded-lg border border-amber-400/15 bg-amber-400/[0.08] p-2 text-amber-200"><BarChart3 className="h-4 w-4" /></span><div><h2 className="text-sm font-semibold text-slate-100">Campaign risk profile</h2><p className="mt-1 text-[11px] text-slate-500">Existing investigations grouped by their current risk score</p></div></div>
          <span className="font-mono text-xs text-slate-400">{campaigns.length} total</span>
        </div>
        {campaigns.length ? <div className="h-[155px] px-3 pb-3 pt-4 sm:px-6"><ResponsiveContainer width="100%" height="100%"><BarChart data={campaignRiskData} layout="vertical" margin={{ top: 0, right: 18, left: 18, bottom: 0 }}><CartesianGrid strokeDasharray="3 5" stroke="#263342" horizontal={false} /><XAxis type="number" allowDecimals={false} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} /><YAxis type="category" dataKey="stage" stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} width={68} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="campaigns" name="Campaigns" radius={[0, 5, 5, 0]} barSize={18}>{campaignRiskData.map((entry) => <Cell key={entry.stage} fill={entry.fill} />)}</Bar></BarChart></ResponsiveContainer></div> : <div className="flex h-[112px] items-center justify-center text-xs text-slate-500">Campaign risk profile appears when investigations are created.</div>}
      </section>

      <GlobalThreatMap sightings={sightings} />
    </div>
  );
}
