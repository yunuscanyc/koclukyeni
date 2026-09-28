import React, { useState, useEffect } from 'react';
import { 
  Archive, 
  Search, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  Trash2, 
  Eye, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  RotateCw,
  Camera, 
  BookOpen,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  Hourglass,
  Clock,
  RefreshCw,
  Download,
  Plus,
  Users,
  Filter,
  AlertCircle
} from 'lucide-react';
import { OgrenciSinavKaydi, SinavSorusu, DenemeSinavi, Student, Kazanim } from '../../../types';
import { retryExamAIAnalysis, markArchiveAsRead, getExamArchiveById, resetAndResolveExamAI, saveExamArchive, reanalyzeArchivePage } from '../../../lib/apiService';
import { QuestionSolutionView } from '../QuestionSolutionView';
import { StudentTestUploadModal } from '../../portal/StudentTestUploadModal';
import { formatDate } from '../../../utils/dateUtils';

interface ExamHistoryTabProps {
  archives: OgrenciSinavKaydi[];
  allArchives?: OgrenciSinavKaydi[];
  activeStudent?: Student;
  curriculum?: Kazanim[];
  onDeleteArchive: (id: string) => void;
  studentName: string;
  onSaveExamArchive?: (archive: OgrenciSinavKaydi, newDeneme?: Omit<DenemeSinavi, 'id'> | DenemeSinavi) => void;
}

export const ExamHistoryTab: React.FC<ExamHistoryTabProps> = ({
  archives,
  allArchives,
  activeStudent,
  curriculum = [],
  onDeleteArchive,
  studentName,
  onSaveExamArchive,
}) => {
  const [scopeFilter, setScopeFilter] = useState<'student' | 'all'>('student');
  const effectiveArchives = (scopeFilter === 'all' && allArchives && allArchives.length > 0)
    ? allArchives
    : (archives.length > 0 ? archives : (allArchives || []));

  const [selectedArchiveId, setSelectedArchiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'Tümü' | 'TYT' | 'AYT'>('Tümü');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Viewer State for the selected exam
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedQuestionNo, setSelectedQuestionNo] = useState<number | null>(null);
  const [selectedPageFilter, setSelectedPageFilter] = useState<'all' | number>('all');

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [reanalyzingPageNo, setReanalyzingPageNo] = useState<number | null>(null);
  const [confirmResetId, setConfirmResetId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [zipProgressText, setZipProgressText] = useState('');

  // Cache for on-demand loaded full archives with high-res base64 photos
  const [fullArchiveCache, setFullArchiveCache] = useState<Record<string, OgrenciSinavKaydi>>({});
  const [loadingArchiveId, setLoadingArchiveId] = useState<string | null>(null);

  // Synchronize selection when archives array updates (if active selection is deleted, reset to null)
  useEffect(() => {
    if (selectedArchiveId && !effectiveArchives.some((a) => a.id === selectedArchiveId)) {
      setSelectedArchiveId(null);
    }
  }, [effectiveArchives, selectedArchiveId]);

  // Lazy-fetch full archive details (high-res page photos) ONLY when an accordion item is opened
  useEffect(() => {
    if (!effectiveArchives || effectiveArchives.length === 0 || !selectedArchiveId) return;

    const rawArch = effectiveArchives.find((a) => a.id === selectedArchiveId);
    if (rawArch) {
      const cached = fullArchiveCache[selectedArchiveId];
      const photos = cached?.sayfaFotolari || rawArch.sayfaFotolari || [];
      const hasFullPhotos = photos.some((p: any) => typeof p === 'string' ? p.length > 500 : Boolean(p?.imageBase64 && p.imageBase64.length > 500));

      if (!hasFullPhotos && loadingArchiveId !== selectedArchiveId) {
        setLoadingArchiveId(selectedArchiveId);
        getExamArchiveById(selectedArchiveId)
          .then((fullArch) => {
            if (fullArch) {
              setFullArchiveCache((prev) => ({ ...prev, [selectedArchiveId]: fullArch }));
            }
          })
          .catch((err) => console.warn('getExamArchiveById error:', err))
          .finally(() => setLoadingArchiveId(null));
      }
    }
  }, [selectedArchiveId, effectiveArchives]);

  // When coach views an archive, mark it as read on the backend (isNew: false)
  const markedAsReadRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    if (selectedArchiveId) {
      const active = effectiveArchives.find((a) => a.id === selectedArchiveId);
      if (active && (active.isNew || active.durum === 'Yeni') && !markedAsReadRef.current.has(active.id)) {
        markedAsReadRef.current.add(active.id);
        markArchiveAsRead(active.id).catch((err) => console.warn('markArchiveAsRead error:', err));
      }
    }
  }, [selectedArchiveId, effectiveArchives]);

  // Automatically mark all archives in this view as read when viewed
  useEffect(() => {
    const newArchives = effectiveArchives.filter((a) => (a.isNew || a.durum === 'Yeni') && !markedAsReadRef.current.has(a.id));
    if (newArchives.length > 0) {
      newArchives.forEach((a) => {
        markedAsReadRef.current.add(a.id);
        markArchiveAsRead(a.id).catch((err) => console.warn('markArchiveAsRead error:', err));
      });
    }
  }, [effectiveArchives]);

  const handleDownloadPhotosZip = async (arch: OgrenciSinavKaydi) => {
    if (!arch) return;
    setIsDownloadingZip(true);
    setZipProgressText('Fotoğraflar hazırlanıyor...');

    try {
      let photos = arch.sayfaFotolari || arch.fotografYollari || [];
      const hasFull = photos.some((p: any) => typeof p === 'string' ? p.length > 500 : Boolean(p?.imageBase64 && p.imageBase64.length > 500));
      if (!hasFull) {
        setZipProgressText('Fotoğraflar sunucudan alınıyor...');
        const full = await getExamArchiveById(arch.id);
        if (full && (full.sayfaFotolari?.length || full.fotografYollari?.length)) {
          photos = full.sayfaFotolari || full.fotografYollari || [];
          setFullArchiveCache(prev => ({ ...prev, [arch.id]: full }));
        }
      }

      const validPhotos = (photos || []).filter((p: any) => 
        (typeof p === 'string' && p.length > 50) || Boolean(p?.imageBase64 && p.imageBase64.length > 50)
      );

      if (validPhotos.length === 0) {
        window.location.href = `/api/archives/${arch.id}/download-zip`;
        return;
      }

      setZipProgressText(`Paketleniyor (${validPhotos.length} Fotoğraf)...`);
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      validPhotos.forEach((photo: any, idx: number) => {
        const raw = typeof photo === 'string' ? photo : (photo?.imageBase64 || '');
        if (!raw) return;
        const isPng = raw.includes('image/png');
        const ext = isPng ? 'png' : 'jpg';
        const cleanBase64 = raw.replace(/^data:image\/\w+;base64,/, '');
        zip.file(`Sayfa_${String(idx + 1).padStart(2, '0')}.${ext}`, cleanBase64, { base64: true });
      });

      setZipProgressText('ZIP oluşturuluyor...');
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      const cleanSinav = (arch.sinavAdi || 'Sinav').replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, '_');
      const cleanOgrenci = (arch.ogrenciAdSoyad || studentName || 'Ogrenci').replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, '_');
      const fileName = `${cleanSinav}_${cleanOgrenci}_Fotograflari.zip`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('ZIP download error, fallback to server direct endpoint:', err);
      window.location.href = `/api/archives/${arch.id}/download-zip`;
    } finally {
      setIsDownloadingZip(false);
      setTimeout(() => setZipProgressText(''), 1000);
    }
  };

  const getAIStatusTag = (arch: OgrenciSinavKaydi, isSelected: boolean) => {
    const photos = arch.sayfaFotolari || arch.fotografYollari || [];
    const totalPages = photos.length || (arch as any).photosCount || (arch as any).sayfaSayisi || 0;
    const realQuestions = (arch.sorular || []).filter(q => q.unite !== "Çözülmemiş / Boş Sayfa" && q.unite !== "Boş / Çözülmemiş Sayfa");
    const coveredPagesSet = new Set((arch.sorular || []).map(q => (q.sayfaIndex !== undefined && typeof q.sayfaIndex === 'number' && q.sayfaIndex >= 0) ? q.sayfaIndex + 1 : (q.sayfaNo || 1)).filter(Boolean));
    const attemptedPagesSet = new Set(realQuestions.filter(q => q.isaretlenenSik && q.isaretlenenSik !== "Boş").map(q => (q.sayfaIndex !== undefined && typeof q.sayfaIndex === 'number' && q.sayfaIndex >= 0) ? q.sayfaIndex + 1 : (q.sayfaNo || 1)));
    
    const isAllCovered = totalPages > 0 && coveredPagesSet.size >= totalPages;
    const isCompleted = arch.aiStatus === 'completed' || (isAllCovered && realQuestions.length > 0);

    if (isCompleted) {
      const solvedCount = attemptedPagesSet.size || coveredPagesSet.size || totalPages;
      const unattemptedCount = Math.max(0, totalPages - solvedCount);

      if (totalPages > 0 && unattemptedCount > 0 && solvedCount > 0) {
        return (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
            isSelected ? 'bg-sky-400 text-slate-950' : 'bg-sky-50 text-sky-700 border border-sky-200'
          }`} title={`${totalPages} sayfanın ${solvedCount} sayfası çözüldü, ${unattemptedCount} sayfa boş bırakıldı`}>
            <CheckCircle2 className="w-3 h-3" />
            <span>Çözülen: {solvedCount}/{totalPages} ({unattemptedCount} Boş)</span>
          </span>
        );
      }

      return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
          isSelected ? 'bg-emerald-400 text-slate-950' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          <CheckCircle2 className="w-3 h-3" />
          <span>{totalPages > 0 ? `Çözülen: ${totalPages}/${totalPages} Sayfa` : 'Yapay Zekâ Çözdü'}</span>
        </span>
      );
    }

    if (arch.aiStatus === 'rate_limited') {
      return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse ${
          isSelected ? 'bg-amber-300 text-amber-950' : 'bg-amber-50 text-amber-800 border border-amber-200'
        }`}>
          <Hourglass className="w-3 h-3" />
          <span>Kota Bekleniyor (Çözülen: {coveredPagesSet.size}/{totalPages || 1})</span>
        </span>
      );
    }

    const isActivelyProcessing = arch.aiStatus === 'processing' || arch.aiStatus === 'pending';

    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
        isSelected ? 'bg-indigo-400 text-slate-950' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
      }`}>
        {isActivelyProcessing ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Clock className="w-3 h-3" />
        )}
        <span>Çözülen: {coveredPagesSet.size}/{totalPages || 1} Sayfa</span>
      </span>
    );
  };

  const filteredArchives = effectiveArchives.filter((a) => {
    const matchesType = selectedType === 'Tümü' || a.sinavTuru === selectedType;
    const matchesSearch =
      (a.sinavAdi || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.ogrenciAdSoyad || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.tarih || '').includes(searchQuery);
    return matchesType && matchesSearch;
  });

  // Get active full archive item (merging cached high-res data safely)
  const getFullArchiveItem = (arch: OgrenciSinavKaydi): OgrenciSinavKaydi => {
    const cachedItem = fullArchiveCache[arch.id];
    if (!cachedItem) return arch;

    const cachedPhotos = cachedItem.sayfaFotolari || cachedItem.fotografYollari || [];
    const archPhotos = arch.sayfaFotolari || arch.fotografYollari || [];
    const hasCachedFull = cachedPhotos.some((p: any) => typeof p === 'string' ? p.length > 500 : Boolean(p?.imageBase64 && p.imageBase64.length > 500));
    const hasArchFull = archPhotos.some((p: any) => typeof p === 'string' ? p.length > 500 : Boolean(p?.imageBase64 && p.imageBase64.length > 500));

    const finalPhotos = hasCachedFull ? cachedPhotos : (hasArchFull ? archPhotos : (cachedPhotos.length >= archPhotos.length ? cachedPhotos : archPhotos));
    const finalSorular = (cachedItem.sorular && cachedItem.sorular.length > 0) ? cachedItem.sorular : (arch.sorular || []);

    return {
      ...arch,
      ...cachedItem,
      sayfaFotolari: finalPhotos,
      fotografYollari: finalPhotos,
      sorular: finalSorular,
    };
  };

  // Reset page and selection when switching active archive
  useEffect(() => {
    setActivePageIndex(0);
    setSelectedQuestionNo(null);
    setSelectedPageFilter('all');
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  }, [selectedArchiveId]);

  const handleReanalyzePage = async (arch: OgrenciSinavKaydi, pageNo: number) => {
    setReanalyzingPageNo(pageNo);
    setRetryMessage(`Sayfa ${pageNo} yapay zekâ ile yeniden taranıyor...`);
    try {
      const res = await reanalyzeArchivePage(arch.id, pageNo - 1, arch);
      if (res.success && res.archive) {
        setFullArchiveCache((prev) => ({
          ...prev,
          [arch.id]: res.archive!,
        }));
        if (onSaveExamArchive) {
          onSaveExamArchive(res.archive);
        }
        setRetryMessage(res.message || `Sayfa ${pageNo} başarıyla analiz edildi.`);
      } else {
        setRetryMessage(res.message || 'Sayfada soru tespit edilemedi.');
      }
      setTimeout(() => setRetryMessage(null), 4000);
    } catch (err: any) {
      console.error('Reanalyze page error:', err);
      setRetryMessage('Sayfa taranırken hata oluştu: ' + (err?.message || ''));
      setTimeout(() => setRetryMessage(null), 4000);
    } finally {
      setReanalyzingPageNo(null);
    }
  };

  // Zoom and rotation controls
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };
  const handleRotateCw = () => {
    setRotation((prev) => (prev + 90) % 360);
  };
  const handleRotateCcw = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  // Pan image with mouse & touch dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
  };

  const handleTouchEnd = () => setIsDragging(false);

  // When clicking on a question, switch to that question's page photo and highlight
  const handleSelectQuestion = (q: SinavSorusu, currentArchive: OgrenciSinavKaydi) => {
    setSelectedQuestionNo(q.soruNo);

    // Determine target page index
    let targetIndex = -1;
    if (typeof q.sayfaNo === 'number' && q.sayfaNo >= 1) {
      targetIndex = q.sayfaNo - 1;
    } else if (q.sayfaFotoUrl && currentArchive.sayfaFotolari) {
      targetIndex = currentArchive.sayfaFotolari.indexOf(q.sayfaFotoUrl);
    }

    if (targetIndex >= 0 && currentArchive.sayfaFotolari && targetIndex < currentArchive.sayfaFotolari.length) {
      setActivePageIndex(targetIndex);
    }
  };

  const handleSaveQuestionSolution = (currentArchive: OgrenciSinavKaydi, questionNo: number, newSolution: string) => {
    if (!currentArchive || !onSaveExamArchive) return;
    const updatedSorular = (currentArchive.sorular || []).map((q) => {
      if (q.soruNo === questionNo) {
        return {
          ...q,
          cozumDetayi: newSolution,
          cozum: newSolution,
        };
      }
      return q;
    });

    const updatedArchive: OgrenciSinavKaydi = {
      ...currentArchive,
      sorular: updatedSorular,
    };

    setFullArchiveCache((prev) => ({ ...prev, [currentArchive.id]: updatedArchive }));
    onSaveExamArchive(updatedArchive);
  };

  const handleSaveQuestionCrop = (currentArchive: OgrenciSinavKaydi, questionNo: number, newCroppedBase64: string, newKutu: [number, number, number, number]) => {
    if (!currentArchive || !onSaveExamArchive) return;
    const updatedSorular = (currentArchive.sorular || []).map((q) => {
      if (q.soruNo === questionNo) {
        return {
          ...q,
          soruFotografYolu: newCroppedBase64,
          kutu: newKutu,
        };
      }
      return q;
    });

    const updatedArchive: OgrenciSinavKaydi = {
      ...currentArchive,
      sorular: updatedSorular,
    };

    setFullArchiveCache((prev) => ({ ...prev, [currentArchive.id]: updatedArchive }));
    onSaveExamArchive(updatedArchive);
  };

  const handleUpdateQuestionStatus = (currentArchive: OgrenciSinavKaydi, questionNo: number, newStatus: 'dogru' | 'yanlis' | 'bos', newOgrenciCevap?: string) => {
    if (!currentArchive || !onSaveExamArchive) return;
    const updatedSorular = (currentArchive.sorular || []).map((q) => {
      if (q.soruNo === questionNo) {
        const isBlank = newStatus === 'bos';
        const isDogru = newStatus === 'dogru';
        const isaret = isBlank ? 'Boş' : (newOgrenciCevap !== undefined ? newOgrenciCevap : (isDogru ? q.dogruCevap : (q.ogrenciCevabi && q.ogrenciCevabi !== 'Boş' ? q.ogrenciCevabi : 'A')));
        return {
          ...q,
          isaretlenenSik: isBlank ? 'Boş' : isaret,
          ogrenciCevabi: isBlank ? 'Boş' : isaret,
          dogruMu: isDogru,
          durum: newStatus,
        };
      }
      return q;
    });

    const dCount = updatedSorular.filter((q) => q.durum === 'dogru' || (q.durum !== 'bos' && q.dogruMu)).length;
    const bCount = updatedSorular.filter((q) => q.durum === 'bos' || (!q.durum && (!q.ogrenciCevabi || q.ogrenciCevabi === 'Boş' || q.isaretlenenSik === 'Boş'))).length;
    const yCount = Math.max(0, updatedSorular.length - dCount - bCount);
    
    // Boşluk doldurma / açık uçlu soruları net hesabına katma, sadece çoktan seçmeli test tiplerini kat:
    const testQ = updatedSorular.filter((q) => !q.soruTuru || q.soruTuru === 'coktan_secmeli');
    const testD = testQ.filter((q) => q.durum === 'dogru' || (q.durum !== 'bos' && q.dogruMu)).length;
    const testB = testQ.filter((q) => q.durum === 'bos' || (!q.durum && (!q.ogrenciCevabi || q.ogrenciCevabi === 'Boş' || q.isaretlenenSik === 'Boş'))).length;
    const testY = Math.max(0, testQ.length - testD - testB);
    const newNet = Math.max(0, Number((testD - testY * 0.25).toFixed(2)));

    const updatedArchive: OgrenciSinavKaydi = {
      ...currentArchive,
      sorular: updatedSorular,
      dogruSayisi: dCount,
      yanlisSayisi: yCount,
      bosSayisi: bCount,
      net: newNet,
      toplamNet: newNet,
    };

    setFullArchiveCache((prev) => ({ ...prev, [currentArchive.id]: updatedArchive }));
    onSaveExamArchive(updatedArchive);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Filters */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Archive className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                7. Sınav Geçmişi & Optik Sayfa Arşivi
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              {scopeFilter === 'student' ? studentName : 'Tüm Öğrenciler'} için yapay zekâ optik taraması yapılmış denemeler ve kitapçık fotoğrafları ({filteredArchives.length} Kayıt)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Scope Filter: Student vs All */}
            {allArchives && allArchives.length > 0 && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setScopeFilter('student')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    scopeFilter === 'student'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={`${studentName} öğrencisine ait sınavlar`}
                >
                  📌 {studentName} ({archives.length})
                </button>
                <button
                  type="button"
                  onClick={() => setScopeFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    scopeFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Tüm öğrencilerin yüklediği optik sınavlar"
                >
                  🌐 Tüm Öğrenciler ({allArchives.length})
                </button>
              </div>
            )}

            {/* TYT / AYT Type Filters */}
            <div className="flex items-center gap-1">
              {['Tümü', 'TYT', 'AYT'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    selectedType === t
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* New Optical Exam Upload Button */}
            {activeStudent && (
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Optik Sınav Yükle</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Arşivde deneme adı, öğrenci veya tarih ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Main List of Archives with Inline Detail Expander */}
      <div className="space-y-4">
        {filteredArchives.length > 0 ? (
          filteredArchives.map((arch) => {
            const isSelected = selectedArchiveId === arch.id;
            const fullArch = isSelected ? getFullArchiveItem(arch) : arch;
            
            const realQ = (fullArch.sorular || []).filter(q => q.unite !== "Çözülmemiş / Boş Sayfa" && q.unite !== "Boş / Çözülmemiş Sayfa");
            let d = fullArch.dogruSayisi || 0;
            let y = fullArch.yanlisSayisi || 0;
            let b = fullArch.bosSayisi || 0;
            let net = fullArch.toplamNet || 0;
            if (realQ.length > 0) {
              d = realQ.filter(q => q.durum === 'dogru' || (q.durum !== 'bos' && q.dogruMu)).length;
              b = realQ.filter(q => q.durum === 'bos' || (!q.durum && (!q.isaretlenenSik || q.isaretlenenSik === "Boş" || q.ogrenciCevabi === "Boş"))).length;
              y = Math.max(0, realQ.length - d - b);
              const testQ = realQ.filter(q => !q.soruTuru || q.soruTuru === 'coktan_secmeli');
              const testD = testQ.filter(q => q.durum === 'dogru' || (q.durum !== 'bos' && q.dogruMu)).length;
              const testB = testQ.filter(q => q.durum === 'bos' || (!q.durum && (!q.isaretlenenSik || q.isaretlenenSik === "Boş" || q.ogrenciCevabi === "Boş"))).length;
              const testY = Math.max(0, testQ.length - testD - testB);
              net = Math.max(0, Number((testD - testY * 0.25).toFixed(2)));
            }

            const photos: any[] = fullArch.sayfaFotolari || fullArch.fotografYollari || [];
            const activePhoto = photos[activePageIndex] || photos[0];
            const activePhotoUrl = typeof activePhoto === 'string' ? activePhoto : (activePhoto?.imageBase64 || '');

            const filteredQuestions = (fullArch.sorular || []).filter((q) => {
              if (selectedPageFilter === 'all') return true;
              const qPage = q.sayfaNo || (q.sayfaIndex !== undefined ? q.sayfaIndex + 1 : 1);
              return qPage === selectedPageFilter;
            });

            return (
              <div
                key={arch.id}
                className={`bg-white border rounded-3xl transition-all shadow-2xs overflow-hidden ${
                  isSelected ? 'border-indigo-400 ring-2 ring-indigo-500/10' : 'border-slate-200/90 hover:border-indigo-300'
                }`}
              >
                {/* Compact Card Header Bar (Clickable) */}
                <div
                  onClick={() => {
                    const willSelect = !isSelected;
                    setSelectedArchiveId(willSelect ? arch.id : null);
                    setActivePageIndex(0);
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                    setRotation(0);

                    if (willSelect) {
                      const cached = fullArchiveCache[arch.id];
                      const curPhotos = cached?.sayfaFotolari || arch.sayfaFotolari || [];
                      const hasFull = curPhotos.some((p: any) => typeof p === 'string' ? p.length > 500 : Boolean(p?.imageBase64 && p.imageBase64.length > 500));
                      if (!hasFull && loadingArchiveId !== arch.id) {
                        setLoadingArchiveId(arch.id);
                        getExamArchiveById(arch.id)
                          .then((fetched) => {
                            if (fetched) {
                              setFullArchiveCache((prev) => ({ ...prev, [arch.id]: fetched }));
                            }
                          })
                          .catch((err) => console.warn('getExamArchiveById error:', err))
                          .finally(() => setLoadingArchiveId(null));
                      }
                    }
                  }}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-indigo-50/50 border-b border-indigo-100' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${
                        arch.sinavTuru === 'TYT'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {arch.sinavTuru}
                    </span>

                    {arch.isNew && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 animate-pulse">
                        YENİ
                      </span>
                    )}

                    {arch.ogrenciYukledi && !arch.isNew && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        📸 Öğrenci Yükledi
                      </span>
                    )}

                    <h4 className="text-sm font-bold text-slate-900">{arch.sinavAdi}</h4>

                    {getAIStatusTag(arch, false)}
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-slate-700">
                        Net: <span className="text-indigo-600">{net.toFixed(2)}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {d}D • {y}Y • {b}B • {formatDate(arch.tarih)}
                      </div>
                    </div>

                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
                      isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                    }`}>
                      {isSelected ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Inline Expanded Detail Viewer (Directly Under Selected Card) */}
                {isSelected && (
                  <div className="p-5 sm:p-7 space-y-6 bg-white animate-fadeIn">
                    {/* Action Buttons Toolbar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <h4 className="text-base font-bold text-slate-900">{fullArch.sinavAdi}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Uygulama Tarihi: {formatDate(fullArch.tarih)} • Toplam {realQ.length || fullArch.toplamSoru || 0} Soru ({d}D • {y}Y • {b}B)
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Download Photos ZIP */}
                        <button
                          type="button"
                          onClick={() => handleDownloadPhotosZip(fullArch)}
                          disabled={isDownloadingZip}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
                          title="Tüm sayfa fotoğraflarını ZIP olarak bilgisayarına indir"
                        >
                          {isDownloadingZip ? (
                            <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                          <span>{isDownloadingZip ? (zipProgressText || 'İndiriliyor...') : `Fotoğrafları İndir (${photos.length || (fullArch as any).photosCount || 0} Sayfa .ZIP)`}</span>
                        </button>

                        {/* Kalan Sayfaları Çöz Button */}
                        <button
                          type="button"
                          onClick={async () => {
                            setIsRetrying(true);
                            setRetryMessage('Kalan sayfalar sıraya alınıyor...');
                            try {
                              const res = await retryExamAIAnalysis(fullArch.id, fullArch);
                              setRetryMessage(res.message || 'Kalan sayfalar çözülüyor.');
                              setTimeout(() => setRetryMessage(null), 3500);
                            } catch (err) {
                              console.error('Retry error:', err);
                              setRetryMessage('Bağlantı hatası oluştu.');
                              setTimeout(() => setRetryMessage(null), 3000);
                            } finally {
                              setIsRetrying(false);
                            }
                          }}
                          disabled={isRetrying}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
                          title="Çözülmemiş veya atlanmış sayfaları arka planda çözmeyi sürdür"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${isRetrying ? 'animate-spin' : ''}`} />
                          <span>Kalan Sayfaları Çöz</span>
                        </button>

                        {/* Tekrar Çöz (Resimleri Silmeden) Button */}
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirmResetId !== fullArch.id) {
                              setConfirmResetId(fullArch.id);
                              setTimeout(() => setConfirmResetId(null), 6000);
                              return;
                            }
                            setConfirmResetId(null);
                            setIsRetrying(true);
                            setRetryMessage('Görseller korundu, sorular ve netler sıfırlanıyor...');

                            const photoCount = photos.length || (fullArch as any).photosCount || 1;
                            const optimisticReset: OgrenciSinavKaydi = {
                              ...fullArch,
                              sorular: [],
                              toplamSoru: photoCount * 4,
                              dogruSayisi: 0,
                              yanlisSayisi: 0,
                              bosSayisi: 0,
                              net: 0,
                              toplamNet: 0,
                              aiStatus: 'processing',
                              aiStatusMessage: `Fotoğraflar korundu. Yapay zekâ ${photoCount} sayfayı baştan çözüyor (Sayfa 1/${photoCount})...`,
                              lastError: '',
                              nextRetryTime: null,
                            };
                            setFullArchiveCache((prev) => ({
                              ...prev,
                              [fullArch.id]: optimisticReset,
                            }));
                            if (onSaveExamArchive) {
                              onSaveExamArchive(optimisticReset);
                            }

                            try {
                              const res = await resetAndResolveExamAI(fullArch.id, fullArch);
                              if (res.archive) {
                                setFullArchiveCache((prev) => ({
                                  ...prev,
                                  [fullArch.id]: {
                                    ...(prev[fullArch.id] || {}),
                                    ...res.archive,
                                    sayfaFotolari: (prev[fullArch.id]?.sayfaFotolari?.length ? prev[fullArch.id].sayfaFotolari : res.archive.sayfaFotolari) || [],
                                    fotografYollari: (prev[fullArch.id]?.fotografYollari?.length ? prev[fullArch.id].fotografYollari : res.archive.fotografYollari) || [],
                                  },
                                }));
                                if (onSaveExamArchive) {
                                  onSaveExamArchive(res.archive);
                                }
                              }
                              setRetryMessage(res.message || 'Görseller korundu, tüm sorular baştan çözülüyor.');
                              setTimeout(() => setRetryMessage(null), 4000);
                            } catch (err) {
                              console.error('Reset error:', err);
                              setRetryMessage('Sıfırlama hatası oluştu.');
                              setTimeout(() => setRetryMessage(null), 3000);
                            } finally {
                              setIsRetrying(false);
                            }
                          }}
                          disabled={isRetrying}
                          className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer ${
                            confirmResetId === fullArch.id
                              ? 'bg-amber-100 hover:bg-amber-200 border-amber-400 text-amber-950 animate-pulse'
                              : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-900'
                          }`}
                          title="Yüklü sayfa fotoğraflarını silmeden sadece çözümleri sıfırla ve tüm soruları baştan çöz"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${confirmResetId === fullArch.id ? 'text-amber-700' : 'text-indigo-700'} ${isRetrying ? 'animate-spin' : ''}`} />
                          <span>{confirmResetId === fullArch.id ? '⚠️ Onaylamak için Tekrar Tıklayın (Resimler Silinmez!)' : 'Tekrar Çöz (Resimleri Silme)'}</span>
                        </button>

                        {/* Delete Exam Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirmDeleteId !== fullArch.id) {
                              setConfirmDeleteId(fullArch.id);
                              setTimeout(() => setConfirmDeleteId(null), 4000);
                              return;
                            }
                            setConfirmDeleteId(null);
                            onDeleteArchive(fullArch.id);
                          }}
                          className={`p-2 rounded-xl transition-all flex items-center gap-1 text-xs font-bold cursor-pointer ${
                            confirmDeleteId === fullArch.id
                              ? 'bg-rose-100 border border-rose-300 text-rose-800 px-2.5 animate-pulse'
                              : 'text-slate-300 hover:text-rose-600 hover:bg-slate-50'
                          }`}
                          title="Arşivi Sil"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" />
                          {confirmDeleteId === fullArch.id && <span>Silmek için tekrar tıkla</span>}
                        </button>
                      </div>
                    </div>

                    {/* Loading Banner for High-Res Photos */}
                    {loadingArchiveId === fullArch.id && (
                      <div className="p-4 rounded-2xl bg-indigo-50/90 border border-indigo-200 text-indigo-950 flex items-center gap-3 animate-pulse">
                        <Loader2 className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
                        <div>
                          <p className="text-xs font-bold">Sayfa Görselleri ve Detaylı Çözümler Yükleniyor...</p>
                          <p className="text-[11px] text-indigo-700 opacity-90">Yüksek çözünürlüklü kitapçık fotoğrafları sunucudan getiriliyor, lütfen bekleyin.</p>
                        </div>
                      </div>
                    )}

                    {/* Status Alert for Background AI / Quota */}
                    {(() => {
                      const totalPages = photos.length || (fullArch as any).photosCount || (fullArch as any).sayfaSayisi || 0;
                      const coveredPagesSet = new Set((fullArch.sorular || []).map(q => (q.sayfaIndex !== undefined && typeof q.sayfaIndex === 'number' && q.sayfaIndex >= 0) ? q.sayfaIndex + 1 : (q.sayfaNo || 1)).filter(Boolean));
                      const realQuestions = (fullArch.sorular || []).filter(q => q.unite !== "Çözülmemiş / Boş Sayfa" && q.unite !== "Boş / Çözülmemiş Sayfa");
                      const isAllCovered = totalPages > 0 && coveredPagesSet.size >= totalPages;
                      const isCompleted = fullArch.aiStatus === 'completed' || (isAllCovered && realQuestions.length > 0);

                      if (!isCompleted && (fullArch.aiStatus === 'processing' || fullArch.aiStatus === 'rate_limited' || fullArch.aiStatus === 'pending' || fullArch.aiStatus === 'error' || fullArch.lastError)) {
                        const isRateLimited = fullArch.aiStatus === 'rate_limited' || fullArch.aiStatus === 'error' || Boolean(fullArch.lastError);
                        const isPending = fullArch.aiStatus === 'pending';
                        const nextRetryTimeStr = fullArch.nextRetryTime ? new Date(fullArch.nextRetryTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : null;

                        return (
                          <div className={`p-4 rounded-2xl border text-xs flex flex-col gap-3 shadow-xs ${
                            isRateLimited
                              ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                              : isPending
                              ? 'bg-sky-50/90 border-sky-300 text-sky-950'
                              : 'bg-indigo-50/90 border-indigo-200 text-indigo-900'
                          }`}>
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5">
                                {isRateLimited ? (
                                  <Hourglass className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                                ) : isPending ? (
                                  <Clock className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                                ) : (
                                  <Loader2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5 animate-spin" />
                                )}
                                <div className="space-y-1">
                                  <div className="font-bold text-sm flex flex-wrap items-center gap-2">
                                    <span>
                                      {isRateLimited
                                        ? `⏳ Yapay Zekâ Kotası / Sunucu Bekleniyor (Çözülen: ${coveredPagesSet.size}/${totalPages || 1} Sayfa)`
                                        : isPending
                                        ? `⏳ Test Sırada Bekliyor (Çözülen: ${coveredPagesSet.size}/${totalPages || 1} Sayfa)`
                                        : `⚡ Yapay Zekâ Soruları Çözüyor (Çözülen: ${coveredPagesSet.size}/${totalPages || 1} Sayfa)`}
                                    </span>
                                    {nextRetryTimeStr && isRateLimited && (
                                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300">
                                        ⏰ Sıradaki Otomatik Deneme: {nextRetryTimeStr}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] font-medium opacity-90">
                                    {fullArch.aiStatusMessage || (
                                      isRateLimited
                                        ? 'Tüm modeller sırayla denendi. Sistem kotalar yenilenince otomatik olarak çözmeye devam edecektir.'
                                        : isPending
                                        ? 'Önceki test çözülüyor. Tamamlandığında bu test otomatik olarak başlayacaktır.'
                                        : 'Yapay zekâ test fotoğraflarındaki soruları ve MEB kazanımlarını çözmektedir.'
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Booklet Photo Viewer with Interactive Canvas */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                            <Camera className="w-4 h-4 text-indigo-600" />
                            <span>Kitapçık Fotoğrafı ({photos.length} Sayfa)</span>
                          </div>
                        </div>

                        {/* Zoom / Pan Controls */}
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={handleZoomIn}
                            className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200"
                            title="Yakınlaştır"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleZoomOut}
                            className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200"
                            title="Uzaklaştır"
                          >
                            <ZoomOut className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleRotateCcw}
                            className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200"
                            title="Sola 90° Döndür"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleRotateCw}
                            className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200"
                            title="Sağa 90° Döndür"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleResetZoom}
                            className="px-2 py-0.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200"
                            title="Sıfırla"
                          >
                            {Math.round(zoom * 100)}%
                          </button>
                        </div>
                      </div>

                      {/* Photo Display Frame */}
                      <div
                        className="relative w-full h-[400px] sm:h-[480px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                      >
                        {activePhotoUrl ? (
                          <div
                            className="transition-transform duration-75 ease-out flex items-center justify-center"
                            style={{
                              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                              transformOrigin: 'center center',
                            }}
                          >
                            <img
                              src={activePhotoUrl}
                              alt={`Sayfa ${activePageIndex + 1}`}
                              className="max-h-[380px] sm:max-h-[460px] w-auto object-contain pointer-events-none rounded shadow-lg"
                            />
                          </div>
                        ) : (
                          <div className="text-center text-slate-500 space-y-2 p-6">
                            <Camera className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                            <p className="text-xs">Bu sayfa için görsel verisi yüklenemedi.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Questions & Step-by-step Solution List */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-indigo-600" />
                          <h4 className="text-sm font-bold text-slate-900">
                            Sorular ve Adım Adım Yapay Zekâ Çözümleri ({filteredQuestions.length} Soru)
                          </h4>
                        </div>

                        {photos.length > 1 && (
                          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl">
                            <button
                              type="button"
                              onClick={() => setSelectedPageFilter('all')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                selectedPageFilter === 'all'
                                  ? 'bg-white text-indigo-600 shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Tüm Sayfalar
                            </button>
                            {photos.map((_, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => {
                                  setActivePageIndex(pIdx);
                                  setSelectedPageFilter(pIdx + 1);
                                  setZoom(1);
                                  setPan({ x: 0, y: 0 });
                                  setRotation(0);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  selectedPageFilter === pIdx + 1
                                    ? 'bg-white text-indigo-600 shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Sayfa {pIdx + 1}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        {filteredQuestions.length > 0 ? (
                          filteredQuestions.map((q) => {
                            const isFillInBlank = q.soruTuru === 'bosluk_doldurma' || q.soruTuru === 'acik_uclu';
                            const hasOptionMatch = Boolean(
                              !isFillInBlank &&
                              q.isaretlenenSik &&
                              q.dogruCevap &&
                              q.isaretlenenSik !== 'Boş' &&
                              q.isaretlenenSik !== '-' &&
                              q.isaretlenenSik.trim().toUpperCase() === q.dogruCevap.trim().toUpperCase()
                            );
                            const isDogru = hasOptionMatch || (q.durum === 'dogru' || (q.durum !== 'bos' && q.dogruMu));
                            const isBlank = !isDogru && (q.durum === 'bos' || (!q.durum && (!q.isaretlenenSik || q.isaretlenenSik === 'Boş' || q.ogrenciCevabi === 'Boş')));
                            const isYanlis = !isDogru && !isBlank;
                            const isUnsolvedPlaceholder = q.unite === "Çözülmemiş / Boş Sayfa" || q.unite === "Boş / Çözülmemiş Sayfa" || q.ders === "Genel" || q.konu === "Öğrenci Tarafından Çözülmemiş";

                            return (
                              <div
                                key={q.soruNo}
                                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                                  isDogru
                                    ? 'bg-emerald-50/40 border-emerald-200'
                                    : isBlank
                                    ? 'bg-slate-50 border-slate-200'
                                    : 'bg-rose-50/40 border-rose-200'
                                }`}
                              >
                                {isUnsolvedPlaceholder && (
                                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                        <span>Bu sayfa yapay zekâ tarafından boş veya çözülmemiş olarak kaydedilmiş.</span>
                                      </div>
                                      <button
                                        type="button"
                                        disabled={reanalyzingPageNo === (q.sayfaNo || 1)}
                                        onClick={() => handleReanalyzePage(fullArch, q.sayfaNo || 1)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                                      >
                                        {reanalyzingPageNo === (q.sayfaNo || 1) ? (
                                          <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Taranıyor...</span>
                                          </>
                                        ) : (
                                          <>
                                            <Sparkles className="w-3.5 h-3.5" />
                                            <span>🔍 Sayfa {q.sayfaNo || 1}'i Tekrar Tara & Çöz</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                    <p className="text-[11px] text-amber-700">
                                      Öğrenci bu sayfadaki soruları çözmüşse, butona tıklayarak yapay zekanın sadece bu sayfayı yüksek hassasiyetle yeniden okumasını sağlayabilirsiniz.
                                    </p>
                                  </div>
                                )}

                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                                      {q.soruNo}
                                    </span>

                                    <span className="text-xs font-bold text-slate-800">
                                      {q.ders || 'Genel'} • {q.unite || 'Genel Konu'}
                                      {q.konu ? ` (${q.konu})` : ''}
                                    </span>

                                    {q.kazanimKodu && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                        {q.kazanimKodu}
                                      </span>
                                    )}

                                    {isFillInBlank && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200">
                                        ✍️ Açık Uçlu / Yazılı
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {/* Editable D / Y / B status selector */}
                                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
                                      <button
                                        type="button"
                                        title="Doğru olarak işaretle"
                                        onClick={() => handleUpdateQuestionStatus(fullArch, q.soruNo, 'dogru')}
                                        className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                                          isDogru ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500 hover:text-emerald-700'
                                        }`}
                                      >
                                        D
                                      </button>
                                      <button
                                        type="button"
                                        title="Yanlış olarak işaretle"
                                        onClick={() => handleUpdateQuestionStatus(fullArch, q.soruNo, 'yanlis')}
                                        className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                                          isYanlis ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-500 hover:text-rose-700'
                                        }`}
                                      >
                                        Y
                                      </button>
                                      <button
                                        type="button"
                                        title="Boş olarak işaretle"
                                        onClick={() => handleUpdateQuestionStatus(fullArch, q.soruNo, 'bos')}
                                        className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                                          isBlank ? 'bg-slate-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                      >
                                        B
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {q.kazanimAciklama && (
                                  <p className="text-[11px] text-slate-600 italic">
                                    📌 {q.kazanimAciklama}
                                  </p>
                                )}

                                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                                  <span>
                                    {isFillInBlank ? (
                                      <>
                                        Öğrenci Cevabı: <strong className="text-slate-800">{isBlank ? 'Boş' : q.ogrenciCevabi}</strong> • Beklenen: <strong className="text-emerald-700">{q.dogruCevap}</strong>
                                      </>
                                    ) : (
                                      <>
                                        İşaretlenen: <strong className="text-slate-800">{isBlank ? 'Boş' : (q.ogrenciCevabi || q.isaretlenenSik || 'Boş')}</strong> • Doğru Şık: <strong className="text-emerald-700">{q.dogruCevap}</strong>
                                      </>
                                    )}
                                  </span>
                                  {q.analizNotu && (
                                    <span className="text-slate-400 italic max-w-xs truncate" title={q.analizNotu}>
                                      {q.analizNotu}
                                    </span>
                                  )}
                                </div>

                                {/* AI Step-by-step Solution Display & Editor */}
                                <QuestionSolutionView
                                  cozumDetayi={q.cozumDetayi || q.cozum}
                                  unite={q.unite}
                                  konu={q.konu}
                                  ders={q.ders}
                                  soruNo={q.soruNo}
                                  soruTuru={q.soruTuru}
                                  kazanimKodu={q.kazanimKodu}
                                  kazanimAciklama={q.kazanimAciklama}
                                  dogruCevap={q.dogruCevap}
                                  ogrenciCevabi={isBlank ? 'Boş' : (q.ogrenciCevabi || q.isaretlenenSik || 'Boş')}
                                  dogruMu={isDogru}
                                  durum={isDogru ? 'dogru' : (isBlank ? 'bos' : 'yanlis')}
                                  canEdit={Boolean(onSaveExamArchive)}
                                  onSaveSolution={(newSol) => handleSaveQuestionSolution(fullArch, q.soruNo, newSol)}
                                  soruFotografYolu={q.soruFotografYolu}
                                  pagePhoto={photos[(q.sayfaNo || 1) - 1] || photos[0]}
                                  kutu={q.kutu}
                                  onSaveCrop={(newCrop, newKutu) => handleSaveQuestionCrop(fullArch, q.soruNo, newCrop, newKutu)}
                                />
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                            <p className="text-slate-500 text-xs font-semibold">
                              {selectedPageFilter !== 'all' ? `Sayfa ${selectedPageFilter} için henüz çözülmüş soru bulunmuyor.` : 'Bu denemede henüz çözülmüş soru bulunmuyor.'}
                            </p>
                            {selectedPageFilter !== 'all' && (
                              <button
                                type="button"
                                disabled={reanalyzingPageNo === selectedPageFilter}
                                onClick={() => handleReanalyzePage(fullArch, selectedPageFilter as number)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                              >
                                {reanalyzingPageNo === selectedPageFilter ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Sayfa {selectedPageFilter} Taranıyor...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>🔍 Sayfa {selectedPageFilter}'i Yapay Zekâ ile Tara & Çöz</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 space-y-2">
            <Archive className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-semibold">Arşivlenmiş sınav kaydı bulunamadı.</p>
          </div>
        )}
      </div>

      {/* Optical Exam Upload Modal for Coach */}
      {isUploadModalOpen && activeStudent && (
        <StudentTestUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          student={activeStudent}
          curriculum={curriculum}
          onTestUploaded={(newArch, newDeneme) => {
            if (onSaveExamArchive) {
              onSaveExamArchive(newArch, newDeneme);
            }
            setSelectedArchiveId(newArch.id);
            setIsUploadModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
