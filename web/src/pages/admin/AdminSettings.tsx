import React, { useState } from 'react';
import { Sliders, Shield, Lock, HardDrive, Mail, Check, Server, Save, Globe } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'SECURITY' | 'USERS' | 'EMAIL' | 'INTEGRATION'>('GENERAL');

  // Screen 23 Form State
  const [siteName, setSiteName] = useState('SecureVault');
  const [maxUploadSize, setMaxUploadSize] = useState('1024');
  const [storagePath, setStoragePath] = useState('D:/securevault-storage');
  const [saved, setSaved] = useState(false);

  // Security Policy State
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [mfaEnforced, setMfaEnforced] = useState(true);
  const [encryptionStandard, setEncryptionStandard] = useState('AES-256-GCM + Blowfish (Cascade)');

  // Email SMTP State
  const [smtpHost, setSmtpHost] = useState('localhost');
  const [smtpPort, setSmtpPort] = useState('1025');
  const [senderEmail, setSenderEmail] = useState('no-reply@securevault.local');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          System Configuration &bull; Storage Root &bull; Security Policies
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 md:p-8">
        {/* Tabs: General, Security, Users, Email, Integration */}
        <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold mb-6 gap-1 overflow-x-auto">
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
              className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Tab 1: General */}
          {activeTab === 'GENERAL' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Site Name
                </label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Max Upload Size (MB)
                </label>
                <input
                  type="number"
                  value={maxUploadSize}
                  onChange={(e) => setMaxUploadSize(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Storage Path
                </label>
                <input
                  type="text"
                  value={storagePath}
                  onChange={(e) => setStoragePath(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white font-mono transition-all"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Security */}
          {activeTab === 'SECURITY' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Cryptographic Framework
                </label>
                <input
                  type="text"
                  disabled
                  value={encryptionStandard}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-blue-700 font-mono font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Session Inactivity Timeout (Minutes)
                </label>
                <input
                  type="number"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-slate-900">Enforce Multi-Factor Authentication</p>
                  <p className="text-[11px] text-slate-500">Requires 6-digit OTP verification upon sign-in</p>
                </div>
                <input
                  type="checkbox"
                  checked={mfaEnforced}
                  onChange={(e) => setMfaEnforced(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
              </div>
            </div>
          )}

          {/* Tab 3: Users */}
          {activeTab === 'USERS' && (
            <div className="space-y-4 text-xs">
              <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                <div className="flex justify-between py-1.5 border-b border-slate-200/70">
                  <span className="text-slate-600">Default Assigned Role:</span>
                  <span className="font-semibold text-blue-600">ROLE_USER</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200/70">
                  <span className="text-slate-600">Auto Email Verification:</span>
                  <span className="font-semibold text-emerald-700">Enabled (6-digit OTP)</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600">Max Failed Login Attempts:</span>
                  <span className="font-semibold text-rose-700">5 attempts before lock</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Email */}
          {activeTab === 'EMAIL' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">SMTP Host</label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">SMTP Port</label>
                <input
                  type="text"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Sender Email</label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>
          )}

          {/* Tab 5: Integration */}
          {activeTab === 'INTEGRATION' && (
            <div className="space-y-4 text-xs">
              <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                <div className="flex justify-between py-1.5 border-b border-slate-200/70">
                  <span className="text-slate-600">Google OAuth 2.0 Client ID:</span>
                  <span className="font-semibold text-emerald-700">Configured</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200/70">
                  <span className="text-slate-600">PostgreSQL Outbox Dispatch:</span>
                  <span className="font-semibold text-emerald-700">Active (cron @ 10s)</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600">Flyway Database Schema:</span>
                  <span className="font-mono text-slate-900 font-medium">v6__secure_storage_enhancements</span>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {saved ? (
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Settings updated successfully!
              </span>
            ) : <span />}

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs shadow-blue-500/20 font-semibold text-xs py-2.5 px-6 flex items-center gap-1.5 transition-all"
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
