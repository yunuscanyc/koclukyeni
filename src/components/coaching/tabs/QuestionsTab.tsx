import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  Award,
  BookOpen,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SoruTakipKaydi, OgrenciSinavKaydi, DenemeSinavi } from '../../../types';
import { formatDate } from '../../../utils/dateUtils';

interface QuestionsTabProps {
  questions: SoruTakipKaydi[];
  examArchives?: OgrenciSinavKaydi[];
  exams?: DenemeSinavi[];
  onAddQuestion: (q: Omit<SoruTakipKaydi, 'id'>) => void;
  onDeleteQuestion: (id: string) => void;
  studentName: string;
}

interface LessonSummary {
  ders: string;
  cozulenSoru: number;
  dogruSayisi: number;
  yanlisSayisi: number;
  bosSayisi: number;
  net: number;
  manualCount: number;
  aiCount: number;
  examCount: number;
}

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

export const QuestionsTab: React.FC<QuestionsTabProps> = ({
  questions = [],
  examArchives = [],
  exams = [],
  onAddQuestion,
  onDeleteQuestion,
  studentName,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

  // Form State for Adding Solved Questions
  const [tarih, setTarih] = useState(new Date().toISOString().split('T')[0]);
  const [ders, setDers] = useState('Matematik');
  const [konu, setKonu] = useState('');
  const [cozulenSoru, setCozulenSoru] = useState<number>(50);
  const [dogruSayisi, setDogruSayisi] = useState<number>(44);
  const [yanlisSayisi, setYanlisSayisi] = useState<number>(4);
  const [bosSayisi, setBosSayisi] = useState<number>(2);

  const calculatedNet = Math.max(0, Number(dogruSayisi) - Number(yanlisSayisi) * 0.25);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onAddQuestion({
      studentId: '',
      tarih,
      ders,
      konu: konu.trim() || 'Genel Soru Çözümü',
      cozulenSoru: Number(cozulenSoru) || 0,
      dogruSayisi: Number(dogruSayisi) || 0,
      yanlisSayisi: Number(yanlisSayisi) || 0,
      bosSayisi: Number(bosSayisi) || 0,
      net: Number(calculatedNet.toFixed(2)),
    });

    setKonu('');
    setShowAddForm(false);
  };

  // Helper to normalize lesson names
  const normalizeDersName = (rawDersName: string): string => {
    if (!rawDersName) return 'Diğer';
    let normalized = rawDersName.trim();
    if (/matematik/i.test(normalized)) normalized = 'Matematik';
    else if (/geometri/i.test(normalized)) normalized = 'Geometri';
    else if (/türkçe|turkce/i.test(normalized)) normalized = 'Türkçe';
    else if (/edebiyat/i.test(normalized)) normalized = 'Edebiyat';
    else if (/fizik/i.test(normalized)) normalized = 'Fizik';
    else if (/kimya/i.test(normalized)) normalized = 'Kimya';
    else if (/biyoloji/i.test(normalized)) normalized = 'Biyoloji';
    else if (/tarih/i.test(normalized)) normalized = 'Tarih';
    else if (/coğrafya|cografya/i.test(normalized)) normalized = 'Coğrafya';
    else if (/felsefe|din/i.test(normalized)) normalized = 'Felsefe & Din';
    return normalized;
  };

  const matchLessonName = (rawDersName: string, targetLesson: string): boolean => {
    return normalizeDersName(rawDersName) === normalizeDersName(targetLesson);
  };

  // Helper to check if a DenemeSinavi record originated from an Optik / AI archive upload
  const isArchiveExam = (ex: DenemeSinavi): boolean => {
    if (!ex || !ex.id) return false;
    if (ex.id.startsWith('exam-auto-') || ex.id.startsWith('exam-arch-')) return true;
    if (ex.yayin === 'Optik / AI Yüklemesi' || ex.yayin === 'Optik AI Yüklemesi') return true;
    return examArchives.some(
      (a) => ex.id === `exam-${a.id}` || ex.id === a.id || ex.id === `exam-${a.id.replace('arch-', '')}`
    );
  };

  // 1. Aggregate Data Strictly BY LESSON (Ders Bazında)
  const lessonMap: Record<string, LessonSummary> = {};

  // Helper to get or init lesson record
  const getLessonObj = (rawDersName: string): LessonSummary => {
    const normalized = normalizeDersName(rawDersName);

    if (!lessonMap[normalized]) {
      lessonMap[normalized] = {
        ders: normalized,
        cozulenSoru: 0,
        dogruSayisi: 0,
        yanlisSayisi: 0,
        bosSayisi: 0,
        net: 0,
        manualCount: 0,
        aiCount: 0,
        examCount: 0,
      };
    }
    return lessonMap[normalized];
  };

  // Helper to get ALL entries (Manuel, Optik/AI, Denemeler) for a specific lesson
  const getLessonEntries = (targetDers: string) => {
    const entries: Array<{
      id: string;
      tarih: string;
      tur: 'manual' | 'archive' | 'exam';
      turLabel: string;
      turBadgeBg: string;
      turBadgeText: string;
      baslik: string;
      cozulenSoru: number;
      dogruSayisi: number;
      yanlisSayisi: number;
      bosSayisi: number;
      net: number;
      canDelete?: boolean;
      rawId?: string;
    }> = [];

    // 1. Manuel Girişler
    questions.forEach((q) => {
      if (matchLessonName(q.ders || 'Matematik', targetDers)) {
        entries.push({
          id: `manual-${q.id}`,
          rawId: q.id,
          tarih: q.tarih || '',
          tur: 'manual',
          turLabel: '✍️ Manuel Soru Kaydı',
          turBadgeBg: 'bg-indigo-50 border-indigo-200',
          turBadgeText: 'text-indigo-700',
          baslik: q.konu || 'Genel Soru Çözümü',
          cozulenSoru: q.cozulenSoru || 0,
          dogruSayisi: q.dogruSayisi || 0,
          yanlisSayisi: q.yanlisSayisi || 0,
          bosSayisi: q.bosSayisi || 0,
          net: q.net || 0,
          canDelete: true,
        });
      }
    });

    // 2. Optik / AI Fotoğraf Yüklemeleri
    examArchives.forEach((a) => {
      const isDenemeUpload = Boolean(a.isDeneme) || exams.some((ex) => ex.id === `exam-${a.id}` || ex.id === a.id);
      const turLabel = isDenemeUpload ? '🎯 Optik Deneme Yüklemesi' : '📸 Optik / AI Yüklemesi';
      const turBadgeBg = isDenemeUpload ? 'bg-indigo-50 border-indigo-200' : 'bg-amber-50 border-amber-200';
      const turBadgeText = isDenemeUpload ? 'text-indigo-800' : 'text-amber-800';

      if (a.sorular && Array.isArray(a.sorular) && a.sorular.length > 0) {
        const matchingQuestions = a.sorular.filter((sq) => matchLessonName(sq.ders || 'Matematik', targetDers));
        if (matchingQuestions.length > 0) {
          let dCount = 0;
          let yCount = 0;
          let bCount = 0;
          let netSum = 0;

          matchingQuestions.forEach((sq) => {
            if (sq.dogruMu === true) {
              dCount++;
              netSum += 1;
            } else if (sq.isaretlenenSik === 'Boş' || !sq.isaretlenenSik) {
              bCount++;
            } else {
              yCount++;
              netSum -= 0.25;
            }
          });

          entries.push({
            id: `archive-${a.id}`,
            tarih: a.tarih || '',
            tur: 'archive',
            turLabel,
            turBadgeBg,
            turBadgeText,
            baslik: a.sinavAdi || 'Optik / Yapay Zekâ Testi',
            cozulenSoru: matchingQuestions.length,
            dogruSayisi: dCount,
            yanlisSayisi: yCount,
            bosSayisi: bCount,
            net: Number(netSum.toFixed(2)),
            canDelete: false,
          });
        }
      } else if (matchLessonName(a.sinavTuru || 'Matematik', targetDers)) {
        entries.push({
          id: `archive-${a.id}`,
          tarih: a.tarih || '',
          tur: 'archive',
          turLabel,
          turBadgeBg,
          turBadgeText,
          baslik: a.sinavAdi || 'Optik / Yapay Zekâ Testi',
          cozulenSoru: a.toplamSoru || 0,
          dogruSayisi: a.dogruSayisi || 0,
          yanlisSayisi: a.yanlisSayisi || 0,
          bosSayisi: a.bosSayisi || 0,
          net: a.toplamNet || 0,
          canDelete: false,
        });
      }
    });

    // 3. Deneme Sınavları
    exams.forEach((ex) => {
      // Prevent double counting of exams generated from optik archive uploads
      if (isArchiveExam(ex)) return;

      if (ex.dersler && Array.isArray(ex.dersler)) {
        ex.dersler.forEach((d) => {
          if (matchLessonName(d.dersAdi, targetDers)) {
            const solved = (d.dogru || 0) + (d.yanlis || 0) + (d.bos || 0);
            entries.push({
              id: `exam-${ex.id}-${d.dersAdi}`,
              tarih: ex.tarih || '',
              tur: 'exam',
              turLabel: '🏆 Deneme Sınavı',
              turBadgeBg: 'bg-purple-50 border-purple-200',
              turBadgeText: 'text-purple-800',
              baslik: `${ex.yayin || ''} ${ex.denemeAdi || 'Deneme'}`.trim(),
              cozulenSoru: solved,
              dogruSayisi: d.dogru || 0,
              yanlisSayisi: d.yanlis || 0,
              bosSayisi: d.bos || 0,
              net: Number((d.net || (d.dogru || 0) - (d.yanlis || 0) * 0.25).toFixed(2)),
              canDelete: false,
            });
          }
        });
      }
    });

    return entries.sort((a, b) => (b.tarih || '').localeCompare(a.tarih || ''));
  };

  // Ensure default lessons exist in map for complete display
  DEFAULT_LESSONS.forEach((l) => getLessonObj(l));

  // A) Add Manual Question Log Entries to Lesson Aggregates
  questions.forEach((q) => {
    const lObj = getLessonObj(q.ders || 'Matematik');
    lObj.cozulenSoru += q.cozulenSoru || 0;
    lObj.dogruSayisi += q.dogruSayisi || 0;
    lObj.yanlisSayisi += q.yanlisSayisi || 0;
    lObj.bosSayisi += q.bosSayisi || 0;
    lObj.net += q.net || 0;
    lObj.manualCount += 1;
  });

  // B) Add AI Solved Test Archives to Lesson Aggregates
  examArchives.forEach((a) => {
    if (a.sorular && Array.isArray(a.sorular) && a.sorular.length > 0) {
      a.sorular.forEach((q) => {
        const lObj = getLessonObj(q.ders || 'Matematik');
        lObj.cozulenSoru += 1;
        if (q.dogruMu === true) {
          lObj.dogruSayisi += 1;
        } else if (q.isaretlenenSik === "Boş" || !q.isaretlenenSik) {
          lObj.bosSayisi += 1;
        } else {
          lObj.yanlisSayisi += 1;
        }
        const qNet = q.dogruMu === true ? 1 : (q.isaretlenenSik === "Boş" || !q.isaretlenenSik ? 0 : -0.25);
        lObj.net += qNet;
      });
      const mainObj = getLessonObj(a.sinavTuru || 'Matematik');
      mainObj.aiCount += 1;
    } else {
      const lObj = getLessonObj(a.sinavTuru || 'Matematik');
      const solved = a.toplamSoru || 0;
      lObj.cozulenSoru += solved;
      lObj.dogruSayisi += a.dogruSayisi || 0;
      lObj.yanlisSayisi += a.yanlisSayisi || 0;
      lObj.bosSayisi += a.bosSayisi || 0;
      lObj.net += a.toplamNet || 0;
      lObj.aiCount += 1;
    }
  });

  // C) Add General Mock Exams (Denemeler) to Lesson Aggregates
  exams.forEach((ex) => {
    // Prevent double counting of automated exams generated from archives
    if (isArchiveExam(ex)) {
      return;
    }

    if (ex.dersler && Array.isArray(ex.dersler)) {
      ex.dersler.forEach((d) => {
        const lObj = getLessonObj(d.dersAdi);
        const dSolved = (d.dogru || 0) + (d.yanlis || 0) + (d.bos || 0);
        lObj.cozulenSoru += dSolved;
        lObj.dogruSayisi += d.dogru || 0;
        lObj.yanlisSayisi += d.yanlis || 0;
        lObj.bosSayisi += d.bos || 0;
        lObj.net += d.net || (d.dogru || 0) - (d.yanlis || 0) * 0.25;
        lObj.examCount += 1;
      });
    }
  });

  // Convert Lesson Map to Array
  const lessonSummaries: LessonSummary[] = Object.values(lessonMap)
    .filter((l) => {
      // Filter by search query if typed
      if (!searchQuery.trim()) return true;
      return l.ders.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => b.cozulenSoru - a.cozulenSoru);

  // Grand Totals Across All Lessons
  const grandTotalSolved = lessonSummaries.reduce((acc, l) => acc + l.cozulenSoru, 0);
  const grandTotalCorrect = lessonSummaries.reduce((acc, l) => acc + l.dogruSayisi, 0);
  const grandTotalWrong = lessonSummaries.reduce((acc, l) => acc + l.yanlisSayisi, 0);
  const grandTotalEmpty = lessonSummaries.reduce((acc, l) => acc + l.bosSayisi, 0);
  const grandTotalNet = lessonSummaries.reduce((acc, l) => acc + l.net, 0);
  const grandAccuracy = grandTotalSolved > 0 ? Math.round((grandTotalCorrect / grandTotalSolved) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Cumulative Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-2xs">
          <div className="text-xs text-slate-500 font-bold mb-1">Toplam Çözülen</div>
          <div className="text-2xl font-black text-slate-900">{grandTotalSolved} <span className="text-xs font-normal text-slate-400">Soru</span></div>
          <div className="text-[10px] text-slate-500 mt-1">Tüm dersler toplamı</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-2xs">
          <div className="text-xs text-emerald-600 font-bold mb-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Toplam Doğru</span>
          </div>
          <div className="text-2xl font-black text-emerald-700">{grandTotalCorrect} <span className="text-xs font-normal text-emerald-600">Soru</span></div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">%{grandAccuracy} Başarı Oranı</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-2xs">
          <div className="text-xs text-rose-600 font-bold mb-1 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>Toplam Yanlış</span>
          </div>
          <div className="text-2xl font-black text-rose-700">{grandTotalWrong} <span className="text-xs font-normal text-rose-400">Soru</span></div>
          <div className="text-[10px] text-slate-500 mt-1">Hata yapılan soru</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-2xs">
          <div className="text-xs text-slate-500 font-bold mb-1 flex items-center gap-1">
            <MinusCircle className="w-3.5 h-3.5" />
            <span>Toplam Boş</span>
          </div>
          <div className="text-2xl font-black text-slate-700">{grandTotalEmpty} <span className="text-xs font-normal text-slate-400">Soru</span></div>
          <div className="text-[10px] text-slate-500 mt-1">Boş bırakılanlar</div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-3xl p-4 sm:p-5 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-xs text-indigo-700 font-bold mb-1 flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>Toplam Net</span>
          </div>
          <div className="text-2xl font-black text-indigo-900">{grandTotalNet.toFixed(2)}</div>
          <div className="text-[10px] text-indigo-700 mt-1 font-semibold">Genel Toplam Net</div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Ders ara (örn: Matematik, Fizik)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          />
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Soru Çözümü Ekle</span>
        </button>
      </div>

      {/* Add Soru Entry Form */}
      {showAddForm && (
        <div className="bg-white border-2 border-indigo-500/30 rounded-3xl p-6 sm:p-7 shadow-lg space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-900">
              Yeni Soru Çözüm Kaydı Ekle
            </h4>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              Kapat
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tarih *</label>
                <input
                  type="date"
                  required
                  value={tarih}
                  onChange={(e) => setTarih(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ders Seçin *</label>
                <select
                  value={ders}
                  onChange={(e) => setDers(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-bold"
                >
                  {DEFAULT_LESSONS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Konu / Not (Opsiyonel)</label>
                <input
                  type="text"
                  placeholder="Örn: Soru Bankası Çözümü"
                  value={konu}
                  onChange={(e) => setKonu(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Question Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">Çözülen Soru</label>
                <input
                  type="number"
                  min="0"
                  value={cozulenSoru}
                  onChange={(e) => setCozulenSoru(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-black text-slate-900 text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-700 mb-1">Doğru Sayısı</label>
                <input
                  type="number"
                  min="0"
                  value={dogruSayisi}
                  onChange={(e) => setDogruSayisi(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-rose-700 mb-1">Yanlış Sayısı</label>
                <input
                  type="number"
                  min="0"
                  value={yanlisSayisi}
                  onChange={(e) => setYanlisSayisi(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-900 text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Boş Sayısı</label>
                <input
                  type="number"
                  min="0"
                  value={bosSayisi}
                  onChange={(e) => setBosSayisi(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-indigo-700 mb-1">Net</label>
                <div className="px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-black text-indigo-700 text-center">
                  {calculatedNet.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
              >
                Kaydet
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lesson-Based Question Analytics Table */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xs">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Ders Bazlı Toplam Soru Takip Tablosu</span>
          </h3>
          <span className="text-xs font-extrabold text-slate-600 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
            {lessonSummaries.length} Ders
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-5">Ders Adı</th>
                <th className="py-3.5 px-4 text-center">Çözülen Soru</th>
                <th className="py-3.5 px-4 text-center">Doğru</th>
                <th className="py-3.5 px-4 text-center">Yanlış</th>
                <th className="py-3.5 px-4 text-center">Boş</th>
                <th className="py-3.5 px-4 text-center">Net</th>
                <th className="py-3.5 px-5 text-center">Başarı Oranı</th>
                <th className="py-3.5 px-4 text-right">Detay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {lessonSummaries.length > 0 ? (
                lessonSummaries.map((summary) => {
                  const accuracy = summary.cozulenSoru > 0 
                    ? Math.round((summary.dogruSayisi / summary.cozulenSoru) * 100) 
                    : 0;
                  const isExpanded = expandedLesson === summary.ders;
                  const lessonQuestions = questions.filter((q) => {
                    const normalized = q.ders ? q.ders.trim() : '';
                    return normalized.toLowerCase().includes(summary.ders.toLowerCase());
                  });

                  return (
                    <React.Fragment key={summary.ders}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-5 font-black text-slate-900 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                            <span>{summary.ders}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center font-black text-slate-900 text-sm">
                          {summary.cozulenSoru}
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-emerald-700 bg-emerald-50/30">
                          {summary.dogruSayisi}
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-rose-700 bg-rose-50/30">
                          {summary.yanlisSayisi}
                        </td>
                        <td className="py-4 px-4 text-center font-semibold text-slate-500">
                          {summary.bosSayisi}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-black text-xs">
                            {summary.net.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden hidden sm:block">
                              <div 
                                className={`h-full ${accuracy >= 70 ? 'bg-emerald-500' : accuracy >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${Math.min(100, accuracy)}%` }}
                              />
                            </div>
                            <span className="font-extrabold text-slate-800">%{accuracy}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => setExpandedLesson(isExpanded ? null : summary.ders)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-600 p-1 rounded-lg transition-colors"
                          >
                            <span>Girişler</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Row for All Entries (Manuel, Optik/AI, Denemeler) under this lesson */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90">
                          <td colSpan={8} className="p-4">
                            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3 shadow-3xs">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                                <div className="text-xs font-black text-slate-800 flex items-center gap-2">
                                  <span>📌 {summary.ders} Dersine Ait Tüm Soru ve Sınav Girişleri</span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                    {getLessonEntries(summary.ders).length} Kayıt
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 font-medium">
                                  Manuel girişler, optik okumalar ve denemeler dahildir.
                                </div>
                              </div>

                              {(() => {
                                const lessonEntries = getLessonEntries(summary.ders);
                                if (lessonEntries.length === 0) {
                                  return (
                                    <div className="text-xs text-slate-400 italic py-3 text-center">
                                      Bu derse ait henüz herhangi bir soru çözümü veya sınav kaydı bulunmuyor.
                                    </div>
                                  );
                                }

                                return (
                                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                    {lessonEntries.map((entry) => (
                                      <div
                                        key={entry.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-2 px-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition-all gap-2"
                                      >
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                          <span className="text-slate-500 font-bold text-[11px] min-w-[70px]">
                                            {formatDate(entry.tarih)}
                                          </span>
                                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${entry.turBadgeBg} ${entry.turBadgeText}`}>
                                            {entry.turLabel}
                                          </span>
                                          <span className="font-extrabold text-slate-900">
                                            {entry.baslik}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-3 self-end sm:self-auto font-medium">
                                          <span className="text-slate-600">
                                            Çözülen: <strong className="text-slate-900 font-black">{entry.cozulenSoru}</strong>
                                          </span>
                                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                                            D: {entry.dogruSayisi}
                                          </span>
                                          <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60">
                                            Y: {entry.yanlisSayisi}
                                          </span>
                                          <span className="text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                                            B: {entry.bosSayisi}
                                          </span>
                                          <span className="text-indigo-700 font-black bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                            Net: {entry.net}
                                          </span>

                                          {entry.canDelete && entry.rawId && (
                                            <button
                                              onClick={() => onDeleteQuestion(entry.rawId!)}
                                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                                              title="Bu Manuel Girişi Sil"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Kayıtlı soru çözümü bulunmuyor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
