import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Share2, Users, Mail, ArrowRight, CheckCircle2, Key, HardDrive, FileCheck } from 'lucide-react';
import { TopFeatureBar } from '../../components/common/TopFeatureBar';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#060b14] text-slate-100 flex flex-col font-sans selection:bg-[#10b981]/30 selection:text-[#34d399]">
      {/* Top Banner from the design board */}
      <TopFeatureBar />

      {/* Main Navigation Header */}
      <nav className="border-b border-[#141f36] bg-[#070e1c]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#10b981]/20 border border-[#10b981]/50 flex items-center justify-center text-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              <Lock className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg text-white tracking-wider">SecureShare</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-slate-300 font-medium">
            <a href="#features" className="hover:text-[#10b981] transition-colors">Features</a>
            <a href="#security" className="hover:text-[#10b981] transition-colors">Security</a>
            <a href="#about" className="hover:text-[#10b981] transition-colors">About</a>
            <Link to="/admin/login" className="text-slate-400 hover:text-rose-400 transition-colors font-mono text-xs">Admin Portal</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-[#10b981] hover:bg-[#059669] text-slate-950 transition-all shadow-[0_0_15px_rgba(16,185,129,0.35)]"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section matching Screen 1 */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl mx-auto px-6 py-12 md:py-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Text Column */}
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
              Secure File Storage <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10b981] via-[#06b6d4] to-cyan-400">
                and Sharing
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-lg leading-relaxed font-sans">
              Multi-layer encryption, steganographic key management, and secure sharing for a safer cloud experience.
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4 pt-2">
              <Link
                to="/register"
                className="px-6 py-3 rounded-xl font-semibold bg-[#10b981] hover:bg-[#059669] text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2 text-sm"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="px-6 py-3 rounded-xl font-semibold bg-[#111c34] hover:bg-[#182849] text-slate-200 border border-[#203258] transition-all text-sm"
              >
                Learn More
              </a>
            </div>

            {/* 4 Bottom Pills */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0c162b] border border-[#1a2947] text-xs font-medium text-slate-300">
                <Lock className="w-4 h-4 text-[#10b981] shrink-0" />
                <span>End-to-End Encryption</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0c162b] border border-[#1a2947] text-xs font-medium text-slate-300">
                <Share2 className="w-4 h-4 text-[#10b981] shrink-0" />
                <span>Secure Sharing</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0c162b] border border-[#1a2947] text-xs font-medium text-slate-300">
                <Users className="w-4 h-4 text-[#10b981] shrink-0" />
                <span>Role-Based Access</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0c162b] border border-[#1a2947] text-xs font-medium text-slate-300">
                <Mail className="w-4 h-4 text-[#10b981] shrink-0" />
                <span>Real Email OTP</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Holographic Shield Pedestal Graphic */}
          <div className="flex items-center justify-center relative">
            <div className="w-full max-w-md aspect-square relative flex items-center justify-center">
              {/* Concentric Neon Rings */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#10b981]/10 via-cyan-500/10 to-transparent blur-3xl animate-pulse" />
              
              <svg className="w-80 h-80 relative z-10" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* 3D Pedestal Base */}
                <ellipse cx="200" cy="320" rx="140" ry="40" fill="url(#pedestalGlow)" opacity="0.6" />
                <ellipse cx="200" cy="310" rx="120" ry="32" stroke="#10b981" strokeWidth="2" strokeDasharray="6 4" opacity="0.8" />
                <ellipse cx="200" cy="300" rx="100" ry="24" stroke="#06b6d4" strokeWidth="1.5" opacity="0.9" />

                {/* Glowing Laser Vertical Beams */}
                <line x1="140" y1="310" x2="160" y2="180" stroke="#10b981" strokeWidth="1" opacity="0.4" />
                <line x1="260" y1="310" x2="240" y2="180" stroke="#10b981" strokeWidth="1" opacity="0.4" />
                <line x1="200" y1="300" x2="200" y2="140" stroke="#06b6d4" strokeWidth="1" opacity="0.5" strokeDasharray="4 4" />

                {/* Central Holographic Shield with Glow */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="10" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                
                <path
                  d="M200 80L270 120V190C270 245 200 280 200 280C200 280 130 245 130 190V120L200 80Z"
                  fill="url(#shieldGrad)"
                  stroke="#34d399"
                  strokeWidth="3"
                  filter="url(#glow)"
                />
                
                {/* Inner Shield Facet */}
                <path
                  d="M200 95L255 128V185C255 230 200 260 200 260C200 260 145 230 145 185V128L200 95Z"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  opacity="0.7"
                />

                {/* Padlock inside Shield */}
                <rect x="180" y="170" width="40" height="32" rx="6" fill="#070e1c" stroke="#34d399" strokeWidth="2" />
                <path d="M188 170V154C188 147.373 193.373 142 200 142C206.627 142 212 147.373 212 154V170" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="200" cy="184" r="3" fill="#34d399" />
                <line x1="200" y1="187" x2="200" y2="194" stroke="#34d399" strokeWidth="2" />

                {/* Gradients */}
                <defs>
                  <radialGradient id="pedestalGlow" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                    <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#060b14" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="shieldGrad" x1="130" y1="80" x2="270" y2="280" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#064e3b" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#065f46" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#022c22" stopOpacity="0.9" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        {/* Feature Sections Anchor */}
        <section id="features" className="pt-20 border-t border-[#141f36] mt-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-[#10b981]">Cryptographic Layers</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">Multi-Layer Hybrid Defense</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#0b1325] border border-[#1a2744] hover:border-[#10b981]/40 transition-colors">
              <div className="p-3 bg-[#10b981]/15 text-[#10b981] rounded-xl w-fit mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">Hybrid Ciphers (AES-GCM + Blowfish)</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Primary authenticated encryption via 256-bit AES-GCM with 128-bit authentication tags, cascaded with Blowfish-CBC for enhanced diffusion.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0b1325] border border-[#1a2744] hover:border-[#10b981]/40 transition-colors">
              <div className="p-3 bg-purple-500/15 text-purple-400 rounded-xl w-fit mb-4">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">Asymmetric Key Wrapping (P-256)</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                NIST P-256 ECDH agreement with RFC 5869 HKDF-SHA-256 ensures zero-knowledge key distribution. The server never sees private keys.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0b1325] border border-[#1a2744] hover:border-[#10b981]/40 transition-colors">
              <div className="p-3 bg-cyan-500/15 text-cyan-400 rounded-xl w-fit mb-4">
                <HardDrive className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">LSB PNG Steganographic Camouflage</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Sealed key envelopes are embedded into the least significant bits of lossless 24-bit PNG images with CRC-32 integrity validation.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#141f36] bg-[#050912] py-8 text-xs text-slate-500 font-mono text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>SecureShare &bull; SJCIT Final-Year BE CSE Major Project &bull; Academic Year 2026-2027</p>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-slate-300">Login</Link>
            <Link to="/register" className="hover:text-slate-300">Register</Link>
            <Link to="/admin/login" className="hover:text-slate-300">Admin Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
