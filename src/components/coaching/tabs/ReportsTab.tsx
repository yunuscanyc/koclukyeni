import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Target, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Brain, 
  Loader2, 
  BarChart2,
  BookOpen,
  Filter,
  X,
  Eye,
  HelpCircle,
  XCircle,
  Image as ImageIcon,
  FileText,
  ChevronRight,
  ExternalLink,
  Calendar,
  Layers,
  RotateCcw,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Student, DenemeSinavi, SoruTakipKaydi, Kazanim, OgrenciSinavKaydi, KazanimIstatistik, SoruAnalizDetay } from '../../../types';
import { formatDate } from '../../../utils/dateUtils';
import { QuestionSolutionView } from '../QuestionSolutionView';

interface ReportsTabProps {
  student: Student;
  exams: DenemeSinavi[];
  questions: SoruTakipKaydi[];
  curriculum: Kazanim[];
  examArchives: OgrenciSinavKaydi[];
  onSaveExamArchive?: (archive: OgrenciSinavKaydi) => void;
}

type TrackType = 'Tümü' | 'Sayısal' | 'Eşit Ağırlık' | 'Sözel' | 'Dil';
type DatePresetType = 'all' | '7days' | '30days' | '90days' | 'custom';

// Standard YKS subjects
const STANDARD_LESSONS = [
  'Matematik',
  'Geometri',
  'Türkçe',
  'Türk Dili ve Edebiyatı',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Tarih',
  'Coğrafya',
  'Felsefe',
  'Din Kültürü',
  'Yabancı Dil (İngilizce)'
];

function normalizeToYMD(dateStr?: string): string | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  const ymdMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    return `${ymdMatch[1]}-${ymdMatch[2].padStart(2, '0')}-${ymdMatch[3].padStart(2, '0')}`;
  }

  const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
  }

  return trimmed.split('T')[0];
}

function isDateInRange(dateStr?: string, start?: string, end?: string): boolean {
  if (!start && !end) return true;
  const normalized = normalizeToYMD(dateStr);
  if (!normalized) return true;
  if (start && normalized < start) return false;
  if (end && normalized > end) return false;
  return true;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  student,
  exams,
  questions,
  curriculum,
  examArchives,
  onSaveExamArchive,
}) => {
  // Filter States
  const [selectedTrack, setSelectedTrack] = useState<TrackType>('Tümü');
  const [selectedLesson, setSelectedLesson] = useState<string>('Tümü');
  const [datePreset, setDatePreset] = useState<DatePresetType>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // AI & Modal States
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [selectedOutcomeForModal, setSelectedOutcomeForModal] = useState<KazanimIstatistik | null>(null);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);

  // Handle Date Preset Changes
  const handleDatePresetChange = (preset: DatePresetType) => {
    setDatePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === '30days') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === '90days') {
      const past = new Date();
      past.setDate(today.getDate() - 90);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedTrack('Tümü');
    setSelectedLesson('Tümü');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
  };

  // Compute all available lessons from dataset & curriculum
  const availableLessons = useMemo(() => {
    const set = new Set<string>();

    // Add standard lessons
    STANDARD_LESSONS.forEach((l) => set.add(l));

    // Add from questions
    questions.forEach((q) => {
      if (q.ders && q.ders.trim()) set.add(q.ders.trim());
    });

    // Add from archives
    examArchives.forEach((arch) => {
      arch.sorular?.forEach((s) => {
        if (s.ders && s.ders.trim()) set.add(s.ders.trim());
      });
    });

    // Add from curriculum
    curriculum.forEach((k) => {
      if (k.ders && k.ders.trim()) set.add(k.ders.trim());
    });

    const list = Array.from(set);

    // If track is selected, prioritize or filter
    if (selectedTrack === 'Sayısal') {
      return list.filter((d) => ['Matematik', 'Geometri', 'Fizik', 'Kimya', 'Biyoloji', 'Fen Bilimleri'].some((m) => d.toLowerCase().includes(m.toLowerCase())));
    }
    if (selectedTrack === 'Eşit Ağırlık') {
      return list.filter((d) => ['Matematik', 'Geometri', 'Türkçe', 'Edebiyat', 'Tarih', 'Coğrafya'].some((m) => d.toLowerCase().includes(m.toLowerCase())));
    }
    if (selectedTrack === 'Sözel') {
      return list.filter((d) => ['Türkçe', 'Edebiyat', 'Tarih', 'Coğrafya', 'Felsefe', 'Din'].some((m) => d.toLowerCase().includes(m.toLowerCase())));
    }
    if (selectedTrack === 'Dil') {
      return list.filter((d) => ['Dil', 'İngilizce', 'Almanca', 'Fransızca', 'Türkçe'].some((m) => d.toLowerCase().includes(m.toLowerCase())));
    }

    return list;
  }, [questions, examArchives, curriculum, selectedTrack]);

  // Filtered Questions based on Date, Track & Lesson
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Date filter
      if (!isDateInRange(q.tarih, startDate, endDate)) {
        return false;
      }

      // Track filter
      if (selectedTrack === 'Sayısal' && !['Matematik', 'Geometri', 'Fizik', 'Kimya', 'Biyoloji', 'Fen Bilimleri'].some((d) => q.ders.toLowerCase().includes(d.toLowerCase()))) {
        return false;
      }
      if (selectedTrack === 'Eşit Ağırlık' && !['Matematik', 'Geometri', 'Türkçe', 'Edebiyat', 'Tarih', 'Coğrafya'].some((d) => q.ders.toLowerCase().includes(d.toLowerCase()))) {
        return false;
      }
      if (selectedTrack === 'Sözel' && !['Türkçe', 'Edebiyat', 'Tarih', 'Coğrafya', 'Felsefe', 'Din'].some((d) => q.ders.toLowerCase().includes(d.toLowerCase()))) {
        return false;
      }
      if (selectedTrack === 'Dil' && !['Dil', 'İngilizce', 'Almanca', 'Fransızca', 'Türkçe'].some((d) => q.ders.toLowerCase().includes(d.toLowerCase()))) {
        return false;
      }

      // Lesson filter
      if (selectedLesson !== 'Tümü') {
        const qDersNorm = q.ders.toLowerCase().replace(/[-_ ]/g, '');
        const selNorm = selectedLesson.toLowerCase().replace(/[-_ ]/g, '');
        if (!qDersNorm.includes(selNorm) && !selNorm.includes(qDersNorm)) {
          return false;
        }
      }

      return true;
    });
  }, [questions, startDate, endDate, selectedTrack, selectedLesson]);

  // Filtered Archives based on Date
  const filteredArchives = useMemo(() => {
    return examArchives.filter((arch) => isDateInRange(arch.tarih, startDate, endDate));
  }, [examArchives, startDate, endDate]);

  // Filtered Practice Exams based on Date
  const filteredExams = useMemo(() => {
    return exams.filter((e) => isDateInRange(e.tarih, startDate, endDate));
  }, [exams, startDate, endDate]);

  // Compute aggregate question stats
  const totalQuestions = filteredQuestions.reduce((acc, q) => acc + q.cozulenSoru, 0);
  const totalCorrect = filteredQuestions.reduce((acc, q) => acc + q.dogruSayisi, 0);
  const totalWrong = filteredQuestions.reduce((acc, q) => acc + q.yanlisSayisi, 0);
  const totalBlank = filteredQuestions.reduce((acc, q) => acc + q.bosSayisi, 0);
  const accuracyRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  // Compute practice exam nets
  const tytExams = filteredExams.filter((e) => e.sinavTuru === 'TYT');
  const aytExams = filteredExams.filter((e) => e.sinavTuru === 'AYT');
  const latestTyt = tytExams[0] || exams.find((e) => e.sinavTuru === 'TYT');
  const latestAyt = aytExams[0] || exams.find((e) => e.sinavTuru === 'AYT');

  const targetScoreNum = Number(student.hedefPuan) || 490;
  const currentEstScore = latestAyt?.puan || latestTyt?.puan || 450;
  const scoreGap = targetScoreNum - currentEstScore;

  // Compute Outcome Success Rates combining questions and photo exam archive
  const kazanimStats: KazanimIstatistik[] = useMemo(() => {
    const map = new Map<string, KazanimIstatistik>();

    // From question tracking
    filteredQuestions.forEach((q) => {
      const key = `${q.ders}-${q.konu}`;
      const existing = map.get(key) || {
        kazanimKodu: `KOD.${q.ders.slice(0, 3)}`,
        kazanimAciklama: `${q.ders} ${q.konu} temel kazanımı`,
        ders: q.ders,
        konu: q.konu,
        toplamSoru: 0,
        dogruSayisi: 0,
        yanlisSayisi: 0,
        bosSayisi: 0,
        basariYuzdesi: 0,
      };

      existing.toplamSoru += q.cozulenSoru;
      existing.dogruSayisi += q.dogruSayisi;
      existing.yanlisSayisi += q.yanlisSayisi;
      existing.bosSayisi += q.bosSayisi;
      map.set(key, existing);
    });

    // From photo exam archives
    filteredArchives.forEach((arch) => {
      arch.sorular?.forEach((s) => {
        const ders = s.ders || 'Genel';

        // Check track match
        if (selectedTrack === 'Sayısal' && !['Matematik', 'Geometri', 'Fizik', 'Kimya', 'Biyoloji', 'Fen Bilimleri'].some((d) => ders.toLowerCase().includes(d.toLowerCase()))) {
          return;
        }
        if (selectedTrack === 'Eşit Ağırlık' && !['Matematik', 'Geometri', 'Türkçe', 'Edebiyat', 'Tarih', 'Coğrafya'].some((d) => ders.toLowerCase().includes(d.toLowerCase()))) {
          return;
        }
        if (selectedTrack === 'Sözel' && !['Türkçe', 'Edebiyat', 'Tarih', 'Coğrafya', 'Felsefe', 'Din'].some((d) => ders.toLowerCase().includes(d.toLowerCase()))) {
          return;
        }
        if (selectedTrack === 'Dil' && !['Dil', 'İngilizce', 'Almanca', 'Fransızca', 'Türkçe'].some((d) => ders.toLowerCase().includes(d.toLowerCase()))) {
          return;
        }

        // Check lesson match
        if (selectedLesson !== 'Tümü') {
          const sDersNorm = ders.toLowerCase().replace(/[-_ ]/g, '');
          const selNorm = selectedLesson.toLowerCase().replace(/[-_ ]/g, '');
          if (!sDersNorm.includes(selNorm) && !selNorm.includes(sDersNorm)) {
            return;
          }
        }

        const key = `${ders}-${s.konu}`;
        const existing = map.get(key) || {
          kazanimKodu: s.kazanimKodu || 'GENEL',
          kazanimAciklama: s.kazanimAciklama || `${ders} ${s.konu}`,
          ders: ders,
          konu: s.konu,
          toplamSoru: 0,
          dogruSayisi: 0,
          yanlisSayisi: 0,
          bosSayisi: 0,
          basariYuzdesi: 0,
        };

        existing.toplamSoru += 1;
        if (s.dogruMu) {
          existing.dogruSayisi += 1;
        } else if (s.isaretlenenSik === 'Boş' || s.ogrenciCevabi === 'Boş') {
          existing.bosSayisi += 1;
        } else {
          existing.yanlisSayisi += 1;
        }
        map.set(key, existing);
      });
    });

    return Array.from(map.values()).map((item) => ({
      ...item,
      basariYuzdesi: item.toplamSoru > 0 ? Math.round((item.dogruSayisi / item.toplamSoru) * 100) : 0,
    }));
  }, [filteredQuestions, filteredArchives, selectedTrack, selectedLesson]);

  const weakOutcomes = useMemo(() => {
    return kazanimStats
      .filter((k) => k.basariYuzdesi < 70)
      .sort((a, b) => a.basariYuzdesi - b.basariYuzdesi);
  }, [kazanimStats]);

  const strongOutcomes = useMemo(() => {
    return kazanimStats
      .filter((k) => k.basariYuzdesi >= 70)
      .sort((a, b) => b.basariYuzdesi - a.basariYuzdesi);
  }, [kazanimStats]);

  // Compute questions for selected outcome modal drill-down (respecting active date filters)
  const wrongQuestionsForOutcome = useMemo(() => {
    if (!selectedOutcomeForModal) return [];

    const list: {
      id: string;
      archiveId: string;
      sinavAdi: string;
      tarih: string;
      soruNo: number;
      sayfaNo?: number;
      ders: string;
      unite?: string;
      konu: string;
      kazanimKodu?: string;
      kazanimAciklama?: string;
      isaretlenenSik: string;
      dogruCevap: string;
      dogruMu: boolean;
      cozumDetayi?: string;
      analizNotu?: string;
      sayfaFotoUrl?: string;
    }[] = [];

    filteredArchives.forEach((arch) => {
      arch.sorular?.forEach((s, idx) => {
        const matchDers = !s.ders || s.ders.toLowerCase() === selectedOutcomeForModal.ders.toLowerCase();
        const matchKonu = s.konu === selectedOutcomeForModal.konu;
        if (matchDers && matchKonu) {
          const pageIdx = Math.max(0, (s.sayfaNo || 1) - 1);
          const pagePhoto = s.sayfaFotoUrl || (arch.sayfaFotolari && arch.sayfaFotolari[pageIdx]) || (arch.sayfaFotolari && arch.sayfaFotolari[0]);
          list.push({
            id: `${arch.id}-${s.soruNo || idx}`,
            archiveId: arch.id,
            sinavAdi: arch.sinavAdi,
            tarih: arch.tarih,
            soruNo: s.soruNo || (idx + 1),
            sayfaNo: s.sayfaNo || 1,
            ders: s.ders || selectedOutcomeForModal.ders,
            unite: s.unite,
            konu: s.konu || selectedOutcomeForModal.konu,
            kazanimKodu: s.kazanimKodu,
            kazanimAciklama: s.kazanimAciklama,
            isaretlenenSik: s.isaretlenenSik || s.ogrenciCevabi || 'Boş',
            dogruCevap: s.dogruCevap || 'A',
            dogruMu: Boolean(s.dogruMu),
            cozumDetayi: s.cozumDetayi || s.cozum || 'Sorunun yapay zekâ analiz detayı indirildi.',
            analizNotu: s.analizNotu,
            sayfaFotoUrl: pagePhoto,
          });
        }
      });
    });

    // Prioritize wrong and blank questions first, then order by question number
    return list.sort((a, b) => {
      if (a.dogruMu !== b.dogruMu) {
        return a.dogruMu ? 1 : -1;
      }
      return a.soruNo - b.soruNo;
    });
  }, [selectedOutcomeForModal, filteredArchives]);

  // Handler to allow editing & saving a question's mathematical solution directly from analysis modal
  const handleSaveQuestionSolution = (archiveId: string, questionNo: number, newSolution: string) => {
    if (!onSaveExamArchive) return;
    const targetArchive = examArchives.find((a) => a.id === archiveId);
    if (!targetArchive) return;

    const updatedSorular = (targetArchive.sorular || []).map((q) => {
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
      ...targetArchive,
      sorular: updatedSorular,
    };

    onSaveExamArchive(updatedArchive);
  };

  // Trigger Gemini AI Coach Advice with all active filters
  const handleGetAICoachingAdvice = async () => {
    setIsLoadingAi(true);

    try {
      const response = await fetch('/api/ai/coaching-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student,
          weakOutcomes: weakOutcomes.slice(0, 6),
          recentExams: filteredExams.slice(0, 3),
          selectedTrack,
          selectedLesson,
          startDate,
          endDate
        }),
      });

      const data = await response.json();
      setAiAdvice(data.advice || 'Koçluk tavsiyesi oluşturulamadı.');
    } catch (err: any) {
      setAiAdvice('Bağlantı hatası oluştu, lütfen tekrar deneyiniz.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const isFilterActive = selectedTrack !== 'Tümü' || selectedLesson !== 'Tümü' || datePreset !== 'all' || startDate !== '' || endDate !== '';

  return (
    <div className="space-y-6">
      {/* Comprehensive Filter Control Panel */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Rapor & Analiz Filtreleri
                </h3>
                {isFilterActive && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Filtreler Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Alan, branş dersi ve tarih aralığına göre kazanım ve net performansını filtreleyin
              </p>
            </div>
          </div>

          {/* Reset Filters button */}
          {isFilterActive && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all self-start lg:self-auto cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Filtreleri Sıfırla</span>
            </button>
          )}
        </div>

        {/* 1. Alan Filtresi (Track) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Alan / Puan Türü Seçimi:</span>
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            {(['Tümü', 'Sayısal', 'Eşit Ağırlık', 'Sözel', 'Dil'] as TrackType[]).map((tr) => (
              <button
                key={tr}
                onClick={() => {
                  setSelectedTrack(tr);
                  setSelectedLesson('Tümü'); // reset lesson on track switch
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  selectedTrack === tr
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tr}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Ders Filtresi (Lesson) */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ders / Branş Filtresi:</span>
            </label>
            <span className="text-[11px] text-slate-400">
              {availableLessons.length} branş dersi mevcut
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 max-h-28 overflow-y-auto pr-1">
            <button
              onClick={() => setSelectedLesson('Tümü')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                selectedLesson === 'Tümü'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Tüm Dersler
            </button>
            {availableLessons.map((les) => (
              <button
                key={les}
                onClick={() => setSelectedLesson(les)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  selectedLesson === les
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {les}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Tarih Aralığı Filtresi (Date Range) */}
        <div className="space-y-3 pt-1 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tarih Aralığı:</span>
            </label>
            {(startDate || endDate) && (
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                Seçili Aralık: {formatDate(startDate, 'İlk Kayıt')} — {formatDate(endDate, 'Bugün')}
              </span>
            )}
          </div>

          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Tüm Zamanlar' },
              { id: '7days', label: 'Son 7 Gün' },
              { id: '30days', label: 'Son 30 Gün' },
              { id: '90days', label: 'Son 3 Ay' },
              { id: 'custom', label: 'Özel Tarih Aralığı' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handleDatePresetChange(p.id as DatePresetType)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  datePreset === p.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs */}
          {(datePreset === 'custom' || startDate || endDate) && (
            <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 animate-in fade-in duration-150">
              <div className="flex-1 w-full sm:w-auto">
                <span className="block text-[10px] font-bold text-slate-500 mb-1">Başlangıç Tarihi:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <span className="text-slate-400 font-bold text-xs hidden sm:inline-block pt-4">→</span>

              <div className="flex-1 w-full sm:w-auto">
                <span className="block text-[10px] font-bold text-slate-500 mb-1">Bitiş Tarihi:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setDatePreset('all');
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors shrink-0 self-end cursor-pointer"
                  title="Tarih filtresini temizle"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Target & Performance Metrics Cards */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Hedef & Performans Raporu
              </h3>
              <p className="text-xs text-slate-500">
                {student.adSoyad} • {student.sinif} ({student.alan} Alanı)
                {selectedLesson !== 'Tümü' && ` • Ders: ${selectedLesson}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              {filteredQuestions.length} Çözüm Kaydı
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              {totalQuestions} Soru
            </span>
          </div>
        </div>

        {/* 3 Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Hedef Tablosu</div>
            <div className="text-sm font-bold text-slate-900">{student.hedefUniversite}</div>
            <div className="text-xs text-indigo-700 font-semibold">{student.hedefBolum}</div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-xs">
              <span className="text-slate-500">Hedef Sıralama:</span>
              <span className="font-extrabold text-slate-900">{student.hedefSiralama}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Hedef Taban Puan:</span>
              <span className="font-extrabold text-indigo-700">{student.hedefPuan}</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Filtreli Performans Özeti
            </div>
            <div className="text-sm font-bold text-slate-900">
              {totalQuestions > 0 ? `${totalCorrect} Doğru / ${totalWrong} Yanlış` : 'Kayıt Bulunmuyor'}
            </div>
            <div className="text-xs text-slate-500">
              {totalBlank > 0 ? `${totalBlank} Boş Soru` : 'Boş soru yok'} • Toplam {totalQuestions} Soru
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-xs">
              <span className="text-slate-500">Soru Doğruluk Oranı:</span>
              <span className={`font-extrabold ${accuracyRate >= 70 ? 'text-emerald-700' : accuracyRate >= 50 ? 'text-amber-700' : 'text-rose-700'}`}>
                %{accuracyRate}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Son Tahmini Puan:</span>
              <span className="font-extrabold text-indigo-700">~{currentEstScore} Puan</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200/70 space-y-2 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">Net & Puan Açığı</div>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {scoreGap > 0 ? `+${scoreGap.toFixed(1)} Puan` : 'Hedef Seviyede'}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {scoreGap > 0
                  ? `Hedefe ulaşmak için ortalama ${Math.round(scoreGap / 3.8)} net daha artış gerekiyor.`
                  : 'Mevcut netler hedeflenen taban puanı karşılıyor.'}
              </p>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Öncelik: {weakOutcomes.length} adet zayıf MEB kazanımını kapatmak
            </div>
          </div>
        </div>
      </div>

      {/* Weak & Strong Outcomes Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weak Outcomes */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h4 className="text-sm font-bold text-slate-900">
                Geliştirilmesi Gereken Zayıf Kazanımlar ({weakOutcomes.length})
              </h4>
            </div>
            <span className="text-[11px] text-slate-400">&lt; %70 Başarı</span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {weakOutcomes.length > 0 ? (
              weakOutcomes.map((k) => (
                <div
                  key={`${k.ders}-${k.konu}`}
                  onClick={() => setSelectedOutcomeForModal(k)}
                  className="bg-rose-50/40 hover:bg-rose-50 border border-rose-100/90 hover:border-rose-300 rounded-2xl p-3.5 space-y-2 cursor-pointer transition-all group relative"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 group-hover:text-rose-800 transition-colors flex items-center gap-1.5">
                      <span>{k.ders} - {k.konu}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 group-hover:bg-rose-600 group-hover:text-white transition-all flex items-center gap-1">
                        🔍 Soruları İncele
                      </span>
                    </span>
                    <span className="font-black text-rose-700">%{k.basariYuzdesi}</span>
                  </div>
                  <div className="w-full h-2 bg-rose-100 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full"
                      style={{ width: `${k.basariYuzdesi}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{k.dogruSayisi} D / {k.toplamSoru} Soru</span>
                    <span>{k.yanlisSayisi} Yanlış, {k.bosSayisi} Boş (Tıkla ve İncele)</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Seçili filtre aralığında kritik zayıf kazanım bulunmuyor.
              </div>
            )}
          </div>
        </div>

        {/* Strong Outcomes */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-slate-900">
                Güçlü & Kazanılmış Konular ({strongOutcomes.length})
              </h4>
            </div>
            <span className="text-[11px] text-slate-400">&gt;= %70 Başarı</span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {strongOutcomes.length > 0 ? (
              strongOutcomes.map((k) => (
                <div
                  key={`${k.ders}-${k.konu}`}
                  onClick={() => setSelectedOutcomeForModal(k)}
                  className="bg-emerald-50/40 hover:bg-emerald-50 border border-emerald-100 hover:border-emerald-300 rounded-2xl p-3.5 space-y-2 cursor-pointer transition-all group relative"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors flex items-center gap-1.5">
                      <span>{k.ders} - {k.konu}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white transition-all flex items-center gap-1">
                        🔍 Soruları İncele
                      </span>
                    </span>
                    <span className="font-black text-emerald-700">%{k.basariYuzdesi}</span>
                  </div>
                  <div className="w-full h-2 bg-emerald-100 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${k.basariYuzdesi}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{k.dogruSayisi} D / {k.toplamSoru} Soru</span>
                    <span>{k.yanlisSayisi > 0 ? `${k.yanlisSayisi} Yanlış (İncele)` : 'Stabil ve Pekiştirilmiş'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Seçili filtre aralığında yeterli soru verisi girilmedi.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Coaching Prescription Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Yapay Zekâ Hedef Odaklı Koçluk Reçetesi
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Gemini AI
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {selectedLesson !== 'Tümü' ? `Özel Ders: ${selectedLesson} • ` : ''}
                {startDate || endDate ? `Tarih: ${formatDate(startDate, 'İlk')} - ${formatDate(endDate, 'Son')} • ` : ''}
                {student.hedefUniversite} için nokta atışı aksiyon planı
              </p>
            </div>
          </div>

          <button
            onClick={handleGetAICoachingAdvice}
            disabled={isLoadingAi}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all disabled:opacity-50 active:scale-95 shrink-0 cursor-pointer"
          >
            {isLoadingAi ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Reçete Hazırlanıyor...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>🤖 Filtrelere Özel AI Koçluk Tavsiyesi Al</span>
              </>
            )}
          </button>
        </div>

        {aiAdvice ? (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-xs text-slate-800 leading-relaxed whitespace-pre-line space-y-3 font-sans">
            {aiAdvice}
          </div>
        ) : (
          <div className="bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 space-y-2">
            <Sparkles className="w-6 h-6 text-indigo-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">
              Kişiselleştirilmiş Koçluk Reçetesi Oluşturun
            </p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              Yukarıdaki butona tıklayarak seçtiğiniz alan, ders ve tarih aralığındaki zayıf MEB kazanımlarını ve net performansını sentezleyen profesyonel bir koçluk stratejisi alabilirsiniz.
            </p>
          </div>
        )}
      </div>

      {/* Weak/Selected Outcome Questions Drill-Down Modal with Mathematical Typesetting */}
      {selectedOutcomeForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between shrink-0 relative">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center shadow-md ${
                  selectedOutcomeForModal.basariYuzdesi < 70 ? 'bg-rose-600' : 'bg-emerald-600'
                }`}>
                  {selectedOutcomeForModal.basariYuzdesi < 70 ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                      selectedOutcomeForModal.basariYuzdesi < 70
                        ? 'bg-rose-500/30 text-rose-200 border-rose-500/40'
                        : 'bg-emerald-500/30 text-emerald-200 border-emerald-500/40'
                    }`}>
                      %{selectedOutcomeForModal.basariYuzdesi} Başarı
                    </span>
                    <span className="text-xs text-slate-400">
                      {selectedOutcomeForModal.yanlisSayisi} Yanlış, {selectedOutcomeForModal.bosSayisi} Boş, {selectedOutcomeForModal.dogruSayisi} Doğru
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                    {selectedOutcomeForModal.ders} - {selectedOutcomeForModal.konu}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedOutcomeForModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Question List */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-100">
                <span className="font-bold text-slate-700">
                  Kazanım Soruları ve Yapay Zekâ Çözümleri ({wrongQuestionsForOutcome.length} Soru)
                </span>
                <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                  📐 Matematiksel Dizgi & Formül Kartları
                </span>
              </div>

              {wrongQuestionsForOutcome.length > 0 ? (
                wrongQuestionsForOutcome.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className={`border rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs transition-all ${
                      q.dogruMu 
                        ? 'bg-emerald-50/20 border-emerald-200/60' 
                        : 'bg-slate-50/80 border-slate-200/90'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center ${
                          q.dogruMu 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          #{q.soruNo}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{q.sinavAdi}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                            <span>📅 {formatDate(q.tarih)}</span>
                            {q.sayfaNo && <span>📄 Sayfa {q.sayfaNo}</span>}
                            {q.kazanimKodu && (
                              <span className="font-mono text-[10px] bg-white text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-100 font-bold">
                                {q.kazanimKodu}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 ${
                          q.dogruMu
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border-rose-200'
                        }`}>
                          {q.dogruMu ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          )}
                          <span>İşaretlenen: {q.isaretlenenSik}</span>
                        </span>
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Doğru Cevap: {q.dogruCevap}</span>
                        </span>
                      </div>
                    </div>

                    {/* AI Coach / Question Note if available */}
                    {q.analizNotu && (
                      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-900 space-y-1">
                        <span className="font-bold flex items-center gap-1.5 text-[11px] text-amber-800">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Koç & AI Analiz Notu:</span>
                        </span>
                        <p className="text-[11px] leading-relaxed italic">{q.analizNotu}</p>
                      </div>
                    )}

                    {/* Question Solution with Mathematical Typesetting (LaTeX / KaTeX, Step Cards & Board Mode) */}
                    <QuestionSolutionView
                      cozumDetayi={q.cozumDetayi}
                      unite={q.unite}
                      konu={q.konu}
                      ders={q.ders}
                      soruNo={q.soruNo}
                      kazanimKodu={q.kazanimKodu}
                      kazanimAciklama={q.kazanimAciklama}
                      dogruCevap={q.dogruCevap}
                      ogrenciCevabi={q.isaretlenenSik}
                      dogruMu={q.dogruMu}
                      defaultExpanded={true}
                      canEdit={Boolean(onSaveExamArchive)}
                      onSaveSolution={(newSol) => handleSaveQuestionSolution(q.archiveId, q.soruNo, newSol)}
                    />

                    {/* Photo button if available */}
                    {q.sayfaFotoUrl && (
                      <div className="pt-1 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setSelectedPhotoPreview(q.sayfaFotoUrl || null)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <ImageIcon className="w-4 h-4 text-indigo-600" />
                          <span>📸 Sorunun Sayfa Fotoğrafını Büyüt ve İncele</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-slate-300" />
                  <div className="text-xs font-bold text-slate-700">Fotoğraflı Testlerde Soru Detayı Yok</div>
                  <div className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Bu kazanımdaki yanlışlar manuel soru takibinden veya soru metni çıkarılmamış eski arşivlerden kaynaklanıyor olabilir.
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedOutcomeForModal(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox Preview */}
      {selectedPhotoPreview && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative max-w-4xl max-h-[90vh] w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>📸 Soru / Sayfa Kitapçığı Fotoğrafı</span>
              </span>
              <button
                onClick={() => setSelectedPhotoPreview(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center flex-1 bg-slate-950">
              <img
                src={selectedPhotoPreview}
                alt="Soru Görseli"
                className="max-h-[75vh] w-auto object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
