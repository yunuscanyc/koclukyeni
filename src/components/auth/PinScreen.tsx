import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  Delete, 
  GraduationCap, 
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { Student } from '../../types';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

interface PinScreenProps {
  coachPin: string;
  students: Student[];
  onLoginCoach: () => void;
  onLoginStudent: (student: Student) => void;
}

export const PinScreen: React.FC<PinScreenProps> = ({
  coachPin,
  students,
  onLoginCoach,
  onLoginStudent,
}) => {
  const safeCoachPin = typeof coachPin === 'string' && coachPin.length >= 4 ? coachPin : '998877';
  const safeStudents = Array.isArray(students) ? students : [];

  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [showDigits, setShowDigits] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle PIN verification
  const verifyPin = (codeToTest: string) => {
    if (codeToTest.length < 4) return;

    // Check if Coach PIN
    if (codeToTest === safeCoachPin) {
      setErrorMsg(null);
      onLoginCoach();
      return;
    }

    // Check if any Student PIN
    const matchedStudent = safeStudents.find((s) => s.pinCode === codeToTest);
    if (matchedStudent) {
      setErrorMsg(null);
      onLoginStudent(matchedStudent);
      return;
    }

    // If code length is equal to coachPin length or max length (8) and no match, show error
    if (codeToTest.length >= Math.max(6, safeCoachPin.length)) {
      setIsShaking(true);
      setErrorMsg('Geçersiz PIN kodu! Lütfen koç PIN kodunuzu veya size verilen öğrenci kodunu giriniz.');
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
        inputRef.current?.focus();
      }, 600);
    }
  };

  const handleKeyPress = (digit: string) => {
    if (pin.length >= 8) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setErrorMsg(null);
    // Instant check if matched
    if (nextPin === safeCoachPin) {
      onLoginCoach();
      return;
    }
    const matchedStudent = safeStudents.find((s) => s.pinCode === nextPin);
    if (matchedStudent) {
      onLoginStudent(matchedStudent);
      return;
    }
    if (nextPin.length >= Math.max(6, safeCoachPin.length)) {
      verifyPin(nextPin);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg(null);
  };

  const handleSubmit = () => {
    if (pin.length < 4) {
      setErrorMsg('Lütfen en az 4 haneli PIN kodunuzu giriniz.');
      return;
    }
    if (pin === safeCoachPin) {
      onLoginCoach();
      return;
    }
    const matchedStudent = safeStudents.find((s) => s.pinCode === pin);
    if (matchedStudent) {
      onLoginStudent(matchedStudent);
      return;
    }
    setIsShaking(true);
    setErrorMsg('Geçersiz PIN kodu! Lütfen koç veya öğrenci PIN kodunu kontrol ediniz.');
    setTimeout(() => {
      setIsShaking(false);
      setPin('');
      inputRef.current?.focus();
    }, 600);
  };

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, safeCoachPin, safeStudents]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between items-center p-4 sm:p-6 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Decorative Lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="w-full max-w-md pt-4 sm:pt-8 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-900/50">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
              <span>EĞİTİM KOÇLUĞU</span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">YKS Takip & Analiz Portalı</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallButton variant="header" />
          <button
            type="button"
            onClick={() => setShowDigits(!showDigits)}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title={showDigits ? "PIN'i Gizle" : "PIN'i Göster"}
          >
            {showDigits ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-[11px] hidden sm:inline">{showDigits ? 'Gizle' : 'Göster'}</span>
          </button>
        </div>
      </div>

      {/* Main PIN Entry Box */}
      <div className="w-full max-w-md my-auto py-6 flex flex-col items-center z-10">
        <div className="w-16 h-16 rounded-3xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-indigo-400 mb-5 shadow-xl shadow-slate-950/40">
          <KeyRound className="w-8 h-8" />
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight text-center">
          Giriş İçin PIN Kodunu Girin
        </h1>
        <p className="text-xs text-slate-400 text-center mt-1.5 max-w-xs">
          Koç veya öğrenci 6 haneli güvenlik PIN kodunuzu girerek sisteme erişebilirsiniz.
        </p>

        {/* Hidden native input for mobile focus & auto keyboard */}
        <input
          ref={inputRef}
          type="tel"
          pattern="[0-9]*"
          maxLength={8}
          value={pin}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 8);
            setPin(val);
            if (val === safeCoachPin) {
              onLoginCoach();
              return;
            }
            const match = safeStudents.find((s) => s.pinCode === val);
            if (match) {
              onLoginStudent(match);
              return;
            }
            if (val.length >= Math.max(6, safeCoachPin.length)) verifyPin(val);
          }}
          className="opacity-0 absolute -z-10 pointer-events-none"
          autoFocus
        />

        {/* Digit Display Blocks */}
        <div 
          onClick={() => inputRef.current?.focus()}
          className={`flex items-center justify-center gap-2.5 sm:gap-3.5 my-7 cursor-pointer ${
            isShaking ? 'animate-bounce text-rose-500' : ''
          }`}
        >
          {Array.from({ length: Math.max(6, safeCoachPin.length, pin.length) }).map((_, index) => {
            const hasValue = index < pin.length;
            const isCurrent = index === pin.length;
            const digitChar = pin[index];

            return (
              <div
                key={index}
                className={`w-11 h-13 sm:w-13 sm:h-16 rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl transition-all duration-150 ${
                  hasValue
                    ? 'bg-indigo-600/20 border-2 border-indigo-500 text-white shadow-md shadow-indigo-900/30 scale-105'
                    : isCurrent
                    ? 'bg-slate-800 border-2 border-indigo-400 text-slate-400 ring-2 ring-indigo-500/20'
                    : 'bg-slate-800/80 border border-slate-700/80 text-slate-600'
                }`}
              >
                {hasValue ? (
                  showDigits ? (
                    digitChar
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full bg-indigo-400 inline-block" />
                  )
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-indigo-400/60 animate-ping inline-block" />
                ) : (
                  <span className="text-slate-700 text-sm">•</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="w-full mb-4 px-3.5 py-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Virtual Numeric Keypad */}
        <div className="w-full max-w-xs grid grid-cols-3 gap-2.5 sm:gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-13 sm:h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-750 active:bg-indigo-600 active:text-white border border-slate-700/60 text-white text-lg font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center"
            >
              {digit}
            </button>
          ))}

          {/* Clear Key */}
          <button
            type="button"
            onClick={handleClear}
            className="h-13 sm:h-14 rounded-2xl bg-slate-800/50 hover:bg-slate-800 active:bg-slate-700 border border-slate-700/50 text-slate-400 text-xs font-bold transition-all active:scale-95 flex items-center justify-center"
            title="Temizle"
          >
            Temizle
          </button>

          {/* 0 Key */}
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-13 sm:h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-750 active:bg-indigo-600 active:text-white border border-slate-700/60 text-white text-lg font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center"
          >
            0
          </button>

          {/* Backspace Key */}
          <button
            type="button"
            onClick={handleDelete}
            className="h-13 sm:h-14 rounded-2xl bg-slate-800/50 hover:bg-slate-800 active:bg-slate-700 border border-slate-700/50 text-slate-300 transition-all active:scale-95 flex items-center justify-center"
            title="Geri Sil"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Discreet Security Footer */}
      <div className="w-full max-w-md pb-4 pt-3 z-10 border-t border-slate-800/80 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Güvenli Giriş Paneli • Size özel PIN kodunuz ile giriş yapınız</span>
        </div>
      </div>
    </div>
  );
};
