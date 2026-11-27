import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

export const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-center items-center p-6 font-sans relative selection:bg-blue-600 selection:text-white">
      {/* 403 Card matching Screen 15 from Design System */}
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-10 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-900">Access Denied</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
            You don't have permission to access this resource.
          </p>
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-mono font-semibold">
            HTTP 403 &bull; Forbidden
          </span>
        </div>

        <div className="pt-4 space-y-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-sm shadow-blue-500/25 transition-all inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <div>
            <Link
              to="/login"
              className="text-xs text-slate-500 hover:text-blue-600 font-medium"
            >
              Contact Administrator
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
