import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

interface IntegrityBadgeProps {
  status?: boolean | 'VALID' | 'FAILED' | 'UNKNOWN';
  size?: 'sm' | 'md';
}

export const IntegrityBadge: React.FC<IntegrityBadgeProps> = ({ status = 'VALID', size = 'md' }) => {
  const isValid = status === true || status === 'VALID';
  const isFailed = status === false || status === 'FAILED';

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  if (isValid) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses}`}
      >
        <ShieldCheck className={iconSize} />
        SHA-256 Valid
      </span>
    );
  }

  if (isFailed) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse ${sizeClasses}`}
      >
        <ShieldAlert className={iconSize} />
        Integrity Compromised
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 ${sizeClasses}`}
    >
      <Shield className={iconSize} />
      Unverified
    </span>
  );
};
