import React from 'react';
import { 
  User, 
  FileText, 
  CalendarCheck, 
  HelpCircle, 
  Award, 
  BookOpen, 
  BarChart2, 
  Camera, 
  Archive,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  KeyRound,
  Copy
} from 'lucide-react';
import { Student, StudentProfileTab } from '../../types';
import { formatDate } from '../../utils/dateUtils';

interface StudentProfileViewProps {
  student: Student;
  activeTab: StudentProfileTab;
  onTabChange: (tab: StudentProfileTab) => void;
  onBackToList: () => void;
  newUploadsCount?: number;
  children: React.ReactNode;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  student,
  activeTab,
  onTabChange,
  onBackToList,
  newUploadsCount = 0,
  children,
}) => {
  const tabs: {
    key: StudentProfileTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
  }[] = [
    { key: 'genel', label: '1. Genel Bilgiler', icon: User },
    { key: 'koc-notlari', label: '2. Koç Notları', icon: FileText },
    { key: 'soru-takibi', label: '3. Soru Takibi', icon: HelpCircle },
    { key: 'haftalik-program', label: '📅 4. Haftalık Program', icon: CalendarCheck },
    { key: 'denemeler', label: '5. Denemeler (TYT/AYT)', icon: Award },
    { key: 'raporlar', label: '6. Raporlar & AI Koçluk', icon: BarChart2 },
    { 
      key: 'sinav-gecmisi', 
      label: '📑 7. Sınav Geçmişi & Arşiv', 
      icon: Archive,
      badge: newUploadsCount > 0 ? `${newUploadsCount} YENİ TEST` : undefined,
      badgeColor: newUploadsCount > 0 ? 'bg-amber-400 text-slate-950 font-black animate-pulse' : undefined
    },
    { key: 'atanan-kaynaklar', label: '📚 8. Atanan Kaynaklar', icon: BookOpen },
  ];
  const [isMoreMenuOpen, setIsMoreMenuOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      {/* Student Profile Quick Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToList}
            className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
            title="Tüm Öğrencilere Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div
            className={`w-14 h-14 rounded-2xl ${
              student.avatarBg || 'bg-indigo-600'
            } text-white flex items-center justify-center font-black text-xl shadow-md shrink-0`}
          >
            {student.adSoyad.charAt(0)}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">{student.adSoyad}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                {student.sinif}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                {student.alan}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>🎯 {student.hedefUniversite} - <strong className="text-indigo-700">{student.hedefBolum}</strong></span>
              <span className="text-slate-300">•</span>
              <span>Hedef: <strong>{student.hedefSiralama}</strong></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
          {/* Öğrenci PIN Kodu Rozeti */}
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 font-semibold shadow-2xs">
            <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
            <span>Öğrenci PIN: <strong className="font-mono text-indigo-700 font-bold">{student.pinCode}</strong></span>
            <button
              onClick={() => navigator.clipboard?.writeText(student.pinCode)}
              className="p-0.5 text-indigo-400 hover:text-indigo-700 transition-colors ml-0.5"
              title="PIN Kodunu Kopyala"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            Kayıt: <strong className="text-slate-900">{formatDate(student.kayitTarihi)}</strong>
          </div>
        </div>
      </div>

      {/* 8 Tabs Navigation (Organized in 2 ergonomic rows: 4 columns x 2 rows on md/lg, 2 columns on sm) */}
      <div className="hidden md:block bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`w-full inline-flex items-center justify-between sm:justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all truncate ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 bg-slate-50/70 border border-slate-200/80'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </div>
                {tab.badge && (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.2 rounded shrink-0 ${
                      tab.badgeColor || (isActive ? 'bg-indigo-400 text-slate-900' : 'bg-indigo-50 text-indigo-700')
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (md:hidden) */}
      <div className="md:hidden">
        {/* Safe padding spacer at the bottom of page to prevent overlaying content */}
        <div className="h-10" />
        
        {/* Diğer Menu Popover */}
        {isMoreMenuOpen && (
          <div className="fixed bottom-20 left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-3 shadow-2xl z-40 animate-in slide-in-from-bottom-5 duration-200 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 px-3 pb-2 border-b border-slate-100 uppercase tracking-wider">Diğer İşlemler</div>
            {[
              { key: 'denemeler', label: '5. Denemeler (TYT/AYT)', icon: Award },
              { key: 'raporlar', label: '6. Raporlar & AI Koçluk', icon: BarChart2 },
              { key: 'sinav-gecmisi', label: '📑 7. Sınav Geçmişi & Arşiv', icon: Archive, badge: newUploadsCount > 0 ? `${newUploadsCount} YENİ` : undefined },
              { key: 'atanan-kaynaklar', label: '📚 8. Atanan Kaynaklar', icon: BookOpen },
            ].map((mTab) => {
              const MIcon = mTab.icon;
              const isActive = activeTab === mTab.key;
              return (
                <button
                  key={mTab.key}
                  onClick={() => {
                    onTabChange(mTab.key as StudentProfileTab);
                    setIsMoreMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MIcon className="w-4 h-4 text-slate-500" />
                    <span>{mTab.label}</span>
                  </div>
                  {mTab.badge && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                      {mTab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom Bar */}
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg z-45 py-2 px-3 pb-safe-bottom flex items-center justify-around">
          {[
            { key: 'genel', label: 'Genel', icon: User },
            { key: 'koc-notlari', label: 'Koç Notu', icon: FileText },
            { key: 'soru-takibi', label: 'Soru Takip', icon: HelpCircle },
            { key: 'haftalik-program', label: 'Program', icon: CalendarCheck },
          ].map((item) => {
            const ItemIcon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onTabChange(item.key as StudentProfileTab);
                  setIsMoreMenuOpen(false);
                }}
                className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all ${
                  isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ItemIcon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px] text-indigo-600' : 'stroke-[2px]'}`} />
                <span className="text-[9px] font-bold tracking-tight">{item.label}</span>
              </button>
            );
          })}

          {/* Diğer Button */}
          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all ${
              ['denemeler', 'raporlar', 'sinav-gecmisi', 'atanan-kaynaklar'].includes(activeTab) || isMoreMenuOpen
                ? 'text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="relative">
              <Archive className={`w-5 h-5 ${isMoreMenuOpen ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
              {newUploadsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white animate-pulse" />
              )}
            </div>
            <span className="text-[9px] font-bold tracking-tight">Diğer</span>
          </button>
        </div>
      </div>

      {/* Render Active Tab Content */}
      <div className="transition-all animate-in fade-in duration-150 pb-20 md:pb-0">
        {children}
      </div>
    </div>
  );
};
