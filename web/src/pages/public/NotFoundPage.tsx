import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Home } from 'lucide-react';
import { TopFeatureBar } from '../../components/common/TopFeatureBar';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#060b14] flex flex-col font-sans selection:bg-[#10b981]/30 selection:text-[#34d399]">
      <TopFeatureBar />
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="w-full max-w-md bg-[#0b1325] border border-[#1a2744] rounded-2xl p-8 sm:p-10 shadow-2xl relative">
          <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] mb-4">
            <Search className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">Page Not Found (404)</h1>
          <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
            The page you are looking for does not exist or has been moved.
          </p>

          <div className="mt-8 flex justify-center">
            <Link
              to="/"
              className="px-6 py-2.5 rounded-lg font-semibold bg-[#10b981] hover:bg-[#059669] text-slate-950 text-xs shadow-lg transition-all flex items-center gap-2"
            >
              <Home className="w-4 h-4" /> Go to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
