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

interface ThreatTelemetryChartsProps {
  sightings: Sighting[];
  campaigns: Campaign[];
}

const PALETTE = ['#0f7b6c', '#37352f', '#787774', '#9b9a97', '#2eaadc', '#eb5757'];
const panel = 'rounded-[8px] border border-[#e3e2e0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]';

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[6px] border border-[#e3e2e0] bg-white px-3 py-2 shadow-sm text-[#37352f]">
      <p className="mb-1 text-[11px] font-semibold text-[#9b9a97]">{label || payload[0].name}</p>
      {payload.map((entry: any, index: number) => (
        <div key={`${entry.dataKey}-${index}`} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
          <span className="text-[#37352f] font-medium">{entry.name}</span>
          <span className="ml-auto pl-4 font-mono font-bold text-[#0f7b6c]">{entry.value}</span>
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
        <div className="flex items-start justify-between gap-3 border-b border-[#e3e2e0] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] p-1.5 text-[#0f7b6c]"><Activity className="h-4 w-4" /></span>
            <div>
              <h2 className="text-sm font-bold text-[#37352f]">Finding activity</h2>
              <p className="mt-0.5 text-[11px] text-[#9b9a97]">Daily observations from available workspace records</p>
            </div>
          </div>
          <span className="rounded-[4px] border border-[#e3e2e0] bg-[#f7f6f3] px-2 py-0.5 text-[10px] font-medium text-[#787774]">Last 7 days</span>
        </div>
        <div className="h-[230px] px-2 pb-3 pt-4 sm:px-4">
          {sightings.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="astraFindingFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0f7b6c" stopOpacity={0.2} /><stop offset="100%" stopColor="#0f7b6c" stopOpacity={0} /></linearGradient>
                  <linearGradient id="astraRiskFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#eb5757" stopOpacity={0.18} /><stop offset="100%" stopColor="#eb5757" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 5" stroke="#e3e2e0" vertical={false} />
                <XAxis dataKey="day" stroke="#9b9a97" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke="#9b9a97" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="findings" name="Findings" stroke="#0f7b6c" strokeWidth={2} fill="url(#astraFindingFill)" activeDot={{ r: 4, fill: '#0f7b6c', strokeWidth: 0 }} />
                <Area type="monotone" dataKey="highRisk" name="High risk" stroke="#eb5757" strokeWidth={1.8} fill="url(#astraRiskFill)" activeDot={{ r: 3, fill: '#eb5757', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="flex h-full flex-col items-center justify-center gap-2 text-center"><Activity className="h-5 w-5 text-[#9b9a97]" /><p className="text-xs text-[#9b9a97]">Activity appears when findings are ingested.</p></div>}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#e3e2e0] px-5 py-2.5 text-[10px] text-[#787774]">
          <span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-[#0f7b6c]" />All findings</span>
          <span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-[#eb5757]" />High risk · {highRiskFindings}</span>
          <span className="ml-auto text-[#9b9a97]">Based on observed timestamps</span>
        </div>
      </section>

      <section className={`${panel} xl:col-span-5`}>
        <div className="flex items-start justify-between gap-3 border-b border-[#e3e2e0] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] p-1.5 text-[#0f7b6c]"><PieIcon className="h-4 w-4" /></span>
            <div><h2 className="text-sm font-bold text-[#37352f]">Exposure by surface</h2><p className="mt-0.5 text-[11px] text-[#9b9a97]">Observed finding distribution</p></div>
          </div>
          <span className="font-mono text-xs font-semibold text-[#37352f]">{sightings.length}</span>
        </div>
        {surfaceData.length ? <>
          <div className="relative h-[174px] px-2 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={surfaceData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value" stroke="#ffffff" strokeWidth={2}>
                  {surfaceData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-2"><span className="font-mono text-xl font-bold text-[#37352f]">{sightings.length}</span><span className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-[#9b9a97]">Findings</span></div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[#e3e2e0] px-5 py-2.5">
            {surfaceData.slice(0, 6).map((item) => <div key={item.name} className="flex min-w-0 items-center gap-2 text-[11px]"><i className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><span className="truncate text-[#787774]">{item.name}</span><span className="ml-auto font-mono font-medium text-[#37352f]">{item.value}</span></div>)}
          </div>
        </> : <div className="flex h-[250px] flex-col items-center justify-center gap-2 text-center"><Radar className="h-5 w-5 text-[#9b9a97]" /><p className="text-xs text-[#9b9a97]">Surface breakdown appears when findings are ingested.</p></div>}
      </section>

      <section className={`${panel} xl:col-span-12`}>
        <div className="flex items-start justify-between gap-3 border-b border-[#e3e2e0] px-5 py-3.5">
          <div className="flex items-center gap-2.5"><span className="rounded-[6px] border border-[#e3e2e0] bg-[#f7f6f3] p-1.5 text-[#0f7b6c]"><BarChart3 className="h-4 w-4" /></span><div><h2 className="text-sm font-bold text-[#37352f]">Campaign risk profile</h2><p className="mt-0.5 text-[11px] text-[#9b9a97]">Existing investigations grouped by risk</p></div></div>
          <span className="font-mono text-xs font-semibold text-[#37352f]">{campaigns.length} total</span>
        </div>
        {campaigns.length ? <div className="h-[155px] px-3 pb-3 pt-4 sm:px-6"><ResponsiveContainer width="100%" height="100%"><BarChart data={campaignRiskData} layout="vertical" margin={{ top: 0, right: 18, left: 18, bottom: 0 }}><CartesianGrid strokeDasharray="3 5" stroke="#e3e2e0" horizontal={false} /><XAxis type="number" allowDecimals={false} stroke="#9b9a97" fontSize={10} tickLine={false} axisLine={false} /><YAxis type="category" dataKey="stage" stroke="#787774" fontSize={11} tickLine={false} axisLine={false} width={68} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="campaigns" name="Campaigns" radius={[0, 4, 4, 0]} barSize={16}>{campaignRiskData.map((entry) => <Cell key={entry.stage} fill={entry.fill} />)}</Bar></BarChart></ResponsiveContainer></div> : <div className="flex h-[112px] items-center justify-center text-xs text-[#9b9a97]">Campaign risk profile appears when investigations are created.</div>}
      </section>
    </div>
  );
}
