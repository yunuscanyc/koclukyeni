import React, { useState } from 'react';
import { 
  Plus, 
  Award, 
  TrendingUp, 
  Calendar, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  BarChart3,
  PieChart
} from 'lucide-react';
import { DenemeSinavi } from '../../../types';
import { NewExamModal } from '../../modals/NewExamModal';
import { formatDate } from '../../../utils/dateUtils';

interface ExamsTabProps {
  exams: DenemeSinavi[];
  onAddExam: (exam: Omit<DenemeSinavi, 'id'>) => void;
  onDeleteExam: (id: string) => void;
  studentId: string;
  studentName: string;
}

export const ExamsTab: React.FC<ExamsTabProps> = ({
  exams,
  onAddExam,
  onDeleteExam,
  studentId,
  studentName,
}) => {
  const [selectedType, setSelectedType] = useState<'Tümü' | 'TYT' | 'AYT'>('Tümü');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(
    exams[0]?.id || null
  );

  const filteredExams = exams.filter(
    (e) => selectedType === 'Tümü' || e.sinavTuru === selectedType
  );

  const activeExam = exams.find((e) => e.id === selectedExamId) || filteredExams[0] || null;

  // KPI calculations
  const tytExams = exams.filter((e) => e.sinavTuru === 'TYT');
  const aytExams = exams.filter((e) => e.sinavTuru === 'AYT');

  const maxTytNet = tytExams.length > 0 ? Math.max(...tytExams.map((e) => e.toplamNet)) : 0;
  const maxAytNet = aytExams.length > 0 ? Math.max(...aytExams.map((e) => e.toplamNet)) : 0;
  const avgNet =
    exams.length > 0
      ? (exams.reduce((acc, e) => acc + e.toplamNet, 0) / exams.length).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs">
          <div className="text-xs text-slate-400 font-semibold mb-1">Toplam Deneme</div>
          <div className="text-2xl font-black text-slate-900">{exams.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">TYT: {tytExams.length} • AYT: {aytExams.length}</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs">
          <div className="text-xs text-indigo-600 font-semibold mb-1 flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>En Yüksek TYT</span>
          </div>
          <div className="text-2xl font-black text-indigo-700">{maxTytNet > 0 ? `${maxTytNet.toFixed(2)}` : '--'}</div>
          <div className="text-[11px] text-slate-500 mt-1">120 Soru Üzerinden</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs">
          <div className="text-xs text-emerald-600 font-semibold mb-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>En Yüksek AYT</span>
          </div>
          <div className="text-2xl font-black text-emerald-700">{maxAytNet > 0 ? `${maxAytNet.toFixed(2)}` : '--'}</div>
          <div className="text-[11px] text-slate-500 mt-1">80 Soru Üzerinden</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">Genel Ortalama Net</div>
          <div className="text-2xl font-black text-slate-800">{avgNet}</div>
          <div className="text-[11px] text-slate-500 mt-1">Tüm Sınavlar Dahil</div>
        </div>
      </div>

      {/* Filter and New Exam Button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {['Tümü', 'TYT', 'AYT'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                selectedType === t
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Deneme Ekle</span>
        </button>
      </div>

      {/* 2-Column Responsive Layout: Wide Table (Left) + Detailed Lesson Net Breakdown (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Exam List Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xs">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Kurumsal Deneme Sınavları</h3>
            <span className="text-xs text-slate-400 font-medium">Detay için denemeye tıklayın</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Tür</th>
                  <th className="py-3 px-4">Sınav Adı</th>
                  <th className="py-3 px-4">Tarih</th>
                  <th className="py-3 px-4 text-center">Net</th>
                  <th className="py-3 px-4 text-center">Puan / Sıralama</th>
                  <th className="py-3 px-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredExams.length > 0 ? (
                  filteredExams.map((exam) => {
                    const isSelected = activeExam?.id === exam.id;
                    return (
                      <tr
                        key={exam.id}
                        onClick={() => setSelectedExamId(exam.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-50/70 text-indigo-950 font-bold' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                              exam.sinavTuru === 'TYT'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {exam.sinavTuru}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{exam.denemeAdi}</div>
                          <div className="text-[11px] text-slate-400 font-normal">{exam.yayin}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{formatDate(exam.tarih)}</td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="text-sm font-black text-indigo-700">
                            {exam.toplamNet.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap text-[11px]">
                          {exam.puan ? (
                            <span className="font-bold text-emerald-700">{exam.puan} P</span>
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                          {exam.siralama && (
                            <div className="text-slate-500 text-[10px]">{exam.siralama}.</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Bu deneme sınavını silmek istediğinize emin misiniz?')) {
                                onDeleteExam(exam.id);
                              }
                            }}
                            className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
                            title="Sınavı Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Henüz deneme kaydı girilmedi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side (430px equivalent): Lesson Net Breakdown & Coach Comment */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-5 flex flex-col justify-between">
          {activeExam ? (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        activeExam.sinavTuru === 'TYT'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {activeExam.sinavTuru}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{formatDate(activeExam.tarih)}</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-1">{activeExam.denemeAdi}</h4>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Toplam Net</div>
                  <div className="text-2xl font-black text-indigo-700">{activeExam.toplamNet.toFixed(2)}</div>
                </div>
              </div>

              {/* Sub-branch Nets */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Ders Bazında Net Dağılımı</span>
                </div>

                <div className="space-y-2">
                  {activeExam.dersler?.map((d) => (
                    <div
                      key={d.dersAdi}
                      className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800">{d.dersAdi}</div>
                        <div className="text-[11px] text-slate-400">
                          {d.dogru} Doğru • {d.yanlis} Yanlış • {d.bos} Boş
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-sm text-indigo-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                          {d.net.toFixed(2)} Net
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coach Note */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Koçun Deneme Notu</span>
                </div>
                <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4 text-xs text-slate-800 leading-relaxed italic">
                  "{activeExam.kocYorumu || 'Bu deneme için özel koç yorumu girilmedi.'}"
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8 space-y-2">
              <Award className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-semibold">Detayları görmek için bir deneme seçin</p>
            </div>
          )}
        </div>
      </div>

      {/* New Exam Modal */}
      {showAddModal && (
        <NewExamModal
          studentId={studentId}
          studentName={studentName}
          onClose={() => setShowAddModal(false)}
          onSave={onAddExam}
        />
      )}
    </div>
  );
};
