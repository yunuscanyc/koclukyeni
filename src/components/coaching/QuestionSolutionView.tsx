import React, { useState, useMemo } from 'react';
import { 
  Lightbulb, 
  Edit3, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Sparkles, 
  BookOpen, 
  Target, 
  Layers, 
  FileText,
  HelpCircle,
  Maximize2,
  Camera,
  Scissors
} from 'lucide-react';
import { MathRenderer, parseStructuredSolution } from '../common/MathRenderer';
import { ManualQuestionCropModal } from './ManualQuestionCropModal';

interface QuestionSolutionViewProps {
  cozumDetayi?: string;
  unite?: string;
  konu?: string;
  ders?: string;
  soruNo?: number;
  soruTuru?: 'coktan_secmeli' | 'bosluk_doldurma' | 'acik_uclu' | 'klasik' | 'dogru_yanlis';
  kazanimKodu?: string;
  kazanimAciklama?: string;
  dogruCevap?: string;
  ogrenciCevabi?: string;
  dogruMu?: boolean;
  durum?: 'dogru' | 'yanlis' | 'bos';
  canEdit?: boolean;
  onSaveSolution?: (newSolution: string) => void;
  defaultExpanded?: boolean;
  soruFotografYolu?: string;
  pagePhoto?: string;
  kutu?: [number, number, number, number];
  onSaveCrop?: (croppedBase64: string, newKutu: [number, number, number, number]) => void;
}

export const QuestionSolutionView: React.FC<QuestionSolutionViewProps> = ({
  cozumDetayi = '',
  unite,
  konu,
  ders,
  soruNo,
  soruTuru = 'coktan_secmeli',
  kazanimKodu,
  kazanimAciklama,
  dogruCevap,
  ogrenciCevabi,
  dogruMu,
  durum,
  canEdit = false,
  onSaveSolution,
  defaultExpanded = false,
  soruFotografYolu,
  pagePhoto,
  kutu,
  onSaveCrop,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showCroppedModal, setShowCroppedModal] = useState(false);
  const [showManualCropModal, setShowManualCropModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(cozumDetayi);
  const [viewMode, setViewMode] = useState<'cards' | 'board'>('cards');
  const [isLargeText, setIsLargeText] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync state if prop changes
  React.useEffect(() => {
    setEditText(cozumDetayi);
  }, [cozumDetayi]);

  const hasSolution = Boolean(cozumDetayi && cozumDetayi.trim().length > 0);
  
  // Single source of truth for empty/blank questions:
  // If dogruMu is explicitly true, or durum is explicitly 'dogru', the question was solved correctly and is NEVER blank!
  const isActuallyDogru = Boolean(dogruMu) || durum === 'dogru';
  const isBlank = !isActuallyDogru && (
    durum === 'bos' ||
    !ogrenciCevabi || 
    ogrenciCevabi === 'Boş' || 
    ogrenciCevabi === '-' || 
    ogrenciCevabi === 'null' || 
    ogrenciCevabi === 'undefined' ||
    ogrenciCevabi.trim().toLowerCase() === 'boş'
  );

  // Parse structured data for card mode
  const structuredData = useMemo(() => {
    return parseStructuredSolution(cozumDetayi);
  }, [cozumDetayi]);

  const hasStructuredSteps = Boolean(
    structuredData.givens.length > 0 || 
    structuredData.rules.length > 0 || 
    structuredData.steps.length > 0 || 
    structuredData.answer
  );

  const handleSave = () => {
    if (onSaveSolution) {
      onSaveSolution(editText);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(cozumDetayi);
    setIsEditing(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cozumDetayi);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const insertFormulaSnippet = (snippet: string) => {
    setEditText((prev) => prev + snippet);
  };

  return (
    <div className="mt-2 pt-2 border-t border-slate-200/70 text-xs">
      {/* Solution Header & Toggle Button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-xl transition-all text-xs cursor-pointer shadow-xs ${
              hasSolution
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300/80 hover:scale-[1.01]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{hasSolution ? 'Şekilli Çözüm & Matematik Adımları' : 'Çözüm Ekle / Görüntüle'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-amber-700" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-700" />}
          </button>

          {soruFotografYolu && (
            <button
              type="button"
              onClick={() => setShowCroppedModal(true)}
              className="flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-900 border border-indigo-200/80 transition-all text-xs cursor-pointer shadow-xs"
              title="Ayrıştırılan tekil soru görselini büyüt"
            >
              <Camera className="w-3.5 h-3.5 text-indigo-600" />
              <span>📷 Soru Görselini Göster</span>
            </button>
          )}
        </div>

        {/* Badges for Subject & Correctness */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {soruTuru && soruTuru !== 'coktan_secmeli' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
              {soruTuru === 'bosluk_doldurma' ? 'Boşluk Doldurma' : soruTuru === 'acik_uclu' ? 'Açık Uçlu' : 'Klasik'}
            </span>
          )}

          {isBlank ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              Boş Bırakıldı
            </span>
          ) : isActuallyDogru ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              Doğru Çözüldü
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
              Hatalı Çözüm
            </span>
          )}

          {unite && (
            <span
              className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 truncate max-w-[180px]"
              title={unite}
            >
              {unite}
            </span>
          )}
        </div>
      </div>

      {/* Expanded Solution Panel */}
      {isExpanded && (
        <div className="mt-3 p-3.5 sm:p-4 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 space-y-3 shadow-xl shadow-slate-950/20">
          {/* Top Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                {soruNo ? `Soru ${soruNo} Çözümü` : 'Detaylı Soru Çözümü'}
              </span>

              {kazanimKodu && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                  {kazanimKodu}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Card vs Board Toggle */}
              {hasSolution && !isEditing && (
                <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                      viewMode === 'cards'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Şekilli Adım Kartları Görünümü"
                  >
                    <Layers className="w-3 h-3" />
                    <span className="hidden sm:inline">Şekilli Kartlar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('board')}
                    className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                      viewMode === 'board'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Matematik Tahtası / Düz Format"
                  >
                    <FileText className="w-3 h-3" />
                    <span className="hidden sm:inline">Tahta Formatı</span>
                  </button>
                </div>
              )}

              {/* Text Size Toggle */}
              {hasSolution && !isEditing && (
                <button
                  type="button"
                  onClick={() => setIsLargeText(!isLargeText)}
                  className={`px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-colors ${
                    isLargeText
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                  title="Yazı Boyutunu Büyüt / Küçült"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span className="text-[10px]">{isLargeText ? 'Küçült' : 'Büyük'}</span>
                </button>
              )}

              {/* Copy Solution Button */}
              {hasSolution && !isEditing && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-[11px] font-medium flex items-center gap-1 transition-colors"
                  title="Çözümü Kopyala"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span className="text-[10px] hidden sm:inline">{copied ? 'Kopyalandı' : 'Kopyala'}</span>
                </button>
              )}

              {/* Edit Button */}
              {canEdit && !isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditText(cozumDetayi);
                    setIsEditing(true);
                  }}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Düzenle</span>
                </button>
              )}
            </div>
          </div>

          {/* Cropped Question Photo Preview Card */}
          {soruFotografYolu && (
            <div className="p-3 rounded-2xl bg-slate-950/90 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-3">
                <div 
                  className="w-16 h-16 rounded-xl bg-slate-900 overflow-hidden border border-indigo-500/40 shrink-0 cursor-pointer group relative"
                  onClick={() => setShowCroppedModal(true)}
                >
                  <img
                    src={soruFotografYolu.startsWith('data:') ? soruFotografYolu : `data:image/jpeg;base64,${soruFotografYolu}`}
                    alt="Kırpılmış Soru"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Maximize2 className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ayrıştırılmış Tekil Soru Görseli</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Test sayfasından otomatik olarak kesilip ayrıştırılmıştır.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCroppedModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-sm"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Görseli Büyüt</span>
                </button>
                {pagePhoto && onSaveCrop && (
                  <button
                    type="button"
                    onClick={() => setShowManualCropModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    title="Kırpma alanını sayfada elle ayarla"
                  >
                    <Scissors className="w-3.5 h-3.5 text-amber-400" />
                    <span>Alanı Ayarla</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* EDIT MODE */}
          {isEditing ? (
            <div className="space-y-2.5">
              {/* Math Formula Toolbar */}
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-slate-400 font-bold mr-1 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-indigo-400" /> Formül Ekle:
                </span>
                {[
                  { label: 'Kesir (a/b)', code: '$\\frac{a}{b}$' },
                  { label: 'Karekök (√x)', code: '$\\sqrt{x}$' },
                  { label: 'Üs (x²)', code: '$x^{2}$' },
                  { label: 'İndis (x₁)', code: '$x_{1}$' },
                  { label: 'Çarpı (·)', code: '$\\cdot$' },
                  { label: '±', code: '$\\pm$' },
                  { label: 'π', code: '$\\pi$' },
                  { label: 'α', code: '$\\alpha$' },
                  { label: 'Δ', code: '$\\Delta$' },
                  { label: 'sin/cos', code: '$\\sin \\theta$' },
                  { label: 'Büyük Formül', code: '\n$$\n\\frac{-b \\pm \\sqrt{\\Delta}}{2a}\n$$\n' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => insertFormulaSnippet(item.code)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-600 active:scale-95 text-slate-200 hover:text-white border border-slate-700 transition-all font-mono text-[10px]"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={9}
                placeholder="LaTeX matematik formülleri ($...$ ve $$...$$) ile adım adım soru çözümünü yazın..."
                className="w-full p-3 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono border border-slate-700 focus:outline-hidden focus:border-amber-400 leading-relaxed shadow-inner"
              />

              {/* Live Preview of Math */}
              {editText && (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <div className="text-[11px] font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>Canlı Matematik Önizleme:</span>
                  </div>
                  <MathRenderer content={editText} className="text-xs text-slate-200" />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Check className="w-3.5 h-3.5" /> Çözümü Kaydet
                </button>
              </div>
            </div>
          ) : hasSolution ? (
            /* VIEW MODE: Structured Bento Cards or Clean Board */
            <div className={`space-y-3 ${isLargeText ? 'text-sm' : 'text-xs'}`}>

              {viewMode === 'cards' && hasStructuredSteps ? (
                /* --- ŞEKİLLİ ADIM KARTLARI GÖRÜNÜMÜ --- */
                <div className="space-y-2.5">
                  {/* 1. Verilenler Kartı (Mavi/İndigo) */}
                  {structuredData.givens.length > 0 && (
                    <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-100">
                      <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5 mb-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Soruda Verilenler & Şartlar:</span>
                      </div>
                      <ul className="space-y-1 pl-1">
                        {structuredData.givens.map((given, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
                            <MathRenderer content={given} className="leading-snug" />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 2. Kural / Formül Kartı (Amber) */}
                  {structuredData.rules.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-100">
                      <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 mb-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                        <span>Temel Kural & Formül:</span>
                      </div>
                      <div className="space-y-1 pl-1">
                        {structuredData.rules.map((rule, idx) => (
                          <MathRenderer key={idx} content={rule} className="leading-snug" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Numaralı Adım Kartları (Koyu Matematik Tahtası Kartları) */}
                  {structuredData.steps.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Layers className="w-3 h-3 text-slate-400" />
                        <span>Adım Adım Çözüm:</span>
                      </div>

                      {structuredData.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors shadow-xs"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-xs">
                              {step.number || idx + 1}
                            </span>
                            <span className="font-bold text-amber-200">
                              <MathRenderer content={step.title} inline />
                            </span>
                          </div>

                          <div className="pl-7 space-y-1.5 text-slate-200">
                            {step.content.map((item, itemIdx) => (
                              <MathRenderer key={itemIdx} content={item} className="leading-relaxed" />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Diğer Kalan Satırlar (Varsa) */}
                  {structuredData.otherLines.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-slate-200 space-y-1">
                      {structuredData.otherLines.map((line, idx) => (
                        <MathRenderer key={idx} content={line} />
                      ))}
                    </div>
                  )}

                  {/* 4. Doğru Cevap & Sonuç Özeti (Yeşil / Emerald) */}
                  {structuredData.answer && (
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-100 flex items-center justify-between gap-3 shadow-inner">
                      <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-emerald-300">
                        <Target className="w-4 h-4 text-emerald-400 shrink-0" />
                        <MathRenderer content={structuredData.answer} />
                      </div>
                      {dogruCevap && (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 font-bold text-xs">
                          Şık: {dogruCevap}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* --- TAHTA FORMATI / SERBEST MATEMATİKSEL METİN --- */
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-sans leading-relaxed text-slate-200 max-h-80 overflow-y-auto pr-2 shadow-inner">
                  <MathRenderer content={cozumDetayi} />
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-400 italic text-xs py-3 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
              Bu soru için henüz kaydedilmiş bir çözüm adımı bulunmuyor.
            </div>
          )}

          {/* MEB Kazanımı Alt Bilgi Şeridi */}
          {kazanimAciklama && (
            <div className="pt-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <span className="text-indigo-400 font-bold shrink-0 flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> MEB Kazanımı:
              </span>
              <span className="italic text-slate-300">{kazanimAciklama}</span>
            </div>
          )}
        </div>
      )}

      {/* CROPPED QUESTION FULLSCREEN MODAL */}
      {showCroppedModal && soruFotografYolu && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  {soruNo ? `Soru ${soruNo}` : 'Ayrıştırılmış Soru'} - Orijinal Görsel
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCroppedModal(false)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-auto flex items-center justify-center bg-slate-950/60 min-h-[300px]">
              <img
                src={soruFotografYolu.startsWith('data:') ? soruFotografYolu : `data:image/jpeg;base64,${soruFotografYolu}`}
                alt="Ayrıştırılmış Soru"
                className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-lg border border-slate-800"
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900">
              <span>{ders ? `${ders} - ` : ''}{unite || 'Test Soru Görseli'}</span>
              <button
                type="button"
                onClick={() => setShowCroppedModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL CROP ADJUSTMENT MODAL */}
      {showManualCropModal && pagePhoto && onSaveCrop && (
        <ManualQuestionCropModal
          isOpen={showManualCropModal}
          onClose={() => setShowManualCropModal(false)}
          pagePhoto={pagePhoto}
          questionNumber={soruNo || 1}
          initialKutu={kutu}
          onSaveCrop={(newCroppedBase64, newKutu) => {
            onSaveCrop(newCroppedBase64, newKutu);
          }}
        />
      )}
    </div>
  );
};
