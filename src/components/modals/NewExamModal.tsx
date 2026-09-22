import React, { useState, useMemo } from 'react';
import { X, Award, Plus, Calculator, CheckCircle2 } from 'lucide-react';
import { DenemeSinavi, DersNetDetay } from '../../types';

interface NewExamModalProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
  onSave: (exam: Omit<DenemeSinavi, 'id'>) => void;
}

const TYT_DEFAULT_LESSONS = [
  { dersAdi: 'Türkçe (40)', maxSoru: 40, dogru: 32, yanlis: 4, bos: 4 },
  { dersAdi: 'Sosyal Bilimler (20)', maxSoru: 20, dogru: 15, yanlis: 3, bos: 2 },
  { dersAdi: 'Temel Matematik (40)', maxSoru: 40, dogru: 30, yanlis: 5, bos: 5 },
  { dersAdi: 'Fen Bilimleri (20)', maxSoru: 20, dogru: 14, yanlis: 4, bos: 2 },
];

const AYT_SAY_LESSONS = [
  { dersAdi: 'Matematik (40)', maxSoru: 40, dogru: 28, yanlis: 4, bos: 8 },
  { dersAdi: 'Fizik (14)', maxSoru: 14, dogru: 10, yanlis: 2, bos: 2 },
  { dersAdi: 'Kimya (13)', maxSoru: 13, dogru: 10, yanlis: 2, bos: 1 },
  { dersAdi: 'Biyoloji (13)', maxSoru: 13, dogru: 9, yanlis: 3, bos: 1 },
];

const AYT_EA_LESSONS = [
  { dersAdi: 'Matematik (40)', maxSoru: 40, dogru: 28, yanlis: 4, bos: 8 },
  { dersAdi: 'Türk Dili ve Edebiyatı (24)', maxSoru: 24, dogru: 18, yanlis: 4, bos: 2 },
  { dersAdi: 'Tarih-1 (10)', maxSoru: 10, dogru: 7, yanlis: 2, bos: 1 },
  { dersAdi: 'Coğrafya-1 (6)', maxSoru: 6, dogru: 5, yanlis: 1, bos: 0 },
];

export const NewExamModal: React.FC<NewExamModalProps> = ({
  studentId,
  studentName,
  onClose,
  onSave,
}) => {
  const [sinavTuru, setSinavTuru] = useState<'TYT' | 'AYT'>('TYT');
  const [denemeAdi, setDenemeAdi] = useState('');
  const [yayin, setYayin] = useState('');
  const [tarih, setTarih] = useState(new Date().toISOString().split('T')[0]);
  const [puan, setPuan] = useState<string>('');
  const [siralama, setSiralama] = useState<string>('');
  const [toplamKatilimci, setToplamKatilimci] = useState<string>('');
  const [kocYorumu, setKocYorumu] = useState('');

  const [lessons, setLessons] = useState(TYT_DEFAULT_LESSONS);

  // Switch template when exam type changes
  const handleTypeChange = (newType: 'TYT' | 'AYT') => {
    setSinavTuru(newType);
    if (newType === 'TYT') {
      setLessons(TYT_DEFAULT_LESSONS);
    } else {
      setLessons(AYT_SAY_LESSONS);
    }
  };

  const handleLessonChange = (index: number, field: 'dogru' | 'yanlis' | 'bos', val: number) => {
    const updated = [...lessons];
    updated[index] = { ...updated[index], [field]: Math.max(0, val) };
    setLessons(updated);
  };

  // Calculate live nets
  const dersNetleri: DersNetDetay[] = useMemo(() => {
    return lessons.map((l) => {
      const net = Math.max(0, l.dogru - l.yanlis * 0.25);
      return {
        dersAdi: l.dersAdi,
        dogru: l.dogru,
        yanlis: l.yanlis,
        bos: l.bos,
        net: Number(net.toFixed(2)),
      };
    });
  }, [lessons]);

  const toplamNet = useMemo(() => {
    const sum = dersNetleri.reduce((acc, curr) => acc + curr.net, 0);
    return Number(sum.toFixed(2));
  }, [dersNetleri]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!denemeAdi.trim()) return;

    onSave({
      studentId,
      ogrenciAdSoyad: studentName,
      sinavTuru,
      denemeAdi: denemeAdi.trim(),
      yayin: yayin.trim() || 'Genel Yayın',
      tarih,
      toplamNet,
      puan: puan ? Number(puan) : null,
      siralama: siralama ? Number(siralama) : null,
      toplamKatilimci: toplamKatilimci ? Number(toplamKatilimci) : null,
      kocYorumu: kocYorumu.trim() || null,
      dersler: dersNetleri,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Yeni Deneme Sınavı Kaydet</h3>
              <p className="text-xs text-slate-500">{studentName} için resmi deneme girişi</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Sınav Türü Seçimi */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleTypeChange('TYT')}
              className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                sinavTuru === 'TYT'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              TYT (Temel Yeterlilik Testi)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('AYT')}
              className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                sinavTuru === 'AYT'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              AYT (Alan Yeterlilik Testi)
            </button>
          </div>

          {/* Sınav Genel Bilgileri */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Deneme Adı *</label>
              <input
                type="text"
                required
                placeholder="Örn: 3D Türkiye Geneli 1"
                value={denemeAdi}
                onChange={(e) => setDenemeAdi(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Yayın / Kurum</label>
              <input
                type="text"
                placeholder="Örn: 3D Yayınları, Özdebir"
                value={yayin}
                onChange={(e) => setYayin(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tarih</label>
              <input
                type="date"
                required
                value={tarih}
                onChange={(e) => setTarih(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Ders Net Girişleri */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Ders Bazında Doğru - Yanlış - Boş</span>
              <span className="text-indigo-600 font-bold">Toplam: {toplamNet} Net</span>
            </div>

            <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-3">
              {lessons.map((lesson, idx) => {
                const net = Math.max(0, lesson.dogru - lesson.yanlis * 0.25);
                return (
                  <div
                    key={lesson.dersAdi}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-100 shadow-2xs"
                  >
                    <span className="text-xs font-bold text-slate-800 sm:w-44">{lesson.dersAdi}</span>
                    <div className="flex items-center gap-2">
                      <div>
                        <span className="text-[10px] text-emerald-700 font-semibold block">D</span>
                        <input
                          type="number"
                          min="0"
                          value={lesson.dogru}
                          onChange={(e) => handleLessonChange(idx, 'dogru', Number(e.target.value))}
                          className="w-14 px-2 py-1 bg-emerald-50/50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-900 text-center"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-rose-700 font-semibold block">Y</span>
                        <input
                          type="number"
                          min="0"
                          value={lesson.yanlis}
                          onChange={(e) => handleLessonChange(idx, 'yanlis', Number(e.target.value))}
                          className="w-14 px-2 py-1 bg-rose-50/50 border border-rose-200 rounded-lg text-xs font-bold text-rose-900 text-center"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold block">B</span>
                        <input
                          type="number"
                          min="0"
                          value={lesson.bos}
                          onChange={(e) => handleLessonChange(idx, 'bos', Number(e.target.value))}
                          className="w-14 px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 text-center"
                        />
                      </div>
                      <div className="text-right sm:w-20 pl-2">
                        <span className="text-[10px] text-indigo-500 font-semibold block">Net</span>
                        <span className="text-xs font-black text-indigo-700">{net.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* İsteğe Bağlı Puan & Sıralama */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Puan</label>
              <input
                type="number"
                step="0.1"
                placeholder="Örn: 465.8"
                value={puan}
                onChange={(e) => setPuan(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sıralama</label>
              <input
                type="number"
                placeholder="Örn: 5200"
                value={siralama}
                onChange={(e) => setSiralama(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Toplam Katılımcı</label>
              <input
                type="number"
                placeholder="Örn: 150000"
                value={toplamKatilimci}
                onChange={(e) => setToplamKatilimci(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Koç Değerlendirmesi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Koçun Deneme Yorumu & Strateji Notu</label>
            <textarea
              rows={3}
              placeholder="Öğrencinin bu denemedeki performansı, süre yönetimi ve branş bazlı tespitler..."
              value={kocYorumu}
              onChange={(e) => setKocYorumu(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-900">
              Hesaplanan Toplam Net: <span className="text-indigo-600 text-sm">{toplamNet}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Denemeyi Kaydet</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
