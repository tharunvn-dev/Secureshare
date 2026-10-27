import React, { useState } from 'react';
import { Sliders, Shield, Lock, HardDrive, Mail, Check, Server, Save, Globe } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'SECURITY' | 'USERS' | 'EMAIL' | 'INTEGRATION'>('GENERAL');

  // Screen 23 Form State
  const [siteName, setSiteName] = useState('SecureShare');
  const [maxUploadSize, setMaxUploadSize] = useState('1024');
  const [storagePath, setStoragePath] = useState('D:/secureshare-storage');
  const [saved, setSaved] = useState(false);

  // Security Policy State
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [mfaEnforced, setMfaEnforced] = useState(true);
  const [encryptionStandard, setEncryptionStandard] = useState('AES-256-GCM + Blowfish (Cascade)');

  // Email SMTP State
  const [smtpHost, setSmtpHost] = useState('localhost');
  const [smtpPort, setSmtpPort] = useState('1025');
  const [senderEmail, setSenderEmail] = useState('no-reply@secureshare.local');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Screen 23 Card: Admin Settings */}
      <div className="sec-card p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white tracking-wide">Admin Settings</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            System Configuration &bull; Storage Root &bull; Security Policies
          </p>
        </div>

        {/* Screen 23 Tabs: General, Security, Users, Email, Integration */}
        <div className="flex border-b border-emerald-950/40 mb-6 gap-2 md:gap-4 overflow-x-auto text-xs font-mono">
          {(
            [
              { id: 'GENERAL', label: 'General' },
              { id: 'SECURITY', label: 'Security' },
              { id: 'USERS', label: 'Users' },
              { id: 'EMAIL', label: 'Email' },
              { id: 'INTEGRATION', label: 'Integration' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2.5 px-3 transition-all relative whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-sm shadow-emerald-400/50" />
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Tab 1: General (Screen 23 exact fields) */}
          {activeTab === 'GENERAL' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1.5">
                  Site Name
                </label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-emerald-950/50 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1.5">
                  Max Upload Size (MB)
                </label>
                <input
                  type="number"
                  value={maxUploadSize}
                  onChange={(e) => setMaxUploadSize(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-emerald-950/50 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1.5">
                  Storage Path
                </label>
                <input
                  type="text"
                  value={storagePath}
                  onChange={(e) => setStoragePath(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-emerald-950/50 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Security */}
          {activeTab === 'SECURITY' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1.5">
                  Cryptographic Framework
                </label>
                <input
                  type="text"
                  disabled
                  value={encryptionStandard}
                  className="w-full px-3.5 py-2.5 bg-black/20 border border-emerald-950/30 rounded-xl text-xs text-emerald-400 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1.5">
                  Session Inactivity Timeout (Minutes)
                </label>
                <input
                  type="number"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-emerald-950/50 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-black/30 border border-emerald-950/40 rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-white">Enforce Multi-Factor Authentication</p>
                  <p className="text-[11px] text-slate-400 font-mono">Requires 6-digit OTP verification upon sign-in</p>
                </div>
                <input
                  type="checkbox"
                  checked={mfaEnforced}
                  onChange={(e) => setMfaEnforced(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0 bg-black/50"
                />
              </div>
            </div>
          )}

          {/* Tab 3: Users */}
          {activeTab === 'USERS' && (
            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 bg-black/30 border border-emerald-950/40 rounded-xl space-y-2">
                <div className="flex justify-between py-1 border-b border-emerald-950/40">
                  <span className="text-slate-400">Default Assigned Role:</span>
                  <span className="text-cyan-400">ROLE_USER</span>
                </div>
                <div className="flex justify-between py-1 border-b border-emerald-950/40">
                  <span className="text-slate-400">Auto Email Verification:</span>
                  <span className="text-emerald-400">Enabled (6-digit OTP)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Max Failed Login Attempts:</span>
                  <span className="text-rose-400">5 attempts before lock</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Email */}
          {activeTab === 'EMAIL' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1.5">SMTP Host</label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-emerald-950/50 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1.5">SMTP Port</label>
                <input
                  type="text"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-emerald-950/50 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1.5">Sender Email</label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-emerald-950/50 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* Tab 5: Integration */}
          {activeTab === 'INTEGRATION' && (
            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 bg-black/30 border border-emerald-950/40 rounded-xl space-y-2">
                <div className="flex justify-between py-1 border-b border-emerald-950/40">
                  <span className="text-slate-400">Google OAuth 2.0 Client ID:</span>
                  <span className="text-emerald-400">Configured</span>
                </div>
                <div className="flex justify-between py-1 border-b border-emerald-950/40">
                  <span className="text-slate-400">PostgreSQL Outbox Dispatch:</span>
                  <span className="text-emerald-400">Active (cron @ 10s)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Flyway Database Schema:</span>
                  <span className="text-white">v6__secure_storage_enhancements</span>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="pt-4 border-t border-emerald-950/40 flex items-center justify-between">
            {saved ? (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Settings updated successfully!
              </span>
            ) : <span />}

            <button
              type="submit"
              className="sec-btn-emerald py-2.5 px-5 text-xs font-semibold flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
