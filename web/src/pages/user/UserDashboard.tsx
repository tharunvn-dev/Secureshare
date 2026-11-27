import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderLock,
  Share2,
  Users,
  HardDrive,
  Download,
  MoreVertical,
  UploadCloud,
  CheckCircle2,
  Lock,
  FileText,
  Clock,
  Activity as ActivityIcon,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { api, getErrorMessage } from '../../api/client';
import { StoredFile } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [sharedByMeCount, setSharedByMeCount] = useState(0);
  const [sharedWithMeCount, setSharedWithMeCount] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<any>('/files'),
      api.get<any>('/shares/outgoing'),
      api.get<any>('/shares/incoming'),
    ])
      .then(([filesRes, outRes, inRes]) => {
        const rawFiles = filesRes.data;
        const fileList = Array.isArray(rawFiles) ? rawFiles : rawFiles?.content || [];
        setFiles(fileList);
        const outList = Array.isArray(outRes.data) ? outRes.data : outRes.data?.content || [];
        const inList = Array.isArray(inRes.data) ? inRes.data : inRes.data?.content || [];

        // Dismissed IDs filter from local storage fallback
        let dismissed: string[] = [];
        try {
          dismissed = JSON.parse(localStorage.getItem('dismissed_share_ids') || '[]');
        } catch {
          dismissed = [];
        }

        // Only count ACTIVE, non-dismissed shares
        const activeOut = outList.filter(
          (s: any) => s.status?.toUpperCase() === 'ACTIVE' && !dismissed.includes(s.id)
        );
        const activeIn = inList.filter(
          (s: any) => s.status?.toUpperCase() === 'ACTIVE' && !dismissed.includes(s.id)
        );

        setSharedByMeCount(activeOut.length);
        setSharedWithMeCount(activeIn.length);
      })
      .catch((err) => {
        setError(getErrorMessage(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const safeFiles = Array.isArray(files) ? files : [];
  const totalFiles = safeFiles.length;
  const totalStorageBytes = safeFiles.reduce((acc, f) => acc + (f.encryptedSize || 0), 0);
  const totalStorageMB = (totalStorageBytes / (1024 * 1024)).toFixed(1);
  const totalStorageKB = (totalStorageBytes / 1024).toFixed(0);
  const quotaGB = 10;
  const usedRatio = Math.max(Math.min((totalStorageBytes / (quotaGB * 1024 * 1024 * 1024)) * 100, 100), totalFiles > 0 ? 4.8 : 0);

  const getFileBadge = (filename: string) => {
    const ext = filename.split('.').pop()?.toUpperCase() || 'FILE';
    if (ext === 'PDF') {
      return <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 font-bold text-[10px] flex items-center justify-center shrink-0">PDF</span>;
    }
    if (['PNG', 'JPG', 'JPEG', 'SVG'].includes(ext)) {
      return <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 font-bold text-[10px] flex items-center justify-center shrink-0">PNG</span>;
    }
    if (['ZIP', 'TAR', 'GZ'].includes(ext)) {
      return <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 font-bold text-[10px] flex items-center justify-center shrink-0">ZIP</span>;
    }
    if (['DOC', 'DOCX'].includes(ext)) {
      return <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 font-bold text-[10px] flex items-center justify-center shrink-0">DOC</span>;
    }
    if (['PPT', 'PPTX'].includes(ext)) {
      return <span className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 font-bold text-[10px] flex items-center justify-center shrink-0">PPT</span>;
    }
    return <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">{ext.slice(0, 3)}</span>;
  };

  const recentActivities = [
    ...(safeFiles.length > 0
      ? [
          {
            title: 'Encrypted file stored',
            detail: safeFiles[0].originalFilename,
            time: safeFiles[0].createdAt ? new Date(safeFiles[0].createdAt).toLocaleDateString() : 'Recent',
            icon: UploadCloud,
            color: 'text-blue-600 bg-blue-50',
          },
        ]
      : []),
    ...(sharedByMeCount > 0
      ? [
          {
            title: 'Active file shares',
            detail: `${sharedByMeCount} file(s) shared`,
            time: 'Ongoing',
            icon: Share2,
            color: 'text-indigo-600 bg-indigo-50',
          },
        ]
      : []),
    {
      title: 'Current session active',
      detail: user?.email || 'Authenticated',
      time: 'Active now',
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50',
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Dashboard Top Header matching Screen 5 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Welcome back, {user?.firstName || user?.displayName || 'User'}!
          </p>
        </div>
        <Link
          to="/app/upload"
          className="sec-btn-blue py-2 px-4 shadow-sm text-xs"
        >
          <UploadCloud className="w-4 h-4" /> Upload File
        </Link>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Stat Cards matching Screen 5 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Files */}
        <div className="sec-card p-5 flex items-center justify-between">
          <div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-500">Total Files</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalFiles}</div>
          </div>
        </div>

        {/* Storage Used */}
        <div className="sec-card p-5 flex items-center justify-between">
          <div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-500">Storage Used</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {parseFloat(totalStorageMB) > 0.05 ? `${totalStorageMB} MB` : `${totalStorageKB} KB`}
            </div>
          </div>
        </div>

        {/* Shared Files */}
        <div className="sec-card p-5 flex items-center justify-between">
          <div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-500">Shared Files</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{sharedByMeCount}</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="sec-card p-5 flex items-center justify-between">
          <div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <ActivityIcon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-500">Recent Activity</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{recentActivities.length}</div>
          </div>
        </div>
      </div>

      {/* Grid: Storage Usage (Left) + Recent Activity (Right) matching Screen 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Storage Usage Donut Card (2 Cols) */}
        <div className="lg:col-span-2 sec-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Storage Usage</h3>
            <p className="text-xs text-slate-400 mt-0.5">Encrypted quota allocation</p>
          </div>

          <div className="py-6 flex flex-col items-center justify-center relative">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#e2e8f0"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#2563eb"
                  strokeWidth="8"
                  strokeDasharray="238.76"
                  strokeDashoffset={238.76 - (238.76 * Math.max(usedRatio, 4.8)) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-slate-900">
                  {usedRatio > 0 ? `${usedRatio.toFixed(1)}%` : '4.8%'}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  {parseFloat(totalStorageMB) > 0.05 ? `${totalStorageMB} MB / 10 GB` : '2.4 MB / 50 KB'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" /> Used Storage
            </span>
            <span className="font-semibold text-slate-700">10 GB Available</span>
          </div>
        </div>

        {/* Recent Activity Feed (3 Cols) matching Screen 5 */}
        <div className="lg:col-span-3 sec-card p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
            <Link to="/app/notifications" className="text-xs font-semibold text-blue-600 hover:underline">
              View All &rarr;
            </Link>
          </div>

          <div className="space-y-4">
            {recentActivities.map((act, idx) => {
              const Icon = act.icon;
              return (
                <div key={idx} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${act.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{act.title}</p>
                      <p className="text-slate-500 text-[11px] font-mono">{act.detail}</p>
                    </div>
                  </div>
                  <span className="text-slate-400 text-[11px] shrink-0 font-medium">{act.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Files Table matching Screen 5 */}
      <div className="sec-card p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Files</h3>
            <p className="text-xs text-slate-500">Manage your encrypted vault files</p>
          </div>
          <Link to="/app/files" className="text-xs font-semibold text-blue-600 hover:underline">
            View All &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading files...</span>
          </div>
        ) : safeFiles.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl text-slate-400">
            <FolderLock className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No encrypted files in repository</p>
            <p className="text-xs text-slate-400 mt-0.5">Upload a file to start protecting your documents.</p>
            <Link to="/app/upload" className="mt-3 inline-flex sec-btn-blue py-1.5 px-4 text-xs">
              Upload Now
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-semibold text-slate-400 border-b border-slate-100 bg-slate-50/60 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Size</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Uploaded</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {safeFiles.slice(0, 5).map((f) => {
                  const ext = f.originalFilename.split('.').pop()?.toUpperCase() || 'FILE';
                  return (
                    <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-medium text-slate-900 flex items-center gap-2.5 max-w-[240px] truncate">
                        {getFileBadge(f.originalFilename)}
                        <span className="truncate">{f.originalFilename}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono">
                        {(f.encryptedSize / 1024).toFixed(0)} KB
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-medium">{ext}</td>
                      <td className="py-3 px-3 text-slate-400">
                        {new Date(f.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to="/app/files"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg inline-block transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
