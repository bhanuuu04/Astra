'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  Sliders, 
  Save,
  AlertCircle,
  Loader2,
  Mail,
  Shield,
  Sparkles
} from 'lucide-react';
import { getSettings, updateSettings } from '@/lib/api';

export function SettingsPage() {
  const [quarantineThreshold, setQuarantineThreshold] = useState(80);
  const [slackWebhook, setSlackWebhook] = useState('');
  const [alertCriticalOnly, setAlertCriticalOnly] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [autoQuarantineEnabled, setAutoQuarantineEnabled] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadSettings() {
      try {
        setLoading(true);
        const data = await getSettings();
        if (mounted) {
          setQuarantineThreshold(data.quarantine_threshold);
          setSlackWebhook(data.slack_webhook_url || '');
          setAlertCriticalOnly(data.alert_critical_only);
          setNotificationEmail(data.notification_email || '');
          setAutoQuarantineEnabled(data.auto_quarantine_enabled);
          setErrorMessage(null);
        }
      } catch (err: any) {
        if (mounted) {
          console.warn('Failed to load settings:', err);
          setErrorMessage('Could not load organization settings. Using defaults.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadSettings();
    return () => { mounted = false; };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMessage(null);
      setSavedMessage(null);

      const updated = await updateSettings({
        quarantine_threshold: quarantineThreshold,
        slack_webhook_url: slackWebhook.trim() ? slackWebhook.trim() : null,
        alert_critical_only: alertCriticalOnly,
        notification_email: notificationEmail.trim() ? notificationEmail.trim() : null,
        auto_quarantine_enabled: autoQuarantineEnabled,
      });

      setQuarantineThreshold(updated.quarantine_threshold);
      setSlackWebhook(updated.slack_webhook_url || '');
      setAlertCriticalOnly(updated.alert_critical_only);
      setNotificationEmail(updated.notification_email || '');
      setAutoQuarantineEnabled(updated.auto_quarantine_enabled);

      setSavedMessage('Organization settings successfully persisted to database.');
      setTimeout(() => setSavedMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save settings to database.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-[#0b1119] p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Platform Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure automated defense thresholds, alert notifications, and persisted organization policies.
        </p>
      </div>

      {savedMessage && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 py-12 text-sm justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Loading organization settings...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
          {/* Automated Quarantine Threshold */}
          <div className="bg-white dark:bg-[#111926] rounded-2xl p-6 border border-slate-200/70 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-500" />
              Automated Quarantine & Blocking Sensitivity
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Findings that score above this risk threshold will automatically trigger automated triage actions and quarantine alerts.
            </p>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-600 dark:text-slate-300">Auto-Quarantine Score:</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">{quarantineThreshold}/100</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={quarantineThreshold}
                onChange={(e) => setQuarantineThreshold(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>More Aggressive (50)</span>
                <span>Balanced (80 - Default)</span>
                <span>Strict Only (95)</span>
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer pt-2 border-t border-slate-100 dark:border-white/[0.05]">
              <input
                type="checkbox"
                checked={autoQuarantineEnabled}
                onChange={(e) => setAutoQuarantineEnabled(e.target.checked)}
                className="accent-cyan-500 w-4 h-4 rounded"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300">
                Enable automated quarantine recommendation in response workflows
              </span>
            </label>
          </div>

          {/* Real-time Alerting & Webhooks */}
          <div className="bg-white dark:bg-[#111926] rounded-2xl p-6 border border-slate-200/70 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-cyan-500" />
              SOC Alert Channels & Webhooks
            </h2>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block">
                  Slack / Discord Webhook URL for Threat Alerts
                </label>
                <input
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  className="w-full mt-1.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 text-xs font-mono placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block">
                  SOC Notification Email
                </label>
                <div className="relative mt-1.5">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="soc@yourcompany.com"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    className="w-full pl-9 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 text-xs font-mono placeholder:text-slate-400"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={alertCriticalOnly}
                  onChange={(e) => setAlertCriticalOnly(e.target.checked)}
                  className="accent-cyan-500 w-4 h-4 rounded"
                />
                <span className="text-slate-700 dark:text-slate-300 font-sans text-xs">
                  Only dispatch notifications for Critical severity threats (Rogue APKs & Confirmed Phishing Impersonations)
                </span>
              </label>
            </div>
          </div>

          {/* Enterprise Governance Tier */}
          <div className="bg-gradient-to-r from-cyan-950/20 to-blue-950/20 rounded-2xl p-6 border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Shield className="w-4 h-4" />
                <span>ASTRA Enterprise Organization</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Organization-scoped data isolation, cryptographically signed JWT auth, and durable audit logs active.
              </p>
            </div>

            <span className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold shrink-0 text-center">
              Tenant Active
            </span>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : savedMessage ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Saving...' : savedMessage ? 'Saved!' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
