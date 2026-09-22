import React, { useState, useRef } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  FileText, 
  Upload, 
  Globe, 
  Loader2, 
  Check, 
  X, 
  Filter, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  GraduationCap,
  Copy,
  ChevronRight,
  FileCheck,
  RefreshCw
} from 'lucide-react';
import { Kazanim, KazanimOnem, SinifType } from '../../types';

interface GlobalCurriculumViewProps {
  curriculum: Kazanim[];
  onAddKazanim: (k: Omit<Kazanim, 'id'>) => Promise<void> | void;
  onUpdateKazanim: (k: Kazanim) => Promise<void> | void;
  onBulkAddKazanimlar: (items: Kazanim[], replaceAll?: boolean) => Promise<void> | void;
  onDeleteKazanim: (id: string) => Promise<void> | void;
  onClearAllCurriculum?: () => Promise<void> | void;
}

export const GlobalCurriculumView: React.FC<GlobalCurriculumViewProps> = ({
  curriculum,
  onAddKazanim,
  onUpdateKazanim,
  onBulkAddKazanimlar,
  onDeleteKazanim,
  onClearAllCurriculum,
}) => {
  // Filters
  const [selectedSinif, setSelectedSinif] = useState<string>('Tümü');
  const [selectedSinav, setSelectedSinav] = useState<string>('Tümü');
  const [selectedDers, setSelectedDers] = useState<string>('Tümü');
  const [selectedOnem, setSelectedOnem] = useState<string>('Tümü');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Forms
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Kazanim | null>(null);

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isFetchingWeb, setIsFetchingWeb] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Manual Add/Edit Form State
  const [formSinif, setFormSinif] = useState<SinifType>('12. Sınıf');
  const [formSinavTuru, setFormSinavTuru] = useState<'TYT' | 'AYT' | 'TÜMÜ'>('TYT');
  const [formDers, setFormDers] = useState<string>('Matematik');
  const [formKonu, setFormKonu] = useState<string>('');
  const [formKazanimKodu, setFormKazanimKodu] = useState<string>('');
  const [formAciklama, setFormAciklama] = useState<string>('');
  const [formOnemDerecesi, setFormOnemDerecesi] = useState<KazanimOnem>('Kritik');
  const [formYil, setFormYil] = useState<string>('2026');

  // PDF / Document AI Extraction State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [pdfTargetClass, setPdfTargetClass] = useState<string>('TÜMÜ');
  const [activePdfTab, setActivePdfTab] = useState<'file' | 'text'>('file');
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [extractedResults, setExtractedResults] = useState<Kazanim[]>([]);
  const [selectedExtractedIds, setSelectedExtractedIds] = useState<Set<string>>(new Set());
  const [previewSearch, setPreviewSearch] = useState<string>('');
  const [previewClassFilter, setPreviewClassFilter] = useState<string>('TÜMÜ');
  const [replaceOldCurriculum, setReplaceOldCurriculum] = useState<boolean>(true);
  const [isSavingToDb, setIsSavingToDb] = useState<boolean>(false);
  const [isConfirmSaveModalOpen, setIsConfirmSaveModalOpen] = useState<boolean>(false);
  const [pendingBulkItems, setPendingBulkItems] = useState<Kazanim[]>([]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: Kazanim) => {
    setEditingItem(item);
    setFormSinif((item.sinif as SinifType) || '12. Sınıf');
    setFormSinavTuru(item.sinavTuru || 'TYT');
    setFormDers(item.ders || 'Matematik');
    setFormKonu(item.konu || '');
    setFormKazanimKodu(item.kazanimKodu || '');
    setFormAciklama(item.aciklama || '');
    setFormOnemDerecesi(item.onemDerecesi || 'Kritik');
    setFormYil(item.yil || '2026');
    setIsAddEditModalOpen(true);
  };

  // Open New Modal
  const handleOpenNew = () => {
    setEditingItem(null);
    setFormSinif('12. Sınıf');
    setFormSinavTuru('TYT');
    setFormDers('Matematik');
    setFormKonu('');
    setFormKazanimKodu('');
    setFormAciklama('');
    setFormOnemDerecesi('Kritik');
    setFormYil('2026');
    setIsAddEditModalOpen(true);
  };

  // Submit Manual Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKonu.trim() || !formAciklama.trim()) {
      showToast('Lütfen konu başlığı ve açıklama alanlarını doldurun.', 'error');
      return;
    }

    if (editingItem) {
      const updated: Kazanim = {
        ...editingItem,
        sinif: formSinif,
        sinavTuru: formSinavTuru,
        ders: formDers.trim(),
        konu: formKonu.trim(),
        kazanimKodu: formKazanimKodu.trim() || `${formDers.slice(0, 3).toUpperCase()}.${formSinavTuru}.${Math.floor(Math.random() * 90 + 10)}`,
        aciklama: formAciklama.trim(),
        onemDerecesi: formOnemDerecesi,
        yil: formYil,
      };
      await onUpdateKazanim(updated);
      showToast('Kazanım başarıyla güncellendi.');
    } else {
      const newK: Omit<Kazanim, 'id'> = {
        sinif: formSinif,
        sinavTuru: formSinavTuru,
        ders: formDers.trim(),
        konu: formKonu.trim(),
        kazanimKodu: formKazanimKodu.trim() || `${formDers.slice(0, 3).toUpperCase()}.${formSinavTuru}.${Math.floor(Math.random() * 90 + 10)}`,
        aciklama: formAciklama.trim(),
        onemDerecesi: formOnemDerecesi,
        yil: formYil,
      };
      await onAddKazanim(newK);
      showToast('Yeni kazanım müfredata eklendi.');
    }

    setIsAddEditModalOpen(false);
  };

  // Web AI Fetching
  const handleFetchWebCurriculum = async () => {
    setIsFetchingWeb(true);
    try {
      const res = await fetch('/api/ai/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hedefYil: 2026 }),
      });
      const data = await res.json();
      if (data.kazanimlar && Array.isArray(data.kazanimlar) && data.kazanimlar.length > 0) {
        setPendingBulkItems(data.kazanimlar);
        if (curriculum.length > 0) {
          // Open custom confirmation modal - asks "Eski müfredatı sileyim mi?"
          setIsConfirmSaveModalOpen(true);
        } else {
          await executeSave(data.kazanimlar, true);
        }
      } else {
        showToast('Müfredat listesi güncellenemedi.', 'error');
      }
    } catch (e: any) {
      showToast('Bağlantı hatası oluştu: ' + (e?.message || ''), 'error');
    } finally {
      setIsFetchingWeb(false);
    }
  };

  // Handle PDF/Image File Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPdfBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Run AI PDF / Text Extraction
  const handleExtractFromPdfOrText = async () => {
    if (activePdfTab === 'file' && !pdfBase64) {
      showToast('Lütfen önce bir PDF veya Görsel belge seçin.', 'error');
      return;
    }
    if (activePdfTab === 'text' && !pastedText.trim()) {
      showToast('Lütfen analiz edilecek müfredat metnini yapıştırın.', 'error');
      return;
    }

    setIsExtractingPdf(true);
    setExtractedResults([]);

    try {
      const payload = {
        fileBase64: activePdfTab === 'file' ? pdfBase64 : undefined,
        mimeType: pdfFile?.type || 'application/pdf',
        documentText: activePdfTab === 'text' ? pastedText : undefined,
        targetClass: pdfTargetClass,
      };

      const res = await fetch('/api/ai/extract-curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.kazanimlar && data.kazanimlar.length > 0) {
        setExtractedResults(data.kazanimlar);
        // Select all by default
        const allIds = new Set<string>(data.kazanimlar.map((k: Kazanim) => k.id));
        setSelectedExtractedIds(allIds);
        const sourceLabel =
          data.source?.includes('flash') || data.source?.includes('pro')
            ? 'Yapay zekâ'
            : 'Akıllı MEB analiz motoru';
        showToast(`🎉 ${sourceLabel} belgeden ${data.kazanimlar.length} adet kazanım çıkardı!`);
      } else {
        showToast(data.error || 'Belgeden kazanım çıkarılamadı.', 'error');
      }
    } catch (err: any) {
      showToast('Belge işlenirken sunucu hatası oluştu.', 'error');
    } finally {
      setIsExtractingPdf(false);
    }
  };

  // Save Extracted Results Flow
  const handleInitiateSave = () => {
    const itemsToSave = extractedResults.filter((k) => selectedExtractedIds.has(k.id));
    if (itemsToSave.length === 0) {
      showToast('Lütfen kaydedilecek en az bir kazanım seçin.', 'error');
      return;
    }
    setPendingBulkItems(itemsToSave);
    // If there is existing curriculum, ask user clearly with confirmation dialog
    if (curriculum.length > 0) {
      setIsConfirmSaveModalOpen(true);
    } else {
      executeSave(itemsToSave, true);
    }
  };

  const executeSave = async (itemsToSave?: Kazanim[], replaceAll: boolean = true) => {
    const items = (itemsToSave && itemsToSave.length > 0) ? itemsToSave : pendingBulkItems;
    if (!items || items.length === 0) {
      setIsConfirmSaveModalOpen(false);
      return;
    }

    // 1. Immediately close both modals and clear extraction inputs so this screen disappears instantly!
    setIsConfirmSaveModalOpen(false);
    setIsPdfModalOpen(false);
    setExtractedResults([]);
    setSelectedExtractedIds(new Set());
    setPdfFile(null);
    setPdfBase64(null);
    setPastedText('');
    setPendingBulkItems([]);

    // 2. Immediate clear toast message
    showToast(
      replaceAll
        ? `🗑️ Eski müfredat silindi ve ${items.length} yeni MEB kazanımı veritabanına kaydedildi!`
        : `➕ ${items.length} yeni kazanım mevcut müfredatın üzerine başarıyla eklendi! (Toplam: ${curriculum.length + items.length})`,
      'success'
    );

    // 3. Run background sync
    try {
      setIsSavingToDb(true);
      await onBulkAddKazanimlar(items, replaceAll);
    } catch (err: any) {
      showToast('Kaydetme hatası: ' + (err?.message || 'Bilinmeyen hata'), 'error');
    } finally {
      setIsSavingToDb(false);
    }
  };

  // Filtering Logic
  const filteredCurriculum = curriculum.filter((k) => {
    const matchesSinif = selectedSinif === 'Tümü' || k.sinif === selectedSinif;
    const matchesSinav = selectedSinav === 'Tümü' || k.sinavTuru === selectedSinav;
    const matchesDers = selectedDers === 'Tümü' || k.ders.toLowerCase().includes(selectedDers.toLowerCase());
    const matchesOnem = selectedOnem === 'Tümü' || k.onemDerecesi === selectedOnem;
    const matchesSearch =
      k.konu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.aciklama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.kazanimKodu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.ders.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (k.sinif && k.sinif.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSinif && matchesSinav && matchesDers && matchesOnem && matchesSearch;
  });

  const uniqueClasses = ['Tümü', '9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf', 'Mezun'];
  const uniqueLessons = ['Tümü', ...Array.from(new Set(curriculum.map((k) => k.ders)))];

  // Stats
  const countTyt = curriculum.filter((k) => k.sinavTuru === 'TYT').length;
  const countAyt = curriculum.filter((k) => k.sinavTuru === 'AYT').length;
  const countKritik = curriculum.filter((k) => k.onemDerecesi === 'Kritik').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-md transition-all animate-in fade-in ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white shadow-emerald-200'
              : 'bg-rose-600 text-white shadow-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="opacity-80 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Ortak YKS Müfredat Merkezi (Koçluk Sistemi)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Merkezî Kazanım & Müfredat Havuzu
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                9, 10, 11, 12. Sınıf ve Mezun grupları için TYT/AYT ders kazanımları. PDF ve belgelerden yapay zekâ ile otomatik kazanım çıkarabilir veya manuel yönetebilirsiniz.
              </p>
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleOpenNew}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Kazanım Ekle</span>
              </button>

              {onClearAllCurriculum && curriculum.length > 0 && (
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Dikkat: Veritabanındaki ${curriculum.length} adet kazanımın tamamı silinecektir. Emin misiniz?`
                      )
                    ) {
                      onClearAllCurriculum();
                      showToast('Ortak müfredattaki tüm kazanımlar başarıyla temizlendi.');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold border border-rose-400/30 transition-all active:scale-95"
                  title="Tüm kazanımları sıfırla"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                  <span className="hidden sm:inline">Müfredatı Sıfırla</span>
                </button>
              )}
            </div>
          </div>

          {/* Stat Badges */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <div className="text-[11px] text-slate-300 font-semibold">Toplam Kazanım</div>
              <div className="text-lg font-black text-white">{curriculum.length} Adet</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <div className="text-[11px] text-indigo-200 font-semibold">TYT Kazanımları</div>
              <div className="text-lg font-black text-indigo-200">{countTyt} Adet</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <div className="text-[11px] text-purple-200 font-semibold">AYT Kazanımları</div>
              <div className="text-lg font-black text-purple-200">{countAyt} Adet</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <div className="text-[11px] text-rose-200 font-semibold">Kritik Konular</div>
              <div className="text-lg font-black text-rose-300">{countKritik} Adet</div>
            </div>
          </div>
        </div>

        {/* Ambient Blur */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Kazanım kodu, ünite, konu, açıklama veya ders adı ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white shadow-2xs transition-all"
          />
        </div>

        {/* Filter Groups */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Class Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Sınıf Seviyesi</label>
            <select
              value={selectedSinif}
              onChange={(e) => setSelectedSinif(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {uniqueClasses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Sınav Türü</label>
            <select
              value={selectedSinav}
              onChange={(e) => setSelectedSinav(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="Tümü">Tümü (TYT & AYT)</option>
              <option value="TYT">Sadece TYT</option>
              <option value="AYT">Sadece AYT</option>
            </select>
          </div>

          {/* Lesson Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Ders</label>
            <select
              value={selectedDers}
              onChange={(e) => setSelectedDers(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {uniqueLessons.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Önem Derecesi</label>
            <select
              value={selectedOnem}
              onChange={(e) => setSelectedOnem(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="Tümü">Tümü</option>
              <option value="Kritik">🔴 Kritik</option>
              <option value="Yüksek">🟠 Yüksek</option>
              <option value="Orta">🟡 Orta</option>
              <option value="Temel">🟢 Temel</option>
            </select>
          </div>
        </div>
      </div>

      {/* Curriculum List Table / Cards */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Listelenen Kazanımlar ({filteredCurriculum.length})</span>
          </div>
          {(selectedSinif !== 'Tümü' || selectedSinav !== 'Tümü' || selectedDers !== 'Tümü' || selectedOnem !== 'Tümü' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedSinif('Tümü');
                setSelectedSinav('Tümü');
                setSelectedDers('Tümü');
                setSelectedOnem('Tümü');
                setSearchQuery('');
              }}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Filtreleri Temizle</span>
            </button>
          )}
        </div>

        {filteredCurriculum.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-700">Seçilen kriterlere uygun kazanım bulunamadı.</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Arama kriterlerinizi değiştirebilir veya yeni bir PDF belgesi yükleyerek yapay zekâ ile otomatik kazanım çıkartabilirsiniz.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCurriculum.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Class Badge */}
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-extrabold border border-slate-200">
                      {item.sinif || '12. Sınıf'}
                    </span>

                    {/* Exam Type Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold ${
                        item.sinavTuru === 'TYT'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : item.sinavTuru === 'AYT'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {item.sinavTuru}
                    </span>

                    {/* Lesson Badge */}
                    <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 text-[11px] font-extrabold border border-indigo-200">
                      {item.ders}
                    </span>

                    {/* Code Badge */}
                    <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {item.kazanimKodu}
                    </span>

                    {/* Priority Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        item.onemDerecesi === 'Kritik'
                          ? 'bg-rose-100 text-rose-800'
                          : item.onemDerecesi === 'Yüksek'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.onemDerecesi}
                    </span>
                  </div>

                  {/* Topic & Outcome Description */}
                  <div className="text-xs font-extrabold text-slate-900">{item.konu}</div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.aciklama}</p>
                </div>

                {/* Edit & Delete Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Kazanımı Düzenle"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`"${item.konu}" kazanımını silmek istediğinize emin misiniz?`)) {
                        await onDeleteKazanim(item.id);
                        showToast('Kazanım silindi.');
                      }
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Kazanımı Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: MANUAL ADD / EDIT KAZANIM MODAL */}
      {/* ========================================================= */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingItem ? 'Kazanım Düzenle' : 'Yeni Kazanım Ekle'}
                  </h3>
                  <p className="text-xs text-slate-500">Ortak müfredat havuzuna kazanım tanımlayın</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Sinif */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Sınıf Seviyesi</label>
                  <select
                    value={formSinif}
                    onChange={(e) => setFormSinif(e.target.value as SinifType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="9. Sınıf">9. Sınıf</option>
                    <option value="10. Sınıf">10. Sınıf</option>
                    <option value="11. Sınıf">11. Sınıf</option>
                    <option value="12. Sınıf">12. Sınıf</option>
                    <option value="Mezun">Mezun</option>
                  </select>
                </div>

                {/* Exam Type */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Sınav Türü</label>
                  <select
                    value={formSinavTuru}
                    onChange={(e) => setFormSinavTuru(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="TYT">TYT</option>
                    <option value="AYT">AYT</option>
                    <option value="TÜMÜ">Ortak (Tüm Sınavlar)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Lesson */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Ders</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Matematik, Fizik..."
                    value={formDers}
                    onChange={(e) => setFormDers(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                {/* Code */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Kazanım Kodu</label>
                  <input
                    type="text"
                    placeholder="Örn: MAT.12.1.1"
                    value={formKazanimKodu}
                    onChange={(e) => setFormKazanimKodu(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Ünite / Konu Başlığı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Türev ve Teğet Denklemleri"
                  value={formKonu}
                  onChange={(e) => setFormKonu(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Kazanım Açıklaması</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Fonksiyonun türevini hesaplar ve teğet denklemini kurar..."
                  value={formAciklama}
                  onChange={(e) => setFormAciklama(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Önem Derecesi</label>
                <select
                  value={formOnemDerecesi}
                  onChange={(e) => setFormOnemDerecesi(e.target.value as KazanimOnem)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="Kritik">🔴 Kritik (Her Yıl Çıkan)</option>
                  <option value="Yüksek">🟠 Yüksek Öncelikli</option>
                  <option value="Orta">🟡 Orta Derece</option>
                  <option value="Temel">🟢 Temel Bilgi</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100"
                >
                  {editingItem ? 'Guncelle' : 'Kaydet ve Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: AI PDF & DOCUMENT EXTRACTION MODAL */}
      {/* ========================================================= */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    PDF & Belgeden Yapay Zekâ ile Kazanım Çıkar
                  </h3>
                  <p className="text-xs text-slate-500">
                    MEB müfredat PDF belgesi yükleyin; sistem 100+ tüm konuları sınıf ve ders bazlı eksiksiz çıkarsın.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Class Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Öncelikli Sınıf Seviyesi Seçin</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {['TÜMÜ', '9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf', 'Mezun'].map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setPdfTargetClass(cls)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold text-center border transition-all ${
                      pdfTargetClass === cls
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Type Tabs */}
            <div className="flex border-b border-slate-200 text-xs font-bold">
              <button
                onClick={() => setActivePdfTab('file')}
                className={`py-2.5 px-4 border-b-2 transition-all flex items-center gap-2 ${
                  activePdfTab === 'file'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>PDF veya Görsel Belge Yükle</span>
              </button>
              <button
                onClick={() => setActivePdfTab('text')}
                className={`py-2.5 px-4 border-b-2 transition-all flex items-center gap-2 ${
                  activePdfTab === 'text'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Müfredat Metnini Yapıştır</span>
              </button>
            </div>

            {/* Tab 1: File Upload */}
            {activePdfTab === 'file' && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50/80 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-800">
                      {pdfFile ? pdfFile.name : 'PDF veya Görsel Belgesini Tıklayarak Seçin'}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Desteklenen formatlar: .PDF, .PNG, .JPG (Maks. 20MB)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Text Paste */}
            {activePdfTab === 'text' && (
              <div>
                <textarea
                  rows={5}
                  placeholder="Müfredat tebliğini, konuları veya kazanım metinlerini buraya yapıştırın..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Process Action */}
            {extractedResults.length === 0 && (
              <button
                onClick={handleExtractFromPdfOrText}
                disabled={isExtractingPdf}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-extrabold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isExtractingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Yapay Zekâ Belgeyi Analiz Ediyor...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Belgeyi Analiz Et ve Kazanımları Çıkar</span>
                  </>
                )}
              </button>
            )}

            {/* Extracted Results Preview List */}
            {extractedResults.length > 0 && (() => {
              const displayedExtracted = extractedResults.filter((k) => {
                const matchesClass = previewClassFilter === 'TÜMÜ' || k.sinif === previewClassFilter;
                const matchesSearch =
                  !previewSearch.trim() ||
                  k.konu.toLowerCase().includes(previewSearch.toLowerCase()) ||
                  k.aciklama.toLowerCase().includes(previewSearch.toLowerCase()) ||
                  k.kazanimKodu.toLowerCase().includes(previewSearch.toLowerCase()) ||
                  k.ders.toLowerCase().includes(previewSearch.toLowerCase());
                return matchesClass && matchesSearch;
              });

              return (
                <div className="space-y-4 border-t border-slate-100 pt-4">
                  {/* Celebratory Banner */}
                  <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        {extractedResults.length}
                      </div>
                      <div>
                        <div className="text-xs font-black text-emerald-950">
                          🎉 Belgeden Toplam {extractedResults.length} Adet Kazanım Başarıyla Çıkarıldı!
                        </div>
                        <div className="text-[11px] text-emerald-700">
                          Şu an {selectedExtractedIds.size} tanesi kaydedilmek üzere seçili.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedExtractedIds(new Set(extractedResults.map((k) => k.id)));
                        }}
                        className="px-2.5 py-1 text-[11px] font-extrabold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
                      >
                        Tümünü Seç ({extractedResults.length})
                      </button>
                      <button
                        onClick={() => setSelectedExtractedIds(new Set())}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
                      >
                        Temizle
                      </button>
                    </div>
                  </div>

                  {/* Filter & Search Toolbar */}
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="relative flex-1 w-full">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Çıkarılan kazanımlar içinde ara (konu, kod, açıklama)..."
                        value={previewSearch}
                        onChange={(e) => setPreviewSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto py-1">
                      {['TÜMÜ', '9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf'].map((c) => (
                        <button
                          key={c}
                          onClick={() => setPreviewClassFilter(c)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold whitespace-nowrap transition-all ${
                            previewClassFilter === c
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Outcomes Scrollable List */}
                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {displayedExtracted.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
                        Arama kriterlerinize uygun kazanım bulunamadı.
                      </div>
                    ) : (
                      displayedExtracted.map((k) => (
                        <div
                          key={k.id}
                          onClick={() => {
                            const next = new Set(selectedExtractedIds);
                            if (next.has(k.id)) next.delete(k.id);
                            else next.add(k.id);
                            setSelectedExtractedIds(next);
                          }}
                          className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                            selectedExtractedIds.has(k.id)
                              ? 'bg-indigo-50/80 border-indigo-300 shadow-2xs'
                              : 'bg-slate-50/60 border-slate-200 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedExtractedIds.has(k.id)}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-slate-900">{k.sinif || '12. Sınıf'}</span>
                              <span className="font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md text-[10px]">
                                {k.sinavTuru} • {k.ders}
                              </span>
                              <span className="font-mono text-[10px] text-slate-500 font-bold">{k.kazanimKodu}</span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  k.onemDerecesi === 'Kritik'
                                    ? 'bg-rose-100 text-rose-700'
                                    : k.onemDerecesi === 'Yüksek'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {k.onemDerecesi}
                              </span>
                            </div>
                            <div className="font-bold text-slate-800">{k.konu}</div>
                            <p className="text-slate-600 text-[11px] leading-relaxed">{k.aciklama}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div className="text-[11px] text-slate-500">
                      Gösterilen: <span className="font-bold text-slate-800">{displayedExtracted.length}</span> / Toplam:{' '}
                      <span className="font-bold text-slate-800">{extractedResults.length}</span> kazanım
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => {
                          setExtractedResults([]);
                          setPreviewSearch('');
                          setPreviewClassFilter('TÜMÜ');
                        }}
                        disabled={isSavingToDb}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
                      >
                        Yeniden Belge Seç
                      </button>
                      <button
                        onClick={handleInitiateSave}
                        disabled={isSavingToDb || selectedExtractedIds.size === 0}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-200 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        {isSavingToDb ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Veritabanına Kaydediliyor ({selectedExtractedIds.size} Adet)...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>
                              Seçilen {selectedExtractedIds.size} Kazanımı Veritabanına Kaydet
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Confirmation Modal Dialog: "Eski Müfredatı Sileyim mi?" */}
      {isConfirmSaveModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-amber-100 text-amber-800 shrink-0">
                <AlertCircle className="w-7 h-7 text-amber-700" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">Eski Müfredatı Sileyim mi?</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sistemde şu anda <strong className="text-slate-900 font-black">{curriculum.length} adet</strong> kayıtlı kazanım var.
                  Çekilen / seçilen <strong className="text-indigo-600 font-black">{pendingBulkItems.length || selectedExtractedIds.size} yeni kazanımı</strong> nasıl kaydetmek istersiniz?
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {/* Option 1: Evet, Eski Müfredatı Sil (Temiz Kurulum) */}
              <button
                type="button"
                onClick={() => executeSave(pendingBulkItems, true)}
                className="w-full p-4 rounded-2xl border-2 border-rose-200 hover:border-rose-400 bg-rose-50/60 hover:bg-rose-50 text-left transition-all flex items-start gap-3.5 group cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-rose-600 text-white shrink-0 group-hover:scale-105 transition-transform">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-black text-rose-950 flex items-center gap-2">
                    <span>Evet, Eski Müfredatı Sil ve Yenileri Kaydet</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 text-[10px] font-black">
                      Temiz Kurulum
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    Mevcut {curriculum.length} eski kazanımı tamamen temizler. Sadece yeni {pendingBulkItems.length || selectedExtractedIds.size} kazanım veritabanında kalır.
                  </p>
                </div>
              </button>

              {/* Option 2: Hayır, Mevcut Müfredatın Üzerine Ekle */}
              <button
                type="button"
                onClick={() => executeSave(pendingBulkItems, false)}
                className="w-full p-4 rounded-2xl border-2 border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 text-left transition-all flex items-start gap-3.5 group cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0 group-hover:scale-105 transition-transform">
                  <Check className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-black text-indigo-950 flex items-center gap-2">
                    <span>Hayır, Mevcut Müfredatın Üzerine Ekle</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-900 text-[10px] font-black">
                      Birleştir
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-800 leading-relaxed">
                    Mevcut {curriculum.length} kazanım korunur, yeni {pendingBulkItems.length || selectedExtractedIds.size} kazanım listenin üzerine eklenir (Toplam: {curriculum.length + (pendingBulkItems.length || selectedExtractedIds.size)}).
                  </p>
                </div>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmSaveModalOpen(false);
                  setPendingBulkItems([]);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Vazgeç (Geri Dön)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
