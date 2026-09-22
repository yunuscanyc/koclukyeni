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
  Sparkles,
  Loader2,
  Hourglass,
  Clock,
  RefreshCw,
  Download
} from 'lucide-react';
import { OgrenciSinavKaydi, SinavSorusu, DenemeSinavi } from '../../../types';
import { retryExamAIAnalysis, markArchiveAsRead, getExamArchiveById, resetAndResolveExamAI } from '../../../lib/apiService';
import { QuestionSolutionView } from '../QuestionSolutionView';
import { formatDate } from '../../../utils/dateUtils';

interface ExamHistoryTabProps {
  archives: OgrenciSinavKaydi[];
  onDeleteArchive: (id: string) => void;
  studentName: string;
  onSaveExamArchive?: (archive: OgrenciSinavKaydi, newDeneme?: Omit<DenemeSinavi, 'id'> | DenemeSinavi) => void;
}

export const ExamHistoryTab: React.FC<ExamHistoryTabProps> = ({
  archives,
  onDeleteArchive,
  studentName,
  onSaveExamArchive,
}) => {
  const [selectedArchiveId, setSelectedArchiveId] = useState<string | null>(
    archives[0]?.id || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'Tümü' | 'TYT' | 'AYT'>('Tümü');

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
  const [confirmResetId, setConfirmResetId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [zipProgressText, setZipProgressText] = useState('');

  // Cache for on-demand loaded full archives with high-res base64 photos
  const [fullArchiveCache, setFullArchiveCache] = useState<Record<string, OgrenciSinavKaydi>>({});
  const [loadingArchiveId, setLoadingArchiveId] = useState<string | null>(null);

  // Synchronize selection when archives array loads/updates
  useEffect(() => {
    if (archives.length > 0) {
      if (!selectedArchiveId || !archives.some((a) => a.id === selectedArchiveId)) {
        setSelectedArchiveId(archives[0].id);
      }
    }
  }, [archives, selectedArchiveId]);

  // Lazy-fetch full archive details (high-res page photos) when an archive is selected
  useEffect(() => {
    if (!selectedArchiveId) return;
    const rawArch = archives.find((a) => a.id === selectedArchiveId);
    if (!rawArch) return;

    const cached = fullArchiveCache[selectedArchiveId];
    const photos = cached?.sayfaFotolari || rawArch.sayfaFotolari || [];
    const hasFullPhotos = photos.some((p) => typeof p === 'string' && p.length > 500);

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
  }, [selectedArchiveId, archives]);

  // When coach views an archive, mark it as read on the backend (isNew: false)
  const markedAsReadRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    if (selectedArchiveId) {
      const active = archives.find((a) => a.id === selectedArchiveId);
      if (active && (active.isNew || active.durum === 'Yeni') && !markedAsReadRef.current.has(active.id)) {
        markedAsReadRef.current.add(active.id);
        markArchiveAsRead(active.id).catch((err) => console.warn('markArchiveAsRead error:', err));
      }
    }
  }, [selectedArchiveId, archives]);

  // Automatically mark all of this student's archives in this tab as read when viewed
  useEffect(() => {
    const newArchives = archives.filter((a) => (a.isNew || a.durum === 'Yeni') && !markedAsReadRef.current.has(a.id));
    if (newArchives.length > 0) {
      newArchives.forEach((a) => {
        markedAsReadRef.current.add(a.id);
        markArchiveAsRead(a.id).catch((err) => console.warn('markArchiveAsRead error:', err));
      });
    }
  }, [archives]);

  const handleRetryAI = async (archiveId: string) => {
    try {
      setIsRetrying(true);
      setRetryMessage(null);
      const res = await retryExamAIAnalysis(archiveId, activeArchive || undefined);
      if (res.archive) {
        setFullArchiveCache(prev => ({
          ...prev,
          [archiveId]: {
            ...(prev[archiveId] || {}),
            ...res.archive,
            sayfaFotolari: (prev[archiveId]?.sayfaFotolari?.length ? prev[archiveId].sayfaFotolari : res.archive.sayfaFotolari) || [],
            fotografYollari: (prev[archiveId]?.fotografYollari?.length ? prev[archiveId].fotografYollari : res.archive.fotografYollari) || [],
          }
        }));
        if (onSaveExamArchive) {
          onSaveExamArchive(res.archive);
        }
      }
      setRetryMessage(res.message || 'Yapay zekâ kuyruğuna eklendi.');
    } catch (err: any) {
      setRetryMessage('Hata: ' + (err?.message || 'İşlem başlatılamadı'));
    } finally {
      setIsRetrying(false);
    }
  };

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
    const totalPages = photos.length;
    const realQuestions = (arch.sorular || []).filter(q => q.unite !== "Çözülmemiş / Boş Sayfa" && q.unite !== "Boş / Çözülmemiş Sayfa");
    const coveredPagesSet = new Set((arch.sorular || []).map(q => (q.sayfaIndex !== undefined && typeof q.sayfaIndex === 'number' && q.sayfaIndex >= 0) ? q.sayfaIndex + 1 : (q.sayfaNo || 1)).filter(Boolean));
    const attemptedPagesSet = new Set(realQuestions.filter(q => q.isaretlenenSik && q.isaretlenenSik !== "Boş").map(q => (q.sayfaIndex !== undefined && typeof q.sayfaIndex === 'number' && q.sayfaIndex >= 0) ? q.sayfaIndex + 1 : (q.sayfaNo || 1)));
    
    const isAllCovered = totalPages === 0 || (coveredPagesSet.size >= totalPages && totalPages > 0);
    const isCompleted = arch.aiStatus === 'completed' || (isAllCovered && arch.aiStatus !== 'processing' && arch.aiStatus !== 'rate_limited');

    if (isCompleted) {
      const solvedCount = attemptedPagesSet.size;
      const unattemptedCount = Math.max(0, totalPages - solvedCount);

      if (totalPages > 0 && unattemptedCount > 0 && solvedCount > 0) {
        return (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
            isSelected ? 'bg-sky-400 text-slate-950' : 'bg-sky-50 text-sky-700 border border-sky-200'
          }`} title={`${totalPages} sayfanın ${solvedCount} sayfası çözüldü, ${unattemptedCount} sayfa boş bırakıldı`}>
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>{solvedCount}/{totalPages} Çözüldü ({unattemptedCount} Boş)</span>
          </span>
        );
      }

      return (
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
          isSelected ? 'bg-emerald-400 text-slate-950' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          <CheckCircle2 className="w-2.5 h-2.5" />
          <span>{totalPages > 0 ? `Yapay Zekâ Çözdü (${totalPages} Sayfa)` : 'Yapay Zekâ Çözdü'}</span>
        </span>
      );
    }

    if (arch.aiStatus === 'rate_limited') {
      return (
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse ${
          isSelected ? 'bg-amber-300 text-amber-950' : 'bg-amber-50 text-amber-800 border border-amber-200'
        }`}>
          <Hourglass className="w-2.5 h-2.5" />
          <span>Kota Bekleniyor ({coveredPagesSet.size}/{totalPages})</span>
        </span>
      );
    }

    const isActivelyProcessing = arch.aiStatus === 'processing';

    if (totalPages > 0 && coveredPagesSet.size > 0 && coveredPagesSet.size < totalPages) {
      return (
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
          isSelected ? 'bg-indigo-400 text-slate-950' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
        }`}>
          {isActivelyProcessing ? (
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
          ) : (
            <Clock className="w-2.5 h-2.5" />
          )}
          <span>{isActivelyProcessing ? 'Çözülüyor' : 'Kısmen Çözüldü'} ({coveredPagesSet.size}/{totalPages})</span>
        </span>
      );
    }

    if (isActivelyProcessing) {
      return (
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
        }`}>
          <Loader2 className="w-2.5 h-2.5 animate-spin" />
          <span>{arch.aiStatusMessage ? arch.aiStatusMessage.slice(0, 20) + '...' : 'Devam Ediyor'}</span>
        </span>
      );
    }

    return (
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
      }`}>
        <Clock className="w-2.5 h-2.5" />
        <span>{arch.aiStatusMessage ? arch.aiStatusMessage.slice(0, 20) + '...' : 'Bekliyor'}</span>
      </span>
    );
  };

  const filteredArchives = archives.filter((a) => {
    const matchesType = selectedType === 'Tümü' || a.sinavTuru === selectedType;
    const matchesSearch =
      a.sinavAdi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tarih.includes(searchQuery);
    return matchesType && matchesSearch;
  });

  const rawActive = archives.find((a) => a.id === selectedArchiveId) || filteredArchives[0] || archives[0] || null;
  const cached = selectedArchiveId ? fullArchiveCache[selectedArchiveId] : undefined;
  const activeArchive: OgrenciSinavKaydi | null = rawActive
    ? {
        ...cached,
        ...rawActive,
        sayfaFotolari:
          (cached?.sayfaFotolari && cached.sayfaFotolari.some((p: any) => typeof p === 'string' ? p.length > 500 : Boolean(p?.imageBase64 && p.imageBase64.length > 500)))
            ? cached.sayfaFotolari
            : (rawActive.sayfaFotolari && rawActive.sayfaFotolari.some((p: any) => typeof p === 'string' ? p.length > 500 : Boolean(p?.imageBase64 && p.imageBase64.length > 500)) ? rawActive.sayfaFotolari : cached?.sayfaFotolari || []),
        fotografYollari:
          (cached?.fotografYollari && cached.fotografYollari.some((p: any) => typeof p === 'string' ? p.length > 500 : Boolean(p?.imageBase64 && p.imageBase64.length > 500)))
            ? cached.fotografYollari
            : (rawActive.fotografYollari && rawActive.fotografYollari.some((p: any) => typeof p === 'string' ? p.length > 500 : Boolean(p?.imageBase64 && p.imageBase64.length > 500)) ? rawActive.fotografYollari : cached?.fotografYollari || []),
      }
    : null;

  // Reset page and selection when switching active archive
  useEffect(() => {
    setActivePageIndex(0);
    setSelectedQuestionNo(null);
    setSelectedPageFilter('all');
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  }, [selectedArchiveId]);

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
  const handleSelectQuestion = (q: SinavSorusu) => {
    setSelectedQuestionNo(q.soruNo);

    // Determine target page index
    let targetIndex = -1;
    if (typeof q.sayfaNo === 'number' && q.sayfaNo >= 1) {
      targetIndex = q.sayfaNo - 1;
    } else if (q.sayfaFotoUrl && activeArchive?.sayfaFotolari) {
      targetIndex = activeArchive.sayfaFotolari.indexOf(q.sayfaFotoUrl);
    }

    if (targetIndex >= 0 && activeArchive?.sayfaFotolari && targetIndex < activeArchive.sayfaFotolari.length) {
      setActivePageIndex(targetIndex);
    }
  };

  const handleSaveQuestionSolution = (questionNo: number, newSolution: string) => {
    if (!activeArchive || !onSaveExamArchive) return;
    const updatedSorular = (activeArchive.sorular || []).map((q) => {
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
      ...activeArchive,
      sorular: updatedSorular,
    };

    onSaveExamArchive(updatedArchive);
  };

  const handleUpdateQuestionStatus = (questionNo: number, newStatus: 'dogru' | 'yanlis' | 'bos', newOgrenciCevap?: string) => {
    if (!activeArchive || !onSaveExamArchive) return;
    const updatedSorular = (activeArchive.sorular || []).map((q) => {
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
    const net = Math.max(0, testD - (testY * 0.25));

    const updatedArchive: OgrenciSinavKaydi = {
      ...activeArchive,
      sorular: updatedSorular,
      dogruSayisi: dCount,
      yanlisSayisi: yCount,
      bosSayisi: bCount,
      toplamNet: Number(net.toFixed(2)),
      net: Number(net.toFixed(2)),
    };

    onSaveExamArchive(updatedArchive);
  };

  const currentPhoto = activeArchive?.sayfaFotolari?.[activePageIndex] || null;

  // Filter questions by selected page filter if active
  const displayedQuestions = (activeArchive?.sorular || []).filter((q) => {
    if (selectedPageFilter === 'all') return true;
    const qPage = q.sayfaNo || 1;
    return qPage === selectedPageFilter;
  });

  const selectedQuestionObj = activeArchive?.sorular?.find((q) => q.soruNo === selectedQuestionNo);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Archive className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                9. Sınav Geçmişi & Sayfa Fotoğrafları Arşivi
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              {studentName} için yapay zekâ optik taraması yapılmış tüm denemeler ve sayfa görselleri ({archives.length} Kayıt)
            </p>
          </div>

          <div className="flex items-center gap-1.5">
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
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List of Archives */}
        <div className="lg:col-span-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Arşivde deneme ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
          </div>

          <div className="space-y-1.5 max-h-[700px] overflow-y-auto pr-1">
            {filteredArchives.length > 0 ? (
              filteredArchives.map((arch) => {
                const isSelected = activeArchive?.id === arch.id;
                return (
                  <div
                    key={arch.id}
                    onClick={() => {
                      setSelectedArchiveId(isSelected ? null : arch.id);
                      setActivePageIndex(0);
                      setZoom(1);
                      setPan({ x: 0, y: 0 });
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-800 border-slate-200/90 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : arch.sinavTuru === 'TYT'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {arch.sinavTuru}
                        </span>

                        {arch.isNew && (
                          <span className={`text-[8px] font-black px-1 py-0.2 rounded-full ${
                            isSelected ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-900 border border-amber-300'
                          } animate-pulse`}>
                            YENİ
                          </span>
                        )}

                        {arch.ogrenciYukledi && !arch.isNew && (
                          <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'
                          }`}>
                            📸 Öğrenci
                          </span>
                        )}

                        {getAIStatusTag(arch, isSelected)}
                      </div>

                      <span
                        className={`text-[9px] font-semibold ${
                          isSelected ? 'text-indigo-100' : 'text-slate-400'
                        }`}
                      >
                        {formatDate(arch.tarih)}
                      </span>
                    </div>

                    <h4 className="text-[11px] font-bold leading-tight line-clamp-1">{arch.sinavAdi}</h4>

                    {(() => {
                      const realQ = (arch.sorular || []).filter(q => q.unite !== "Çözülmemiş / Boş Sayfa" && q.unite !== "Boş / Çözülmemiş Sayfa");
                      let d = arch.dogruSayisi || 0;
                      let y = arch.yanlisSayisi || 0;
                      let b = arch.bosSayisi || 0;
                      let net = arch.toplamNet || 0;
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
                      return (
                        <div
                          className={`flex items-center justify-between pt-1 border-t text-[10px] font-bold ${
                            isSelected ? 'border-white/10 text-white' : 'border-slate-100 text-slate-500'
                          }`}
                        >
                          <span>
                            Net: <strong className={isSelected ? 'text-white' : 'text-indigo-700'}>{net.toFixed(2)}</strong>
                          </span>
                          <span>
                            {d}D • {y}Y • {b}B
                          </span>
                        </div>
                      );
                    })()}

                    {/* Image loading status indicator */}
                    {(() => {
                      const cached = fullArchiveCache[arch.id];
                      const photos = cached?.sayfaFotolari || arch.sayfaFotolari || [];
                      const hasFullPhotos = photos.some((p) => typeof p === 'string' && p.length > 500);
                      const isLoadingThis = loadingArchiveId === arch.id;

                      if (isLoadingThis) {
                        return (
                          <div className={`text-[9px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                            isSelected ? 'bg-indigo-700 text-white' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          } animate-pulse`}>
                            <Loader2 className="w-2.5 h-2.5 animate-spin shrink-0 text-indigo-500" />
                            <span>Görseller & Detaylar Yükleniyor...</span>
                          </div>
                        );
                      }

                      if (photos.length > 0 && !hasFullPhotos) {
                        return (
                          <div className={`text-[9px] font-medium px-2 py-0.5 rounded flex items-center gap-1 ${
                            isSelected ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            <Hourglass className="w-2.5 h-2.5 shrink-0" />
                            <span>Temel Bilgiler Yüklendi (Görseller Tıklanınca Yüklenir)</span>
                          </div>
                        );
                      }

                      return null;
                    })()}
                  </div>
                );
              })
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-400 text-xs">
                Arşivlenmiş sınav kaydı bulunamadı.
              </div>
            )}
          </div>
        </div>

        {/* Right Detail Viewer: Top Photo Viewer + Bottom Questions Table */}
        <div className="lg:col-span-8 space-y-6">
          {activeArchive ? (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-6">
              {/* Exam Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        activeArchive.sinavTuru === 'TYT'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {activeArchive.sinavTuru}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{activeArchive.sinavAdi}</h3>
                    {getAIStatusTag(activeArchive, false)}
                  </div>
                  {(() => {
                    const realQ = (activeArchive.sorular || []).filter(q => q.unite !== "Çözülmemiş / Boş Sayfa" && q.unite !== "Boş / Çözülmemiş Sayfa");
                    let totalS = realQ.length > 0 ? realQ.length : (activeArchive.toplamSoru || 0);
                    let d = activeArchive.dogruSayisi || 0;
                    let y = activeArchive.yanlisSayisi || 0;
                    let b = activeArchive.bosSayisi || 0;
                    let net = activeArchive.toplamNet || 0;
                    if (realQ.length > 0) {
                      d = realQ.filter(q => q.durum === 'dogru' || (q.durum !== 'bos' && q.dogruMu)).length;
                      b = realQ.filter(q => q.durum === 'bos' || (!q.durum && (!q.isaretlenenSik || q.isaretlenenSik === "Boş" || q.ogrenciCevabi === "Boş"))).length;
                      y = Math.max(0, totalS - d - b);
                      const testQ = realQ.filter(q => !q.soruTuru || q.soruTuru === 'coktan_secmeli');
                      const testD = testQ.filter(q => q.durum === 'dogru' || (q.durum !== 'bos' && q.dogruMu)).length;
                      const testB = testQ.filter(q => q.durum === 'bos' || (!q.durum && (!q.isaretlenenSik || q.isaretlenenSik === "Boş" || q.ogrenciCevabi === "Boş"))).length;
                      const testY = Math.max(0, testQ.length - testD - testB);
                      net = Math.max(0, Number((testD - testY * 0.25).toFixed(2)));
                    }
                    return (
                      <>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Uygulama Tarihi: {formatDate(activeArchive.tarih)} • Toplam {totalS} Soru ({d}D • {y}Y • {b}B)
                        </p>
                      </>
                    );
                  })()}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                    Net: <span className="text-indigo-700">{(() => {
                      const realQ = (activeArchive.sorular || []).filter(q => q.unite !== "Çözülmemiş / Boş Sayfa" && q.unite !== "Boş / Çözülmemiş Sayfa");
                      if (realQ.length > 0) {
                        const testQ = realQ.filter(q => !q.soruTuru || q.soruTuru === 'coktan_secmeli');
                        const testD = testQ.filter(q => q.durum === 'dogru' || (q.durum !== 'bos' && q.dogruMu)).length;
                        const testB = testQ.filter(q => q.durum === 'bos' || (!q.durum && (!q.isaretlenenSik || q.isaretlenenSik === "Boş" || q.ogrenciCevabi === "Boş"))).length;
                        const testY = Math.max(0, testQ.length - testD - testB);
                        return Math.max(0, Number((testD - testY * 0.25).toFixed(2))).toFixed(2);
                      }
                      return (activeArchive.toplamNet || 0).toFixed(2);
                    })()}</span>
                  </div>

                  {/* Fotoğrafları ZIP Olarak İndir Button */}
                  {(() => {
                    const photosCount = activeArchive.sayfaFotolari?.length || activeArchive.fotografYollari?.length || (activeArchive as any).photosCount || 0;
                    return (
                      <button
                        onClick={() => handleDownloadPhotosZip(activeArchive)}
                        disabled={isDownloadingZip}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
                        title="Bu sınavdaki tüm sayfa fotoğraflarını tek bir ZIP arşivi olarak bilgisayarına indir"
                      >
                        {isDownloadingZip ? (
                          <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                        <span>{isDownloadingZip ? (zipProgressText || 'İndiriliyor...') : `Fotoğrafları İndir (${photosCount} Fotoğraf .ZIP)`}</span>
                      </button>
                    );
                  })()}

                  {/* Kalan Sayfaları Çöz Button */}
                  <button
                    onClick={async () => {
                      setIsRetrying(true);
                      setRetryMessage('Kalan sayfalar sıraya alınıyor...');
                      try {
                        const res = await retryExamAIAnalysis(activeArchive.id, activeArchive);
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
                    className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 disabled:opacity-50"
                    title="Çözülmemiş veya atlanmış sayfaları arka planda çözmeyi sürdür"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${isRetrying ? 'animate-spin' : ''}`} />
                    <span>Kalan Sayfaları Çöz</span>
                  </button>

                  {/* Tekrar Çöz (Resimleri Silmeden) Button */}
                  <button
                    onClick={async () => {
                      if (confirmResetId !== activeArchive.id) {
                        setConfirmResetId(activeArchive.id);
                        setTimeout(() => setConfirmResetId(null), 6000);
                        return;
                      }
                      setConfirmResetId(null);
                      setIsRetrying(true);
                      setRetryMessage('Görseller korundu, sorular ve netler sıfırlanıyor...');

                      // Optimistically clear questions and reset counters immediately
                      const photosList = activeArchive.sayfaFotolari || activeArchive.fotografYollari || [];
                      const photoCount = photosList.length || (activeArchive as any).photosCount || 1;
                      const optimisticReset: OgrenciSinavKaydi = {
                        ...activeArchive,
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
                        [activeArchive.id]: optimisticReset,
                      }));
                      if (onSaveExamArchive) {
                        onSaveExamArchive(optimisticReset);
                      }

                      try {
                        const res = await resetAndResolveExamAI(activeArchive.id, activeArchive);
                        if (res.archive) {
                          setFullArchiveCache((prev) => ({
                            ...prev,
                            [activeArchive.id]: {
                              ...(prev[activeArchive.id] || {}),
                              ...res.archive,
                              sayfaFotolari: (prev[activeArchive.id]?.sayfaFotolari?.length ? prev[activeArchive.id].sayfaFotolari : res.archive.sayfaFotolari) || [],
                              fotografYollari: (prev[activeArchive.id]?.fotografYollari?.length ? prev[activeArchive.id].fotografYollari : res.archive.fotografYollari) || [],
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
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 disabled:opacity-50 ${
                      confirmResetId === activeArchive.id
                        ? 'bg-amber-100 hover:bg-amber-200 border-amber-400 text-amber-950 animate-pulse'
                        : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-900'
                    }`}
                    title="Yüklü sayfa fotoğraflarını silmeden sadece çözümleri sıfırla ve tüm soruları baştan çöz"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${confirmResetId === activeArchive.id ? 'text-amber-700' : 'text-indigo-700'} ${isRetrying ? 'animate-spin' : ''}`} />
                    <span>{confirmResetId === activeArchive.id ? '⚠️ Onaylamak için Tekrar Tıklayın (Resimler Silinmez!)' : 'Tekrar Çöz (Resimleri Silme)'}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirmDeleteId !== activeArchive.id) {
                        setConfirmDeleteId(activeArchive.id);
                        setTimeout(() => setConfirmDeleteId(null), 4000);
                        return;
                      }
                      setConfirmDeleteId(null);
                      onDeleteArchive(activeArchive.id);
                    }}
                    className={`p-2 rounded-xl transition-all flex items-center gap-1 text-xs font-bold ${
                      confirmDeleteId === activeArchive.id
                        ? 'bg-rose-100 border border-rose-300 text-rose-800 px-2.5 animate-pulse'
                        : 'text-slate-300 hover:text-rose-600 hover:bg-slate-50'
                    }`}
                    title="Arşivi Sil"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                    {confirmDeleteId === activeArchive.id && <span>Silmek için tekrar tıkla</span>}
                  </button>
                </div>
              </div>

              {/* Loading Banner for High-Res Photos */}
              {loadingArchiveId === activeArchive.id && (
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
                const activePhotos = activeArchive.sayfaFotolari || activeArchive.fotografYollari || [];
                const activeTotalPages = activePhotos.length;
                const activeCoveredPagesSet = new Set((activeArchive.sorular || []).map(q => (q.sayfaIndex !== undefined && typeof q.sayfaIndex === 'number' && q.sayfaIndex >= 0) ? q.sayfaIndex + 1 : (q.sayfaNo || 1)).filter(Boolean));
                const isPartiallySolved = activeArchive.aiStatus !== 'completed' && activeTotalPages > 0 && activeCoveredPagesSet.size < activeTotalPages;

                if (activeArchive.aiStatus === 'processing' || activeArchive.aiStatus === 'rate_limited' || activeArchive.aiStatus === 'pending' || activeArchive.aiStatus === 'error' || (activeArchive.aiStatus !== 'completed' && activeArchive.lastError)) {
                  const isRateLimited = activeArchive.aiStatus === 'rate_limited' || activeArchive.aiStatus === 'error' || Boolean(activeArchive.lastError);
                  const isPending = activeArchive.aiStatus === 'pending';
                  const nextRetryTimeStr = activeArchive.nextRetryTime ? new Date(activeArchive.nextRetryTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : null;

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
                                  ? '⏳ Yapay Zekâ Kotası / Sunucu Bekleniyor (5 dk)'
                                  : isPending
                                  ? '⏳ Test Sırada Bekliyor'
                                  : '⚡ Yapay Zekâ Soruları Çözüyor'}
                              </span>
                              {nextRetryTimeStr && isRateLimited && (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300">
                                  ⏰ Sıradaki Otomatik Deneme: {nextRetryTimeStr}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-medium opacity-90">
                              {activeArchive.aiStatusMessage || (
                                isRateLimited
                                  ? 'Tüm modeller sırayla denendi. Sistem kotalar yenilenince listenin en başından otomatik olarak çözmeye devam edecektir. Fotoğraflarınız ve verileriniz güvendedir.'
                                  : isPending
                                  ? 'Önceki test çözülüyor. Tamamlandığında bu test otomatik başlayacaktır.'
                                  : 'Sistem test fotoğraflarındaki soruları ve MEB kazanımlarını tek tek çözmektedir.'
                              )}
                            </div>
                            {isRateLimited && (
                              <div className="text-[11px] text-amber-800">
                                ℹ️ Model kotaları yoğunluktan dolayı geçici olarak meşguldür. Süre dolduğunda sistem listenin en başındaki modelden sırayla otomatik deneyecektir.
                              </div>
                            )}
                            {retryMessage && (
                              <div className="text-[11px] font-bold text-indigo-700 mt-1">
                                {retryMessage}
                              </div>
                            )}
                          </div>
                        </div>

                        {isRateLimited && (
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                            <button
                              onClick={() => handleRetryAI(activeArchive.id)}
                              disabled={isRetrying}
                              className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                              title="Süreyi beklemeden hemen şimdi tekrar dene"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                              <span>{isRetrying ? 'Deneniyor...' : 'Şimdi Tekrar Dene'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                if (isPartiallySolved) {
                  return (
                    <div className="p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50 border-amber-200 text-amber-900">
                      <div className="flex items-start gap-2.5">
                        <Hourglass className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold">
                            ⚠️ Kısmen Çözüldü ({activeCoveredPagesSet.size} / {activeTotalPages} Sayfa)
                          </div>
                          <div className="text-[11px] opacity-90 mt-0.5">
                            Öğrencinin yüklediği {activeTotalPages} sayfadan {activeCoveredPagesSet.size} sayfası çözülmüş, kalan {activeTotalPages - activeCoveredPagesSet.size} sayfa henüz çözülmemiştir.
                          </div>
                          {retryMessage && (
                            <div className="text-[11px] font-bold text-amber-800 mt-1">
                              {retryMessage}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRetryAI(activeArchive.id)}
                        disabled={isRetrying}
                        className="shrink-0 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs self-end sm:self-auto disabled:opacity-50 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                        <span>{isRetrying ? 'Kuyruğa Alınıyor...' : `Kalan Sayfaları Çöz (${activeCoveredPagesSet.size + 1}-${activeTotalPages})`}</span>
                      </button>
                    </div>
                  );
                }

                return null;
              })()}

              {/* Page Photos Viewer with Zoom & Pan */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Kitapçık Sayfası Fotoğrafı ({activeArchive.sayfaFotolari?.length || 0} Sayfa)
                    </span>
                  </div>

                  {/* Zoom controls */}
                  <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={handleZoomIn}
                      className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200"
                      title="Yakınlaştır"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleZoomOut}
                      className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200"
                      title="Uzaklaştır"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleRotateCcw}
                      className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200"
                      title="Sola 90° Döndür"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleRotateCw}
                      className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200"
                      title="Sağa 90° Döndür"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleResetZoom}
                      className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200"
                      title="Görünümü Sıfırla"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-bold text-slate-500 px-1.5">
                      {Math.round(zoom * 100)}%
                    </span>
                  </div>
                </div>

                {/* Photo Display Viewport */}
                <div className="relative w-full h-84 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center select-none">
                  {/* Selected Question Overlay Indicator */}
                  {selectedQuestionObj && (
                    <div className="absolute top-3 left-3 right-3 z-10 bg-slate-900/90 backdrop-blur-md border border-indigo-500/40 text-white px-3.5 py-2 rounded-xl text-xs flex items-center justify-between shadow-lg">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center">
                          {selectedQuestionObj.soruNo}
                        </span>
                        <div>
                          <span className="font-bold text-indigo-200">Soru {selectedQuestionObj.soruNo}:</span> {selectedQuestionObj.ders} - {selectedQuestionObj.konu}
                          <span className="text-[10px] text-slate-400 ml-2">(Sayfa {selectedQuestionObj.sayfaNo || (activePageIndex + 1)})</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedQuestionNo(null);
                        }}
                        className="text-slate-400 hover:text-white text-[11px] px-2 py-0.5 rounded-lg hover:bg-slate-800"
                      >
                        Kapat ✕
                      </button>
                    </div>
                  )}

                  {currentPhoto ? (
                    <div
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden touch-none"
                    >
                      <img
                        src={currentPhoto}
                        alt="Sayfa Görseli"
                        style={{
                          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                          transformOrigin: 'center center',
                        }}
                        className="max-w-full max-h-full object-contain pointer-events-none select-none"
                      />
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 text-xs">
                      Bu sınav için sayfa fotoğrafı kaydedilmedi.
                    </div>
                  )}
                </div>

                {/* Page Thumbnails & Filter Bar */}
                {activeArchive.sayfaFotolari && activeArchive.sayfaFotolari.length > 0 && (
                  <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-400 mr-1">Sayfalar:</span>
                      {activeArchive.sayfaFotolari.map((img, i) => {
                        const pageNum = i + 1;
                        const pageQuestionsCount = (activeArchive.sorular || []).filter(
                          (q) => (q.sayfaNo || 1) === pageNum
                        ).length;

                        return (
                          <button
                            key={i}
                            onClick={() => {
                              setActivePageIndex(i);
                              setSelectedPageFilter(pageNum);
                              setZoom(1);
                              setPan({ x: 0, y: 0 });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                              activePageIndex === i
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <span>Sayfa {pageNum}</span>
                            {pageQuestionsCount > 0 && (
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                activePageIndex === i ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {pageQuestionsCount} Soru
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {activeArchive.sayfaFotolari.length > 1 && (
                      <button
                        onClick={() => setSelectedPageFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border whitespace-nowrap ${
                          selectedPageFilter === 'all'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Tüm Soruları Göster ({activeArchive.sorular?.length || 0})
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Color-Coded Questions Table / Cards */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Sınav Soruları & MEB Kazanım Eşleşmeleri
                    </h4>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {displayedQuestions.length} Soru {selectedPageFilter !== 'all' ? `(Sayfa ${selectedPageFilter})` : ''}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    💡 Soruya tıklayarak ait olduğu sayfa fotoğrafına odaklanabilirsiniz
                  </span>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {displayedQuestions.map((q, idx) => {
                    const isQuestionSelected = selectedQuestionNo === q.soruNo;
                    const questionPage = q.sayfaNo || (activePageIndex + 1);
                    const isFillInBlank = q.soruTuru === 'bosluk_doldurma' || q.soruTuru === 'acik_uclu';
                    
                    // Single source of truth:
                    // If durum is 'dogru' or q.dogruMu is true, the question was solved correctly and can NEVER be blank!
                    const isDogru = q.durum === 'dogru' || (q.durum !== 'bos' && Boolean(q.dogruMu));
                    const isBlank = !isDogru && (
                      q.durum === 'bos' ||
                      (isFillInBlank
                        ? (!q.ogrenciCevabi || q.ogrenciCevabi === 'Boş' || q.ogrenciCevabi === '-' || q.ogrenciCevabi.trim().toLowerCase() === 'boş')
                        : (!q.isaretlenenSik || q.isaretlenenSik === 'Boş' || q.isaretlenenSik === '-' || q.isaretlenenSik.trim().toLowerCase() === 'boş')
                      )
                    );
                    const isYanlis = !isDogru && !isBlank;

                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelectQuestion(q)}
                        className={`p-3.5 rounded-2xl border transition-all text-xs space-y-1.5 cursor-pointer hover:shadow-xs relative ${
                          isQuestionSelected
                            ? 'ring-2 ring-indigo-600 bg-indigo-50/70 border-indigo-300'
                            : isDogru
                            ? 'bg-emerald-50/40 border-emerald-200/80 hover:bg-emerald-50/80'
                            : isBlank
                            ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            : 'bg-rose-50/40 border-rose-200/80 hover:bg-rose-50/80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-5 h-5 rounded-md bg-slate-900 text-white font-black text-[11px] flex items-center justify-center">
                              {q.soruNo}
                            </span>
                            <span className="font-bold text-slate-900">{q.ders}</span>
                            <span className="text-slate-400">•</span>
                            <span className="font-semibold text-slate-700">{q.konu}</span>
                            
                            {/* Page link badge */}
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                              <Camera className="w-2.5 h-2.5 text-indigo-600" />
                              <span>Sayfa {questionPage}</span>
                            </span>

                            {/* Question Type Badge */}
                            {q.soruTuru && q.soruTuru !== 'coktan_secmeli' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                                {q.soruTuru === 'bosluk_doldurma' ? 'Boşluk Doldurma' : q.soruTuru === 'acik_uclu' ? 'Açık Uçlu' : 'Klasik'}
                              </span>
                            )}

                            {q.kazanimKodu && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white text-indigo-700 border border-slate-200">
                                {q.kazanimKodu}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {isDogru ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Doğru
                              </span>
                            ) : isBlank ? (
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <MinusCircle className="w-3 h-3" /> Boş
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Yanlış
                              </span>
                            )}

                            {/* Quick status switchers for coach */}
                            {onSaveExamArchive && (
                              <div className="inline-flex rounded-lg bg-white border border-slate-200 p-0.5 text-[10px] shadow-2xs">
                                <button
                                  type="button"
                                  title="Doğru olarak işaretle"
                                  onClick={() => handleUpdateQuestionStatus(q.soruNo, 'dogru')}
                                  className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                                    isDogru ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-emerald-700'
                                  }`}
                                >
                                  D
                                </button>
                                <button
                                  type="button"
                                  title="Yanlış olarak işaretle"
                                  onClick={() => handleUpdateQuestionStatus(q.soruNo, 'yanlis')}
                                  className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                                    isYanlis ? 'bg-rose-600 text-white' : 'text-slate-500 hover:text-rose-700'
                                  }`}
                                >
                                  Y
                                </button>
                                <button
                                  type="button"
                                  title="Boş olarak işaretle"
                                  onClick={() => handleUpdateQuestionStatus(q.soruNo, 'bos')}
                                  className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                                    isBlank ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-slate-700'
                                  }`}
                                >
                                  B
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {q.kazanimAciklama && (
                          <p className="text-[11px] text-slate-600 italic">
                            📌 {q.kazanimAciklama}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
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
                            <span className="text-slate-500 italic max-w-xs truncate" title={q.analizNotu}>
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
                          onSaveSolution={(newSol) => handleSaveQuestionSolution(q.soruNo, newSol)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center text-slate-400 space-y-2">
              <Archive className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">Görüntülemek için soldan bir deneme seçin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
