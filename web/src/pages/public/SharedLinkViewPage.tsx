import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, Download, Lock, AlertTriangle, Clock, CheckCircle2, FileText, Key } from 'lucide-react';
import { api, getErrorMessage } from '../../api/client';
import { SharedLink } from '../../types';

export const SharedLinkViewPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [linkData, setLinkData] = useState<SharedLink | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [privateKeyInput, setPrivateKeyInput] = useState<string>(() => localStorage.getItem('ecc_private_key') || '');
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api
      .get<SharedLink>(`/shares/link/${token}`)
      .then((res) => {
        setLinkData(res.data);
      })
      .catch((err) => {
        setError(getErrorMessage(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleDownload = async () => {
    if (!token) return;
    setError(null);
    setDownloading(true);

    try {
      const headers: Record<string, string> = {};
      if (privateKeyInput.trim()) {
        headers['X-Private-Key'] = privateKeyInput.trim();
      }

      const response = await api.post(`/shares/link/${token}/consume`, {}, {
        headers,
        responseType: 'blob',
      });

      // Trigger browser file download
      const contentDisposition = response.headers['content-disposition'];
      let filename = linkData?.originalFilename || 'decrypted_file';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '');
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      if (linkData?.isOneTime) {
        setLinkData({ ...linkData, isConsumed: true });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-cyan-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-400">Inspecting Cryptographic Shared Link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center p-6 selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="w-full max-w-lg bg-[#0d1424] border border-slate-800 rounded-2xl p-8 shadow-2xl relative">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl mb-3 shadow-lg shadow-cyan-950/40">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Secure File Access</h1>
          <p className="text-xs text-slate-400 font-mono mt-1 text-center">
            Encrypted Multi-Layer Link Delivery
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {linkData ? (
          <div className="space-y-6">
            <div className="p-4 bg-black/40 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-cyan-400" />
                <div className="truncate">
                  <h3 className="text-sm font-semibold text-white truncate">{linkData.originalFilename}</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Size: {(linkData.originalSize / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-2 text-[11px] font-mono">
                {linkData.isOneTime && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    ONE-TIME USE ONLY
                  </span>
                )}
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  Expires: {new Date(linkData.expiryDate).toLocaleString()}
                </span>
              </div>
            </div>

            {linkData.isConsumed && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                This one-time access link has already been consumed. Replay is cryptographically prohibited.
              </div>
            )}

            {linkData.isExpired && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                This share link has expired.
              </div>
            )}

            {!linkData.isConsumed && !linkData.isExpired && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    Recipient ECC Private Key (Optional / Auto-detected)
                  </label>
                  <input
                    type="password"
                    placeholder="Auto-detected from keyring, or paste PKCS#8 private key..."
                    value={privateKeyInput}
                    onChange={(e) => setPrivateKeyInput(e.target.value)}
                    className="w-full px-3 py-2 bg-black/60 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    If file envelope is protected with your ECC public key, the private key unwraps the DEK.
                  </p>
                </div>

                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-950/60 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {downloading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Decrypt &amp; Download Plaintext
                    </>
                  )}
                </button>
              </>
            )}

            {downloadSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Decryption succeeded! SHA-256 integrity verified.
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-sm">Link invalid or expired.</div>
        )}

        <div className="mt-8 pt-4 border-t border-slate-800 text-center">
          <Link to="/" className="text-xs text-cyan-400 hover:text-cyan-300">
            &larr; Return to SecureVault Home
          </Link>
        </div>
      </div>
    </div>
  );
};
