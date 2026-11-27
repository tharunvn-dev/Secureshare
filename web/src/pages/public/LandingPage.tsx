import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Share2, Users, ArrowRight, FileCheck, Cloud, HardDrive, CheckCircle2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (window.location.hash && window.location.hash.includes('access_token=')) {
      navigate('/login' + window.location.hash, { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative">
      {/* Navigation Header */}
      <nav className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">SecureStorage</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Home</a>
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#about" className="hover:text-blue-600 transition-colors">About</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-xl text-xs shadow-sm shadow-blue-500/25 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section matching Screen 1 from Design System */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl mx-auto px-6 py-12 md:py-20 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-600 text-xs font-semibold tracking-wider uppercase">
              <span>SECURE &bull; PRIVATE &bull; YOURS</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-slate-900">
              Your Files. Your Control. <br />
              <span className="text-blue-600">Securely.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-lg leading-relaxed font-sans">
              A modern, secure file storage and sharing platform with advanced encryption, role-based access control, and complete privacy.
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4 pt-2">
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md shadow-blue-500/25 transition-all text-xs flex items-center gap-2"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-6 rounded-xl border border-slate-200 shadow-xs transition-all text-xs"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Right Column: Clean Modern Illustration matching Screen 1 */}
          <div className="flex items-center justify-center relative">
            <div className="w-full max-w-lg aspect-4/3 relative flex items-center justify-center p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
              {/* Cloud with upload arrow */}
              <div className="absolute top-6 right-10 w-16 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Cloud className="w-7 h-7" />
              </div>

              {/* Main Desktop Screen Mockup */}
              <div className="w-72 sm:w-80 bg-white border border-slate-200/80 rounded-2xl shadow-xl p-4 space-y-3 relative">
                {/* Window header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="h-3 w-24 bg-slate-100 rounded-full" />
                </div>

                {/* File list items inside mockup */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-red-100 text-red-600 font-bold text-[9px] flex items-center justify-center">PDF</span>
                      <span className="font-medium text-slate-800">Project_Document.pdf</span>
                    </div>
                    <span className="text-[10px] text-slate-400">24 KB</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 font-bold text-[9px] flex items-center justify-center">PNG</span>
                      <span className="font-medium text-slate-800">Image.png</span>
                    </div>
                    <span className="text-[10px] text-slate-400">16 KB</span>
                  </div>
                </div>

                {/* Green/Blue Shield floating badge */}
                <div className="absolute -bottom-4 -left-4 bg-white border border-slate-200 rounded-2xl p-3 shadow-lg flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-tight">256-Bit Encrypted</p>
                    <p className="text-[10px] text-slate-500">Zero-Knowledge Vault</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Bottom Feature Cards matching Screen 1 */}
        <section id="features" className="pt-20 border-t border-slate-200 mt-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">End-to-End Encryption</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your files are encrypted before they leave your device.
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Role-Based Access</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Control who can access what, and when.
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Secure Sharing</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Share files safely with trusted users.
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Audit Logging</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Full activity tracking and monitoring.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-900">SecureStorage</span>
          </div>
          <p>&copy; {new Date().getFullYear()} SecureStorage Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/admin/login" className="text-slate-500 hover:text-blue-600">Admin Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
