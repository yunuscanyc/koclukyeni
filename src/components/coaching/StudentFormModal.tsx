import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, GraduationCap, Target, Calendar, Award } from 'lucide-react';
import { Student, SinifType, AlanType, DurumType } from '../../types';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentData: Omit<Student, 'id'>, existingId?: string) => void;
  editingStudent?: Student | null;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingStudent,
}) => {
  const [adSoyad, setAdSoyad] = useState('');
  const [dogumTarihi, setDogumTarihi] = useState('2008-01-01');
  const [sinif, setSinif] = useState<SinifType>('12. Sınıf');
  const [alan, setAlan] = useState<AlanType>('Sayısal');
  const [yksHedefYili, setYksHedefYili] = useState('2026');
  const [hedefUniversite, setHedefUniversite] = useState('');
  const [hedefBolum, setHedefBolum] = useState('');
  const [hedefPuan, setHedefPuan] = useState('');
  const [hedefSiralama, setHedefSiralama] = useState('');
  const [kayitTarihi, setKayitTarihi] = useState(new Date().toISOString().split('T')[0]);
  const [durum, setDurum] = useState<DurumType>('Aktif');

  useEffect(() => {
    if (editingStudent) {
      setAdSoyad(editingStudent.adSoyad);
      setDogumTarihi(editingStudent.dogumTarihi || '2008-01-01');
      setSinif(editingStudent.sinif);
      setAlan(editingStudent.alan);
      setYksHedefYili(editingStudent.yksHedefYili);
      setHedefUniversite(editingStudent.hedefUniversite);
      setHedefBolum(editingStudent.hedefBolum);
      setHedefPuan(String(editingStudent.hedefPuan || ''));
      setHedefSiralama(String(editingStudent.hedefSiralama || ''));
      setKayitTarihi(editingStudent.kayitTarihi);
      setDurum(editingStudent.durum);
    } else {
      setAdSoyad('');
      setDogumTarihi('2008-01-01');
      setSinif('12. Sınıf');
      setAlan('Sayısal');
      setYksHedefYili('2026');
      setHedefUniversite('');
      setHedefBolum('');
      setHedefPuan('');
      setHedefSiralama('');
      setKayitTarihi(new Date().toISOString().split('T')[0]);
      setDurum('Aktif');
    }
  }, [editingStudent, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adSoyad.trim()) return;

    onSave(
      {
        adSoyad: adSoyad.trim(),
        dogumTarihi,
        sinif,
        alan,
        yksHedefYili,
        hedefUniversite: hedefUniversite.trim(),
        hedefBolum: hedefBolum.trim(),
        hedefPuan: hedefPuan.trim(),
        hedefSiralama: hedefSiralama.trim(),
        kayitTarihi,
        durum,
        kocNotu: editingStudent?.kocNotu || '',
        pinCode: editingStudent?.pinCode || '',
        avatarBg: editingStudent?.avatarBg || 'bg-indigo-600',
      },
      editingStudent ? editingStudent.id : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              {editingStudent ? <GraduationCap className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {editingStudent ? 'Öğrenci Profilini Düzenle' : 'Yeni Öğrenci Kaydı'}
              </h3>
              <p className="text-xs text-slate-500">
                Kapsamlı YKS koçluk profili ve hedef parametreleri
              </p>
            </div>
          </div>
          <button
            id="close-student-modal-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Temel Bilgiler */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              1. Temel Kimlik & Akademik Bilgiler
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ad Soyad *
                </label>
                <input
                  id="student-name-input"
                  type="text"
                  required
                  placeholder="örn: Ahmet Yılmaz"
                  value={adSoyad}
                  onChange={(e) => setAdSoyad(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Doğum Tarihi
                </label>
                <input
                  id="student-birth-date-input"
                  type="date"
                  value={dogumTarihi}
                  onChange={(e) => setDogumTarihi(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Sınıf ComboBox */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sınıf *
                </label>
                <select
                  id="student-class-select"
                  value={sinif}
                  onChange={(e) => setSinif(e.target.value as SinifType)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                >
                  <option value="9. Sınıf">9. Sınıf</option>
                  <option value="10. Sınıf">10. Sınıf</option>
                  <option value="11. Sınıf">11. Sınıf</option>
                  <option value="12. Sınıf">12. Sınıf</option>
                  <option value="Mezun">Mezun</option>
                </select>
              </div>

              {/* Alan ComboBox */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alan *
                </label>
                <select
                  id="student-field-select"
                  value={alan}
                  onChange={(e) => setAlan(e.target.value as AlanType)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                >
                  <option value="Sayısal">Sayısal</option>
                  <option value="Eşit Ağırlık">Eşit Ağırlık</option>
                  <option value="Sözel">Sözel</option>
                  <option value="Dil">Dil</option>
                  <option value="Belirtilmemiş">Belirtilmemiş</option>
                </select>
              </div>

              {/* YKS Hedef Yılı ComboBox */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  YKS Hedef Yılı *
                </label>
                <select
                  id="student-yks-year-select"
                  value={yksHedefYili}
                  onChange={(e) => setYksHedefYili(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                  <option value="2029">2029</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Hedefler (Üniversite & Bölüm Ayrı) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              <span>2. YKS Hedefleri (Üniversite, Bölüm, Puan, Sıralama)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hedef Üniversite
                </label>
                <input
                  id="student-target-uni-input"
                  type="text"
                  placeholder="örn: Hacettepe Üniversitesi"
                  value={hedefUniversite}
                  onChange={(e) => setHedefUniversite(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hedef Bölüm
                </label>
                <input
                  id="student-target-dept-input"
                  type="text"
                  placeholder="örn: Bilgisayar Mühendisliği"
                  value={hedefBolum}
                  onChange={(e) => setHedefBolum(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hedef Puan
                </label>
                <input
                  id="student-target-score-input"
                  type="text"
                  placeholder="örn: 490"
                  value={hedefPuan}
                  onChange={(e) => setHedefPuan(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hedef Sıralama
                </label>
                <input
                  id="student-target-rank-input"
                  type="text"
                  placeholder="örn: 25.000"
                  value={hedefSiralama}
                  onChange={(e) => setHedefSiralama(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Kayıt & Durum */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              3. Kayıt Tarihi ve Koçluk Durumu
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kayıt Tarihi
                </label>
                <input
                  id="student-reg-date-input"
                  type="date"
                  value={kayitTarihi}
                  onChange={(e) => setKayitTarihi(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Durum
                </label>
                <select
                  id="student-status-select"
                  value={durum}
                  onChange={(e) => setDurum(e.target.value as DurumType)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                >
                  <option value="Aktif">Aktif (Koçluk Alıyor)</option>
                  <option value="Pasif">Pasif (Donduruldu / Mezun)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              İptal
            </button>
            <button
              id="save-student-submit-btn"
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{editingStudent ? 'Güncelle' : 'Öğrenciyi Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
