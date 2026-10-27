import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { TopFeatureBar } from '../../components/common/TopFeatureBar';

export const AccessDeniedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#060b14] flex flex-col font-sans selection:bg-[#10b981]/30 selection:text-[#34d399]">
      <TopFeatureBar />
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="w-full max-w-md bg-[#0b1325] border border-rose-500/30 rounded-2xl p-8 sm:p-10 shadow-2xl relative">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)] mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">Access Denied (403)</h1>
          <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
            You do not have permission to access this protected area.
          </p>

          <div className="mt-8 flex justify-center gap-3">
            <Link
              to="/app/dashboard"
              className="px-5 py-2.5 rounded-lg font-semibold bg-[#10b981] hover:bg-[#059669] text-slate-950 text-xs shadow-lg transition-all flex items-center gap-2"
            >
              <Home className="w-4 h-4" /> User Dashboard
            </Link>
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-lg font-medium bg-[#13203c] hover:bg-[#1a2b50] text-slate-300 text-xs border border-[#22355e] transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Sign In Again
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
