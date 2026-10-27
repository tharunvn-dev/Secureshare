import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#060b14] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#0b1325] border border-rose-500/30 rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Something went wrong</h2>
            <p className="text-xs text-slate-400 mt-2 font-mono break-words bg-[#070e1c] p-3 rounded-lg border border-[#1a2744]">
              {this.state.error?.message || 'Unknown runtime error'}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="sec-btn-emerald py-2 px-4 text-xs flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reload Page
              </button>
              <a
                href="/app/dashboard"
                className="sec-btn-glass py-2 px-4 text-xs flex items-center gap-2"
              >
                <Home className="w-3.5 h-3.5" /> Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
