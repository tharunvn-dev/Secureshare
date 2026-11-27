import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Home, FileQuestion } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-center items-center p-6 font-sans relative selection:bg-blue-600 selection:text-white">
      {/* 404 Card matching Screen 14 from Design System */}
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-10 shadow-sm text-center space-y-4">
        {/* 404 Large Display */}
        <h1 className="text-6xl font-extrabold text-blue-600 tracking-tight">404</h1>

        <div>
          <h2 className="text-xl font-bold text-slate-900">Page Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="pt-4 flex justify-center">
          <Link
            to="/app/dashboard"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-sm shadow-blue-500/25 transition-all inline-flex items-center gap-2"
          >
            <Home className="w-4 h-4" /> Go Back Home
          </Link>
        </div>
      </div>
    </div>
  );
};
