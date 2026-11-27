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
    img.src = previewUrl;
  };

  const handleEmbedAndDownload = async () => {
    setErrorMsg(null);
    setSuccessInfo(null);
    setIsProcessing(true);

    try {
      let baseName = 'stego_carrier';

      if (carrierMode === 'CYBERPUNK') {
        baseName = 'security_vault';
      } else {
        if (!customFile) {
          throw new Error('Please choose a carrier image first.');
        }
        baseName = customFile.name.replace(/\.[^/.]+$/, '');
      }
      const outputFilename = `${baseName}_stego_private_key.png`;

      // Embed key with CRC-32 and spatial LSB
      const stegoBlob = await embedKeyInStegoImage(privateKey, carrierMode === 'CUSTOM' ? customFile : null);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-slate-200/90 rounded-2xl shadow-xl p-6 relative text-slate-800 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Conceal Private Key in Stego Carrier Image
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Spatial LSB Steganography &bull; IEEE 802.3 CRC-32 Framing &bull; Zero-Knowledge
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Carrier Mode Selection Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold mt-5">
          <button
            type="button"
            onClick={() => setCarrierMode('CUSTOM')}
            className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              carrierMode === 'CUSTOM'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Choose My Own Image (Recommended)
          </button>
          <button
            type="button"
            onClick={() => setCarrierMode('CYBERPUNK')}
            className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              carrierMode === 'CYBERPUNK'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate Security Canvas
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
                  ? 'border-blue-500 bg-blue-50/40'
                  : 'border-slate-200 hover:border-blue-500 bg-slate-50'
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
                      className="w-28 h-28 object-cover rounded-xl border border-slate-200 shadow-xs"
                    />
                    <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity text-xs text-white font-medium">
                      Change Image
                    </div>
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-xs truncate">
                        {customFile?.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-mono">
                        {customFile ? (customFile.size / 1024).toFixed(1) + ' KB' : ''}
                      </span>
                    </div>

                    {capacityInfo && (
                      <div className="text-[11px] font-mono text-slate-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Dimensions:</span>
                          <span className="text-slate-800">
                            {capacityInfo.width} &times; {capacityInfo.height} px ({capacityInfo.totalPixels.toLocaleString()} pixels)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Carrier Capacity:</span>
                          <span className="text-emerald-700 font-semibold">
                            {(capacityInfo.availableBytes / 1024).toFixed(1)} KB available
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Key Payload:</span>
                          <span className="text-blue-700 font-semibold">
                            {capacityInfo.requiredBytes} bytes (~{capacityInfo.utilizationPercentage.toFixed(3)}% utilization)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 shadow-xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-900">
                    Choose or Drag &amp; Drop Any Image from Your Computer
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">
                    Accepts photos, wallpapers, logos, artwork (.png, .jpg, .jpeg, .webp, .bmp)
                  </span>
                </div>
              )}
            </div>

            {/* Capacity Status Badge */}
            {capacityInfo && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Carrier Capacity Verified &bull; Human-Imperceptible LSB Modification (&plusmn;1 pixel delta)</span>
                </div>
                <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                  READY
                </span>
              </div>
            )}
          </div>
        )}

        {/* Mode 2: Security Canvas */}
        {carrierMode === 'CYBERPUNK' && (
          <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-center">
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-slate-100 flex flex-col items-center justify-center p-2 shadow-xs relative overflow-hidden">
                <Sparkles className="w-6 h-6 text-blue-600 mb-1 relative z-10" />
                <span className="text-[10px] text-blue-700 uppercase tracking-wider relative z-10 font-bold">
                  Security Grid
                </span>
                <span className="text-[9px] text-slate-500 relative z-10 font-mono">
                  256 &times; 256 px
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-700 font-medium">
              Auto-generates a clean cybersecurity pattern canvas with mathematical gradients.
            </p>
            <p className="text-[11px] text-slate-500">
              Dimensions: 256&times;256 px &bull; Lossless PNG output &bull; Embedded CRC-32 integrity frame
            </p>
          </div>
        )}

        {/* Information Callout */}
        <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-slate-800 font-semibold">Why is the output always saved as a lossless PNG?</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Steganography alters the least significant bit (LSB) of pixel channels. Lossy formats like JPEG recompress pixels and destroy subtle bits. PNG preserves every bit with 100% mathematical fidelity.
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successInfo && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successInfo}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleEmbedAndDownload}
            disabled={isProcessing || (carrierMode === 'CUSTOM' && !customFile)}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-5 text-xs font-semibold rounded-xl shadow-xs shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Download className="w-4 h-4 text-white" />
            )}
            {isProcessing ? 'Concealing Private Key...' : 'Embed Key & Download Stego PNG'}
          </button>
        </div>
      </div>
    </div>
  );
};
