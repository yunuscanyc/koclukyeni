import React from 'react';
import { 
  GraduationCap, 
  Sparkles, 
  UserPlus, 
  Users, 
  BarChart3, 
  Menu,
  ChevronDown,
  BookOpen,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { Student, MainViewMode } from '../../types';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

interface CoachingHeaderProps {
  students: Student[];
  selectedStudent: Student | null;
  onSelectStudent: (id: string) => void;
  viewMode: MainViewMode;
  onChangeViewMode: (mode: MainViewMode) => void;
  onOpenAddStudent: () => void;
  onOpenAiAsk: () => void;
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  coachPin?: string;
  newExamCount?: number;
  onLogout: () => void;
  onMarkAllAsRead?: () => void;
  onOpenCoachPinModal?: () => void;
}

export const CoachingHeader: React.FC<CoachingHeaderProps> = ({
  students,
  selectedStudent,
  onSelectStudent,
  viewMode,
  onChangeViewMode,
  onOpenAddStudent,
  onOpenAiAsk,
  isMobileMenuOpen,
  onToggleMobileMenu,
  coachPin,
  newExamCount = 0,
  onLogout,
  onMarkAllAsRead,
  onOpenCoachPinModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onChangeViewMode('students')}
              className="flex items-center gap-3 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span>Eğitim Koçluğu</span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    YKS PRO
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Öğrenci & Sınav Takip Portalı
                </div>
              </div>
            </button>
          </div>

          {/* Student Selector Quick Dropdown & Main Navigation */}
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-lg">
            {/* Nav Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                onClick={() => onChangeViewMode('students')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'students' || viewMode === 'student-detail'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Öğrencilerim</span>
              </button>

              <button
                onClick={() => onChangeViewMode('curriculum')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'curriculum'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                <span>Müfredat & Konular</span>
              </button>

              <button
                onClick={() => onChangeViewMode('resources')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'resources'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Kaynak Kitaplar</span>
              </button>
            </div>

            <div className="relative flex-1">
              <select
                value={selectedStudent?.id || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    onSelectStudent(e.target.value);
                  }
                }}
                className="w-full appearance-none pl-3.5 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    👤 {s.adSoyad} ({s.sinif} - {s.alan})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* PWA Install Button */}
            <PWAInstallButton variant="header" />

            {/* New Student Test Upload Alert Notification */}
            {newExamCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 hover:text-white active:scale-95 text-slate-950 text-xs font-black shadow-md shadow-amber-200/50 animate-bounce cursor-pointer transition-all"
                title={`${newExamCount} adet yeni test var. Hepsini okundu olarak işaretlemek için tıklayın.`}
              >
                <span>🔔</span>
                <span>{newExamCount} Yeni Test</span>
              </button>
            )}

            {/* Coach PIN Info Badge & Change Button */}
            <button
              type="button"
              onClick={onOpenCoachPinModal}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold text-indigo-900 shadow-2xs transition-all cursor-pointer group"
              title="Koç PIN kodunu değiştirmek için tıklayın"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span>Koç PIN: <strong className="font-mono text-indigo-700">{coachPin || '998877'}</strong></span>
              <span className="text-[10px] font-bold text-indigo-600 bg-white/80 px-1.5 py-0.5 rounded border border-indigo-200/80 ml-1">Değiştir</span>
            </button>

            {/* AI Coach Assistant Button */}
            <button
              onClick={onOpenAiAsk}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-sm shadow-indigo-200 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Koç Asistanı</span>
              <span className="sm:hidden">AI Koç</span>
            </button>

            {/* New Student */}
            <button
              onClick={onOpenAddStudent}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-all active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Yeni Öğrenci</span>
            </button>

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 border border-slate-200 text-xs font-bold transition-all active:scale-95"
              title="Koç Oturumunu Kapat ve PIN Ekranına Dön"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Çıkış Yap</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-50 border-t border-slate-200 px-4 py-3 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                onChangeViewMode('students');
                onToggleMobileMenu();
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border ${
                viewMode === 'students' || viewMode === 'student-detail'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Öğrenciler</span>
            </button>

            <button
              onClick={() => {
                onChangeViewMode('curriculum');
                onToggleMobileMenu();
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border ${
                viewMode === 'curriculum'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Müfredat</span>
            </button>

            <button
              onClick={() => {
                onChangeViewMode('resources');
                onToggleMobileMenu();
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border ${
                viewMode === 'resources'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Kaynaklar</span>
            </button>
          </div>

          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider pt-2 border-t border-slate-200">
            Aktif Öğrenciyi Seç
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {students.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  onSelectStudent(s.id);
                  onToggleMobileMenu();
                }}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-bold flex items-center justify-between border ${
                  selectedStudent?.id === s.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{s.adSoyad}</span>
                <span className="text-[11px] opacity-80">{s.sinif} • {s.alan}</span>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onToggleMobileMenu();
                onOpenCoachPinModal?.();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-900"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Koç PIN: <strong className="font-mono text-indigo-700">{coachPin || '998877'}</strong> (Değiştir)</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
