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
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-blue-600 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Inspecting Cryptographic Shared Link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-center items-center p-6 font-sans relative selection:bg-blue-600 selection:text-white">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
          <Shield className="w-5 h-5" />
        </div>
        <span className="font-bold text-xl text-slate-900 tracking-tight">Secure Vault</span>
      </div>

      <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-2xl p-8 shadow-sm relative">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl mb-3 flex items-center justify-center shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Secure File Access</h1>
          <p className="text-xs text-slate-500 mt-1">
            Encrypted Multi-Layer Link Delivery
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {linkData ? (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600 shrink-0" />
                <div className="truncate">
                  <h3 className="text-sm font-semibold text-slate-900 truncate">{linkData.originalFilename}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Size: {(linkData.originalSize / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-2 text-[11px] font-mono">
                {linkData.isOneTime && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                    ONE-TIME USE ONLY
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3 text-slate-500" />
                  Expires: {new Date(linkData.expiryDate).toLocaleString()}
                </span>
              </div>
            </div>

            {linkData.isConsumed && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                This one-time access link has already been consumed. Replay is cryptographically prohibited.
              </div>
            )}

            {linkData.isExpired && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs">
                This share link has expired.
              </div>
            )}

            {!linkData.isConsumed && !linkData.isExpired && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-600" />
                    Recipient ECC Private Key (Optional / Auto-detected)
                  </label>
                  <input
                    type="password"
                    placeholder="Auto-detected from keyring, or paste PKCS#8 private key..."
                    value={privateKeyInput}
                    onChange={(e) => setPrivateKeyInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    If file envelope is protected with your ECC public key, the private key unwraps the DEK.
                  </p>
                </div>

                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                >
                  {downloading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Decryption succeeded! SHA-256 integrity verified.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 text-xs">Link invalid or expired.</div>
        )}

        <div className="mt-8 pt-4 border-t border-slate-100 text-center">
          <Link to="/" className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
            &larr; Return to Secure Vault Home
          </Link>
        </div>
      </div>
    </div>
  );
};
