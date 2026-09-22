import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  BookOpen, 
  Sparkles, 
  Trash2, 
  Filter, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Globe,
  Check,
  AlertCircle
} from 'lucide-react';
import { Kazanim, KazanimOnem } from '../../../types';

interface OutcomesTabProps {
  curriculum: Kazanim[];
  onAddKazanim: (k: Omit<Kazanim, 'id'>) => void;
  onBulkAddKazanimlar: (items: Kazanim[], replaceAll?: boolean) => void;
  onDeleteKazanim: (id: string) => void;
  studentName: string;
}

export const OutcomesTab: React.FC<OutcomesTabProps> = ({
  curriculum,
  onAddKazanim,
  onBulkAddKazanimlar,
  onDeleteKazanim,
  studentName,
}) => {
  const [selectedSinav, setSelectedSinav] = useState<'Tümü' | 'TYT' | 'AYT'>('Tümü');
  const [selectedDers, setSelectedDers] = useState<string>('Tümü');
  const [selectedOnem, setSelectedOnem] = useState<string>('Tümü');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isFetchingAI, setIsFetchingAI] = useState(false);
  const [fetchToast, setFetchToast] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingItems, setPendingItems] = useState<Kazanim[]>([]);

  // Form State
  const [sinavTuru, setSinavTuru] = useState<'TYT' | 'AYT'>('TYT');
  const [ders, setDers] = useState('Matematik');
  const [konu, setKonu] = useState('');
  const [kazanimKodu, setKazanimKodu] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [onemDerecesi, setOnemDerecesi] = useState<KazanimOnem>('Kritik');
  const [yil, setYil] = useState('2026');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!konu.trim() || !aciklama.trim()) return;

    onAddKazanim({
      sinavTuru,
      ders,
      konu: konu.trim(),
      kazanimKodu: kazanimKodu.trim() || `${ders.slice(0, 3).toUpperCase()}.${sinavTuru}.${Math.floor(Math.random() * 90 + 10)}`,
      aciklama: aciklama.trim(),
      onemDerecesi,
      yil,
    });

    setKonu('');
    setKazanimKodu('');
    setAciklama('');
    setShowAddForm(false);
  };

  // AI Live Curriculum Fetch
  const handleFetchCurriculumFromAI = async () => {
    setIsFetchingAI(true);
    setFetchToast(null);

    try {
      const response = await fetch('/api/ai/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hedefYil: 2026 }),
      });

      const data = await response.json();
      if (data.kazanimlar && Array.isArray(data.kazanimlar) && data.kazanimlar.length > 0) {
        setPendingItems(data.kazanimlar);
        if (curriculum.length > 0) {
          setIsConfirmModalOpen(true);
        } else {
          executeBulkSave(data.kazanimlar, true);
        }
      } else {
        setFetchToast('Müfredat listesi güncellenemedi.');
      }
    } catch (err: any) {
      setFetchToast('Müfredat çekilirken bağlantı hatası oluştu.');
    } finally {
      setIsFetchingAI(false);
    }
  };

  const executeBulkSave = (items: Kazanim[], replaceAll: boolean) => {
    setIsConfirmModalOpen(false);
    setPendingItems([]);
    onBulkAddKazanimlar(items, replaceAll);
    setFetchToast(
      replaceAll
        ? `🗑️ Eski müfredat silindi ve ${items.length} yeni MEB kazanımı başarıyla yüklendi!`
        : `➕ ${items.length} yeni MEB kazanımı mevcut listenin üzerine eklendi! (Toplam: ${curriculum.length + items.length})`
    );
    setTimeout(() => setFetchToast(null), 5000);
  };

  const filteredCurriculum = curriculum.filter((k) => {
    const matchesSinav = selectedSinav === 'Tümü' || k.sinavTuru === selectedSinav;
    const matchesDers = selectedDers === 'Tümü' || k.ders.toLowerCase().includes(selectedDers.toLowerCase());
    const matchesOnem = selectedOnem === 'Tümü' || k.onemDerecesi === selectedOnem;
    const matchesSearch =
      k.konu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.aciklama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.kazanimKodu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.ders.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSinav && matchesDers && matchesOnem && matchesSearch;
  });

  const uniqueLessons = Array.from(new Set(curriculum.map((k) => k.ders)));

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {fetchToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <span>{fetchToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                6. MEB Müfredat Kazanımları Havuzu
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Türkiye YKS sınav sistemine uygun resmi MEB Talim ve Terbiye Kurulu kazanımları ({curriculum.length} Aktif Kazanım)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Kazanım Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Kazanım kodu (örn MAT.TYT.01), konu veya açıklama ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
          </div>

          {/* Sınav Filtresi */}
          <div className="flex items-center gap-1.5">
            {['Tümü', 'TYT', 'AYT'].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSinav(s as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedSinav === s
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Lesson Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedDers('Tümü')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedDers === 'Tümü'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tüm Dersler
          </button>
          {uniqueLessons.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDers(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedDers === d
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Add Kazanim Form */}
      {showAddForm && (
        <div className="bg-white border-2 border-indigo-500/30 rounded-3xl p-6 sm:p-7 shadow-lg space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-900">
              Manuel MEB Kazanımı Ekle
            </h4>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Kapat
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sınav Türü</label>
                <select
                  value={sinavTuru}
                  onChange={(e) => setSinavTuru(e.target.value as 'TYT' | 'AYT')}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="TYT">TYT</option>
                  <option value="AYT">AYT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ders *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Matematik, Fizik"
                  value={ders}
                  onChange={(e) => setDers(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Konu *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: İntegral ve Alan Hesabı"
                  value={konu}
                  onChange={(e) => setKonu(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kazanım Kodu</label>
                <input
                  type="text"
                  placeholder="Örn: MAT.AYT.06"
                  value={kazanimKodu}
                  onChange={(e) => setKazanimKodu(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Önem Derecesi</label>
                <select
                  value={onemDerecesi}
                  onChange={(e) => setOnemDerecesi(e.target.value as KazanimOnem)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Kritik">Kritik (Yüksek Soru Ağırlığı)</option>
                  <option value="Yüksek">Yüksek</option>
                  <option value="Orta">Orta</option>
                  <option value="Temel">Temel</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Müfredat Yılı</label>
                <input
                  type="text"
                  value={yil}
                  onChange={(e) => setYil(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Resmi MEB Kazanım Açıklaması *</label>
              <textarea
                rows={3}
                required
                placeholder="Öğrencinin bu konuda kazanması hedeflenen beceri, teorem veya problem çözüm yöntemi..."
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
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
                Kazanımı Kaydet
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Outcomes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCurriculum.length > 0 ? (
          filteredCurriculum.map((k) => (
            <div
              key={k.id}
              className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        k.sinavTuru === 'TYT' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {k.sinavTuru}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{k.ders}</span>
                    <span className="text-[10px] font-bold text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                      {k.kazanimKodu}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      k.onemDerecesi === 'Kritik'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : k.onemDerecesi === 'Yüksek'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {k.onemDerecesi}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900">{k.konu}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {k.aciklama}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                <span>MEB YKS {k.yil} Müfredatı</span>
                <button
                  onClick={() => onDeleteKazanim(k.id)}
                  className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
                  title="Kazanımı Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 space-y-2">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">Aradığınız kriterlere uygun kazanım bulunamadı.</p>
            <p className="text-[11px]">Yukarıdaki "🌐 Güncel Müfredatı Çek (Yapay Zekâ)" butonuna basarak MEB kazanımlarını otomatik yükleyebilirsiniz.</p>
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL FOR OUTCOMES TAB */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-800 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">Eski Müfredatı Sileyim mi?</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sistemde şu an <strong className="text-slate-900">{curriculum.length} adet</strong> kayıtlı kazanım bulunuyor.
                  Çekilen <strong className="text-indigo-700">{pendingItems.length} adet</strong> MEB kazanımını nasıl kaydetmek istersiniz?
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {/* Option 1: Evet, Eski Müfredatı Sil (Temiz Kurulum) */}
              <button
                type="button"
                onClick={() => executeBulkSave(pendingItems, true)}
                className="w-full p-4 rounded-2xl border-2 border-rose-200 hover:border-rose-400 bg-rose-50/60 hover:bg-rose-50 text-left transition-all flex items-start gap-3.5 group cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-rose-600 text-white shrink-0 group-hover:scale-105 transition-transform">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-black text-rose-950 flex items-center gap-2">
                    <span>Evet, Eski Müfredatı Sil ve Yenileri Kaydet</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 text-[10px] font-black">
                      Temiz Kurulum
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    Mevcut {curriculum.length} eski kazanımı tamamen siler. Sadece yeni {pendingItems.length} MEB kazanımı veritabanında kalır.
                  </p>
                </div>
              </button>

              {/* Option 2: Hayır, Mevcut Müfredatın Üzerine Ekle */}
              <button
                type="button"
                onClick={() => executeBulkSave(pendingItems, false)}
                className="w-full p-4 rounded-2xl border-2 border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 text-left transition-all flex items-start gap-3.5 group cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0 group-hover:scale-105 transition-transform">
                  <Check className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-black text-indigo-950 flex items-center gap-2">
                    <span>Hayır, Mevcut Müfredatın Üzerine Ekle</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-900 text-[10px] font-black">
                      Birleştir
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-800 leading-relaxed">
                    Mevcut {curriculum.length} kazanım korunur, yeni {pendingItems.length} MEB kazanımı listenin üzerine eklenir (Toplam: {curriculum.length + pendingItems.length}).
                  </p>
                </div>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setPendingItems([]);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Vazgeç (Geri Dön)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
