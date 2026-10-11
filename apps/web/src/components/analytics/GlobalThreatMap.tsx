'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Globe2, MapPin } from 'lucide-react';
import type { Sighting } from '@/lib/api';

type GeoPoint = { lat: number; lon: number; label: string; count: number };

function asCoordinate(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function findCoordinates(payload: Record<string, any> | null | undefined): { lat: number; lon: number; label?: string } | null {
  if (!payload) return null;
  const candidates = [payload, payload.geolocation, payload.geo, payload.location, payload.ip_geo, payload.geoip];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;
    const lat = asCoordinate(candidate.latitude ?? candidate.lat);
    const lon = asCoordinate(candidate.longitude ?? candidate.lon ?? candidate.lng);
    if (lat !== null && lon !== null && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      const label = [candidate.city, candidate.region, candidate.country_name ?? candidate.country]
        .filter((part) => typeof part === 'string' && part.trim())
        .join(', ');
      return { lat, lon, label: label || undefined };
    }
  }
  return null;
}

function project(point: Pick<GeoPoint, 'lat' | 'lon'>) {
  return { x: 24 + ((point.lon + 180) / 360) * 952, y: 26 + ((90 - point.lat) / 180) * 476 };
}

export function GlobalThreatMap({ sightings }: { sightings: Sighting[] }) {
  const points = useMemo(() => {
    const grouped = new Map<string, GeoPoint>();
    sightings.forEach((sighting) => {
      const location = findCoordinates(sighting.normalized_payload);
      if (!location) return;
      const key = `${location.lat.toFixed(2)},${location.lon.toFixed(2)}`;
      const current = grouped.get(key);
      if (current) current.count += 1;
      else grouped.set(key, { ...location, count: 1, label: location.label || 'Reported coordinates' });
    });
    return [...grouped.values()].sort((a, b) => b.count - a.count);
  }, [sightings]);

  return (
    <section aria-label="Global threat map" className="rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-12">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="rounded-lg border border-cyan-200 bg-cyan-50 p-2 text-cyan-700"><Globe2 className="h-4 w-4" /></span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Global Threat Map</h2>
            <p className="mt-1 text-[11px] text-slate-500">Geolocated findings from your workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-slate-600"><span className="h-2 w-2 rounded-full bg-cyan-500" />{points.length} locations</span>
          <Link href="/sightings" className="inline-flex items-center gap-1 font-medium text-cyan-700 hover:text-cyan-800">View findings <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_230px] lg:p-5">
        <div className="relative min-h-[230px] overflow-hidden rounded-lg border border-slate-100 bg-[#f7f9fc] sm:min-h-[330px]">
          <svg viewBox="0 0 1000 520" role="img" aria-label={`World map with ${points.length} geolocated finding locations`} className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="mapLand" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#dce5ef" /><stop offset="1" stopColor="#e9eef4" /></linearGradient>
              <filter id="markerGlow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <rect width="1000" height="520" fill="#f7f9fc" />
            <g stroke="#e4eaf1" strokeWidth="1" fill="none">
              {[120, 215, 310, 405].map((y) => <path key={`lat-${y}`} d={`M22 ${y} H978`} />)}
              {[262, 500, 738].map((x) => <path key={`lon-${x}`} d={`M${x} 22 V498`} />)}
            </g>
            <g fill="url(#mapLand)" stroke="#ccd7e3" strokeWidth="1.2" strokeLinejoin="round">
              <path d="M91 91 119 70 155 73 175 58 209 69 224 88 250 91 265 111 292 119 302 142 283 159 271 181 247 189 239 213 219 222 207 244 184 246 173 225 153 219 144 194 124 184 117 165 98 157 82 137 70 116Z" />
              <path d="M245 229 265 236 278 253 292 260 300 282 313 297 316 324 329 345 325 367 339 392 333 416 318 445 306 433 299 407 288 388 282 360 269 340 265 314 252 296 249 271 238 250Z" />
              <path d="M280 69 298 54 322 58 339 70 333 87 312 94 291 87Z" />
              <path d="M444 119 462 106 482 111 490 125 481 139 462 140Z" />
              <path d="M461 145 483 137 508 146 526 159 531 181 520 202 513 225 500 248 492 276 477 295 467 274 464 248 453 226 450 205 438 188 440 164Z" />
              <path d="M493 111 514 94 550 91 571 78 610 83 633 75 674 83 696 97 728 94 749 108 788 108 811 124 839 128 858 144 881 145 895 162 877 174 851 170 830 185 803 182 784 199 761 194 745 210 718 207 697 223 671 216 650 225 630 212 605 215 586 198 562 199 548 179 524 177 520 157 499 145Z" />
              <path d="M556 222 582 212 607 221 625 242 621 269 608 292 599 322 580 342 565 332 559 305 546 282 541 258Z" />
              <path d="M840 323 865 313 892 319 914 336 913 358 894 373 874 366 855 378 838 360Z" />
              <path d="M929 218 938 210 945 224 940 241 933 238Z" />
              <path d="M358 167 365 160 371 168 368 180 361 181Z" />
              <path d="M947 275 953 270 958 281 955 293 949 291Z" />
            </g>
            {points.map((point) => {
              const { x, y } = project(point);
              const radius = Math.min(11, 5 + Math.log2(point.count));
              return <g key={`${point.lat}-${point.lon}`} filter="url(#markerGlow)"><circle cx={x} cy={y} r={radius + 6} fill="#22b8cf" opacity="0.13" /><circle cx={x} cy={y} r={radius} fill="#0891b2" stroke="#ffffff" strokeWidth="2"><title>{point.label}: {point.count} {point.count === 1 ? 'finding' : 'findings'}</title></circle></g>;
            })}
          </svg>
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white/90 px-2.5 py-1.5 text-[10px] text-slate-500 shadow-sm"><MapPin className="h-3.5 w-3.5 text-cyan-700" />Marker size reflects finding volume</div>
        </div>

        <aside className="flex flex-col rounded-lg border border-slate-200 bg-white p-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-semibold text-slate-800">Mapped locations</h3>
            <span className="font-mono text-[10px] text-slate-400">{points.reduce((sum, point) => sum + point.count, 0)} findings</span>
          </div>
          {points.length ? (
            <ul className="mt-2 max-h-[250px] space-y-1 overflow-auto">
              {points.slice(0, 8).map((point) => <li key={`${point.lat}-${point.lon}`} className="flex items-center gap-2 rounded-md px-1.5 py-2 text-xs"><span className="h-2 w-2 rounded-full bg-cyan-500" /><span className="min-w-0 flex-1 truncate text-slate-600">{point.label}</span><span className="font-mono text-slate-800">{point.count}</span></li>)}
            </ul>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center py-7 text-center">
              <Globe2 className="mb-2 h-5 w-5 text-slate-300" />
              <p className="text-xs font-medium text-slate-600">No location coordinates yet</p>
              <p className="mt-1 max-w-[185px] text-[10px] leading-4 text-slate-400">Map markers appear when incoming findings include latitude and longitude.</p>
            </div>
          )}
          <div className="mt-auto border-t border-slate-100 pt-3 text-[10px] leading-4 text-slate-400">Locations come from source findings. No country or IP location is inferred.</div>
        </aside>
      </div>
    </section>
  );
}
