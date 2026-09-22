import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Target, 
  Award, 
  Trash2, 
  ChevronRight,
  TrendingUp,
  GraduationCap,
  Sparkles,
  KeyRound,
  Copy,
  Check,
  BookOpen,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Student, OgrenciSinavKaydi, CurriculumTopicItem } from '../../types';
import { CurriculumExplorer } from './CurriculumExplorer';

interface StudentListViewProps {
  students: Student[];
  selectedStudent: Student | null;
  archives?: OgrenciSinavKaydi[];
  onSelectStudent: (id: string) => void;
  onOpenAddStudent: () => void;
  onDeleteStudent: (id: string) => void;
  onNavigateToCurriculum?: () => void;
}

export const StudentListView: React.FC<StudentListViewProps> = ({
  students,
  selectedStudent,
  archives = [],
  onSelectStudent,
  onOpenAddStudent,
  onDeleteStudent,
  onNavigateToCurriculum
}) => {
  const [activeHomeTab, setActiveHomeTab] = useState<'students' | 'curriculum'>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlan, setSelectedAlan] = useState<string>('Tümü');

  const filteredStudents = students.filter((s) => {
    const q = (searchQuery || '').trim().toLowerCase();
    const adSoyad = (s.adSoyad || '').toLowerCase();
    const hedefUni = (s.hedefUniversite || '').toLowerCase();
    const hedefBolum = (s.hedefBolum || '').toLowerCase();

    const matchesSearch =
      !q || adSoyad.includes(q) || hedefUni.includes(q) || hedefBolum.includes(q);

    const sAlan: string = s.alan || '';
    const matchesAlan =
      selectedAlan === 'Tümü' ||
      sAlan === selectedAlan ||
      (selectedAlan === 'Sayısal' && (sAlan === 'SAY' || sAlan === 'Sayısal')) ||
      (selectedAlan === 'Eşit Ağırlık' && (sAlan === 'EA' || sAlan === 'Eşit Ağırlık')) ||
      (selectedAlan === 'Sözel' && (sAlan === 'SÖZ' || sAlan === 'Sözel'));

    return matchesSearch && matchesAlan;
  });

  return (
    <div className="space-y-6">
      {/* Banner / Overview Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>YKS Eğitim Koçluğu Yönetim Merkezi</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Öğrencilerinizin YKS Yolculuğunu & MEB Müfredatını Tek Ekranda Yönetin
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Fotoğraflı deneme analizi, 9-12. sınıf MEB ünite ve konu kazanım kütüphanesi, haftalık çalışma görevleri ve yapay zekâ koçluk reçeteleri.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenAddStudent}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Öğrenci Ekle</span>
            </button>

            <button
              onClick={() => setActiveHomeTab('curriculum')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                activeHomeTab === 'curriculum'
                  ? 'bg-white text-slate-900 border-white shadow-md'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-indigo-200 border-slate-700/70'
              }`}
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Sınıf & Ders Müfredatını İncele (9-12. Sınıf)</span>
            </button>

            <div className="text-xs text-slate-400 font-medium">
              Toplam: <strong className="text-white">{students.length} Kayıtlı Öğrenci</strong>
            </div>
          </div>
        </div>

        {/* Ambient Gradient Blur */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Home Navigation Segment Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveHomeTab('students')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
            activeHomeTab === 'students'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Kayıtlı Öğrencilerim ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveHomeTab('curriculum')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
            activeHomeTab === 'curriculum'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>MEB & YKS Müfredat, Ünite ve Konu Havuzu (9, 10, 11, 12. Sınıf)</span>
        </button>
      </div>

      {activeHomeTab === 'curriculum' ? (
        <CurriculumExplorer />
      ) : (
        <>
          {/* Filter and Search for Students */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Öğrenci adı, üniversite veya bölüm ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {['Tümü', 'Sayısal', 'Eşit Ağırlık', 'Sözel', 'Dil'].map((alan) => (
                <button
                  key={alan}
                  onClick={() => setSelectedAlan(alan)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    selectedAlan === alan
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {alan}
                </button>
              ))}
            </div>
          </div>

          {/* Student Cards Grid */}
          {students.length === 0 ? (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto text-2xl font-bold">
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">Kayıtlı Öğrenci Bulunmuyor</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Sistemde henüz kayıtlı öğrenci yoktur. "Yeni Öğrenci Ekle" butonuna basarak ilk öğrencinizi sisteme dahil edebilirsiniz.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onOpenAddStudent}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yeni Öğrenci Ekle</span>
                </button>
              </div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-8 text-center max-w-md mx-auto space-y-2">
              <p className="text-xs font-bold text-slate-700">Arama kriterlerine uygun öğrenci bulunamadı.</p>
              <p className="text-[11px] text-slate-500">Lütfen arama terimini değiştirin veya filtreyi sıfırlayın.</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredStudents.map((s) => {
              const isSelected = selectedStudent?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => onSelectStudent(s.id)}
                  className={`group bg-white border rounded-3xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all cursor-pointer relative flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20'
                      : 'border-slate-200/90 hover:border-indigo-300'
                  }`}
                >
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl ${
                          s.avatarBg || 'bg-indigo-600'
                        } text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0`}
                      >
                        {s.adSoyad.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {s.adSoyad}
                          </h3>
                          {archives.some((a) => a.studentId === s.id && a.isNew) && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 animate-pulse">
                              📸 YENİ TEST
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-semibold text-slate-500">{s.sinif}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                            {s.alan}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`${s.adSoyad} isimli öğrenciyi ve tüm kayıtlarını silmek istediğinize emin misiniz?`)) {
                          onDeleteStudent(s.id);
                        }
                      }}
                      className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition-colors"
                      title="Öğrenciyi Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Target Details */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold truncate">
                      <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="truncate">{s.hedefUniversite}</span>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-700 font-bold truncate pl-6">
                      <span className="truncate">{s.hedefBolum}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Hedef Sıralama: <strong className="text-slate-900">{s.hedefSiralama}</strong></span>
                      <span>Hedef Puan: <strong className="text-indigo-700">{s.hedefPuan}</strong></span>
                    </div>
                  </div>

                  {/* 6 Haneli Giriş PIN Kodu */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px]">
                      <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Öğrenci Giriş PIN:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-indigo-700 tracking-wider text-xs px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100">
                        {s.pinCode}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard?.writeText(s.pinCode);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                        title="Öğrenci PIN Kodunu Kopyala"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Coach Note preview */}
                  {s.kocNotu && (
                    <p className="text-[11px] text-slate-500 italic line-clamp-2 bg-indigo-50/30 p-2.5 rounded-xl border border-indigo-100/50">
                      "{s.kocNotu}"
                    </p>
                  )}

                  {/* Action */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Detaylı Koçluk Paneli</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      YKS {s.yksHedefYili}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </>
      )}
    </div>
  );
};
