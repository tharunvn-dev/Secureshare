import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Shield,
  X,
  FileCheck,
} from 'lucide-react';
import { api, getErrorMessage } from '../../api/client';
import { calculateFileSha256 } from '../../utils/crypto';
import { StoredFile } from '../../types';

export const UserUpload: React.FC = () => {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<File | null>(null);
  const [useSteganography, setUseSteganography] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const [uploading, setUploading] = useState(false);
  const [uploadedResult, setUploadedResult] = useState<StoredFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setError(null);
      setUploadedResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setError(null);
      setUploadedResult(null);
    }
  };

  const handleCarrierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const carrier = e.target.files[0];
      if (!carrier.name.toLowerCase().endsWith('.png')) {
        setError('Carrier image must be a lossless PNG image (.png)');
        return;
      }
      setSelectedCarrier(carrier);
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (selectedCarrier && useSteganography) {
        formData.append('carrier', selectedCarrier);
        formData.append('carrierImage', selectedCarrier);
      }

      const response = await api.post<StoredFile>('/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadedResult(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setSelectedCarrier(null);
    setError(null);
    setUploadedResult(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Upload File Card (matching Screen 7 from Design System) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between pb-5 border-b border-slate-100">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Upload File</h1>
            <p className="text-xs text-slate-500 mt-0.5">Encrypt and store your files securely in the vault</p>
          </div>
          <button
            onClick={() => navigate('/app/files')}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {uploadedResult && (
          <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>File uploaded and encrypted successfully!</span>
            </div>
            <p className="text-[11px] text-emerald-600">
              Encrypted under AES-256-GCM authenticated cipher with SHA-256 integrity seal.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => navigate('/app/files')}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-medium text-xs hover:bg-emerald-700 transition-colors"
              >
                View in My Files &rarr;
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-emerald-700 font-medium hover:underline text-xs"
              >
                Upload Another
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleUpload} className="mt-6 space-y-6">
          {/* Large Dashed Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-2xl p-8 sm:p-12 text-center bg-blue-50/20 hover:bg-blue-50/40 transition-colors cursor-pointer relative"
          >
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-xs">
                <UploadCloud className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                Drag &amp; drop your file here
              </p>
              <p className="text-xs text-blue-600 font-medium mt-1">or click to browse</p>
              <p className="text-[11px] text-slate-400 mt-3">Maximum file size: 50 MB</p>
            </div>
          </div>

          {/* Selected File Preview Box (matching Screen 7) */}
          {selectedFile && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 truncate max-w-xs">{selectedFile.name}</p>
                  <p className="text-[11px] text-slate-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ready to upload</span>
              </div>
            </div>
          )}

          {/* Optional Advanced Toggle for LSB Stego */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <span>{showAdvanced ? '▾ Hide' : '▸ Show'} Advanced Cryptography Options</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">LSB Steganographic Carrier</p>
                    <p className="text-[11px] text-slate-500">Conceal file encryption keys invisibly inside a PNG carrier image</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={useSteganography}
                    onChange={(e) => setUseSteganography(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                </div>

                {useSteganography && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Select PNG Carrier Image (.png)
                    </label>
                    <input
                      type="file"
                      accept=".png"
                      onChange={handleCarrierChange}
                      className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {selectedCarrier && (
                      <p className="text-[11px] text-emerald-600 mt-1">Carrier loaded: {selectedCarrier.name}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons (matching Screen 7: Blue Upload, White Cancel) */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm shadow-blue-500/25 transition-all text-xs disabled:opacity-50"
            >
              {uploading ? 'Encrypting & Uploading...' : 'Upload'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-200 rounded-xl transition-all text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
