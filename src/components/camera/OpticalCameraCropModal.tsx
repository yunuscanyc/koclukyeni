import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, 
  X, 
  RotateCw, 
  RotateCcw, 
  Check, 
  RefreshCw, 
  SwitchCamera, 
  AlertCircle, 
  Crop,
  Maximize2,
  Sparkles,
  Layers,
  CheckCircle2,
  Upload
} from 'lucide-react';

interface OpticalCameraCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCropped: (croppedBase64: string) => void;
  initialImage?: string | null;
}

export const OpticalCameraCropModal: React.FC<OpticalCameraCropModalProps> = ({
  isOpen,
  onClose,
  onPhotoCropped,
  initialImage = null,
}) => {
  // Mode: 'camera' or 'crop'
  const [mode, setMode] = useState<'camera' | 'crop'>(initialImage ? 'crop' : 'camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(initialImage || null);

  // Camera States
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const nativeFileInputRef = useRef<HTMLInputElement>(null);

  // Crop & Transform States
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  // Normalized crop percentages (0 to 100)
  const [crop, setCrop] = useState<{ x1: number; y1: number; x2: number; y2: number }>({
    x1: 6,
    y1: 6,
    x2: 94,
    y2: 94,
  });

  // Dragging state
  const [activeHandle, setActiveHandle] = useState<'topLeft' | 'bottomRight' | 'box' | null>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; initialCrop: typeof crop }>({
    clientX: 0,
    clientY: 0,
    initialCrop: crop,
  });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Stop camera tracks helper
  const stopCameraStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Initialize camera stream
  const startCameraStream = useCallback(async () => {
    stopCameraStream();
    setCameraError(null);
    setIsCameraLoading(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tarayıcınız doğrudan kamera erişimini desteklemiyor.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: cameraFacing },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('[Camera Access Warning]:', err);
      let msg = 'Kameraya erişilemedi. Lütfen kamera izinlerini kontrol ediniz.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Kamera izni verilmedi. Lütfen tarayıcı ayarlarından kameraya izin verin.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'Kullanılabilir kamera bulunamadı.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Kamera başka bir uygulama tarafından kullanılıyor olabilir.';
      }
      setCameraError(msg);
    } finally {
      setIsCameraLoading(false);
    }
  }, [cameraFacing, stopCameraStream]);

  // Sync mode with initialImage and open state
  useEffect(() => {
    if (isOpen) {
      if (initialImage) {
        setCapturedImage(initialImage);
        setMode('crop');
        setRotation(0);
        setCrop({ x1: 6, y1: 6, x2: 94, y2: 94 });
      } else {
        setMode('camera');
        setCapturedImage(null);
        setRotation(0);
        setCrop({ x1: 6, y1: 6, x2: 94, y2: 94 });
        startCameraStream();
      }
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen, initialImage, startCameraStream, stopCameraStream]);

  // Switch camera facing mode
  const handleToggleCameraFacing = () => {
    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Re-start camera when facingMode changes in camera mode
  useEffect(() => {
    if (isOpen && mode === 'camera') {
      startCameraStream();
    }
  }, [cameraFacing, isOpen, mode, startCameraStream]);

  // Snap photo from live video feed
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const videoWidth = video.videoWidth || 1280;
    const videoHeight = video.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
    const snapDataUrl = canvas.toDataURL('image/jpeg', 0.95);

    // Stop video stream and transition to crop mode
    stopCameraStream();
    setCapturedImage(snapDataUrl);
    setMode('crop');
    setRotation(0);
    setCrop({ x1: 6, y1: 6, x2: 94, y2: 94 });
  };

  // Fallback upload through native camera input
  const handleNativeFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        stopCameraStream();
        setCapturedImage(dataUrl);
        setMode('crop');
        setRotation(0);
        setCrop({ x1: 6, y1: 6, x2: 94, y2: 94 });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Retake photo: go back to camera mode
  const handleRetake = () => {
    setCapturedImage(null);
    setMode('camera');
    setRotation(0);
    startCameraStream();
  };

  // Rotate photo 90 degrees
  const handleRotate = (direction: 'cw' | 'ccw') => {
    setRotation((prev) => {
      if (direction === 'cw') return (prev + 90) % 360;
      return (prev - 90 + 360) % 360;
    });
  };

  // Drag interaction for Top-Left and Bottom-Right handles
  const handlePointerDown = (
    e: React.PointerEvent | React.TouchEvent | React.MouseEvent,
    handleType: 'topLeft' | 'bottomRight' | 'box'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    setActiveHandle(handleType);
    dragStartRef.current = {
      clientX,
      clientY,
      initialCrop: { ...crop },
    };
  };

  useEffect(() => {
    if (!activeHandle) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!imageContainerRef.current) return;
      const rect = imageContainerRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const deltaXPercent = ((clientX - dragStartRef.current.clientX) / rect.width) * 100;
      const deltaYPercent = ((clientY - dragStartRef.current.clientY) / rect.height) * 100;

      const { initialCrop } = dragStartRef.current;
      const MIN_BOX_PERCENT = 12;

      setCrop((prev) => {
        let { x1, y1, x2, y2 } = initialCrop;

        if (activeHandle === 'topLeft') {
          // Sol üst tutamaç
          x1 = Math.max(0, Math.min(x2 - MIN_BOX_PERCENT, x1 + deltaXPercent));
          y1 = Math.max(0, Math.min(y2 - MIN_BOX_PERCENT, y1 + deltaYPercent));
          return { x1: Number(x1.toFixed(2)), y1: Number(y1.toFixed(2)), x2, y2 };
        }

        if (activeHandle === 'bottomRight') {
          // Sağ alt tutamaç
          x2 = Math.min(100, Math.max(x1 + MIN_BOX_PERCENT, x2 + deltaXPercent));
          y2 = Math.min(100, Math.max(y1 + MIN_BOX_PERCENT, y2 + deltaYPercent));
          return { x1, y1, x2: Number(x2.toFixed(2)), y2: Number(y2.toFixed(2)) };
        }

        if (activeHandle === 'box') {
          // Kırpma kutusunu tamamen kaydır
          const boxWidth = x2 - x1;
          const boxHeight = y2 - y1;
          let newX1 = x1 + deltaXPercent;
          let newY1 = y1 + deltaYPercent;

          if (newX1 < 0) newX1 = 0;
          if (newX1 + boxWidth > 100) newX1 = 100 - boxWidth;
          if (newY1 < 0) newY1 = 0;
          if (newY1 + boxHeight > 100) newY1 = 100 - boxHeight;

          return {
            x1: Number(newX1.toFixed(2)),
            y1: Number(newY1.toFixed(2)),
            x2: Number((newX1 + boxWidth).toFixed(2)),
            y2: Number((newY1 + boxHeight).toFixed(2)),
          };
        }

        return prev;
      });
    };

    const handlePointerUp = () => {
      setActiveHandle(null);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
    window.addEventListener('touchcancel', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('touchcancel', handlePointerUp);
    };
  }, [activeHandle]);

  // Crop & Produce Final Base64
  const handleCropAndUse = async () => {
    if (!capturedImage) return;

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Fotoğraf işlenirken hata oluştu.'));
        img.src = capturedImage;
      });

      // Handle orientation rotation if user rotated the image
      const srcCanvas = document.createElement('canvas');
      const srcCtx = srcCanvas.getContext('2d');
      if (!srcCtx) return;

      const isRotated90or270 = rotation === 90 || rotation === 270;
      srcCanvas.width = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
      srcCanvas.height = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

      srcCtx.save();
      srcCtx.translate(srcCanvas.width / 2, srcCanvas.height / 2);
      srcCtx.rotate((rotation * Math.PI) / 180);
      srcCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      srcCtx.restore();

      // Calculate slice bounds based on percentage crop
      const fullW = srcCanvas.width;
      const fullH = srcCanvas.height;

      const px1 = Math.max(0, Math.floor((crop.x1 / 100) * fullW));
      const py1 = Math.max(0, Math.floor((crop.y1 / 100) * fullH));
      const px2 = Math.min(fullW, Math.ceil((crop.x2 / 100) * fullW));
      const py2 = Math.min(fullH, Math.ceil((crop.y2 / 100) * fullH));

      const cropWidth = Math.max(50, px2 - px1);
      const cropHeight = Math.max(50, py2 - py1);

      // Optimal resolution clamp for OCR text clarity and lightning-fast upload (~200KB - 400KB)
      const MAX_W = 1200;
      const MAX_H = 1600;
      let targetW = cropWidth;
      let targetH = cropHeight;

      if (targetW > MAX_W || targetH > MAX_H) {
        const scale = Math.min(MAX_W / targetW, MAX_H / targetH);
        targetW = Math.max(1, Math.round(targetW * scale));
        targetH = Math.max(1, Math.round(targetH * scale));
      }

      const targetCanvas = document.createElement('canvas');
      targetCanvas.width = targetW;
      targetCanvas.height = targetH;
      const targetCtx = targetCanvas.getContext('2d');
      if (!targetCtx) return;

      targetCtx.imageSmoothingEnabled = true;
      targetCtx.imageSmoothingQuality = 'high';

      // Draw cropped slice onto targetCanvas
      targetCtx.drawImage(
        srcCanvas,
        px1,
        py1,
        cropWidth,
        cropHeight,
        0,
        0,
        targetW,
        targetH
      );

      // Clean compression: 0.85 quality produces crisp mathematical formulas and compact ~200-350 KB size
      const finalCroppedBase64 = targetCanvas.toDataURL('image/jpeg', 0.85);
      onPhotoCropped(finalCroppedBase64);
      onClose();
    } catch (err) {
      console.error('Kırpma işlemi başarısız:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none font-sans">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-white relative">
        
        {/* Hidden Fallback Input */}
        <input
          ref={nativeFileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleNativeFallback}
        />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90 backdrop-blur-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-950/50">
              {mode === 'camera' ? <Camera className="w-5 h-5" /> : <Crop className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
                <span>{mode === 'camera' ? 'Optik Sınav Fotoğrafı Çek' : 'Fotoğrafı Kırp & Kenarları Temizle'}</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {mode === 'camera' ? 'Kamera' : 'Kırpma'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {mode === 'camera'
                  ? 'Test sayfasını çerçeve içine hizalayın ve net bir fotoğraf çekin.'
                  : 'Sol üst ve sağ alt tutamaçları sürükleyerek fazlalık boşlukları kırpın.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-slate-950 p-3 sm:p-4 min-h-[380px] max-h-[68vh]">
          {/* CAMERA MODE */}
          {mode === 'camera' && (
            <div className="relative w-full h-full max-h-[580px] rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-slate-800">
              {/* Video Element */}
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`w-full h-full object-contain ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Optical Framing Overlay Guides */}
              <div className="absolute inset-4 sm:inset-8 pointer-events-none border-2 border-indigo-500/40 rounded-2xl flex flex-col justify-between p-3">
                {/* 4 Corner Markers */}
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-t-3 border-l-3 border-indigo-400 rounded-tl-lg" />
                  <div className="w-6 h-6 border-t-3 border-r-3 border-indigo-400 rounded-tr-lg" />
                </div>
                <div className="text-center">
                  <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-[11px] font-bold text-indigo-200 border border-indigo-500/30 shadow-sm inline-flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>Soru sayfasını kılavuzun içine hizalayın</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-b-3 border-l-3 border-indigo-400 rounded-bl-lg" />
                  <div className="w-6 h-6 border-b-3 border-r-3 border-indigo-400 rounded-br-lg" />
                </div>
              </div>

              {/* Loading Indicator */}
              {isCameraLoading && (
                <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                  <span className="text-xs text-slate-300 font-semibold">Kamera başlatılıyor...</span>
                </div>
              )}

              {/* Camera Error Display */}
              {cameraError && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h4 className="text-sm font-bold text-white">Kamera Açılamadı</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{cameraError}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
                    <button
                      onClick={startCameraStream}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Tekrar Dene</span>
                    </button>
                    <button
                      onClick={() => nativeFileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Fotoğraf Yükle</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Camera Flip Action */}
              {!cameraError && !isCameraLoading && (
                <button
                  type="button"
                  onClick={handleToggleCameraFacing}
                  className="absolute top-4 right-4 p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 text-slate-200 border border-slate-700/60 backdrop-blur-md shadow-lg transition-transform active:scale-95 cursor-pointer"
                  title="Ön/Arka Kamera Değiştir"
                >
                  <SwitchCamera className="w-5 h-5 text-indigo-300" />
                </button>
              )}
            </div>
          )}

          {/* CROP MODE */}
          {mode === 'crop' && capturedImage && (
            <div className="relative w-full h-full max-h-[580px] flex items-center justify-center overflow-hidden">
              <div
                ref={imageContainerRef}
                className="relative inline-block max-w-full max-h-full rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-black"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease-out',
                }}
              >
                {/* Photo Element */}
                <img
                  src={capturedImage}
                  alt="Çekilen Test Fotoğrafı"
                  className="max-h-[55vh] sm:max-h-[58vh] w-auto object-contain block pointer-events-none"
                  draggable={false}
                />

                {/* Darkened Mask Outside Crop Box */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `linear-gradient(to right, rgba(2, 6, 23, 0.65) ${crop.x1}%, transparent ${crop.x1}%, transparent ${crop.x2}%, rgba(2, 6, 23, 0.65) ${crop.x2}%)`,
                  }}
                />
                {/* Top Overlay */}
                <div
                  className="absolute top-0 inset-x-0 pointer-events-none bg-slate-950/65"
                  style={{ height: `${crop.y1}%` }}
                />
                {/* Bottom Overlay */}
                <div
                  className="absolute bottom-0 inset-x-0 pointer-events-none bg-slate-950/65"
                  style={{ height: `${100 - crop.y2}%` }}
                />

                {/* Interactive Crop Rectangle Box */}
                <div
                  onMouseDown={(e) => handlePointerDown(e, 'box')}
                  onTouchStart={(e) => handlePointerDown(e, 'box')}
                  className="absolute border-2 border-indigo-400 bg-indigo-500/10 cursor-move transition-shadow"
                  style={{
                    left: `${crop.x1}%`,
                    top: `${crop.y1}%`,
                    width: `${crop.x2 - crop.x1}%`,
                    height: `${crop.y2 - crop.y1}%`,
                    boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.55)',
                  }}
                >
                  {/* Grid Lines (Rule of thirds) */}
                  <div className="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none">
                    <div className="border-r border-b border-indigo-300/30" />
                    <div className="border-r border-b border-indigo-300/30" />
                    <div className="border-b border-indigo-300/30" />
                    <div className="border-r border-b border-indigo-300/30" />
                    <div className="border-r border-b border-indigo-300/30" />
                    <div className="border-b border-indigo-300/30" />
                    <div className="border-r border-indigo-300/30" />
                    <div className="border-r border-indigo-300/30" />
                    <div />
                  </div>

                  {/* SOL ÜST TUTAMAÇ (Top-Left Handle) - USER REQUESTED */}
                  <div
                    onMouseDown={(e) => handlePointerDown(e, 'topLeft')}
                    onTouchStart={(e) => handlePointerDown(e, 'topLeft')}
                    className="absolute -top-3.5 -left-3.5 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 border-2 border-white shadow-xl shadow-indigo-950/80 cursor-nwse-resize flex items-center justify-center active:scale-110 transition-transform touch-none z-20 group"
                    title="Sol Üst Tutamaç: Boşluğu ayarlamak için sürükleyin"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-white group-hover:scale-125 transition-transform" />
                    <div className="absolute -top-7 -left-1 px-1.5 py-0.5 rounded bg-slate-900/90 text-white text-[9px] font-black uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-700">
                      Sol Üst
                    </div>
                  </div>

                  {/* SAĞ ALT TUTAMAÇ (Bottom-Right Handle) - USER REQUESTED */}
                  <div
                    onMouseDown={(e) => handlePointerDown(e, 'bottomRight')}
                    onTouchStart={(e) => handlePointerDown(e, 'bottomRight')}
                    className="absolute -bottom-3.5 -right-3.5 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 border-2 border-white shadow-xl shadow-indigo-950/80 cursor-nwse-resize flex items-center justify-center active:scale-110 transition-transform touch-none z-20 group"
                    title="Sağ Alt Tutamaç: Boşluğu ayarlamak için sürükleyin"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-white group-hover:scale-125 transition-transform" />
                    <div className="absolute -bottom-7 -right-1 px-1.5 py-0.5 rounded bg-slate-900/90 text-white text-[9px] font-black uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-700">
                      Sağ Alt
                    </div>
                  </div>

                  {/* Corner Accent Visuals */}
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-indigo-300 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-indigo-300 pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer & Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/95 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {mode === 'camera' ? (
            /* Camera Mode Actions */
            <div className="w-full flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => nativeFileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-700/60"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Galeriden Seç</span>
              </button>

              {/* Big Shutter Button */}
              <button
                type="button"
                onClick={handleCapturePhoto}
                disabled={Boolean(cameraError) || isCameraLoading}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-black transition-all shadow-lg shadow-indigo-900/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5 cursor-pointer ring-4 ring-indigo-500/20"
              >
                <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
                <span>Fotoğrafı Çek</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                Vazgeç
              </button>
            </div>
          ) : (
            /* Crop Mode Actions with "Kırp ve Kullan" button */
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Rotate and Reset Controls */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={() => handleRotate('ccw')}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Sola Döndür (90°)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRotate('cw')}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Sağa Döndür (90°)"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCrop({ x1: 2, y1: 2, x2: 98, y2: 98 })}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Tüm Sayfayı Seç"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tamamı</span>
                </button>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Yeniden Fotoğraf Çek"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Yeniden Çek</span>
                </button>
              </div>

              {/* USER REQUESTED PRIMARY BUTTON: "Kırp ve Kullan" */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    stopCameraStream();
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  İptal
                </button>

                <button
                  type="button"
                  onClick={handleCropAndUse}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer ring-2 ring-emerald-400/30"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                  <span>Kırp ve Kullan</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
