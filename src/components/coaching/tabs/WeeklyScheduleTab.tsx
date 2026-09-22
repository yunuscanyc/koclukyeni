import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Clock, 
  CheckCircle, 
  Copy, 
  Printer, 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  Award, 
  UserCheck, 
  HeartHandshake, 
  RotateCcw, 
  Coffee,
  Check,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { WeeklyScheduleTask, ScheduleTaskType, DayOfWeek, BookResource } from '../../../types';
import { formatDate } from '../../../utils/dateUtils';

interface WeeklyScheduleTabProps {
  tasks: WeeklyScheduleTask[];
  books?: BookResource[];
  studentId?: string;
  onAddTask?: (task: Omit<WeeklyScheduleTask, 'id'>) => void;
  onUpdateTask: (task: WeeklyScheduleTask) => void;
  onDeleteTask?: (id: string) => void;
  onBulkAddTasks?: (tasks: Omit<WeeklyScheduleTask, 'id'>[]) => void;
  onClearAllTasks?: () => void;
  studentName: string;
  isStudentView?: boolean;
}

const DAYS: { id: DayOfWeek; label: string; short: string }[] = [
  { id: 'pazartesi', label: 'Pazartesi', short: 'Pzt' },
  { id: 'sali', label: 'Salı', short: 'Sal' },
  { id: 'carsamba', label: 'Çarşamba', short: 'Çar' },
  { id: 'persembe', label: 'Perşembe', short: 'Per' },
  { id: 'cuma', label: 'Cuma', short: 'Cum' },
  { id: 'cumartesi', label: 'Cumartesi', short: 'Cmt' },
  { id: 'pazar', label: 'Pazar', short: 'Paz' },
];

// Generate 30-min slots from 05:00 to 24:00 (38 intervals)
const TIME_SLOTS: string[] = [];
for (let h = 5; h < 24; h++) {
  const hStr = h < 10 ? `0${h}` : `${h}`;
  TIME_SLOTS.push(`${hStr}:00`);
  TIME_SLOTS.push(`${hStr}:30`);
}

const TASK_TYPE_CONFIG: Record<ScheduleTaskType, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorBg: string;
  colorBorder: string;
  colorText: string;
  badgeBg: string;
  defaultTitle: string;
}> = {
  'soru-cozumu': {
    label: 'Soru Çözümü',
    icon: HelpCircle,
    colorBg: 'bg-indigo-50/90 hover:bg-indigo-100/90',
    colorBorder: 'border-indigo-200',
    colorText: 'text-indigo-900',
    badgeBg: 'bg-indigo-600 text-white',
    defaultTitle: 'Soru Çözümü'
  },
  'konu-calismasi': {
    label: 'Ders Çalışma / Konu',
    icon: BookOpen,
    colorBg: 'bg-emerald-50/90 hover:bg-emerald-100/90',
    colorBorder: 'border-emerald-200',
    colorText: 'text-emerald-900',
    badgeBg: 'bg-emerald-600 text-white',
    defaultTitle: 'Konu Çalışması'
  },
  'deneme-sinavi': {
    label: 'Deneme Sınavı',
    icon: Award,
    colorBg: 'bg-purple-50/90 hover:bg-purple-100/90',
    colorBorder: 'border-purple-200',
    colorText: 'text-purple-900',
    badgeBg: 'bg-purple-600 text-white',
    defaultTitle: 'Deneme Sınavı'
  },
  'koc-gorusmesi': {
    label: 'Koç Görüşmesi',
    icon: UserCheck,
    colorBg: 'bg-amber-50/90 hover:bg-amber-100/90',
    colorBorder: 'border-amber-300',
    colorText: 'text-amber-900',
    badgeBg: 'bg-amber-600 text-white',
    defaultTitle: 'Koç Görüşmesi'
  },
  'rehberlik': {
    label: 'Rehber Öğretmen',
    icon: HeartHandshake,
    colorBg: 'bg-sky-50/90 hover:bg-sky-100/90',
    colorBorder: 'border-sky-200',
    colorText: 'text-sky-900',
    badgeBg: 'bg-sky-600 text-white',
    defaultTitle: 'Rehber Öğretmen Görüşmesi'
  },
  'tekrar-analiz': {
    label: 'Tekrar & Soru Analizi',
    icon: RotateCcw,
    colorBg: 'bg-rose-50/90 hover:bg-rose-100/90',
    colorBorder: 'border-rose-200',
    colorText: 'text-rose-900',
    badgeBg: 'bg-rose-600 text-white',
    defaultTitle: 'Haftalık Tekrar & Analiz'
  },
  'mola-serbest': {
    label: 'Mola / Dinlenme',
    icon: Coffee,
    colorBg: 'bg-slate-100 hover:bg-slate-200/80',
    colorBorder: 'border-slate-200',
    colorText: 'text-slate-800',
    badgeBg: 'bg-slate-600 text-white',
    defaultTitle: 'Mola & Serbest Zaman'
  }
};

const DEFAULT_LESSONS = [
  'Matematik',
  'Geometri',
  'Türkçe',
  'Edebiyat',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Tarih',
  'Coğrafya',
  'Felsefe & Din'
];

// Helper to convert "HH:MM" string to minutes from 00:00
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// Helper to add 30 minutes to "HH:MM" string
function add30Minutes(t: string): string {
  const mins = timeToMinutes(t) + 30;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const hStr = h < 10 ? `0${h}` : `${h}`;
  const mStr = m < 10 ? `0${m}` : `${m}`;
  return `${hStr}:${mStr}`;
}

export const WeeklyScheduleTab: React.FC<WeeklyScheduleTabProps> = ({
  tasks = [],
  books = [],
  studentId,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onBulkAddTasks,
  onClearAllTasks,
  studentName,
  isStudentView = false,
}) => {
  // Selected Week Monday State
  const [currentMonday, setCurrentMonday] = useState<Date>(() => {
    const localNow = new Date();
    const day = localNow.getDay();
    const diff = localNow.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(localNow.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const getWeekDays = (monday: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const formatDateYYYYMMDD = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const weekDays = getWeekDays(currentMonday);
  const weekDates = weekDays.map(formatDateYYYYMMDD);

  const getWeekRangeLabel = (monday: Date) => {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return `${formatDate(monday)} - ${formatDate(sunday)}`;
  };

  // Filter tasks to show ONLY those belonging to the current selected week (or legacy template tasks with no date)
  const currentWeekTasks = tasks.filter((t) => {
    const dayIdx = DAYS.findIndex((d) => d.id === t.gun);
    if (dayIdx === -1) return false;
    if (t.tarih) {
      return t.tarih === weekDates[dayIdx];
    }
    return true;
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<WeeklyScheduleTask | null>(null);
  const [detailModalTask, setDetailModalTask] = useState<WeeklyScheduleTask | null>(null);
  const [showCopyModal, setShowCopyModal] = useState(false);

  // Close open modals on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
        if (modalOpen) {
          setModalOpen(false);
          setEditingTask(null);
        } else if (detailModalTask) {
          setDetailModalTask(null);
        } else if (showCopyModal) {
          setShowCopyModal(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalOpen, detailModalTask, showCopyModal]);

  // Range Selection State (First click -> Last click)
  const [selectionStart, setSelectionStart] = useState<{ day: DayOfWeek; slotIndex: number } | null>(null);
  const [hoverSlotIndex, setHoverSlotIndex] = useState<number | null>(null);

  // Modal Form Inputs
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('pazartesi');
  const [startSlot, setStartSlot] = useState<string>('09:00');
  const [endSlot, setEndSlot] = useState<string>('10:30');
  const [gorevTuru, setGorevTuru] = useState<ScheduleTaskType>('soru-cozumu');
  const [baslik, setBaslik] = useState<string>('');
  const [ders, setDers] = useState<string>('Matematik');
  const [konular, setKonular] = useState<string>('');
  const [hedefSoruSayisi, setHedefSoruSayisi] = useState<number>(50);
  const [kaynak, setKaynak] = useState<string>('');
  const [gorusmeNotu, setGorusmeNotu] = useState<string>('');
  const [aciklama, setAciklama] = useState<string>('');

  // Copy Day State
  const [sourceDay, setSourceDay] = useState<DayOfWeek>('pazartesi');
  const [targetDay, setTargetDay] = useState<DayOfWeek>('sali');

  // Open Modal for New Task or Range Selection
  const openNewTaskModal = (day: DayOfWeek, start: string, end: string) => {
    setEditingTask(null);
    setSelectedDay(day);
    setStartSlot(start);
    setEndSlot(end);
    setGorevTuru('soru-cozumu');
    setBaslik(TASK_TYPE_CONFIG['soru-cozumu'].defaultTitle);
    setDers('Matematik');
    setKonular('');
    setHedefSoruSayisi(50);
    setKaynak('');
    setGorusmeNotu('');
    setAciklama('');
    setModalOpen(true);
  };

  // Open Modal for Editing Existing Task
  const openEditModal = (task: WeeklyScheduleTask) => {
    setEditingTask(task);
    setSelectedDay(task.gun);
    setStartSlot(task.baslangicSaat);
    setEndSlot(task.bitisSaat);
    setGorevTuru(task.gorevTuru);
    setBaslik(task.baslik);
    setDers(task.ders || 'Matematik');
    setKonular(task.konular || '');
    setHedefSoruSayisi(task.hedefSoruSayisi || 50);
    setKaynak(task.kaynak || '');
    setGorusmeNotu(task.gorusmeNotu || '');
    setAciklama(task.aciklama || '');
    setModalOpen(true);
  };

  // Handle Cell Click for First-to-Last Cell Selection
  const handleCellClick = (day: DayOfWeek, slotIdx: number) => {
    if (isStudentView) return;

    if (!selectionStart) {
      // First click: Start selection
      setSelectionStart({ day, slotIndex: slotIdx });
      setHoverSlotIndex(slotIdx);
    } else {
      // Second click: If same day, finalize range
      if (selectionStart.day === day) {
        const minIdx = Math.min(selectionStart.slotIndex, slotIdx);
        const maxIdx = Math.max(selectionStart.slotIndex, slotIdx);

        const startTime = TIME_SLOTS[minIdx];
        const endTime = add30Minutes(TIME_SLOTS[maxIdx]);

        setSelectionStart(null);
        setHoverSlotIndex(null);
        openNewTaskModal(day, startTime, endTime);
      } else {
        // Different day clicked: restart selection on new day
        setSelectionStart({ day, slotIndex: slotIdx });
        setHoverSlotIndex(slotIdx);
      }
    }
  };

  // Form Submit (Save / Update Task)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dayIdx = DAYS.findIndex((d) => d.id === selectedDay);
    const calculatedTarih = dayIdx !== -1 ? weekDates[dayIdx] : undefined;

    // Preserve studentId from editingTask or prop studentId
    const studentIdToUse = editingTask?.studentId || studentId || '';

    // Calculate date: if day unchanged and had tarih, keep it; if day was changed, update to selected day's date
    let finalTarih: string | undefined = calculatedTarih;
    if (editingTask && editingTask.gun === selectedDay && editingTask.tarih) {
      finalTarih = editingTask.tarih;
    }

    const taskData = {
      studentId: studentIdToUse,
      gun: selectedDay,
      baslangicSaat: startSlot,
      bitisSaat: endSlot,
      gorevTuru,
      baslik: baslik.trim() || TASK_TYPE_CONFIG[gorevTuru].defaultTitle,
      ders: (gorevTuru === 'soru-cozumu' || gorevTuru === 'konu-calismasi') ? ders : undefined,
      konular: konular.trim() || undefined,
      hedefSoruSayisi: gorevTuru === 'soru-cozumu' ? Number(hedefSoruSayisi) : undefined,
      kaynak: kaynak.trim() || undefined,
      gorusmeNotu: (gorevTuru === 'koc-gorusmesi' || gorevTuru === 'rehberlik') ? gorusmeNotu.trim() : undefined,
      aciklama: aciklama.trim() || undefined,
      tamamlandi: editingTask ? editingTask.tamamlandi : false,
      tarih: finalTarih,
    };

    if (editingTask) {
      onUpdateTask({ ...taskData, id: editingTask.id });
    } else {
      onAddTask?.(taskData);
    }

    setEditingTask(null);
    setModalOpen(false);
  };

  // Toggle Completed Status for Task
  const handleToggleComplete = (task: WeeklyScheduleTask, e: React.MouseEvent) => {
    e.stopPropagation();
    const dayIdx = DAYS.findIndex((d) => d.id === task.gun);
    const calculatedTarih = dayIdx !== -1 ? weekDates[dayIdx] : undefined;

    onUpdateTask({
      ...task,
      tamamlandi: !task.tamamlandi,
      tarih: task.tarih || calculatedTarih
    });
  };

  // Copy Day Schedule Function
  const handleCopyDaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceDay === targetDay) return;

    const sourceTasks = currentWeekTasks.filter((t) => t.gun === sourceDay);
    if (sourceTasks.length === 0) {
      alert(`Seçtiğiniz ${DAYS.find(d => d.id === sourceDay)?.label} gününde kayıtlı görev bulunamadı.`);
      return;
    }

    const targetDayIdx = DAYS.findIndex((d) => d.id === targetDay);
    const calculatedTargetTarih = targetDayIdx !== -1 ? weekDates[targetDayIdx] : undefined;

    const newTasks = sourceTasks.map((t) => ({
      studentId: t.studentId || '',
      gun: targetDay,
      baslangicSaat: t.baslangicSaat,
      bitisSaat: t.bitisSaat,
      gorevTuru: t.gorevTuru,
      baslik: t.baslik,
      ders: t.ders,
      konular: t.konular,
      hedefSoruSayisi: t.hedefSoruSayisi,
      kaynak: t.kaynak,
      gorusmeNotu: t.gorusmeNotu,
      aciklama: t.aciklama,
      tamamlandi: false,
      tarih: calculatedTargetTarih,
    }));

    if (onBulkAddTasks) {
      onBulkAddTasks(newTasks);
    } else {
      newTasks.forEach((nt) => onAddTask?.(nt));
    }

    setShowCopyModal(false);
  };

  // Load Preset Template
  const handleLoadPreset = () => {
    if (!confirm('Yoğun YKS Sayısal Haftalık Çalışma Şablonu yüklensin mi? (Mevcut programın üzerine eklenecektir)')) return;

    const rawPresetTasks: Omit<WeeklyScheduleTask, 'id'>[] = [
      // Pazartesi
      { studentId: '', gun: 'pazartesi', baslangicSaat: '08:00', bitisSaat: '10:00', gorevTuru: 'konu-calismasi', baslik: 'Matematik Konu Çalışması', ders: 'Matematik', konular: 'Trigonometri Formülleri & Özet', tamamlandi: false },
      { studentId: '', gun: 'pazartesi', baslangicSaat: '10:30', bitisSaat: '12:30', gorevTuru: 'soru-cozumu', baslik: 'Matematik Soru Çözümü', ders: 'Matematik', hedefSoruSayisi: 80, kaynak: '3D Yayınları', tamamlandi: false },
      { studentId: '', gun: 'pazartesi', baslangicSaat: '14:00', bitisSaat: '16:00', gorevTuru: 'konu-calismasi', baslik: 'Fizik Konu Çalışması', ders: 'Fizik', konular: 'Elektrik & Mıknatıs', tamamlandi: false },
      { studentId: '', gun: 'pazartesi', baslangicSaat: '16:30', bitisSaat: '18:00', gorevTuru: 'soru-cozumu', baslik: 'Fizik Soru Çözümü', ders: 'Fizik', hedefSoruSayisi: 50, tamamlandi: false },
      { studentId: '', gun: 'pazartesi', baslangicSaat: '20:00', bitisSaat: '21:30', gorevTuru: 'koc-gorusmesi', baslik: 'Haftalık Koç Değerlendirmesi', gorusmeNotu: 'Haftalık soru hedefleri ve deneme analizi görüşmesi', tamamlandi: false },

      // Salı
      { studentId: '', gun: 'sali', baslangicSaat: '08:30', bitisSaat: '10:30', gorevTuru: 'konu-calismasi', baslik: 'Kimya Konu Çalışması', ders: 'Kimya', konular: 'Mol Kavramı & Gazlar', tamamlandi: false },
      { studentId: '', gun: 'sali', baslangicSaat: '11:00', bitisSaat: '12:30', gorevTuru: 'soru-cozumu', baslik: 'Kimya Soru Çözümü', ders: 'Kimya', hedefSoruSayisi: 60, tamamlandi: false },
      { studentId: '', gun: 'sali', baslangicSaat: '14:00', bitisSaat: '16:00', gorevTuru: 'konu-calismasi', baslik: 'Biyoloji Konu Çalışması', ders: 'Biyoloji', konular: 'Hücre Bölünmeleri & Kalıtım', tamamlandi: false },
      { studentId: '', gun: 'sali', baslangicSaat: '16:30', bitisSaat: '18:00', gorevTuru: 'soru-cozumu', baslik: 'Biyoloji Soru Çözümü', ders: 'Biyoloji', hedefSoruSayisi: 60, tamamlandi: false },

      // Çarşamba
      { studentId: '', gun: 'carsamba', baslangicSaat: '09:00', bitisSaat: '12:00', gorevTuru: 'deneme-sinavi', baslik: 'TYT Genel Deneme Sınavı', ders: 'Türkçe', konular: 'TYT Genel Prova', tamamlandi: false },
      { studentId: '', gun: 'carsamba', baslangicSaat: '14:00', bitisSaat: '16:30', gorevTuru: 'tekrar-analiz', baslik: 'Deneme Yanlış Sorular Analizi', ders: 'Matematik', konular: 'Denemede Boş Bırakılan Soruların Çözümü', tamamlandi: false },

      // Perşembe
      { studentId: '', gun: 'persembe', baslangicSaat: '08:30', bitisSaat: '10:30', gorevTuru: 'konu-calismasi', baslik: 'Geometri Konu Çalışması', ders: 'Geometri', konular: 'Üçgende Açılar & Özel Üçgenler', tamamlandi: false },
      { studentId: '', gun: 'persembe', baslangicSaat: '11:00', bitisSaat: '12:30', gorevTuru: 'soru-cozumu', baslik: 'Geometri Soru Çözümü', ders: 'Geometri', hedefSoruSayisi: 50, tamamlandi: false },
      { studentId: '', gun: 'persembe', baslangicSaat: '14:00', bitisSaat: '15:30', gorevTuru: 'rehberlik', baslik: 'Rehber Öğretmen Görüşmesi', gorusmeNotu: 'Sınav stresi ve zaman yönetimi rehberlik oturumu', tamamlandi: false },

      // Cuma
      { studentId: '', gun: 'cuma', baslangicSaat: '08:30', bitisSaat: '11:00', gorevTuru: 'konu-calismasi', baslik: 'Türkçe Paragraf & Dil Bilgisi', ders: 'Türkçe', konular: 'Paragrafta Yapı & Yazım Kuralları', tamamlandi: false },
      { studentId: '', gun: 'cuma', baslangicSaat: '11:30', bitisSaat: '13:00', gorevTuru: 'soru-cozumu', baslik: 'Paragraf Soru Çözümü', ders: 'Türkçe', hedefSoruSayisi: 50, tamamlandi: false },

      // Cumartesi
      { studentId: '', gun: 'cumartesi', baslangicSaat: '09:00', bitisSaat: '12:00', gorevTuru: 'deneme-sinavi', baslik: 'AYT Sayısal Branş Denemesi', ders: 'Fizik', tamamlandi: false },
      { studentId: '', gun: 'cumartesi', baslangicSaat: '14:00', bitisSaat: '17:00', gorevTuru: 'tekrar-analiz', baslik: 'Haftalık Genel Tekrar ve Hata Defteri', tamamlandi: false },

      // Pazar
      { studentId: '', gun: 'pazar', baslangicSaat: '10:00', bitisSaat: '13:00', gorevTuru: 'mola-serbest', baslik: 'Haftalık Dinlenme & Sosyal Etkinlik', tamamlandi: false },
    ];

    const presetTasks = rawPresetTasks.map((t) => {
      const dayIdx = DAYS.findIndex((d) => d.id === t.gun);
      return {
        ...t,
        tarih: dayIdx !== -1 ? weekDates[dayIdx] : undefined,
      };
    });

    if (onBulkAddTasks) {
      onBulkAddTasks(presetTasks);
    } else {
      presetTasks.forEach((t) => onAddTask?.(t));
    }
  };

  // Total Statistics
  const totalTasksCount = currentWeekTasks.length;
  const completedTasksCount = currentWeekTasks.filter(t => t.tamamlandi).length;
  const totalPlannedQuestions = currentWeekTasks.reduce((acc, t) => acc + (t.hedefSoruSayisi || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700">
                <Clock className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                Haftalık Ders & Çalışma Programı
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              <strong>{studentName}</strong> için sabah 05:00 ile gece 24:00 arası yarım saatlik hücrelerle haftalık çalışma takvimi.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isStudentView && (
              <>
                <button
                  onClick={() => setShowCopyModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Günü Kopyala</span>
                </button>

                <button
                  onClick={handleLoadPreset}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all"
                >
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Örnek Şablon Yükle</span>
                </button>
              </>
            )}

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all"
            >
              <Printer className="w-4 h-4 text-emerald-600" />
              <span>Yazdır / PDF</span>
            </button>

            {!isStudentView && onClearAllTasks && currentWeekTasks.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Seçili haftanın tüm programı sıfırlansın mı?')) onClearAllTasks();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all"
                title="Programı Temizle"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
            <div className="text-[11px] text-slate-500 font-bold">Toplam Görev</div>
            <div className="text-xl font-black text-slate-900">{totalTasksCount} Block</div>
          </div>
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 text-center">
            <div className="text-[11px] text-emerald-700 font-bold">Tamamlanan</div>
            <div className="text-xl font-black text-emerald-800">{completedTasksCount} / {totalTasksCount}</div>
          </div>
          <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-3 text-center">
            <div className="text-[11px] text-indigo-700 font-bold">Planlanan Hedef Soru</div>
            <div className="text-xl font-black text-indigo-900">{totalPlannedQuestions} Soru</div>
          </div>
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 text-center">
            <div className="text-[11px] text-amber-800 font-bold">Nasıl Kullanılır?</div>
            <div className="text-[11px] font-semibold text-amber-900 mt-0.5">
              {isStudentView ? "Tamamladığın görevlerdeki tike tıklayarak işaretle!" : "Hücrelere tıklayarak saat aralığı seçin"}
            </div>
          </div>
        </div>
      </div>

      {/* Week Navigation Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-slate-200/90 rounded-2xl p-4 shadow-3xs gap-3">
        <button
          onClick={() => {
            const prev = new Date(currentMonday);
            prev.setDate(currentMonday.getDate() - 7);
            setCurrentMonday(prev);
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-black transition-all hover:shadow-2xs active:scale-98"
        >
          <ChevronLeft className="w-4 h-4 text-slate-500" />
          <span>Önceki Hafta</span>
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider">Seçili Çalışma Dönemi</span>
          <h3 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
            {getWeekRangeLabel(currentMonday)}
          </h3>
        </div>

        <button
          onClick={() => {
            const next = new Date(currentMonday);
            next.setDate(currentMonday.getDate() + 7);
            setCurrentMonday(next);
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-black transition-all hover:shadow-2xs active:scale-98"
        >
          <span>Sonraki Hafta</span>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Range Selection Instructions Alert */}
      {selectionStart ? (
        <div className="bg-indigo-600 text-white rounded-2xl p-3 px-4 flex items-center justify-between text-xs font-bold animate-pulse shadow-md">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>
              <strong>{DAYS.find(d => d.id === selectionStart.day)?.label}</strong> günü saat <strong>{TIME_SLOTS[selectionStart.slotIndex]}</strong> seçildi. Şimdi BİTİŞ saatindeki hücreye tıklayarak aralığı tamamlayın.
            </span>
          </div>
          <button
            onClick={() => {
              setSelectionStart(null);
              setHoverSlotIndex(null);
            }}
            className="px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-white text-[10px] uppercase font-black"
          >
            İptal Et
          </button>
        </div>
      ) : null}

      {/* Task Type Color Legend */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex items-center gap-2 flex-wrap text-xs">
        <span className="font-bold text-slate-500 mr-1 text-[11px] uppercase tracking-wider">Görev Türleri:</span>
        {(Object.keys(TASK_TYPE_CONFIG) as ScheduleTaskType[]).map((key) => {
          const cfg = TASK_TYPE_CONFIG[key];
          const Icon = cfg.icon;
          return (
            <div
              key={key}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold border text-[11px] ${cfg.colorBg} ${cfg.colorBorder} ${cfg.colorText}`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{cfg.label}</span>
            </div>
          );
        })}
      </div>

      {/* Weekly Timetable Grid (05:00 to 24:00 - 30 min intervals) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Header: Days */}
            <div className="grid grid-cols-8 bg-slate-900 text-white text-center font-bold text-xs sticky top-0 z-10 border-b border-slate-800">
              <div className="py-3 px-2 border-r border-slate-800 text-slate-400 font-mono flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Saat</span>
              </div>
              {DAYS.map((day, idx) => {
                const dayTasks = currentWeekTasks.filter(t => t.gun === day.id);
                const dateOfToday = weekDays[idx];
                const displayDate = formatDate(dateOfToday);
                return (
                  <div key={day.id} className="py-3 px-2 border-r border-slate-800/80 last:border-0">
                    <div className="font-extrabold text-sm">{day.label}</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {displayDate} • {dayTasks.length} Görev
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Timetable Body Rows */}
            <div className="divide-y divide-slate-100 bg-slate-50/30 text-xs">
              {TIME_SLOTS.map((slotTime, slotIdx) => {
                const slotMinutes = timeToMinutes(slotTime);

                return (
                  <div key={slotTime} className="grid grid-cols-8 min-h-[42px] hover:bg-slate-100/40 transition-colors">
                    {/* Time Column */}
                    <div className="py-2 px-2 text-center text-[11px] font-mono font-extrabold text-slate-500 bg-slate-100/70 border-r border-slate-200/80 flex items-center justify-center shrink-0 select-none">
                      {slotTime}
                    </div>

                    {/* Day Columns */}
                    {DAYS.map((day) => {
                      // Find tasks for this day that cover this slot
                      const dayTasks = currentWeekTasks.filter((t) => {
                        if (t.gun !== day.id) return false;
                        const startMins = timeToMinutes(t.baslangicSaat);
                        const endMins = timeToMinutes(t.bitisSaat);
                        return slotMinutes >= startMins && slotMinutes < endMins;
                      });

                      // Check if this slot is the START slot of a task
                      const startingTask = dayTasks.find((t) => t.baslangicSaat === slotTime);

                      // Check range selection highlight
                      let isSelectedHighlight = false;
                      if (selectionStart && selectionStart.day === day.id && hoverSlotIndex !== null) {
                        const minIndex = Math.min(selectionStart.slotIndex, hoverSlotIndex);
                        const maxIndex = Math.max(selectionStart.slotIndex, hoverSlotIndex);
                        if (slotIdx >= minIndex && slotIdx <= maxIndex) {
                          isSelectedHighlight = true;
                        }
                      }

                      return (
                        <div
                          key={day.id}
                          onClick={() => handleCellClick(day.id, slotIdx)}
                          onMouseEnter={() => {
                            if (selectionStart) setHoverSlotIndex(slotIdx);
                          }}
                          className={`relative border-r border-slate-200/70 last:border-0 p-1 cursor-pointer transition-all ${
                            isSelectedHighlight 
                              ? 'bg-indigo-300/60 border-2 border-indigo-600 z-10' 
                              : 'hover:bg-indigo-50/50'
                          }`}
                        >
                          {/* Render Task Card if task starts at this time slot */}
                          {startingTask ? (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isStudentView) {
                                  setDetailModalTask(startingTask);
                                } else {
                                  openEditModal(startingTask);
                                }
                              }}
                              className={`absolute inset-x-1 top-1 z-20 rounded-2xl p-2.5 border shadow-sm transition-all hover:scale-[1.02] cursor-pointer ${
                                TASK_TYPE_CONFIG[startingTask.gorevTuru].colorBg
                              } ${
                                TASK_TYPE_CONFIG[startingTask.gorevTuru].colorBorder
                              } ${
                                TASK_TYPE_CONFIG[startingTask.gorevTuru].colorText
                              } ${startingTask.tamamlandi ? 'opacity-70 line-through' : ''}`}
                              style={{
                                // Calculate span height based on duration
                                height: `${Math.max(1, (timeToMinutes(startingTask.bitisSaat) - timeToMinutes(startingTask.baslangicSaat)) / 30) * 42 - 6}px`,
                              }}
                            >
                              <div className="flex items-start justify-between gap-1 h-full flex-col justify-between overflow-hidden">
                                <div>
                                  <div className="flex items-start justify-between gap-1 mb-1">
                                    <div className="flex items-center gap-1 flex-wrap min-w-0">
                                      {/* Görev Türü Rozeti */}
                                      <span
                                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 shadow-2xs shrink-0 ${
                                          TASK_TYPE_CONFIG[startingTask.gorevTuru]?.badgeBg || 'bg-indigo-600 text-white'
                                        }`}
                                        title={`Görev Türü: ${TASK_TYPE_CONFIG[startingTask.gorevTuru]?.label || ''}`}
                                      >
                                        {(() => {
                                          const TaskIcon = TASK_TYPE_CONFIG[startingTask.gorevTuru]?.icon || HelpCircle;
                                          return <TaskIcon className="w-2.5 h-2.5 shrink-0" />;
                                        })()}
                                        <span className="truncate max-w-[95px]">{TASK_TYPE_CONFIG[startingTask.gorevTuru]?.label || 'Görev'}</span>
                                      </span>

                                      {/* Saat Rozeti */}
                                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-white/90 text-slate-800 border border-black/10 shadow-2xs shrink-0">
                                        {startingTask.baslangicSaat} - {startingTask.bitisSaat}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={(e) => handleToggleComplete(startingTask, e)}
                                      className={`p-1 rounded-full transition-colors shrink-0 ${
                                        startingTask.tamamlandi 
                                          ? 'bg-emerald-600 text-white shadow-xs' 
                                          : 'bg-white/80 hover:bg-emerald-100 text-slate-400 hover:text-emerald-700'
                                      }`}
                                      title={startingTask.tamamlandi ? 'Tamamlandı olarak işaretlendi' : 'Tamamlandı olarak işaretle'}
                                    >
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </button>
                                  </div>

                                  <div className="font-extrabold text-xs mt-0.5 line-clamp-1">
                                    {startingTask.baslik}
                                  </div>

                                  {startingTask.ders && (
                                    <div className="text-[10px] font-bold opacity-80 mt-0.5">
                                      📚 {startingTask.ders}
                                    </div>
                                  )}

                                  {startingTask.konular && (
                                    <div className="text-[10px] opacity-75 line-clamp-1 mt-0.5 font-medium">
                                      {startingTask.konular}
                                    </div>
                                  )}

                                  {startingTask.hedefSoruSayisi && startingTask.hedefSoruSayisi > 0 ? (
                                    <div className="text-[10px] font-black mt-1 inline-block px-1.5 py-0.5 rounded bg-white/70">
                                      🎯 {startingTask.hedefSoruSayisi} Soru
                                    </div>
                                  ) : null}

                                  {startingTask.gorusmeNotu && (
                                    <div className="text-[10px] italic opacity-85 line-clamp-2 mt-1">
                                      💬 {startingTask.gorusmeNotu}
                                    </div>
                                  )}
                                </div>

                                <div className="text-[9px] font-semibold opacity-60 self-end">
                                  {isStudentView ? (startingTask.tamamlandi ? '✓ Tamamlandı' : '🔍 Detayı Gör') : 'Tıkla & Düzenle'}
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Student Task Detail Modal (Read-only) */}
      {detailModalTask && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDetailModalTask(null);
            }
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
        >
          <div className="bg-white border-2 border-indigo-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 my-8">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg border ${TASK_TYPE_CONFIG[detailModalTask.gorevTuru].colorBg} ${TASK_TYPE_CONFIG[detailModalTask.gorevTuru].colorBorder} ${TASK_TYPE_CONFIG[detailModalTask.gorevTuru].colorText}`}>
                    {TASK_TYPE_CONFIG[detailModalTask.gorevTuru].label}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                    ⏰ {detailModalTask.baslangicSaat} - {detailModalTask.bitisSaat}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                    📅 {DAYS.find(d => d.id === detailModalTask.gun)?.label}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  {detailModalTask.baslik}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalTask(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                title="Kapat (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details List */}
            <div className="space-y-3 text-xs">
              {/* Ders & Soru Target */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {detailModalTask.ders && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Ders</div>
                    <div className="font-black text-slate-800 text-sm">{detailModalTask.ders}</div>
                  </div>
                )}

                {detailModalTask.hedefSoruSayisi ? (
                  <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-0.5">
                    <div className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-wider">Hedef Soru</div>
                    <div className="font-black text-indigo-900 text-sm">🎯 {detailModalTask.hedefSoruSayisi} Soru</div>
                  </div>
                ) : null}
              </div>

              {/* Çalışılacak Konular */}
              {detailModalTask.konular && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Çalışılacak Konular</div>
                  <div className="font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">{detailModalTask.konular}</div>
                </div>
              )}

              {/* Kaynak / Kitap */}
              {detailModalTask.kaynak && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Kaynak Kitap / Materyal</div>
                  <div className="font-bold text-slate-800">{detailModalTask.kaynak}</div>
                </div>
              )}

              {/* Koç Notu */}
              {detailModalTask.gorusmeNotu && (
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1">
                  <div className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">
                    💬 Koç Notu / Talimatı
                  </div>
                  <div className="font-bold text-amber-950 leading-relaxed whitespace-pre-wrap">{detailModalTask.gorusmeNotu}</div>
                </div>
              )}

              {/* Açıklama */}
              {detailModalTask.aciklama && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Genel Açıklama</div>
                  <div className="font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{detailModalTask.aciklama}</div>
                </div>
              )}

              {/* Tamamlanma Durumu Tıklanabilir Toggle */}
              <div className="pt-2">
                <button
                  onClick={(e) => {
                    handleToggleComplete(detailModalTask, e);
                    setDetailModalTask({
                      ...detailModalTask,
                      tamamlandi: !detailModalTask.tamamlandi
                    });
                  }}
                  className={`w-full py-3 px-4 rounded-2xl border text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    detailModalTask.tamamlandi
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-200'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-2xs'
                  }`}
                >
                  <Check className={`w-4 h-4 stroke-[3] ${detailModalTask.tamamlandi ? 'text-white' : 'text-slate-400'}`} />
                  <span>
                    {detailModalTask.tamamlandi ? '✓ Görev Tamamlandı Olarak İşaretlendi (Tıkla Değiştir)' : 'Görev Henüz Tamamlanmadı (Tamamlandı Olarak İşaretle)'}
                  </span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setDetailModalTask(null)}
                className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-extrabold hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Creation & Editing Modal */}
      {modalOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModalOpen(false);
              setEditingTask(null);
            }
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
        >
          <div className="bg-white border-2 border-indigo-500/30 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-indigo-50 text-indigo-600 font-bold">
                  <Clock className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingTask ? 'Görevi Düzenle' : 'Haftalık Program Görevi Ekle'}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">İptal etmek için ESC tuşuna basabilirsiniz</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setEditingTask(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
                title="Kapat (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Day & Time Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gün *</label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                  >
                    {DAYS.map((d) => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Başlangıç Saati *</label>
                  <select
                    value={startSlot}
                    onChange={(e) => setStartSlot(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bitiş Saati *</label>
                  <select
                    value={endSlot}
                    onChange={(e) => setEndSlot(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="24:00">24:00</option>
                  </select>
                </div>
              </div>

              {/* Task Type Radio/Buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Görev Türü *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(TASK_TYPE_CONFIG) as ScheduleTaskType[]).map((key) => {
                    const cfg = TASK_TYPE_CONFIG[key];
                    const Icon = cfg.icon;
                    const isSelected = gorevTuru === key;
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => {
                          setGorevTuru(key);
                          if (!baslik || baslik === TASK_TYPE_CONFIG[gorevTuru].defaultTitle) {
                            setBaslik(cfg.defaultTitle);
                          }
                        }}
                        className={`flex items-center gap-2 p-2.5 rounded-2xl border text-xs font-bold transition-all text-left ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="line-clamp-1">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Task Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Görev Başlığı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Matematik Soru Çözümü"
                  value={baslik}
                  onChange={(e) => setBaslik(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Dynamic Fields for Soru Çözümü & Ders Çalışma */}
              {(gorevTuru === 'soru-cozumu' || gorevTuru === 'konu-calismasi') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ders *</label>
                    <select
                      value={ders}
                      onChange={(e) => setDers(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      {DEFAULT_LESSONS.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>

                  {gorevTuru === 'soru-cozumu' ? (
                    <div>
                      <label className="block text-xs font-bold text-indigo-700 mb-1">Hedef Soru Sayısı</label>
                      <input
                        type="number"
                        min="1"
                        value={hedefSoruSayisi}
                        onChange={(e) => setHedefSoruSayisi(Number(e.target.value))}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-indigo-900"
                      />
                    </div>
                  ) : null}

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Çalışılacak Konular / Üniteler</label>
                    <input
                      type="text"
                      placeholder="Örn: Trigonometri Yarım Açı ve Dönüşüm Formülleri"
                      value={konular}
                      onChange={(e) => setKonular(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  {gorevTuru === 'soru-cozumu' && (
                    <div className="sm:col-span-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700">Kaynak Kitap / Test</label>
                        {books.length > 0 && (
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            📚 {books.length} Kaynak Havuzda
                          </span>
                        )}
                      </div>

                      {/* Select from pool combo */}
                      {books.length > 0 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              setKaynak(e.target.value);
                            }
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white text-slate-700"
                          defaultValue=""
                        >
                          <option value="" disabled>-- Havuzdan Hazır Kaynak Kitap Seç --</option>
                          {books
                            .filter(b => !ders || b.subject.toLowerCase() === ders.toLowerCase() || b.subject === 'Genel')
                            .map((b) => (
                              <option key={b.id} value={`${b.publisher} - ${b.name} (${b.difficulty})`}>
                                [{b.difficulty}] {b.publisher} - {b.name}
                              </option>
                            ))}
                          {books
                            .filter(b => ders && b.subject.toLowerCase() !== ders.toLowerCase() && b.subject !== 'Genel')
                            .map((b) => (
                              <option key={b.id} value={`${b.publisher} - ${b.name} (${b.difficulty})`}>
                                [{b.subject} - {b.difficulty}] {b.publisher} - {b.name}
                              </option>
                            ))}
                        </select>
                      )}

                      {/* Manual / Detail text input */}
                      <input
                        type="text"
                        placeholder="Örn: 3D YKS Soru Bankası Test 4-5 veya istediğiniz kaynağı yazın"
                        value={kaynak}
                        onChange={(e) => setKaynak(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Fields for Koç Görüşmesi & Rehberlik */}
              {(gorevTuru === 'koc-gorusmesi' || gorevTuru === 'rehberlik') && (
                <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-1">Görüşme Konusu & Açıklaması</label>
                    <textarea
                      rows={2}
                      placeholder="Örn: Deneme sonuçlarının değerlendirilmesi, sınav kaygısı yönetimi..."
                      value={gorusmeNotu}
                      onChange={(e) => setGorusmeNotu(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}

              {/* General Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Genel Not / Ek Açıklama</label>
                <input
                  type="text"
                  placeholder="İsteğe bağlı ek hatırlatma notu..."
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {editingTask ? (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteTask?.(editingTask.id);
                      setModalOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Görevi Sil</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModalOpen(false);
                      setEditingTask(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    İptal (ESC)
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    {editingTask ? 'Güncelle' : 'Programa Ekle'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Copy Day Modal */}
      {showCopyModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCopyModal(false);
            }
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border-2 border-indigo-500/20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Copy className="w-4 h-4 text-indigo-600" />
                <span>Günün Programını Kopyala</span>
              </h4>
              <button 
                type="button"
                onClick={() => setShowCopyModal(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
                title="Kapat (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCopyDaySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kaynak Gün (Kopyalanacak)</label>
                <select
                  value={sourceDay}
                  onChange={(e) => setSourceDay(e.target.value as DayOfWeek)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  {DAYS.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hedef Gün (Yapıştırılacak)</label>
                <select
                  value={targetDay}
                  onChange={(e) => setTargetDay(e.target.value as DayOfWeek)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  {DAYS.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCopyModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  İptal (ESC)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Kopyala ve Yapıştır
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
