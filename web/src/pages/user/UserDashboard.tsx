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
        setSharedByMeCount(outList.length);
        setSharedWithMeCount(inList.length);
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
  const totalStorageGB = (totalStorageBytes / (1024 * 1024 * 1024)).toFixed(2);
  const quotaGB = 10;
  const usedRatio = Math.min((totalStorageBytes / (quotaGB * 1024 * 1024 * 1024)) * 100, 100);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner matching Screen 8 */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0c1a32] via-[#09152b] to-[#070e1e] border border-[#1a2d52] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
            Welcome back!
          </h1>
          <p className="text-xs text-slate-300 mt-1">Manage your files securely</p>
        </div>
        <Link
          to="/app/upload"
          className="sec-btn-emerald px-5 py-2.5 shadow-lg shadow-emerald-950/40 text-xs shrink-0"
        >
          <UploadCloud className="w-4 h-4" /> Upload &amp; Encrypt File
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* 4 Stat Cards matching Screen 8 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Files */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#0b1325] border border-[#1a2744] shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400">Total Files</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white mt-1">{totalFiles}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#10b981]/15 text-[#10b981] flex items-center justify-center">
            <FolderLock className="w-5 h-5" />
          </div>
        </div>

        {/* Shared By Me */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#0b1325] border border-[#1a2744] shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400">Shared By Me</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white mt-1">{sharedByMeCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
        </div>

        {/* Shared With Me */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#0b1325] border border-[#1a2744] shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400">Shared With Me</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white mt-1">{sharedWithMeCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Storage Used */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#0b1325] border border-[#1a2744] shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400">Storage Used</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[#34d399] mt-1">
              {parseFloat(totalStorageGB) > 0.05 ? `${totalStorageGB} GB` : `${totalStorageMB} MB`}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Grid: Recent Files (Left) + Storage Usage Donut (Right) matching Screen 8 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Files Table (Takes 2 cols) */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-[#0b1325] border border-[#1a2744] shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Recent Files</h3>
            <Link to="/app/files" className="text-xs text-[#10b981] hover:underline font-medium">
              View all &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-10 text-xs font-mono text-slate-500">Loading files...</div>
          ) : safeFiles.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[#1a2744] rounded-xl text-slate-400">
              <FolderLock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-medium">No encrypted files in repository</p>
              <Link to="/app/upload" className="mt-3 inline-block sec-btn-emerald py-1.5 px-3 text-xs">
                Upload Now
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] font-medium text-slate-400 border-b border-[#141f36]">
                  <tr>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Uploaded On</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141f36] text-slate-300">
                  {safeFiles.slice(0, 5).map((f) => (
                    <tr key={f.id} className="hover:bg-[#0c1830]/40 transition-colors">
                      <td className="py-3 px-3 font-medium text-white truncate max-w-[180px]">
                        {f.originalFilename}
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono">
                        {(f.encryptedSize / (1024 * 1024)).toFixed(1)} MB
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {new Date(f.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30">
                          Encrypted
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/app/files`}
                          className="p-1 text-slate-400 hover:text-white inline-block"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Storage Usage Donut Circular Progress matching Screen 8 */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0b1325] border border-[#1a2744] shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Storage Usage</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Encrypted quota allocation</p>
          </div>

          {/* Circular Donut Visual */}
          <div className="py-6 flex flex-col items-center justify-center relative">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#121e36"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Used Storage Arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="url(#storageGrad)"
                  strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * Math.max(usedRatio, 4)) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="storageGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold font-mono text-white">
                  {parseFloat(totalStorageGB) > 0.05 ? `${totalStorageGB} GB` : `${totalStorageMB} MB`}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">of 10 GB</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="pt-4 border-t border-[#141f36] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> Used
              </span>
              <span className="font-mono text-white">
                {parseFloat(totalStorageGB) > 0.05 ? `${totalStorageGB} GB` : `${totalStorageMB} MB`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1e293b]" /> Remaining
              </span>
              <span className="font-mono text-slate-400">
                {(quotaGB - parseFloat(totalStorageGB)).toFixed(2)} GB
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
