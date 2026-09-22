import React, { useState } from 'react';
import { 
  User, 
  Calendar, 
  GraduationCap, 
  Target, 
  Award, 
  FileText, 
  Check, 
  Edit3,
  Clock,
  KeyRound,
  Copy,
  RefreshCw
} from 'lucide-react';
import { Student, SinifType, AlanType, DurumType } from '../../../types';
import { generateRandom6DigitPin } from '../../../utils/pinUtils';
import { formatDate } from '../../../utils/dateUtils';

interface GeneralInfoTabProps {
  student: Student;
  onUpdateStudent: (updated: Student) => void;
}

export const GeneralInfoTab: React.FC<GeneralInfoTabProps> = ({
  student,
  onUpdateStudent,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Student>(student);
  const [savedToast, setSavedToast] = useState(false);

  // Sync if student prop changes
  React.useEffect(() => {
    setFormData(student);
  }, [student]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStudent(formData);
    setIsEditing(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="space-y-6">
      {savedToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in">
          <span>✅ Öğrenci genel bilgileri başarıyla güncellendi.</span>
        </div>
      )}

      {/* Main Info Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              1. Öğrenci Kimlik ve YKS Hazırlık Bilgileri
            </h3>
            <p className="text-xs text-slate-500">
              Öğrencinin alan, sınıf, hedef üniversite ve koçluk başlangıç parametreleri
            </p>
          </div>

          <button
            onClick={() => {
              if (isEditing) {
                setFormData(student);
              }
              setIsEditing(!isEditing);
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isEditing
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'İptal' : 'Bilgileri Düzenle'}</span>
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  required
                  value={formData.adSoyad}
                  onChange={(e) => setFormData({ ...formData, adSoyad: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Giriş PIN Kodu (6 Hane)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={formData.pinCode || ''}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, pinCode: generateRandom6DigitPin() })}
                    className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 transition-colors shrink-0"
                    title="Yeni 6 Haneli PIN Üret"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sınıf</label>
                <select
                  value={formData.sinif}
                  onChange={(e) => setFormData({ ...formData, sinif: e.target.value as SinifType })}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alan</label>
                <select
                  value={formData.alan}
                  onChange={(e) => setFormData({ ...formData, alan: e.target.value as AlanType })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Sayısal">Sayısal</option>
                  <option value="Eşit Ağırlık">Eşit Ağırlık</option>
                  <option value="Sözel">Sözel</option>
                  <option value="Dil">Dil</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Doğum Tarihi</label>
                <input
                  type="date"
                  value={formData.dogumTarihi}
                  onChange={(e) => setFormData({ ...formData, dogumTarihi: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hedef YKS Yılı</label>
                <input
                  type="text"
                  value={formData.yksHedefYili}
                  onChange={(e) => setFormData({ ...formData, yksHedefYili: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Koçluk Durumu</label>
                <select
                  value={formData.durum}
                  onChange={(e) => setFormData({ ...formData, durum: e.target.value as DurumType })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Donduruldu">Donduruldu</option>
                  <option value="Tamamlandı">Tamamlandı</option>
                  <option value="Pasif">Pasif</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hedef Üniversite</label>
                <input
                  type="text"
                  value={formData.hedefUniversite}
                  onChange={(e) => setFormData({ ...formData, hedefUniversite: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hedef Bölüm</label>
                <input
                  type="text"
                  value={formData.hedefBolum}
                  onChange={(e) => setFormData({ ...formData, hedefBolum: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hedef Sıralama</label>
                <input
                  type="text"
                  value={formData.hedefSiralama}
                  onChange={(e) => setFormData({ ...formData, hedefSiralama: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Koçluk Değerlendirmesi & Notu</label>
              <textarea
                rows={3}
                value={formData.kocNotu}
                onChange={(e) => setFormData({ ...formData, kocNotu: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
              >
                Değişiklikleri Kaydet
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* 3 Metric Summary Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Öğrenci Profili</span>
                </div>
                <div className="text-base font-extrabold text-slate-900">{student.adSoyad}</div>
                <div className="text-xs text-slate-500">{student.sinif} • {student.alan} Alanı</div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-1">
                <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Hedef YKS</span>
                </div>
                <div className="text-base font-extrabold text-indigo-950">{student.hedefUniversite}</div>
                <div className="text-xs font-bold text-indigo-700">{student.hedefBolum}</div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1">
                <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Hedef Sıralama</span>
                </div>
                <div className="text-base font-extrabold text-emerald-950">{student.hedefSiralama}</div>
                <div className="text-xs text-slate-500">Hedef Taban Puan: <strong className="text-emerald-800">{student.hedefPuan}</strong></div>
              </div>
            </div>

            {/* Detailed Parameters List */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50/60 border border-slate-200/70 rounded-2xl p-5 text-xs">
              <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 col-span-2 sm:col-span-1">
                <span className="text-indigo-600 block font-bold mb-0.5 flex items-center gap-1 text-[11px]">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Öğrenci Giriş PIN</span>
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="font-mono font-black text-indigo-900 text-sm tracking-wider">{student.pinCode}</span>
                  <button
                    onClick={() => navigator.clipboard?.writeText(student.pinCode)}
                    className="p-1 text-indigo-400 hover:text-indigo-700 transition-colors"
                    title="Kopyala"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5">Doğum Tarihi</span>
                <span className="font-bold text-slate-800">{formatDate(student.dogumTarihi, 'Belirtilmedi')}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5">Kayıt Tarihi</span>
                <span className="font-bold text-slate-800">{formatDate(student.kayitTarihi)}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5">Sınav Yılı</span>
                <span className="font-bold text-indigo-700">YKS {student.yksHedefYili}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5">Durum</span>
                <span className="inline-block font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                  {student.durum}
                </span>
              </div>
            </div>

            {/* Coach Assessment Note */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>Koçun İlk Durum Değerlendirmesi & Yol Haritası</span>
              </div>
              <div className="bg-amber-50/40 border border-amber-200/70 rounded-2xl p-5 text-xs text-slate-800 leading-relaxed font-medium">
                {student.kocNotu || 'Henüz koçluk değerlendirme notu girilmedi.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
