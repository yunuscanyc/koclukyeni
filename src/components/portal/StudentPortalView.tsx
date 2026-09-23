import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  LogOut, 
  KeyRound, 
  Target, 
  Sparkles, 
  Calendar, 
  Award, 
  BookOpen, 
  Clock, 
  ShieldCheck,
  CheckCircle2,
  Circle,
  AlertCircle,
  Lock,
  Camera,
  Upload,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  FileCheck,
  XCircle,
  HelpCircle,
  Loader2,
  Hourglass,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  X,
  ListTodo,
  CalendarDays,
  Search,
  Filter,
  CheckSquare2,
  MessageSquareQuote,
  MessageSquare,
  Flame,
  ArrowRight,
  Download,
  Scissors
} from 'lucide-react';
import { Student, OgrenciSinavKaydi, Kazanim, SoruAnalizDetay, CoachNote, WeeklyScheduleTask, SoruTakipKaydi, DenemeSinavi, StudentAssignedResource, BookDifficulty } from '../../types';
import { StudentTestUploadModal } from './StudentTestUploadModal';
import { getExamArchiveById } from '../../lib/apiService';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { QuestionSolutionView } from '../coaching/QuestionSolutionView';
import { WeeklyScheduleTab } from '../coaching/tabs/WeeklyScheduleTab';
import { QuestionsTab } from '../coaching/tabs/QuestionsTab';
import { CurriculumExplorer } from '../coaching/CurriculumExplorer';
import { formatDate } from '../../utils/dateUtils';
import { batchCropArchiveQuestions } from '../../utils/imageCropper';

interface StudentPortalViewProps {
  student: Student;
  studentArchives?: OgrenciSinavKaydi[];
  coachNotes?: CoachNote[];
  curriculum?: Kazanim[];
  schedules?: WeeklyScheduleTask[];
  questions?: SoruTakipKaydi[];
  exams?: DenemeSinavi[];
  assignedResources?: StudentAssignedResource[];
  onLogout: () => void;
  onSaveExamArchive?: (archive: OgrenciSinavKaydi, newDeneme?: DenemeSinavi) => void;
  onUpdateScheduleTask?: (task: WeeklyScheduleTask) => void;
  onAddQuestion?: (q: Omit<SoruTakipKaydi, 'id'>) => void;
  onDeleteQuestion?: (id: string) => void;
  onToggleAssignedResource?: (id: string, completed: boolean) => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  student,
  studentArchives = [],
  coachNotes = [],
  curriculum = [],
  schedules = [],
  questions = [],
  exams = [],
  assignedResources = [],
  onLogout,
  onSaveExamArchive,
  onUpdateScheduleTask,
  onAddQuestion,
  onDeleteQuestion,
  onToggleAssignedResource,
}) => {
  const [activePortalTab, setActivePortalTab] = useState<'testler' | 'hedefler' | 'haftalik-program' | 'soru-takibi' | 'atanan-kaynaklar'>('testler');
  const [resourceFilter, setResourceFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState<OgrenciSinavKaydi | null>(null);
  const [viewingPhotoModal, setViewingPhotoModal] = useState<{
    photoUrl: string;
    pageNo: number;
    question?: SoruAnalizDetay;
  } | null>(null);
  const [modalZoom, setModalZoom] = useState(1);
  const [modalPan, setModalPan] = useState({ x: 0, y: 0 });
  const [modalRotation, setModalRotation] = useState<number>(0);
  const [modalIsDragging, setModalIsDragging] = useState(false);
  const [modalDragStart, setModalDragStart] = useState({ x: 0, y: 0 });

  // Student Portal Testler Booklet Viewer states
  const [studentActivePageIndex, setStudentActivePageIndex] = useState(0);
  const [studentZoom, setStudentZoom] = useState(1);
  const [studentPan, setStudentPan] = useState({ x: 0, y: 0 });
  const [studentRotation, setStudentRotation] = useState<number>(0);
  const [studentIsDragging, setStudentIsDragging] = useState(false);
  const [studentDragStart, setStudentDragStart] = useState({ x: 0, y: 0 });
  const [studentSelectedQuestionNo, setStudentSelectedQuestionNo] = useState<number | null>(null);
  const [studentSelectedPageFilter, setStudentSelectedPageFilter] = useState<number | 'all'>('all');

  const [portalToast, setPortalToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [retryingArchiveId, setRetryingArchiveId] = useState<string | null>(null);
  const [confirmResetId, setConfirmResetId] = useState<string | null>(null);
  const [loadingArchiveId, setLoadingArchiveId] = useState<string | null>(null);
  const [studentArchiveCache, setStudentArchiveCache] = useState<Record<string, OgrenciSinavKaydi>>({});
  const [isDownloadingStudentZip, setIsDownloadingStudentZip] = useState(false);
  const [studentZipProgress, setStudentZipProgress] = useState('');
  const [isStudentCropping, setIsStudentCropping] = useState(false);

  const showPortalToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setPortalToast({ text, type });
    setTimeout(() => setPortalToast(null), 3500);
  };

  const handleStudentDownloadZip = async (archive: OgrenciSinavKaydi) => {
    if (!archive) return;
    setIsDownloadingStudentZip(true);
    setStudentZipProgress('Fotoğraflar hazırlanıyor...');

    try {
      let photos = archive.sayfaFotolari || archive.fotografYollari || [];
      const hasFull = photos.some((p: any) => typeof p === 'string' ? p.length > 500 : Boolean(p?.imageBase64 && p.imageBase64.length > 500));
      if (!hasFull) {
        setStudentZipProgress('Fotoğraflar sunucudan alınıyor...');
        const res = await fetch(`/api/archives/${archive.id}`);
        const full = await res.json();
        if (full && (full.sayfaFotolari?.length || full.fotografYollari?.length)) {
          photos = full.sayfaFotolari || full.fotografYollari || [];
        }
      }

      const validPhotos = (photos || []).filter((p: any) => 
        (typeof p === 'string' && p.length > 50) || Boolean(p?.imageBase64 && p.imageBase64.length > 50)
      );

      if (validPhotos.length === 0) {
        window.location.href = `/api/archives/${archive.id}/download-zip`;
        return;
      }

      setStudentZipProgress(`Paketleniyor (${validPhotos.length} Fotoğraf)...`);
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

      setStudentZipProgress('ZIP oluşturuluyor...');
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      const cleanSinav = (archive.sinavAdi || 'Sinav').replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, '_');
      const cleanOgrenci = (student.adSoyad || 'Ogrenci').replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, '_');
      const fileName = `${cleanSinav}_${cleanOgrenci}_Fotograflari.zip`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showPortalToast(`${validPhotos.length} sayfa fotoğrafı ZIP olarak indirildi.`, 'success');
    } catch (err: any) {
      console.error('Student ZIP download error:', err);
      window.location.href = `/api/archives/${archive.id}/download-zip`;
    } finally {
      setIsDownloadingStudentZip(false);
      setTimeout(() => setStudentZipProgress(''), 1000);
    }
  };

  const handleStudentRetryAI = async (archive: OgrenciSinavKaydi) => {
    setRetryingArchiveId(archive.id);
    try {
      const res = await fetch(`/api/archives/${archive.id}/retry-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archive }),
      });
      const data = await res.json();
      if (data.archive) {
        if (onSaveExamArchive) onSaveExamArchive(data.archive);
        if (selectedArchive?.id === archive.id) setSelectedArchive(data.archive);
      }
      showPortalToast(data.message || 'Yapay zekâ çözümü kaldığı sayfadan devam ettiriliyor.', 'info');
    } catch (err) {
      console.error("Retry AI error:", err);
      showPortalToast('Yeniden başlatma sırasında bağlantı hatası oluştu.', 'error');
    } finally {
      setTimeout(() => setRetryingArchiveId(null), 1500);
    }
  };

  const handleStudentResetAndResolve = async (archive: OgrenciSinavKaydi) => {
    if (confirmResetId !== archive.id) {
      setConfirmResetId(archive.id);
      showPortalToast('Sıfırlama işlemini onaylamak için lütfen "Tekrar Tıkla" butonuna basın.', 'info');
      setTimeout(() => setConfirmResetId(null), 5000);
      return;
    }
    setConfirmResetId(null);
    setRetryingArchiveId(archive.id);

    // Optimistically reset on screen
    const photosList = archive.sayfaFotolari || archive.fotografYollari || [];
    const photoCount = photosList.length || (archive as any).photosCount || 1;
    const optimistic: OgrenciSinavKaydi = {
      ...archive,
      sorular: [],
      toplamSoru: photoCount * 4,
      dogruSayisi: 0,
      yanlisSayisi: 0,
      bosSayisi: 0,
      net: 0,
      toplamNet: 0,
      aiStatus: 'processing',
      aiStatusMessage: `Fotoğraflar korundu. Yapay zekâ ${photoCount} sayfayı baştan çözüyor (Sayfa 1/${photoCount})...`,
    };
    if (onSaveExamArchive) onSaveExamArchive(optimistic);
    if (selectedArchive?.id === archive.id) setSelectedArchive(optimistic);

    try {
      const res = await fetch(`/api/archives/${archive.id}/reset-and-solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archive }),
      });
      const data = await res.json();
      if (data.archive) {
        if (onSaveExamArchive) onSaveExamArchive(data.archive);
        if (selectedArchive?.id === archive.id) setSelectedArchive(data.archive);
      }
      showPortalToast(data.message || 'Fotoğraflar muhafaza edildi, sorular baştan çözülüyor.', 'success');
    } catch (err) {
      console.error("Reset AI error:", err);
      showPortalToast('Sıfırlama sırasında bağlantı hatası oluştu.', 'error');
    } finally {
      setTimeout(() => setRetryingArchiveId(null), 1500);
    }
  };

  const handleStudentCropAllQuestions = async (archive: OgrenciSinavKaydi) => {
    if (!archive) return;
    let photos = archive.sayfaFotolari || archive.fotografYollari || [];
    
    // If photos are empty strings, load full archive first
    const hasFull = photos.some((p: any) => typeof p === 'string' ? p.length > 500 : Boolean(p?.imageBase64 && p.imageBase64.length > 500));
    if (!hasFull) {
      showPortalToast('Fotoğraflar sunucudan alınıyor...', 'info');
      try {
        const fullArch = await getExamArchiveById(archive.id);
        if (fullArch && (fullArch.sayfaFotolari?.length || fullArch.fotografYollari?.length)) {
          photos = fullArch.sayfaFotolari || fullArch.fotografYollari || [];
          setStudentArchiveCache((prev) => ({ ...prev, [archive.id]: fullArch }));
        }
      } catch (err) {
        console.warn('Full archive fetch error for crop:', err);
      }
    }

    const validPhotos = photos.filter((p: any) => 
      (typeof p === 'string' && p.length > 50) || Boolean(p?.imageBase64 && p.imageBase64.length > 50)
    ).map((p: any) => typeof p === 'string' ? p : p?.imageBase64 || '');

    if (validPhotos.length === 0) {
      showPortalToast('Bu sınav için geçerli sayfa fotoğrafı bulunamadı.', 'error');
      return;
    }

    setIsStudentCropping(true);
    showPortalToast('Sorular sayfa fotoğraflarından tek tek ayrıştırılıyor...', 'info');

    try {
      const croppedSorular = await batchCropArchiveQuestions(validPhotos, archive.sorular || []);
      const updatedArchive: OgrenciSinavKaydi = {
        ...archive,
        sorular: croppedSorular,
      };

      setStudentArchiveCache((prev) => ({
        ...prev,
        [archive.id]: updatedArchive,
      }));

      if (selectedArchive?.id === archive.id) {
        setSelectedArchive(updatedArchive);
      }

      if (onSaveExamArchive) {
        onSaveExamArchive(updatedArchive);
      }

      showPortalToast(`${croppedSorular.length} adet soru başarıyla ayrıştırıldı!`, 'success');
    } catch (err: any) {
      console.warn('Student crop questions error:', err);
      showPortalToast('Soru ayrıştırma sırasında bir hata oluştu.', 'error');
    } finally {
      setIsStudentCropping(false);
    }
  };

  // Filter student's own exams
  const myArchives = studentArchives.filter((a) => !a.studentId || a.studentId === student.id || a.ogrenciAdSoyad === student.adSoyad);
  const myNotes = coachNotes.filter((n) => !n.studentId || n.studentId === student.id);
  const myQuestions = questions.filter((q) => !q.studentId || q.studentId === student.id);
  const myExams = exams.filter((e) => !e.studentId || e.studentId === student.id);
  const myAssignedResources = (assignedResources || []).filter((r) => r.studentId === student.id);
  const pendingAssignedResources = myAssignedResources.filter((r) => !r.completed);

  // Background pre-fetch images for student tests so opening is INSTANT
  useEffect(() => {
    if (activePortalTab !== 'testler' || myArchives.length === 0) return;
    myArchives.slice(0, 6).forEach((arch) => {
      if (!studentArchiveCache[arch.id]) {
        getExamArchiveById(arch.id)
          .then((fullArch) => {
            if (fullArch) {
              setStudentArchiveCache((prev) => ({ ...prev, [arch.id]: fullArch }));
            }
          })
          .catch(() => {});
      }
    });
  }, [activePortalTab, myArchives]);

  // Synchronize selectedArchive when studentArchives updates from backend polling
  React.useEffect(() => {
    if (selectedArchive) {
      const updated = studentArchives.find((a) => a.id === selectedArchive.id);
      if (
        updated &&
        (updated.aiStatus !== selectedArchive.aiStatus ||
          updated.sorular?.length !== selectedArchive.sorular?.length ||
          updated.aiStatusMessage !== selectedArchive.aiStatusMessage ||
          updated.toplamNet !== selectedArchive.toplamNet)
      ) {
        setSelectedArchive({
          ...selectedArchive,
          ...updated,
          sayfaFotolari: (selectedArchive.sayfaFotolari?.length ? selectedArchive.sayfaFotolari : updated.sayfaFotolari) || [],
          fotografYollari: (selectedArchive.fotografYollari?.length ? selectedArchive.fotografYollari : updated.fotografYollari) || [],
        });
      }
    }
  }, [studentArchives, selectedArchive?.id]);

  // Reset page and selection when switching active student archive
  React.useEffect(() => {
    setStudentActivePageIndex(0);
    setStudentSelectedQuestionNo(null);
    setStudentSelectedPageFilter('all');
    setStudentZoom(1);
    setStudentPan({ x: 0, y: 0 });
  }, [selectedArchive?.id]);

  // Drag booklet photo mouse & touch handlers
  const handleStudentMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setStudentIsDragging(true);
    setStudentDragStart({ x: e.clientX - studentPan.x, y: e.clientY - studentPan.y });
  };

  const handleStudentMouseMove = (e: React.MouseEvent) => {
    if (!studentIsDragging) return;
    e.preventDefault();
    setStudentPan({ x: e.clientX - studentDragStart.x, y: e.clientY - studentDragStart.y });
  };

  const handleStudentMouseUp = () => {
    setStudentIsDragging(false);
  };

  const handleStudentTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setStudentIsDragging(true);
      setStudentDragStart({ x: e.touches[0].clientX - studentPan.x, y: e.touches[0].clientY - studentPan.y });
    }
  };

  const handleStudentTouchMove = (e: React.TouchEvent) => {
    if (!studentIsDragging || e.touches.length !== 1) return;
    setStudentPan({ x: e.touches[0].clientX - studentDragStart.x, y: e.touches[0].clientY - studentDragStart.y });
  };

  const handleStudentTouchEnd = () => {
    setStudentIsDragging(false);
  };

  // Modal Drag Handlers
  const handleModalMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setModalIsDragging(true);
    setModalDragStart({ x: e.clientX - modalPan.x, y: e.clientY - modalPan.y });
  };

  const handleModalMouseMove = (e: React.MouseEvent) => {
    if (!modalIsDragging) return;
    e.preventDefault();
    setModalPan({ x: e.clientX - modalDragStart.x, y: e.clientY - modalDragStart.y });
  };

  const handleModalMouseUp = () => {
    setModalIsDragging(false);
  };

  const handleModalTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setModalIsDragging(true);
      setModalDragStart({ x: e.touches[0].clientX - modalPan.x, y: e.touches[0].clientY - modalPan.y });
    }
  };

  const handleModalTouchMove = (e: React.TouchEvent) => {
    if (!modalIsDragging || e.touches.length !== 1) return;
    setModalPan({ x: e.touches[0].clientX - modalDragStart.x, y: e.touches[0].clientY - modalDragStart.y });
  };

  const handleModalTouchEnd = () => {
    setModalIsDragging(false);
  };

  const handleTestUploaded = (archive: OgrenciSinavKaydi, newDeneme?: DenemeSinavi) => {
    if (onSaveExamArchive) {
      onSaveExamArchive(archive, newDeneme);
    }
  };

  const getAIStatusBadge = (archive: OgrenciSinavKaydi) => {
    const photos = archive.sayfaFotolari || archive.fotografYollari || [];
    const totalPages = photos.length;
    const realQuestions = (archive.sorular || []).filter(q => q.unite !== "Çözülmemiş / Boş Sayfa" && q.unite !== "Boş / Çözülmemiş Sayfa");
    const coveredPagesSet = new Set((archive.sorular || []).map(q => q.sayfaNo || (q.sayfaIndex !== undefined ? q.sayfaIndex + 1 : 1)).filter(Boolean));
    const attemptedPagesSet = new Set(realQuestions.filter(q => q.isaretlenenSik && q.isaretlenenSik !== "Boş").map(q => q.sayfaNo || (q.sayfaIndex !== undefined ? q.sayfaIndex + 1 : 1)));
    
    const isAllCovered = totalPages === 0 || (coveredPagesSet.size >= totalPages && totalPages > 0);
    const isCompleted = archive.aiStatus === 'completed' && isAllCovered;

    if (isCompleted) {
      const solvedPagesCount = attemptedPagesSet.size;
      const unattemptedPagesCount = Math.max(0, totalPages - solvedPagesCount);

      if (totalPages > 0 && unattemptedPagesCount > 0 && solvedPagesCount > 0) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold" title={`${totalPages} sayfanın ${solvedPagesCount} sayfası çözülmüş, ${unattemptedPagesCount} sayfası boş bırakılmış`}>
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            <span>İncelendi ({solvedPagesCount}/{totalPages} Sayfa Çözüldü, {unattemptedPagesCount} Boş)</span>
          </span>
        );
      }

      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>{totalPages > 0 ? `Yapay Zekâ Çözdü (${totalPages}/${totalPages} Sayfa)` : 'Yapay Zekâ Çözdü'}</span>
        </span>
      );
    }

    if (archive.aiStatus === 'rate_limited') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold animate-pulse">
          <Hourglass className="w-3 h-3 text-amber-600" />
          <span>Kota Bekleniyor ({coveredPagesSet.size}/{totalPages} Sayfa Hazır)</span>
        </span>
      );
    }

    const isActivelyProcessing = archive.aiStatus === 'processing';

    if (totalPages > 0 && coveredPagesSet.size > 0 && coveredPagesSet.size < totalPages) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold">
          {isActivelyProcessing ? (
            <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />
          ) : (
            <Clock className="w-3 h-3 text-indigo-600" />
          )}
          <span>{isActivelyProcessing ? 'Çözülüyor' : 'Kısmen Çözüldü'} ({coveredPagesSet.size}/{totalPages} Sayfa)</span>
        </span>
      );
    }

    if (isActivelyProcessing) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold">
          <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />
          <span>{archive.aiStatusMessage || 'Çözülüyor...'}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold">
        <Clock className="w-3 h-3 text-slate-500" />
        <span>{archive.aiStatusMessage || 'Sırada Bekliyor...'}</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>Öğrenci Portalı</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Aktif Oturum
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {student.adSoyad} • {student.sinif}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* PWA Install Button */}
            <PWAInstallButton variant="header" />

            {/* Student PIN Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 font-semibold">
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              <span>Öğrenci PIN: <strong className="text-slate-900 font-mono">{student.pinCode}</strong></span>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
              title="Çıkış Yap ve PIN Ekranına Dön"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      </header>

      {/* Student Navigation Tab Bar (Clean 2-Row / Ergonomic Responsive Grid - No horizontal scroll) */}
      <div className="hidden md:block bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-16 z-20 py-2.5 shadow-2xs">
        <div className="max-w-5xl w-full mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            <button
              onClick={() => setActivePortalTab('testler')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between sm:justify-center gap-2 ${
                activePortalTab === 'testler'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 ring-2 ring-indigo-600/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Camera className="w-4 h-4 shrink-0" />
                <span className="truncate">Testlerim & AI</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                activePortalTab === 'testler' ? 'bg-indigo-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {myArchives.length}
              </span>
            </button>

            <button
              onClick={() => setActivePortalTab('hedefler')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between sm:justify-center gap-2 ${
                activePortalTab === 'hedefler'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 ring-2 ring-indigo-600/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Target className="w-4 h-4 shrink-0" />
                <span className="truncate">Hedefler & Notlar</span>
              </div>
              {myNotes.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                  activePortalTab === 'hedefler' ? 'bg-indigo-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {myNotes.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActivePortalTab('soru-takibi')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between sm:justify-center gap-2 ${
                activePortalTab === 'soru-takibi'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 ring-2 ring-indigo-600/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">Soru Takibi</span>
              </div>
              {myQuestions.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                  activePortalTab === 'soru-takibi' ? 'bg-indigo-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {myQuestions.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActivePortalTab('haftalik-program')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between sm:justify-center gap-2 ${
                activePortalTab === 'haftalik-program'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 ring-2 ring-indigo-600/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <CalendarDays className="w-4 h-4 shrink-0" />
                <span className="truncate">Haftalık Program</span>
              </div>
              {schedules.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                  activePortalTab === 'haftalik-program' ? 'bg-indigo-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {schedules.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActivePortalTab('atanan-kaynaklar')}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between sm:justify-center gap-2 ${
                activePortalTab === 'atanan-kaynaklar'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 ring-2 ring-indigo-600/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <BookOpen className="w-4 h-4 shrink-0" />
                <span className="truncate">Atanan Kaynaklar</span>
              </div>
              {pendingAssignedResources.length > 0 ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-black bg-rose-500 text-white animate-pulse shrink-0">
                  {pendingAssignedResources.length} Bekleyen
                </span>
              ) : myAssignedResources.length > 0 ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-slate-200 text-slate-700 shrink-0">
                  {myAssignedResources.length}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (md:hidden) */}
      <div className="md:hidden">
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg z-45 py-2 px-3 pb-safe-bottom flex items-center justify-around">
          {[
            { key: 'testler', label: 'Testlerim', icon: Camera, badge: myArchives.length > 0 ? myArchives.length : undefined },
            { key: 'atanan-kaynaklar', label: 'Kaynaklar', icon: BookOpen, badge: pendingAssignedResources.length > 0 ? pendingAssignedResources.length : undefined },
            { key: 'hedefler', label: 'Hedeflerim', icon: Target, badge: myNotes.length > 0 ? myNotes.length : undefined },
            { key: 'soru-takibi', label: 'Soru Takip', icon: HelpCircle, badge: myQuestions.length > 0 ? myQuestions.length : undefined },
            { key: 'haftalik-program', label: 'Programım', icon: CalendarDays, badge: schedules.length > 0 ? schedules.length : undefined },
          ].map((item) => {
            const ItemIcon = item.icon;
            const isActive = activePortalTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActivePortalTab(item.key as any)}
                className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all relative ${
                  isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <ItemIcon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px] text-indigo-600' : 'stroke-[2px]'}`} />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-2 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.2 rounded-full border border-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-bold tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Student Page Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-6 space-y-6">
        
        {/* =========================================================
            TAB 2: TEST YÜKLEME & YAPAY ZEKÂ ÇÖZÜMLERİ
           ========================================================= */}
        {activePortalTab === 'testler' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header and Upload Action Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Çözdüğün Testler & Yapay Zekâ Analizleri</h2>
                <p className="text-xs text-slate-400 mt-1">Yüklediğin testlerin soru çözümlerini ve MEB kazanımlarını incele.</p>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all flex items-center gap-2 active:scale-95 self-start sm:self-auto"
              >
                <Camera className="w-4 h-4" />
                <span>Yeni Test Fotoğrafı Yükle</span>
              </button>
            </div>

            {/* Uploaded Tests History */}
            {myArchives.length > 0 ? (
              <div className="space-y-3">
                {myArchives.map((arch) => {
                  const isOpen = selectedArchive?.id === arch.id;
                  return (
                    <div
                      key={arch.id}
                      className={`bg-white border rounded-2xl transition-all overflow-hidden ${
                        isOpen
                          ? 'border-indigo-400 shadow-sm ring-1 ring-indigo-400/20'
                          : 'border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      {/* Accordion Header */}
                      <div
                        onClick={async () => {
                          if (isOpen) {
                            setSelectedArchive(null);
                          } else {
                            const cached = studentArchiveCache[arch.id];
                            if (cached) {
                              setSelectedArchive(cached);
                              return;
                            }

                            setSelectedArchive(arch);
                            const photos = arch.sayfaFotolari || arch.fotografYollari || [];
                            const hasFullPhotos = photos.some((p) => typeof p === 'string' && p.length > 500);

                            if (!hasFullPhotos) {
                              setLoadingArchiveId(arch.id);
                              try {
                                const fullArch = await getExamArchiveById(arch.id);
                                if (fullArch) {
                                  setStudentArchiveCache((prev) => ({ ...prev, [arch.id]: fullArch }));
                                  setSelectedArchive((prev) => (prev?.id === arch.id ? { ...prev, ...fullArch } : fullArch));
                                }
                              } catch (err) {
                                console.warn('getExamArchiveById error:', err);
                              } finally {
                                setLoadingArchiveId(null);
                              }
                            }
                          }
                        }}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                              arch.sinavTuru === 'TYT'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {arch.sinavTuru}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                            {arch.sinavAdi}
                          </h4>
                          <span className="text-[10px] text-slate-400">({formatDate(arch.tarih)})</span>
                          {getAIStatusBadge(arch)}

                          {/* Image Loading Status Badge */}
                          {(() => {
                            const photos = arch.sayfaFotolari || arch.fotografYollari || [];
                            const hasFullPhotos = photos.some((p) => typeof p === 'string' && p.length > 500);

                            if (loadingArchiveId === arch.id) {
                              return (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-300 flex items-center gap-1 animate-pulse">
                                  <Loader2 className="w-2.5 h-2.5 text-indigo-600 animate-spin shrink-0" />
                                  <span>Görseller Yükleniyor...</span>
                                </span>
                              );
                            }

                            if (photos.length > 0 && !hasFullPhotos) {
                              return (
                                <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                                  <Hourglass className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                  <span>Temel Bilgiler Yüklendi</span>
                                </span>
                              );
                            }

                            return null;
                          })()}

                          {(arch.isNew || arch.durum === 'Yeni') ? (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                              ✨ Koç İncelemesinde
                            </span>
                          ) : (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Koç İncelendi
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
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
                              <div className="text-xs font-bold text-slate-500">
                                Net: <span className="text-indigo-700 font-extrabold">{net.toFixed(2)}</span>
                                <span className="text-[10px] text-slate-400 font-normal ml-1.5">
                                  ({d}D {y}Y {b}B)
                                </span>
                              </div>
                            );
                          })()}
                          <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-400">
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Accordion Content */}
                      {isOpen && (
                        <div className="px-4 pb-5 pt-1 border-t border-slate-100 space-y-6">
                          
                          {/* On-demand full archive loading state */}
                          {loadingArchiveId === arch.id && (
                            <div className="p-5 rounded-2xl bg-indigo-50/90 border border-indigo-200 text-indigo-950 flex items-center justify-center gap-3 animate-pulse">
                              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
                              <div>
                                <p className="text-xs font-bold">Sayfa Görselleri ve Yapay Zekâ Çözümleri Yükleniyor...</p>
                                <p className="text-[11px] text-indigo-700 opacity-90">Sınav kitapçığı fotoğrafları ve detaylı çözümler getiriliyor, lütfen bekleyin.</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Ongoing background AI processing states or partially solved state */}
                          {(() => {
                            const studentExamPhotos = (arch.sayfaFotolari && arch.sayfaFotolari.length > 0)
                              ? arch.sayfaFotolari
                              : (arch.fotografYollari && arch.fotografYollari.length > 0 ? arch.fotografYollari : []);
                            const totalPages = studentExamPhotos.length;
                            const coveredPagesSet = new Set((arch.sorular || []).map(q => q.sayfaNo || (q.sayfaIndex !== undefined ? q.sayfaIndex + 1 : 1)).filter(Boolean));
                            const isPartiallySolved = totalPages > 0 && coveredPagesSet.size < totalPages;

                            if (isPartiallySolved && arch.aiStatus !== 'processing' && arch.aiStatus !== 'rate_limited' && arch.aiStatus !== 'error' && !arch.lastError) {
                              return (
                                <div className="p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50 border-amber-200 text-amber-900">
                                  <div className="flex items-center gap-2.5">
                                    <Hourglass className="w-4 h-4 text-amber-600 shrink-0" />
                                    <div className="space-y-0.5">
                                      <div className="font-bold">
                                        ⚠️ Kısmen Çözüldü: {totalPages} sayfadan {coveredPagesSet.size} sayfası çözüldü
                                      </div>
                                      <div className="text-[11px] opacity-85">
                                        Kalan {totalPages - coveredPagesSet.size} sayfa henüz çözülmedi. Kaldığı sayfadan çözdürmek için butona tıklayabilirsiniz.
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => handleStudentRetryAI(arch)}
                                    disabled={retryingArchiveId === arch.id}
                                    className="shrink-0 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs self-end sm:self-auto disabled:opacity-50 cursor-pointer"
                                  >
                                    <RefreshCw className={`w-3.5 h-3.5 ${retryingArchiveId === arch.id ? 'animate-spin' : ''}`} />
                                    <span>{retryingArchiveId === arch.id ? 'Sıraya Alınıyor...' : `Kalan Sayfaları Çöz (${coveredPagesSet.size + 1}-${totalPages})`}</span>
                                  </button>
                                </div>
                              );
                            }

                            if (arch.aiStatus === 'rate_limited' || arch.aiStatus === 'processing' || arch.aiStatus === 'pending' || arch.aiStatus === 'error' || arch.lastError) {
                              const isRateLimited = arch.aiStatus === 'rate_limited' || arch.aiStatus === 'error' || Boolean(arch.lastError);
                              const isPending = arch.aiStatus === 'pending';
                              const nextRetryTimeStr = arch.nextRetryTime ? new Date(arch.nextRetryTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : null;

                              return (
                                <div className={`p-4 rounded-xl border text-xs flex flex-col gap-3 shadow-xs ${
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
                                          {arch.aiStatusMessage || (
                                            isRateLimited
                                              ? 'Tüm modeller sırayla denendi. Sistem kotalar yenilenince listenin en başından otomatik olarak çözmeye devam edecektir. Fotoğraflarınız ve verileriniz güvendedir.'
                                              : isPending
                                              ? 'Önceki test çözülüyor. Tamamlandığında bu test otomatik olarak başlayacaktır.'
                                              : 'Yapay zekâ test fotoğraflarındaki soruları ve MEB kazanımlarını tek tek çözmektedir.'
                                          )}
                                        </div>
                                        {isRateLimited && (
                                          <div className="text-[11px] text-amber-800">
                                            ℹ️ Model kotaları yoğunluktan dolayı geçici olarak meşguldür. Süre dolduğunda sistem listenin en başındaki modelden sırayla otomatik deneyecektir.
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {isRateLimited && (
                                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                                        <button
                                          onClick={() => handleStudentRetryAI(arch)}
                                          disabled={retryingArchiveId === arch.id}
                                          className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                                          title="Süreyi beklemeden hemen şimdi tekrar dene"
                                        >
                                          <RefreshCw className={`w-3.5 h-3.5 ${retryingArchiveId === arch.id ? 'animate-spin' : ''}`} />
                                          <span>{retryingArchiveId === arch.id ? 'Deneniyor...' : 'Şimdi Tekrar Dene'}</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }

                            return null;
                          })()}

                          {/* Booklet Photo Viewer with interactive zoom/pan */}
                          {(() => {
                            const studentExamPhotos = (arch.sayfaFotolari && arch.sayfaFotolari.length > 0)
                              ? arch.sayfaFotolari
                              : (arch.fotografYollari && arch.fotografYollari.length > 0 ? arch.fotografYollari : []);

                            return (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    <Camera className="w-4 h-4 text-indigo-600" />
                                    <span className="text-xs font-bold text-slate-900">
                                      Sınav Kitapçığı Fotoğrafları ({studentExamPhotos.length} Sayfa)
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 flex-wrap">
                                    {/* Fotoğrafları ZIP Olarak İndir button */}
                                    <button
                                      onClick={() => handleStudentDownloadZip(arch)}
                                      disabled={isDownloadingStudentZip}
                                      className="px-2.5 py-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                                      title="Tüm sayfa fotoğraflarını ZIP olarak bilgisayarına veya telefonuna indir"
                                    >
                                      {isDownloadingStudentZip ? (
                                        <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />
                                      ) : (
                                        <Download className="w-3 h-3 text-indigo-600" />
                                      )}
                                      <span>{isDownloadingStudentZip ? (studentZipProgress || 'İndiriliyor...') : `Fotoğrafları İndir (${studentExamPhotos.length || (arch as any).photosCount || 0} Sayfa .ZIP)`}</span>
                                    </button>

                                    {/* Soru Soru Ayrıştır button */}
                                    <button
                                      type="button"
                                      onClick={() => handleStudentCropAllQuestions(arch)}
                                      disabled={isStudentCropping}
                                      className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600 text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                                      title="Fotoğraflardaki soruları tek tek ayrıştır ve görsellerini hazırla"
                                    >
                                      {isStudentCropping ? (
                                        <Loader2 className="w-3 h-3 animate-spin text-white" />
                                      ) : (
                                        <Scissors className="w-3 h-3 text-indigo-200" />
                                      )}
                                      <span>Soru Soru Ayrıştır</span>
                                    </button>

                                    {/* Tekrar Çöz (Resimleri Silme) button */}
                                    <button
                                      onClick={() => handleStudentResetAndResolve(arch)}
                                      disabled={retryingArchiveId === arch.id}
                                      className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer ${
                                        confirmResetId === arch.id
                                          ? 'bg-amber-100 hover:bg-amber-200 border-amber-400 text-amber-950 animate-pulse'
                                          : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-900'
                                      }`}
                                      title="Görselleri koruyarak tüm soruları baştan çözdür"
                                    >
                                      <RotateCcw className={`w-3 h-3 ${confirmResetId === arch.id ? 'text-amber-700' : 'text-indigo-700'} ${retryingArchiveId === arch.id ? 'animate-spin' : ''}`} />
                                      <span>{confirmResetId === arch.id ? '⚠️ Emin misiniz? Tekrar Tıklayın' : 'Tekrar Çöz (Resimleri Silme)'}</span>
                                    </button>

                                    {/* Zoom controls */}
                                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                                      <button
                                        onClick={() => setStudentZoom((z) => Math.min(z + 0.25, 3))}
                                        className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200"
                                        title="Yakınlaştır"
                                      >
                                        <ZoomIn className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setStudentZoom((z) => Math.max(z - 0.25, 0.5))}
                                        className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200"
                                        title="Uzaklaştır"
                                      >
                                        <ZoomOut className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setStudentRotation((r) => (r - 90 + 360) % 360)}
                                        className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200"
                                        title="Sola 90° Döndür"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setStudentRotation((r) => (r + 90) % 360)}
                                        className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200"
                                        title="Sağa 90° Döndür"
                                      >
                                        <RotateCw className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setStudentZoom(1);
                                          setStudentPan({ x: 0, y: 0 });
                                          setStudentRotation(0);
                                        }}
                                        className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200"
                                        title="Görünümü Sıfırla"
                                      >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                      </button>
                                      <span className="text-[10px] font-bold text-slate-500 px-1.5">
                                        {Math.round(studentZoom * 100)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Image Canvas with Drag-to-Pan */}
                                <div className="relative w-full h-80 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center select-none">
                                  {studentSelectedQuestionNo && arch.sorular && (
                                    (() => {
                                      const selectedQ = arch.sorular.find((q) => q.soruNo === studentSelectedQuestionNo);
                                      return selectedQ ? (
                                        <div className="absolute top-3 left-3 right-3 z-10 bg-slate-900/90 backdrop-blur-md border border-indigo-500/40 text-white px-3.5 py-2 rounded-xl text-xs flex items-center justify-between shadow-lg">
                                          <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-md bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center">
                                              {selectedQ.soruNo}
                                            </span>
                                            <div>
                                              <span className="font-bold text-indigo-200">Soru {selectedQ.soruNo}:</span> {selectedQ.ders} - {selectedQ.konu}
                                              <span className="text-[10px] text-slate-400 ml-2">(Sayfa {selectedQ.sayfaNo || (studentActivePageIndex + 1)})</span>
                                            </div>
                                          </div>
                                          <button
                                            onClick={() => setStudentSelectedQuestionNo(null)}
                                            className="text-slate-400 hover:text-white text-[11px]"
                                          >
                                            Kapat ✕
                                          </button>
                                        </div>
                                      ) : null;
                                    })()
                                  )}

                                  {studentExamPhotos && studentExamPhotos[studentActivePageIndex] ? (
                                    <div
                                      onMouseDown={handleStudentMouseDown}
                                      onMouseMove={handleStudentMouseMove}
                                      onMouseUp={handleStudentMouseUp}
                                      onMouseLeave={handleStudentMouseUp}
                                      onTouchStart={handleStudentTouchStart}
                                      onTouchMove={handleStudentTouchMove}
                                      onTouchEnd={handleStudentTouchEnd}
                                      className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden touch-none"
                                    >
                                      <img
                                        src={studentExamPhotos[studentActivePageIndex]}
                                        alt={`Kitapçık Sayfa ${studentActivePageIndex + 1}`}
                                        style={{
                                          transform: `translate(${studentPan.x}px, ${studentPan.y}px) scale(${studentZoom}) rotate(${studentRotation}deg)`,
                                          transition: studentIsDragging ? 'none' : 'transform 0.15s ease-out',
                                          transformOrigin: 'center center',
                                        }}
                                        className="max-w-full max-h-full object-contain pointer-events-none select-none"
                                      />
                                    </div>
                                  ) : (
                                    <div className="text-center text-slate-500 text-xs">
                                      Bu sınav için yüklenmiş sayfa fotoğrafı bulunamadı.
                                    </div>
                                  )}
                                </div>

                                {/* Thumbnails Swapper */}
                                {studentExamPhotos && studentExamPhotos.length > 0 && (
                                  <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 pt-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[11px] font-bold text-slate-400 mr-1">Sayfalar:</span>
                                      {studentExamPhotos.map((_, idx) => {
                                        const pageNum = idx + 1;
                                        const pageQCount = (arch.sorular || []).filter((q) => (q.sayfaNo || 1) === pageNum).length;
                                        return (
                                          <button
                                            key={idx}
                                            onClick={() => {
                                              setStudentActivePageIndex(idx);
                                              setStudentZoom(1);
                                              setStudentPan({ x: 0, y: 0 });
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border whitespace-nowrap flex items-center gap-1 ${
                                              studentActivePageIndex === idx
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                            }`}
                                          >
                                            <span>{pageNum}. Sayfa</span>
                                            {pageQCount > 0 && (
                                              <span className={`text-[9px] px-1.5 rounded-full font-bold ${
                                                studentActivePageIndex === idx ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-100 text-slate-600'
                                              }`}>
                                                {pageQCount} Soru
                                              </span>
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>

                                    {studentExamPhotos.length > 1 && (
                                      <button
                                        onClick={() => setStudentSelectedPageFilter('all')}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border whitespace-nowrap ${
                                          studentSelectedPageFilter === 'all'
                                            ? 'bg-slate-800 text-white border-slate-800'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                      >
                                        Tüm Soruları Göster
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Soru Listesi & MEB Kazanımları */}
                          {arch.sorular && arch.sorular.length > 0 ? (
                            <div className="space-y-3 pt-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                  📝 Yapay Zekâ Soru Çözümleri & MEB Kazanımları
                                </h4>
                                <span className="text-[10px] text-slate-400">
                                  💡 Bir soruya tıklayarak fotoğrafta o soruya odaklanabilirsiniz
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
                                {(arch.sorular || [])
                                  .filter((q) => studentSelectedPageFilter === 'all' || (q.sayfaNo || 1) === studentSelectedPageFilter)
                                  .map((q) => {
                                    const isQSelected = studentSelectedQuestionNo === q.soruNo;
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

                                    return (
                                      <div
                                        key={q.soruNo}
                                        onClick={() => {
                                          setStudentSelectedQuestionNo(q.soruNo);
                                          const pNum = q.sayfaNo || 1;
                                          const pList = (arch.sayfaFotolari && arch.sayfaFotolari.length > 0) ? arch.sayfaFotolari : (arch.fotografYollari || []);
                                          if (pList.length >= pNum) {
                                            setStudentActivePageIndex(pNum - 1);
                                          }
                                        }}
                                        className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs space-y-1.5 ${
                                          isQSelected
                                            ? 'bg-indigo-50 border-indigo-400 shadow-xs'
                                            : 'bg-slate-50 border-slate-200/80 hover:border-indigo-200'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-slate-800">Soru {q.soruNo}: {q.ders}</span>
                                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-white text-slate-500 border border-slate-200 font-semibold">
                                              Sayfa {q.sayfaNo || 1}
                                            </span>
                                            {isFillInBlank && (
                                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold">
                                                Boşluk Doldurma
                                              </span>
                                            )}
                                          </div>
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                            isBlank
                                              ? 'bg-amber-100 text-amber-800'
                                              : isDogru
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : 'bg-rose-100 text-rose-800'
                                          }`}>
                                            {isBlank ? 'BOŞ' : isDogru ? 'DOĞRU' : 'YANLIŞ'}
                                          </span>
                                        </div>

                                        <div className="text-slate-700 text-[11px]">Konu: <strong>{q.konu}</strong></div>
                                        
                                        {q.kazanimAciklama && (
                                          <p className="text-[11px] text-slate-500 italic line-clamp-2">
                                            📌 {q.kazanimAciklama}
                                          </p>
                                        )}

                                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1.5 border-t border-slate-100">
                                          <span>
                                            {isFillInBlank ? (
                                              <>Cevabın: <strong className="text-slate-700">{isBlank ? 'Boş' : q.ogrenciCevabi}</strong> • Doğru: <strong className="text-emerald-700">{q.dogruCevap}</strong></>
                                            ) : (
                                              <>İşaretlenen: <strong className="text-slate-700">{isBlank ? 'Boş' : (q.isaretlenenSik || 'Boş')}</strong> • Doğru: <strong className="text-emerald-700">{q.dogruCevap}</strong></>
                                            )}
                                          </span>
                                          <span className="text-indigo-600 font-bold hover:underline flex items-center gap-1">
                                            <Camera className="w-3 h-3" /> Fotoğrafta Odaklan
                                          </span>
                                        </div>

                                        {/* AI Step-by-step Solution Display */}
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
                                          ogrenciCevabi={isBlank ? 'Boş' : (isFillInBlank ? q.ogrenciCevabi : (q.isaretlenenSik || q.ogrenciCevabi || 'Boş'))}
                                          dogruMu={isDogru}
                                          durum={isDogru ? 'dogru' : (isBlank ? 'bos' : 'yanlis')}
                                          canEdit={false}
                                          soruFotografYolu={q.soruFotografYolu}
                                          pagePhoto={arch.sayfaFotolari?.[(q.sayfaNo || 1) - 1] || arch.sayfaFotolari?.[0] || arch.fotografYollari?.[(q.sayfaNo || 1) - 1] || arch.fotografYollari?.[0]}
                                          kutu={q.kutu}
                                        />
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          ) : (
                            <div className="p-6 text-center text-slate-400 text-xs">
                              Bu sınavın soru ayrıntıları henüz yapay zekâ tarafından analiz ediliyor. Tamamlandığında burada listelenecektir.
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3">
                <Camera className="w-10 h-10 text-slate-300 mx-auto" />
                <div>
                  <div className="text-sm font-bold text-slate-700">Henüz bir test fotoğrafı yüklemediniz</div>
                  <div className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Çözdüğünüz deneme veya yaprak testlerin fotoğrafını çekip yükleyerek yapay zekâ analizi yaptırabilir ve koçunuzla paylaşabilirsiniz.
                  </div>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100"
                >
                  <Camera className="w-4 h-4" />
                  <span>İlk Testimi Fotoğrafla & Yükle</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 3: HEDEFLER & KOÇ NOTLARI
           ========================================================= */}
        {activePortalTab === 'hedefler' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Student Target Card */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl ${
                      student.avatarBg || 'bg-indigo-600'
                    } text-white flex items-center justify-center font-black text-lg shadow-md shrink-0`}
                  >
                    {student.adSoyad.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">{student.adSoyad}</h2>
                    <div className="text-xs text-slate-500 font-medium">
                      {student.sinif} • {student.alan} • YKS {student.yksHedefYili}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    Hedef Sıralama: <strong>{student.hedefSiralama}</strong>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-700 font-bold">
                    {student.hedefPuan} Puan
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Hedef Üniversite & Bölüm
                  </div>
                  <div className="font-bold text-slate-900">{student.hedefUniversite}</div>
                  <div className="text-indigo-700 font-semibold">{student.hedefBolum}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                    Genel Koç Tavsiyesi
                  </div>
                  <div className="text-slate-700 italic">
                    {student.kocNotu || 'Koçunuz henüz genel bir not eklemedi.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Coach Notes List */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <MessageSquareQuote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Koçumun Rehberlik & Strateji Notları ({myNotes.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Koçun tarafından sana özel yazılan değerlendirmeler ve motivasyon yönlendirmeleri
                  </p>
                </div>
              </div>

              {myNotes.length > 0 ? (
                <div className="space-y-3">
                  {myNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                            {note.kategori}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            note.oncelik === 'Kritik'
                              ? 'bg-rose-100 text-rose-800'
                              : note.oncelik === 'Önemli'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {note.oncelik}
                          </span>
                          <h4 className="font-bold text-slate-900">{note.baslik}</h4>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">{formatDate(note.tarih)}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{note.icerik}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-2">
                  <MessageSquareQuote className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="text-xs font-bold text-slate-600">Henüz kayıtlı bir koç notu bulunmuyor</div>
                  <div className="text-[11px] text-slate-400">Koçunuz özel not veya değerlendirme eklediğinde burada listelenecektir.</div>
                </div>
              )}
            </div>

            {/* MEB & YKS Müfredat, Ünite ve Konu Rehberi */}
            <div className="space-y-3">
              <CurriculumExplorer />
            </div>
          </div>
        )}

        {activePortalTab === 'haftalik-program' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <WeeklyScheduleTab
              tasks={schedules}
              studentId={student.id}
              onUpdateTask={onUpdateScheduleTask}
              studentName={student.adSoyad}
              isStudentView={true}
            />
          </div>
        )}

        {activePortalTab === 'soru-takibi' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <QuestionsTab
              questions={myQuestions}
              examArchives={myArchives}
              exams={myExams}
              onAddQuestion={onAddQuestion || (() => {})}
              onDeleteQuestion={onDeleteQuestion || (() => {})}
              studentName={student.adSoyad}
            />
          </div>
        )}

        {/* TAB: ATANAN KAYNAKLARIM (STUDENT VIEW) */}
        {activePortalTab === 'atanan-kaynaklar' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Banner */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-2xl bg-indigo-50 text-indigo-600">
                    <BookOpen className="w-6 h-6" />
                  </span>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Koçunun Sana Atadığı Kaynaklar
                  </h2>
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  Koçun tarafından sana atanan kaynak kitapları, hedef süreleri ve çalışma talimatlarını incele. Çözüp bitirdiğinde <strong>"Tamamladım"</strong> butonuna bas!
                </p>
              </div>

              {/* Completion Progress Bar */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 min-w-[220px] space-y-2 shrink-0">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">İlerleme Durumu:</span>
                  <span className="text-indigo-600 font-black">
                    {myAssignedResources.length > 0 
                      ? `${Math.round(((myAssignedResources.length - pendingAssignedResources.length) / myAssignedResources.length) * 100)}%` 
                      : '0%'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${myAssignedResources.length > 0 
                        ? Math.round(((myAssignedResources.length - pendingAssignedResources.length) / myAssignedResources.length) * 100) 
                        : 0}%` 
                    }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-bold text-center">
                  {myAssignedResources.length - pendingAssignedResources.length} / {myAssignedResources.length} Kaynak Bitirildi
                </div>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <button
                onClick={() => setResourceFilter('pending')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  resourceFilter === 'pending'
                    ? 'bg-indigo-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Çözülecekler ({pendingAssignedResources.length})
              </button>
              <button
                onClick={() => setResourceFilter('completed')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  resourceFilter === 'completed'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tamamlananlar ({myAssignedResources.length - pendingAssignedResources.length})
              </button>
              <button
                onClick={() => setResourceFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  resourceFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tümü ({myAssignedResources.length})
              </button>
            </div>

            {/* Resources List */}
            {myAssignedResources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myAssignedResources
                  .filter(res => {
                    if (resourceFilter === 'pending') return !res.completed;
                    if (resourceFilter === 'completed') return res.completed;
                    return true;
                  })
                  .map((res) => (
                    <div 
                      key={res.id}
                      className={`bg-white border rounded-3xl p-6 shadow-2xs flex flex-col justify-between transition-all ${
                        res.completed 
                          ? 'border-emerald-200/90 bg-emerald-50/10' 
                          : 'border-slate-200/90 hover:border-indigo-300'
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Subject & Difficulty */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 inline-block mb-1.5">
                              {res.subject}
                            </span>
                            <h3 className="text-base font-black text-slate-900 leading-snug">
                              {res.bookName}
                            </h3>
                            <p className="text-xs font-bold text-slate-500 mt-0.5">
                              Yayın: {res.publisher}
                            </p>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border shrink-0 ${
                            res.difficulty === 'Kolay' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : res.difficulty === 'Zor' 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {res.difficulty || 'Orta'}
                          </span>
                        </div>

                        {/* Target Info Badges */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {res.targetDurationDays && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 font-extrabold">
                              <Clock className="w-4 h-4 text-amber-600" />
                              <span>Hedef Süre: {res.targetDurationDays} Gün</span>
                            </div>
                          )}

                          {res.targetDate && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200/80 text-sky-900 font-extrabold">
                              <Calendar className="w-4 h-4 text-sky-600" />
                              <span>Son Tarih: {formatDate(res.targetDate)}</span>
                            </div>
                          )}

                          {res.hedefSoruSayisi && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200/80 text-purple-900 font-extrabold">
                              <Target className="w-4 h-4 text-purple-600" />
                              <span>Hedef: {res.hedefSoruSayisi} Soru</span>
                            </div>
                          )}
                        </div>

                        {/* Coach Note */}
                        {res.note && (
                          <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-950 font-medium">
                            <span className="font-extrabold text-indigo-900">💬 Koç Notu: </span>
                            {res.note}
                          </div>
                        )}
                      </div>

                      {/* Card Footer Action */}
                      <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-[11px] font-bold text-slate-400">
                          Atanma Tarihi: {formatDate(res.assignedDate)}
                        </div>

                        <button
                          onClick={() => {
                            if (onToggleAssignedResource) {
                              onToggleAssignedResource(res.id, !res.completed);
                            }
                          }}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer ${
                            res.completed
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                          }`}
                        >
                          {res.completed ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Tamamlandı ({formatDate(res.completedDate)})</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Tamamladım</span>
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  ))}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-2">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-black text-slate-800">Henüz Atanmış Kaynak Yok</h3>
                <p className="text-xs text-slate-400">
                  Koçun senin için yeni soru bankası veya kaynak kitap atadığında burada görünecektir.
                </p>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Question Photo Lightbox Modal */}
      {viewingPhotoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Sayfa {viewingPhotoModal.pageNo} Fotoğrafı
                    {viewingPhotoModal.question && ` - Soru ${viewingPhotoModal.question.soruNo} (${viewingPhotoModal.question.ders})`}
                  </h3>
                  <p className="text-xs text-slate-400">Yapay zekânın taradığı orijinal test kâğıdı görseli</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setModalZoom((z) => Math.min(z + 0.25, 3))}
                    className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                    title="Yakınlaştır"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setModalZoom((z) => Math.max(z - 0.25, 0.5))}
                    className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                    title="Uzaklaştır"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setModalRotation((r) => (r - 90 + 360) % 360)}
                    className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                    title="Sola 90° Döndür"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setModalRotation((r) => (r + 90) % 360)}
                    className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                    title="Sağa 90° Döndür"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setModalZoom(1);
                      setModalPan({ x: 0, y: 0 });
                      setModalRotation(0);
                    }}
                    className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                    title="Görünümü Sıfırla"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-bold text-slate-500 px-1">
                    {Math.round(modalZoom * 100)}%
                  </span>
                </div>

                <button
                  onClick={() => {
                    setViewingPhotoModal(null);
                    setModalZoom(1);
                    setModalPan({ x: 0, y: 0 });
                    setModalRotation(0);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Photo Viewport */}
            <div
              onMouseDown={handleModalMouseDown}
              onMouseMove={handleModalMouseMove}
              onMouseUp={handleModalMouseUp}
              onMouseLeave={handleModalMouseUp}
              onTouchStart={handleModalTouchStart}
              onTouchMove={handleModalTouchMove}
              onTouchEnd={handleModalTouchEnd}
              className="relative flex-1 min-h-[350px] max-h-[500px] bg-slate-950 flex items-center justify-center overflow-hidden p-4 select-none cursor-grab active:cursor-grabbing touch-none"
            >
              <img
                src={viewingPhotoModal.photoUrl}
                alt="Test Sayfası"
                style={{
                  transform: `translate(${modalPan.x}px, ${modalPan.y}px) scale(${modalZoom}) rotate(${modalRotation}deg)`,
                  transition: modalIsDragging ? 'none' : 'transform 0.15s ease-out',
                  transformOrigin: 'center center',
                }}
                className="max-w-full max-h-[480px] object-contain pointer-events-none select-none"
              />
            </div>

            {/* Question Details Footer if available */}
            {viewingPhotoModal.question && (
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <span>Soru {viewingPhotoModal.question.soruNo}: {viewingPhotoModal.question.ders} - {viewingPhotoModal.question.konu}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                      viewingPhotoModal.question.dogruMu ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {viewingPhotoModal.question.dogruMu ? 'DOĞRU' : 'YANLIŞ'}
                    </span>
                  </div>
                  {viewingPhotoModal.question.kazanimAciklama && (
                    <div className="text-[11px] text-slate-500 italic">
                      📌 {viewingPhotoModal.question.kazanimAciklama}
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-600 font-mono shrink-0">
                  İşaretlenen: <strong>{viewingPhotoModal.question.isaretlenenSik || 'Boş'}</strong> • Doğru Cevap: <strong className="text-emerald-700">{viewingPhotoModal.question.dogruCevap}</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Test Modal */}
      {isUploadModalOpen && (
        <StudentTestUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          student={student}
          curriculum={curriculum}
          onTestUploaded={handleTestUploaded}
        />
      )}

      {/* Student Toast Notification */}
      {portalToast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200 ${
          portalToast.type === 'success'
            ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
            : 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20'
        }`}>
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs font-bold">{portalToast.text}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/80 bg-white">
        Öğrenci No: <span className="font-mono font-bold text-slate-700">{student.pinCode}</span> • Eğitim Koçluğu Portalı
      </footer>
    </div>
  );
};

