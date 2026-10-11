'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Bell, 
  ShieldAlert, 
  Key, 
  Sparkles, 
  Check, 
  Sliders, 
  Save 
} from 'lucide-react';

export function SettingsPage() {
  const [quarantineThreshold, setQuarantineThreshold] = useState(80);
  const [slackWebhook, setSlackWebhook] = useState('https://hooks.slack.com/services/T00/B00/XXXX');
  const [alertCriticalOnly, setAlertCriticalOnly] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure automated defense thresholds, alert notifications, and API credentials
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Automated Quarantine Threshold */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            Automated Quarantine & Blocking Sensitivity
          </h2>
          <p className="text-xs text-slate-500">
            Messages that receive a threat score above this threshold will be immediately blocked from reaching social media managers to prevent phishing compromise.
          </p>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-600">Auto-Quarantine Score:</span>
              <span className="font-bold text-indigo-600">{quarantineThreshold}/100</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={quarantineThreshold}
              onChange={(e) => setQuarantineThreshold(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>More Aggressive (50)</span>
              <span>Balanced (80 - Recommended)</span>
              <span>Strict Only (95)</span>
            </div>
          </div>
        </div>

        {/* Real-time Alerting & Webhooks */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            SOC Alert Notifications
          </h2>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="text-slate-700 font-semibold">Slack / Discord Webhook URL for Instant Threat Alerts</label>
              <input
                type="text"
                value={slackWebhook}
                onChange={(e) => setSlackWebhook(e.target.value)}
                className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs font-mono"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={alertCriticalOnly}
                onChange={(e) => setAlertCriticalOnly(e.target.checked)}
                className="accent-indigo-600 w-4 h-4 rounded"
              />
              <span className="text-slate-700 font-sans text-xs">Only dispatch notifications for Critical severity threats (Rogue APKs & Confirmed Impersonators)</span>
            </label>
          </div>
        </div>

        {/* Pro Plan Status */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Astra Enterprise Shield Active</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Your subscription includes 24/7 automated platform takedowns, unlimited social handle monitoring, and API webhook access.
            </p>
          </div>

          <span className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shrink-0 text-center">
            Active Tier
          </span>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
