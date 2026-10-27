import React, { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Shield,
  Eye,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  embedKeyInStegoImage,
  downloadBlob,
  inspectCarrierCapacity,
  CarrierCapacityInfo,
  createCyberpunkCanvas,
} from '../../utils/steganography';

interface StegoKeyBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  privateKey: string;
  userEmail?: string;
}

export const StegoKeyBackupModal: React.FC<StegoKeyBackupModalProps> = ({
  isOpen,
  onClose,
  privateKey,
  userEmail,
}) => {
  const [carrierMode, setCarrierMode] = useState<'CUSTOM' | 'CYBERPUNK'>('CUSTOM');
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [capacityInfo, setCapacityInfo] = useState<CarrierCapacityInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  // Reset state when opening or closing
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessInfo(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedImage(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processSelectedImage(file);
  };

  const processSelectedImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, JPEG, WebP, BMP).');
      return;
    }

    setErrorMsg(null);
    setSuccessInfo(null);
    setCustomFile(file);

    if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);

    // Load image to determine resolution and capacity
    const img = new Image();
    img.onload = () => {
      const cap = inspectCarrierCapacity(img.width, img.height, privateKey);
      setCapacityInfo(cap);
    };
    img.onerror = () => {
      setErrorMsg('Could not read image dimensions. Please choose another image.');
    };
    img.src = previewUrl;
  };

  const handleEmbedAndDownload = async () => {
    if (!privateKey) {
      setErrorMsg('No private key available in session to conceal.');
      return;
    }

    if (carrierMode === 'CUSTOM' && !customFile) {
      setErrorMsg('Please select or drop an image from your computer first.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg(null);
      setSuccessInfo(null);

      // Embed key into custom carrier file or default cyberpunk canvas
      const carrierFile = carrierMode === 'CUSTOM' ? customFile : null;
      const stegoBlob = await embedKeyInStegoImage(privateKey, carrierFile);

      // Determine clean filename
      let baseName = userEmail ? userEmail.split('@')[0] : 'user';
      if (carrierMode === 'CUSTOM' && customFile) {
        baseName = customFile.name.replace(/\.[^/.]+$/, '');
      }
      const outputFilename = `${baseName}_stego_private_key.png`;

      // Trigger lossless PNG download
      downloadBlob(stegoBlob, outputFilename);

      setSuccessInfo(
        `Private key successfully concealed into '${outputFilename}' via Spatial LSB! CRC-32 integrity verified.`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to embed private key into the carrier image.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#091224] border border-cyan-500/30 rounded-2xl shadow-2xl p-6 relative text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-emerald-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/25 rounded-xl text-cyan-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Conceal Private Key in Stego Carrier Image
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Spatial LSB Steganography &bull; IEEE 802.3 CRC-32 Framing &bull; Zero-Knowledge
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Carrier Mode Selection Tabs */}
        <div className="flex border-b border-emerald-950/40 mt-5">
          <button
            type="button"
            onClick={() => setCarrierMode('CUSTOM')}
            className={`py-2 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              carrierMode === 'CUSTOM'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Choose My Own Image (Recommended)
          </button>
          <button
            type="button"
            onClick={() => setCarrierMode('CYBERPUNK')}
            className={`py-2 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              carrierMode === 'CYBERPUNK'
                ? 'border-emerald-400 text-emerald-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate Cyberpunk Canvas
          </button>
        </div>

        {/* Mode 1: Custom Image Upload */}
        {carrierMode === 'CUSTOM' && (
          <div className="mt-4 space-y-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-xl text-center transition-all cursor-pointer ${
                customFile
                  ? 'border-cyan-500/60 bg-cyan-500/5'
                  : 'border-slate-800 hover:border-cyan-500/40 bg-black/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp"
                onChange={handleFileChange}
                className="hidden"
              />

              {imagePreviewUrl ? (
                <div className="flex flex-col sm:flex-row items-center gap-4 text-left">
                  <div className="relative group shrink-0">
                    <img
                      src={imagePreviewUrl}
                      alt="Carrier Preview"
                      className="w-28 h-28 object-cover rounded-xl border border-cyan-500/30 shadow-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity text-[10px] text-cyan-300 font-mono">
                      Change Image
                    </div>
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs truncate">
                        {customFile?.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono">
                        {customFile ? (customFile.size / 1024).toFixed(1) + ' KB' : ''}
                      </span>
                    </div>

                    {capacityInfo && (
                      <div className="text-[11px] font-mono text-slate-400 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Dimensions:</span>
                          <span className="text-slate-200">
                            {capacityInfo.width} &times; {capacityInfo.height} px ({capacityInfo.totalPixels.toLocaleString()} pixels)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Carrier Capacity:</span>
                          <span className="text-emerald-400">
                            {(capacityInfo.availableBytes / 1024).toFixed(1)} KB available
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Key Payload:</span>
                          <span className="text-amber-300">
                            {capacityInfo.requiredBytes} bytes (~{capacityInfo.utilizationPercentage.toFixed(3)}% utilization)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-4">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-white">
                    Choose or Drag &amp; Drop Any Image from Your Computer
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Accepts photos, wallpapers, logos, artwork (.png, .jpg, .jpeg, .webp, .bmp)
                  </span>
                </div>
              )}
            </div>

            {/* Capacity Status Badge */}
            {capacityInfo && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Carrier Capacity Verified &bull; Human-Imperceptible LSB Modification (&plusmn;1 pixel delta)</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded font-bold">
                  READY
                </span>
              </div>
            )}
          </div>
        )}

        {/* Mode 2: Cyberpunk Default Canvas */}
        {carrierMode === 'CYBERPUNK' && (
          <div className="mt-4 p-4 bg-black/40 border border-emerald-950/40 rounded-xl space-y-3 text-center">
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-[#060b14] via-[#0b192c] to-[#052e25] flex flex-col items-center justify-center p-2 shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:12px_12px]" />
                <Sparkles className="w-6 h-6 text-emerald-400 mb-1 relative z-10" />
                <span className="text-[9px] font-mono text-emerald-300 uppercase tracking-wider relative z-10 font-bold">
                  Cyberpunk Grid
                </span>
                <span className="text-[8px] font-mono text-slate-400 relative z-10">
                  256 &times; 256 px
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300">
              Auto-generates a futuristic cybersecurity grid canvas with mathematical circuits and geometric crosshairs.
            </p>
            <p className="text-[11px] font-mono text-slate-400">
              Dimensions: 256&times;256 px &bull; Lossless PNG output &bull; Embedded CRC-32 integrity frame
            </p>
          </div>
        )}

        {/* Information Callout */}
        <div className="mt-4 p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-slate-300 font-medium">Why is the output always saved as a lossless PNG?</p>
            <p className="text-[11px] leading-relaxed">
              Steganography alters the least significant bit (LSB) of pixel channels. Lossy formats like JPEG recompress pixels and destroy subtle bits. PNG preserves every bit with 100% mathematical fidelity.
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successInfo && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successInfo}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-emerald-950/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleEmbedAndDownload}
            disabled={isProcessing || (carrierMode === 'CUSTOM' && !customFile)}
            className="sec-btn-emerald py-2 px-5 text-xs font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <Download className="w-4 h-4 text-slate-950" />
            )}
            {isProcessing ? 'Concealing Private Key...' : 'Embed Key & Download Stego PNG'}
          </button>
        </div>
      </div>
    </div>
  );
};
