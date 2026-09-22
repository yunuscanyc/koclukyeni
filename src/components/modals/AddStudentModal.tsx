import React, { useState } from 'react';
import { X, UserPlus, GraduationCap, Target, KeyRound, RefreshCw } from 'lucide-react';
import { Student, SinifType, AlanType } from '../../types';
import { generateRandom6DigitPin } from '../../utils/pinUtils';

interface AddStudentModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSave?: (student: Omit<Student, 'id'>) => void;
  onAdd?: (student: Omit<Student, 'id'>) => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen = true,
  onClose,
  onSave,
  onAdd,
}) => {
  const [adSoyad, setAdSoyad] = useState('');
  const [pinCode, setPinCode] = useState(() => generateRandom6DigitPin());
  const [dogumTarihi, setDogumTarihi] = useState('2008-05-15');
  const [sinif, setSinif] = useState<SinifType>('12. Sınıf');
  const [alan, setAlan] = useState<AlanType>('Sayısal');
  const [yksHedefYili, setYksHedefYili] = useState('2026');
  const [hedefUniversite, setHedefUniversite] = useState('');
  const [hedefBolum, setHedefBolum] = useState('');
  const [hedefPuan, setHedefPuan] = useState<number | string>(490);
  const [hedefSiralama, setHedefSiralama] = useState('20.000');
  const [kocNotu, setKocNotu] = useState('');

  if (!isOpen) return null;

  const avatarColors = [
    'bg-indigo-600',
    'bg-emerald-600',
    'bg-blue-600',
    'bg-purple-600',
    'bg-rose-600',
    'bg-amber-600',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adSoyad.trim()) return;

    const randomBg = avatarColors[Math.floor(Math.random() * avatarColors.length)];
    const saveHandler = onSave || onAdd;

    if (saveHandler) {
      saveHandler({
        adSoyad: adSoyad.trim(),
        pinCode: pinCode.trim() || generateRandom6DigitPin(),
        dogumTarihi,
        kayitTarihi: new Date().toISOString().split('T')[0],
        sinif,
        alan,
        yksHedefYili,
        hedefUniversite: hedefUniversite.trim() || 'Hedef Belirtilmedi',
        hedefBolum: hedefBolum.trim() || 'Genel Bölüm',
        hedefPuan,
        hedefSiralama: hedefSiralama.trim() || 'İlk 20.000',
        durum: 'Aktif',
        kocNotu: kocNotu.trim(),
        avatarBg: randomBg,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Yeni Öğrenci Kaydı</h3>
              <p className="text-xs text-slate-500">YKS koçluk takip sistemine yeni öğrenci ekleyin</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Adı ve Soyadı *</label>
              <input
                type="text"
                required
                placeholder="Örn: Mehmet Can Demir"
                value={adSoyad}
                onChange={(e) => setAdSoyad(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* 6 Haneli Benzersiz Öğrenci Giriş PIN'i */}
            <div className="sm:col-span-2 p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-700">Öğrenci 6 Haneli Giriş PIN Kodu (Otomatik Üretildi)</div>
                  <div className="text-base font-black text-indigo-700 font-mono tracking-wider">{pinCode}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPinCode(generateRandom6DigitPin())}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
                title="Yeni rastgele PIN kodu üret"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Yenile</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sınıf</label>
              <select
                value={sinif}
                onChange={(e) => setSinif(e.target.value as SinifType)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              >
                <option value="9. Sınıf">9. Sınıf</option>
                <option value="10. Sınıf">10. Sınıf</option>
                <option value="11. Sınıf">11. Sınıf</option>
                <option value="12. Sınıf">12. Sınıf</option>
                <option value="Mezun">Mezun</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Alan (YKS Bölümü)</label>
              <select
                value={alan}
                onChange={(e) => setAlan(e.target.value as AlanType)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Sayısal">Sayısal (SAY)</option>
                <option value="Eşit Ağırlık">Eşit Ağırlık (EA)</option>
                <option value="Sözel">Sözel (SÖZ)</option>
                <option value="Dil">Dil (DİL)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Doğum Tarihi</label>
              <input
                type="date"
                value={dogumTarihi}
                onChange={(e) => setDogumTarihi(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hedef YKS Yılı</label>
              <input
                type="text"
                placeholder="2026"
                value={yksHedefYili}
                onChange={(e) => setYksHedefYili(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Hedef Bilgileri */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-500" />
              <span>YKS Hedefleri</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hedef Üniversite</label>
                <input
                  type="text"
                  placeholder="Örn: Boğaziçi Üniversitesi"
                  value={hedefUniversite}
                  onChange={(e) => setHedefUniversite(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hedef Bölüm</label>
                <input
                  type="text"
                  placeholder="Örn: Endüstri Mühendisliği"
                  value={hedefBolum}
                  onChange={(e) => setHedefBolum(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hedef Taban Puan</label>
                <input
                  type="number"
                  placeholder="495"
                  value={hedefPuan}
                  onChange={(e) => setHedefPuan(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hedef Sıralama</label>
                <input
                  type="text"
                  placeholder="15.000"
                  value={hedefSiralama}
                  onChange={(e) => setHedefSiralama(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Koç Notu */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">İlk Koç Değerlendirmesi</label>
            <textarea
              rows={2}
              placeholder="Öğrencinin başlangıç durumu, güçlü/zayıf yanları ve çalışma alışkanlıkları..."
              value={kocNotu}
              onChange={(e) => setKocNotu(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all active:scale-95"
            >
              Öğrenciyi Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
