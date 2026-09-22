import React, { useState } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Eye, 
  EyeOff,
  UserX,
  Sparkles
} from 'lucide-react';
import { Student } from '../../types';
import { updateCoachPin } from '../../lib/apiService';

interface CoachPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPin: string;
  students: Student[];
  onPinUpdated: (newPin: string) => void;
}

export const CoachPinModal: React.FC<CoachPinModalProps> = ({
  isOpen,
  onClose,
  currentPin,
  students,
  onPinUpdated,
}) => {
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Conflict detection: check if newPin matches any student PIN
  const conflictedStudent = newPin.trim().length >= 4 
    ? students.find((s) => s.pinCode === newPin.trim()) 
    : null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanNewPin = newPin.trim();
    const cleanConfirmPin = confirmPin.trim();

    if (!cleanNewPin || !/^\d{4,8}$/.test(cleanNewPin)) {
      setErrorMsg('Koç PIN kodu 4 ila 8 haneli sadece rakamlardan oluşmalıdır.');
      return;
    }

    if (cleanNewPin !== cleanConfirmPin) {
      setErrorMsg('Yeni PIN kodları birbiriyle eşleşmiyor. Lütfen kontrol ediniz.');
      return;
    }

    if (conflictedStudent) {
      setErrorMsg(`Bu PIN kodu "${conflictedStudent.adSoyad}" (${conflictedStudent.sinif || 'Öğrenci'}) isimli öğrencide kayıtlıdır. Çakışma olmaması için farklı bir PIN belirleyiniz.`);
      return;
    }

    if (cleanNewPin === currentPin) {
      setErrorMsg('Yeni PIN kodu mevcut PIN kodu ile aynı olamaz.');
      return;
    }

    setLoading(true);
    try {
      const res = await updateCoachPin(cleanNewPin);
      if (res.success && res.coachPin) {
        setSuccessMsg('Koç PIN kodunuz başarıyla güncellendi!');
        onPinUpdated(res.coachPin);
        setTimeout(() => {
          onClose();
          setNewPin('');
          setConfirmPin('');
          setSuccessMsg(null);
        }, 1200);
      } else {
        setErrorMsg(res.error || 'PIN kodu güncellenirken bir hata oluştu.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Sunucu bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Koç PIN Kodunu Değiştir
            </h3>
            <p className="text-xs text-slate-500">
              Mevcut Koç PIN: <strong className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">{currentPin}</strong>
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          {/* Conflict Warning Alert */}
          {conflictedStudent && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <UserX className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Öğrenci PIN Çakışması Algılandı:</strong>
                <p className="mt-0.5 text-amber-800">
                  Girdiğiniz PIN kodu <strong>{conflictedStudent.adSoyad}</strong> isimli öğrencide kayıtlıdır. Giriş ekranında çakışma yaşanmaması için lütfen başka bir PIN belirleyin.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          {/* New PIN Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Yeni Koç PIN Kodu (4-8 Rakam)
            </label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                maxLength={8}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Örn: 998877"
                value={newPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setNewPin(val);
                  setErrorMsg(null);
                }}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-2xl font-mono text-sm tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  conflictedStudent ? 'border-amber-400 bg-amber-50/30' : 'border-slate-200'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Koç girişinde kullanacağınız yeni gizli kodunuzu belirleyin.
            </p>
          </div>

          {/* Confirm PIN Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Yeni PIN Kodu (Tekrar)
            </label>
            <input
              type={showPin ? "text" : "password"}
              maxLength={8}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Yeni PIN kodunu tekrar girin"
              value={confirmPin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setConfirmPin(val);
                setErrorMsg(null);
              }}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-sm tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading || !!conflictedStudent || newPin.length < 4 || newPin !== confirmPin}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-95 ${
                loading || !!conflictedStudent || newPin.length < 4 || newPin !== confirmPin
                  ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>PIN Kodunu Güncelle</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
