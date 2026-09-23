import React, { useState, useRef, useEffect } from 'react';
import { X, Check, RotateCcw, Scissors, Eye, Move, Maximize2, Sliders, SunMedium, Compass, Sparkles } from 'lucide-react';
import { cropQuestionFromPageImage, normalizeBoundingBox } from '../../utils/imageCropper';
import { dewarpAndEnhanceImage, DewarpOptions } from '../../utils/imageDewarper';

interface ManualQuestionCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  pagePhoto: string;
  questionNumber: number;
  initialKutu?: [number, number, number, number] | null;
  onSaveCrop: (croppedBase64: string, newKutu: [number, number, number, number]) => void;
}

export const ManualQuestionCropModal: React.FC<ManualQuestionCropModalProps> = ({
  isOpen,
  onClose,
  pagePhoto,
  questionNumber,
  initialKutu,
  onSaveCrop,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Box coordinates in percentage 0 - 100
  const [box, setBox] = useState<{ ymin: number; xmin: number; ymax: number; xmax: number }>({
    ymin: 10,
    xmin: 5,
    ymax: 50,
    xmax: 50,
  });

  // Dewarp & Flattening Settings
  const [dewarpOpts, setDewarpOpts] = useState<DewarpOptions>({
    curvature: 0,
    rotation: 0,
    shadowRemoval: 0,
    contrast: 0,
  });
  const [showDewarpTools, setShowDewarpTools] = useState(false);

  const [previewBase64, setPreviewBase64] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'move' | 'nw' | 'ne' | 'se' | 'sw' | 'draw' | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialBoxOnDrag, setInitialBoxOnDrag] = useState<typeof box>({ ...box });

  // Initialize box from initialKutu
  useEffect(() => {
    if (initialKutu && Array.isArray(initialKutu) && initialKutu.length === 4) {
      let [ymin, xmin, ymax, xmax] = initialKutu;
      const maxVal = Math.max(ymin, xmin, ymax, xmax);
      const scale = maxVal > 100 ? 1000 : (maxVal <= 1.0 ? 1.0 : 100);

      setBox({
        ymin: Math.max(0, Math.min(100, (ymin / scale) * 100)),
        xmin: Math.max(0, Math.min(100, (xmin / scale) * 100)),
        ymax: Math.max(0, Math.min(100, (ymax / scale) * 100)),
        xmax: Math.max(0, Math.min(100, (xmax / scale) * 100)),
      });
    } else {
      // Default: Top-left column
      setBox({
        ymin: 10,
        xmin: 5,
        ymax: 50,
        xmax: 50,
      });
    }
  }, [initialKutu, isOpen]);

  // Update live preview when box or dewarp options change
  useEffect(() => {
    let active = true;
    const generatePreview = async () => {
      if (!pagePhoto) return;
      const kutu100: [number, number, number, number] = [
        Math.min(box.ymin, box.ymax),
        Math.min(box.xmin, box.xmax),
        Math.max(box.ymin, box.ymax),
        Math.max(box.xmin, box.xmax),
      ];

      const rawCropped = await cropQuestionFromPageImage(pagePhoto, kutu100);
      if (!active || !rawCropped) return;

      // Apply Dewarping & Flattening
      const hasDewarp = Math.abs(dewarpOpts.curvature || 0) > 0.5 ||
        Math.abs(dewarpOpts.rotation || 0) > 0.1 ||
        (dewarpOpts.shadowRemoval || 0) > 0 ||
        (dewarpOpts.contrast || 0) > 0;

      if (hasDewarp) {
        try {
          const dewarped = await dewarpAndEnhanceImage(rawCropped, dewarpOpts);
          if (active) setPreviewBase64(dewarped);
        } catch (e) {
          if (active) setPreviewBase64(rawCropped);
        }
      } else {
        if (active) setPreviewBase64(rawCropped);
      }
    };

    const timeout = setTimeout(generatePreview, 80);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [box, pagePhoto, dewarpOpts]);

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent, mode: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'draw') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragMode(mode);
    setStartPoint({ x: e.clientX, y: e.clientY });
    setInitialBoxOnDrag({ ...box });
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    setIsDragging(true);
    setDragMode('draw');
    setStartPoint({ x: e.clientX, y: e.clientY });
    setBox({
      xmin: Math.max(0, Math.min(100, clickX)),
      ymin: Math.max(0, Math.min(100, clickY)),
      xmax: Math.max(0, Math.min(100, clickX + 2)),
      ymax: Math.max(0, Math.min(100, clickY + 2)),
    });
    setInitialBoxOnDrag({
      xmin: clickX,
      ymin: clickY,
      xmax: clickX,
      ymax: clickY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    const deltaX = ((e.clientX - startPoint.x) / rect.width) * 100;
    const deltaY = ((e.clientY - startPoint.y) / rect.height) * 100;

    if (dragMode === 'move') {
      const boxW = initialBoxOnDrag.xmax - initialBoxOnDrag.xmin;
      const boxH = initialBoxOnDrag.ymax - initialBoxOnDrag.ymin;

      let newXmin = Math.max(0, Math.min(100 - boxW, initialBoxOnDrag.xmin + deltaX));
      let newYmin = Math.max(0, Math.min(100 - boxH, initialBoxOnDrag.ymin + deltaY));

      setBox({
        xmin: newXmin,
        ymin: newYmin,
        xmax: newXmin + boxW,
        ymax: newYmin + boxH,
      });
    } else if (dragMode === 'draw') {
      const currentX = ((e.clientX - rect.left) / rect.width) * 100;
      const currentY = ((e.clientY - rect.top) / rect.height) * 100;

      setBox({
        xmin: Math.max(0, Math.min(100, Math.min(initialBoxOnDrag.xmin, currentX))),
        ymin: Math.max(0, Math.min(100, Math.min(initialBoxOnDrag.ymin, currentY))),
        xmax: Math.max(0, Math.min(100, Math.max(initialBoxOnDrag.xmin, currentX))),
        ymax: Math.max(0, Math.min(100, Math.max(initialBoxOnDrag.ymin, currentY))),
      });
    } else if (dragMode === 'se') {
      setBox(prev => ({
        ...prev,
        xmax: Math.max(prev.xmin + 5, Math.min(100, initialBoxOnDrag.xmax + deltaX)),
        ymax: Math.max(prev.ymin + 5, Math.min(100, initialBoxOnDrag.ymax + deltaY)),
      }));
    } else if (dragMode === 'nw') {
      setBox(prev => ({
        ...prev,
        xmin: Math.max(0, Math.min(prev.xmax - 5, initialBoxOnDrag.xmin + deltaX)),
        ymin: Math.max(0, Math.min(prev.ymax - 5, initialBoxOnDrag.ymin + deltaY)),
      }));
    } else if (dragMode === 'ne') {
      setBox(prev => ({
        ...prev,
        xmax: Math.max(prev.xmin + 5, Math.min(100, initialBoxOnDrag.xmax + deltaX)),
        ymin: Math.max(0, Math.min(prev.ymax - 5, initialBoxOnDrag.ymin + deltaY)),
      }));
    } else if (dragMode === 'sw') {
      setBox(prev => ({
        ...prev,
        xmin: Math.max(0, Math.min(prev.xmax - 5, initialBoxOnDrag.xmin + deltaX)),
        ymax: Math.max(prev.ymin + 5, Math.min(100, initialBoxOnDrag.ymax + deltaY)),
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragMode(null);
  };

  const handleSave = () => {
    if (!previewBase64) return;
    const finalKutu: [number, number, number, number] = [
      Math.round(Math.min(box.ymin, box.ymax) * 10),
      Math.round(Math.min(box.xmin, box.xmax) * 10),
      Math.round(Math.max(box.ymin, box.ymax) * 10),
      Math.round(Math.max(box.xmin, box.xmax) * 10),
    ];
    onSaveCrop(previewBase64, finalKutu);
    onClose();
  };

  const setColumnPreset = (col: 'left' | 'right' | 'full', pos: 'top' | 'mid' | 'bot' | 'all') => {
    let xmin = 3;
    let xmax = 48.5;
    if (col === 'right') {
      xmin = 50.5;
      xmax = 97;
    } else if (col === 'full') {
      xmin = 2;
      xmax = 98;
    }

    let ymin = 4;
    let ymax = 96;
    if (pos === 'top') {
      ymin = 4;
      ymax = 48;
    } else if (pos === 'mid') {
      ymin = 25;
      ymax = 75;
    } else if (pos === 'bot') {
      ymin = 48;
      ymax = 96;
    }

    setBox({ xmin, xmax, ymin, ymax });
  };

  const applyAutoFlattenPreset = () => {
    setDewarpOpts({
      curvature: 18,
      rotation: 0,
      shadowRemoval: 35,
      contrast: 25,
    });
    setShowDewarpTools(true);
  };

  const resetDewarp = () => {
    setDewarpOpts({
      curvature: 0,
      rotation: 0,
      shadowRemoval: 0,
      contrast: 0,
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-white">
              Soru {questionNumber} - Kesin Kırpma ve Sayfa Düzleştirme
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDewarpTools(!showDewarpTools)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                showDewarpTools 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Sayfa Kıvrımını Düzelt / Netleştir</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Column Presets Bar */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 text-[11px] font-bold">Hızlı Sütun Seçimi:</span>
            <button
              type="button"
              onClick={() => setColumnPreset('left', 'top')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
            >
              Sol Üst
            </button>
            <button
              type="button"
              onClick={() => setColumnPreset('left', 'bot')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
            >
              Sol Alt
            </button>
            <button
              type="button"
              onClick={() => setColumnPreset('right', 'top')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
            >
              Sağ Üst
            </button>
            <button
              type="button"
              onClick={() => setColumnPreset('right', 'bot')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
            >
              Sağ Alt
            </button>
            <button
              type="button"
              onClick={() => setColumnPreset('full', 'all')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
            >
              Tam Sayfa
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={applyAutoFlattenPreset}
              className="px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Otomatik Kıvrım & Gölge Düzelt</span>
            </button>
          </div>
        </div>

        {/* Dewarping & Flattening Controls Panel (Expandable) */}
        {showDewarpTools && (
          <div className="px-4 py-3 bg-slate-950/90 border-b border-amber-500/30 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs animate-in slide-in-from-top-2 duration-150">
            {/* Curvature (Yaylaşma) Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-semibold">
                <span className="flex items-center gap-1">
                  <span>📐 Kıvrım / Yaylaşma Giderme:</span>
                </span>
                <span className="text-amber-400 font-mono">{dewarpOpts.curvature || 0}</span>
              </div>
              <input
                type="range"
                min="-40"
                max="40"
                value={dewarpOpts.curvature || 0}
                onChange={(e) => setDewarpOpts({ ...dewarpOpts, curvature: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">Kitap içi kıvrılan yay satırlarını düzleştirir</p>
            </div>

            {/* Spine Shadow Removal Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-semibold">
                <span className="flex items-center gap-1">
                  <SunMedium className="w-3 h-3 text-amber-400" />
                  <span>Kıvrım Gölgesi Silme:</span>
                </span>
                <span className="text-amber-400 font-mono">%{dewarpOpts.shadowRemoval || 0}</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={dewarpOpts.shadowRemoval || 0}
                onChange={(e) => setDewarpOpts({ ...dewarpOpts, shadowRemoval: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">Dipte kalan koyu gölgeleri beyazlatır</p>
            </div>

            {/* Contrast / Text Sharpening */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-semibold">
                <span>Metin Netliği & Kontrast:</span>
                <span className="text-amber-400 font-mono">%{dewarpOpts.contrast || 0}</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={dewarpOpts.contrast || 0}
                onChange={(e) => setDewarpOpts({ ...dewarpOpts, contrast: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">Silik yazıları netleştirir</p>
            </div>

            {/* Rotation / Straighten */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-semibold">
                <span className="flex items-center gap-1">
                  <Compass className="w-3 h-3 text-amber-400" />
                  <span>Döndürme / Açı:</span>
                </span>
                <span className="text-amber-400 font-mono">{dewarpOpts.rotation || 0}°</span>
              </div>
              <input
                type="range"
                min="-15"
                max="15"
                step="0.5"
                value={dewarpOpts.rotation || 0}
                onChange={(e) => setDewarpOpts({ ...dewarpOpts, rotation: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={resetDewarp}
                  className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Filtreleri Sıfırla
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workspace Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-3 p-3 sm:p-4 min-h-0 bg-slate-900/50">
          {/* Main Visual Crop Canvas (8 cols) */}
          <div className="md:col-span-8 flex items-center justify-center bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden select-none p-2 max-h-[55vh] md:max-h-none">
            <div 
              ref={containerRef}
              onMouseDown={handleContainerMouseDown}
              className="relative max-w-full max-h-full inline-block cursor-crosshair overflow-hidden shadow-md"
            >
              <img
                ref={imgRef}
                src={pagePhoto.startsWith('data:') ? pagePhoto : `data:image/jpeg;base64,${pagePhoto}`}
                alt="Sayfa"
                className="max-h-[48vh] md:max-h-[58vh] w-auto object-contain block pointer-events-none"
              />

              {/* Crop Box Overlay */}
              <div
                style={{
                  top: `${Math.min(box.ymin, box.ymax)}%`,
                  left: `${Math.min(box.xmin, box.xmax)}%`,
                  width: `${Math.abs(box.xmax - box.xmin)}%`,
                  height: `${Math.abs(box.ymax - box.ymin)}%`,
                }}
                onMouseDown={(e) => handleMouseDown(e, 'move')}
                className="absolute border-2 border-amber-400 bg-amber-400/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] cursor-move transition-colors z-20 group"
              >
                {/* Center Badge */}
                <div className="absolute top-1 left-1 bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.5 rounded shadow-xs pointer-events-none flex items-center gap-1">
                  <Scissors className="w-2.5 h-2.5" />
                  <span>Soru {questionNumber}</span>
                </div>

                {/* Resize Handles */}
                <div
                  onMouseDown={(e) => handleMouseDown(e, 'nw')}
                  className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-amber-400 border border-slate-950 rounded-full cursor-nw-resize z-30"
                />
                <div
                  onMouseDown={(e) => handleMouseDown(e, 'ne')}
                  className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 border border-slate-950 rounded-full cursor-ne-resize z-30"
                />
                <div
                  onMouseDown={(e) => handleMouseDown(e, 'sw')}
                  className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-amber-400 border border-slate-950 rounded-full cursor-sw-resize z-30"
                />
                <div
                  onMouseDown={(e) => handleMouseDown(e, 'se')}
                  className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 border border-slate-950 rounded-full cursor-se-resize z-30"
                />
              </div>
            </div>
          </div>

          {/* Right Preview Side (4 cols) */}
          <div className="md:col-span-4 flex flex-col gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Canlı Düzleştirilmiş Önizleme</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {Math.round(Math.abs(box.xmax - box.xmin))}% × {Math.round(Math.abs(box.ymax - box.ymin))}%
              </span>
            </div>

            <div className="flex-1 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center p-2 overflow-auto min-h-[160px]">
              {previewBase64 ? (
                <img
                  src={previewBase64}
                  alt="Önizleme"
                  className="max-h-[35vh] w-auto object-contain rounded shadow-md border border-slate-700/50"
                />
              ) : (
                <div className="text-slate-500 text-xs text-center">Önizleme oluşturuluyor...</div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!previewBase64}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Kırpılan Görseli Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
