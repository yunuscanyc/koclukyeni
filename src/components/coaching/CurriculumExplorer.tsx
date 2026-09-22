import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  ChevronDown, 
  ChevronRight, 
  Layers, 
  Target, 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  Award, 
  Compass, 
  Copy, 
  Check,
  Flame,
  Bookmark,
  GraduationCap,
  Filter
} from 'lucide-react';
import { MEB_YKS_CURRICULUM } from './curriculumData';
import { CurriculumTopicItem } from '../../types';

interface CurriculumExplorerProps {
  onSelectTopicForTask?: (topic: CurriculumTopicItem, dersAdi: string) => void;
  className?: string;
  defaultExpanded?: boolean;
}

export const CurriculumExplorer: React.FC<CurriculumExplorerProps> = ({
  onSelectTopicForTask,
  className = '',
  defaultExpanded = true
}) => {
  const [selectedGradeId, setSelectedGradeId] = useState<string>('9');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOnem, setSelectedOnem] = useState<string>('all');
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Active Grade Level
  const currentGrade = useMemo(() => {
    return MEB_YKS_CURRICULUM.find((g) => g.gradeId === selectedGradeId) || MEB_YKS_CURRICULUM[0];
  }, [selectedGradeId]);

  // Available subjects for active grade
  const availableSubjects = useMemo(() => {
    return currentGrade.subjects;
  }, [currentGrade]);

  // Filtered Subject & Units
  const filteredData = useMemo(() => {
    let subjects = currentGrade.subjects;

    if (selectedSubjectId !== 'all') {
      subjects = subjects.filter((s) => s.id === selectedSubjectId);
    }

    return subjects.map((subject) => {
      const filteredUnits = subject.units.map((unit) => {
        const filteredTopics = unit.topics.filter((topic) => {
          const matchesSearch =
            searchQuery.trim() === '' ||
            topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            unit.uniteAdi.toLowerCase().includes(searchQuery.toLowerCase()) ||
            subject.dersAdi.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (topic.kazanimKodu && topic.kazanimKodu.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (topic.kocNotu && topic.kocNotu.toLowerCase().includes(searchQuery.toLowerCase()));

          const matchesOnem = selectedOnem === 'all' || topic.onem === selectedOnem;

          return matchesSearch && matchesOnem;
        });

        return {
          ...unit,
          topics: filteredTopics
        };
      }).filter((unit) => unit.topics.length > 0);

      return {
        ...subject,
        units: filteredUnits
      };
    }).filter((subject) => subject.units.length > 0);
  }, [currentGrade, selectedSubjectId, searchQuery, selectedOnem]);

  // Stats calculation
  const totalStats = useMemo(() => {
    let totalUnits = 0;
    let totalTopics = 0;
    let criticalTopics = 0;

    MEB_YKS_CURRICULUM.forEach((grade) => {
      grade.subjects.forEach((sub) => {
        totalUnits += sub.units.length;
        sub.units.forEach((u) => {
          totalTopics += u.topics.length;
          criticalTopics += u.topics.filter((t) => t.onem === 'Kritik').length;
        });
      });
    });

    return { totalUnits, totalTopics, criticalTopics };
  }, []);

  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev) => ({
      ...prev,
      [unitId]: prev[unitId] !== undefined ? !prev[unitId] : false // toggle from default expanded (true)
    }));
  };

  const isUnitExpanded = (unitId: string) => {
    if (expandedUnits[unitId] !== undefined) {
      return expandedUnits[unitId];
    }
    return defaultExpanded;
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className={`bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden ${className}`}>
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-7 text-white relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>MEB & ÖSYM Müfredat Kütüphanesi</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <strong>{totalStats.totalUnits}</strong> Ünite
              </span>
              <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <strong>{totalStats.totalTopics}</strong> Konu & Kazanım
              </span>
              <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 text-amber-300">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <strong>{totalStats.criticalTopics}</strong> Kritik ÖSYM Konusu
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Sınıf Sınıf ve Ders Ders MEB & YKS Konu Havuzu</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              9, 10, 11 ve 12. sınıfların tüm MEB üniteleri, TYT/AYT soru ağırlıkları, çalışma süreleri ve koçluk strateji ipuçları.
            </p>
          </div>
        </div>

        {/* Background glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Control Bar: Grade Tabs + Search + Importance Filter */}
      <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
        {/* 1. Sınıf Seçici Butonları */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sınıf Kademesi Seçin</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MEB_YKS_CURRICULUM.map((grade) => {
              const isSelected = selectedGradeId === grade.gradeId;
              return (
                <button
                  key={grade.gradeId}
                  onClick={() => {
                    setSelectedGradeId(grade.gradeId);
                    setSelectedSubjectId('all'); // reset subject filter
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-black flex items-center justify-between">
                    <span>{grade.title}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                  </div>
                  <div className={`text-[11px] mt-0.5 truncate ${isSelected ? 'text-indigo-100 font-medium' : 'text-slate-500'}`}>
                    {grade.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Ders Seçici Hap Butonlar & Arama */}
        <div className="space-y-2 pt-1">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Ders Hapları */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedSubjectId('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                  selectedSubjectId === 'all'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Tüm Dersler ({availableSubjects.length})
              </button>

              {availableSubjects.map((sub) => {
                const isSelected = selectedSubjectId === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubjectId(sub.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{sub.dersAdi}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-500 font-bold'}`}>
                      {sub.units.length} Ünite
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Öncelik & Önem Filtresi */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedOnem}
                onChange={(e) => setSelectedOnem(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Tüm Önem Seviyeleri</option>
                <option value="Kritik">🔥 Sadece Kritik Konular</option>
                <option value="Yüksek">⚡ Yüksek Öncelikli</option>
                <option value="Orta">📌 Orta Seviye</option>
                <option value="Temel">🌱 Temel Seviye</option>
              </select>
            </div>
          </div>

          {/* Arama Inputu */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`${currentGrade.title} içinde ünite, konu adı, kazanım kodu veya koçluk ipucu ara... (Örn: Trigonometri, Limit, Polinom, Hücre, Eşitsizlik)`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 px-1.5 py-0.5 rounded-md hover:bg-slate-100"
              >
                Temizle
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grade Explanation Note */}
      <div className="px-6 py-3 bg-indigo-50/50 border-b border-indigo-100/60 flex items-center justify-between text-xs text-indigo-900">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="font-medium">{currentGrade.description}</span>
        </div>
        <div className="hidden sm:block text-[11px] font-bold text-indigo-700">
          ÖSYM 2026/2027 Müfredatına Uyarlanmıştır
        </div>
      </div>

      {/* Content View: Lessons -> Units -> Topics */}
      <div className="p-4 sm:p-6 space-y-6">
        {filteredData.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-100">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">Arama kriterlerinize uygun konu bulunamadı.</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Lütfen arama terimini değiştirin veya önem seviyesi filtresini sıfırlayın.
            </p>
          </div>
        ) : (
          filteredData.map((subject) => (
            <div key={subject.id} className="space-y-3">
              {/* Subject Title Header */}
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-600" />
                  <h4 className="text-base font-black text-slate-900 tracking-tight">
                    {subject.dersAdi}
                  </h4>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {subject.sinavTuru}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {subject.units.length} Ünite • {subject.units.reduce((acc, u) => acc + u.topics.length, 0)} Konu
                </span>
              </div>

              {/* Units List */}
              <div className="space-y-3">
                {subject.units.map((unit) => {
                  const isExpanded = isUnitExpanded(unit.id);
                  return (
                    <div
                      key={unit.id}
                      className="border border-slate-200/80 rounded-2xl overflow-hidden transition-all bg-white hover:border-indigo-200 shadow-2xs"
                    >
                      {/* Unit Accordion Bar */}
                      <button
                        onClick={() => toggleUnit(unit.id)}
                        className="w-full px-4 sm:px-5 py-3.5 bg-slate-50/70 hover:bg-slate-100/80 transition-colors flex items-center justify-between text-left gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                            {unit.uniteNo}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-black text-slate-900 truncate">
                              {unit.uniteAdi}
                            </div>
                            {unit.aciklama && (
                              <div className="text-[11px] text-slate-500 truncate font-medium">
                                {unit.aciklama}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                            {unit.topics.length} Konu
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* Unit Topics Table / Rows */}
                      {isExpanded && (
                        <div className="divide-y divide-slate-100 border-t border-slate-100">
                          {unit.topics.map((topic) => {
                            const getImportanceBadge = (onem: string) => {
                              switch (onem) {
                                case 'Kritik':
                                  return (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black">
                                      <Flame className="w-3 h-3 text-rose-600" />
                                      <span>Kritik</span>
                                    </span>
                                  );
                                case 'Yüksek':
                                  return (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black">
                                      <span>⚡ Yüksek</span>
                                    </span>
                                  );
                                case 'Orta':
                                  return (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                                      <span>📌 Orta</span>
                                    </span>
                                  );
                                default:
                                  return (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold">
                                      <span>Temel</span>
                                    </span>
                                  );
                              }
                            };

                            return (
                              <div
                                key={topic.id}
                                className="p-3.5 sm:p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                              >
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                                      {topic.name}
                                    </span>
                                    {getImportanceBadge(topic.onem)}
                                    {topic.osymCikmaAirligi && (
                                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                                        🎯 {topic.osymCikmaAirligi}
                                      </span>
                                    )}
                                  </div>

                                  {/* Coach strategic note / tips */}
                                  {topic.kocNotu && (
                                    <div className="text-[11px] text-amber-800 bg-amber-50/70 border border-amber-200/60 rounded-xl px-3 py-1.5 flex items-start gap-1.5">
                                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                      <span><strong>Koçluk İpucu:</strong> {topic.kocNotu}</span>
                                    </div>
                                  )}

                                  {/* Meta: Question target, hours, code */}
                                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                                    {topic.kazanimKodu && (
                                      <button
                                        onClick={() => handleCopyCode(topic.kazanimKodu!)}
                                        className="inline-flex items-center gap-1 hover:text-indigo-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-700"
                                        title="Kodu Kopyala"
                                      >
                                        <span>{topic.kazanimKodu}</span>
                                        {copiedCode === topic.kazanimKodu ? (
                                          <Check className="w-3 h-3 text-emerald-600" />
                                        ) : (
                                          <Copy className="w-3 h-3 text-slate-400" />
                                        )}
                                      </button>
                                    )}

                                    {topic.hedefSoruOnerisi && (
                                      <span className="flex items-center gap-1">
                                        <Target className="w-3 h-3 text-indigo-500" />
                                        <span>Önerilen Soru: <strong>{topic.hedefSoruOnerisi} Soru</strong></span>
                                      </span>
                                    )}

                                    {topic.tahminiCalismaSaati && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        <span>Tahmini Süre: <strong>~{topic.tahminiCalismaSaati} Saat</strong></span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Right Side Actions */}
                                <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                                  {onSelectTopicForTask && (
                                    <button
                                      onClick={() => onSelectTopicForTask(topic, subject.dersAdi)}
                                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors active:scale-95 border border-indigo-200/70 shadow-2xs flex items-center gap-1.5"
                                    >
                                      <Bookmark className="w-3 h-3 text-indigo-600" />
                                      <span>Ödev & Görev Ata</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
