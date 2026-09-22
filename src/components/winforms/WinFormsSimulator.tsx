import React, { useState } from 'react';
import { 
  Monitor, 
  Code2, 
  Copy, 
  Check, 
  Download, 
  FolderGit2, 
  FileCode2, 
  Database, 
  Layers, 
  Play, 
  Minimize2, 
  Maximize2, 
  X, 
  Save, 
  Plus, 
  RefreshCw, 
  Printer, 
  FileSpreadsheet,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { WINFORMS_PROJECT_FILES, WinFormsFile } from './winformsCodeData';
import { Student, ExamRecord, CoachNote, QuestionEntry, OutcomeItem } from '../../types';
import { formatDate } from '../../utils/dateUtils';

interface WinFormsSimulatorProps {
  students: Student[];
  exams: ExamRecord[];
  notes: CoachNote[];
  questions: QuestionEntry[];
  outcomes: OutcomeItem[];
  onSelectStudent: (student: Student) => void;
  activeStudent: Student;
}

export const WinFormsSimulator: React.FC<WinFormsSimulatorProps> = ({
  students,
  exams,
  notes,
  questions,
  outcomes,
  onSelectStudent,
  activeStudent,
}) => {
  const [activeViewMode, setActiveViewMode] = useState<'form-preview' | 'csharp-code'>('form-preview');
  const [activeTabPageIndex, setActiveTabPageIndex] = useState<number>(0);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  // Form local values for active student
  const [tempStudent, setTempStudent] = useState<Student>(activeStudent);
  const [statusMessage, setStatusMessage] = useState('Hazır');

  // Koç Notları state
  const [localNotes, setLocalNotes] = useState<CoachNote[]>(notes);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteKategori, setNoteKategori] = useState('Haftalık Değerlendirme');
  const [noteOncelik, setNoteOncelik] = useState('Önemli');
  const [noteTarih, setNoteTarih] = useState(new Date().toISOString().split('T')[0]);
  const [noteBaslik, setNoteBaslik] = useState('');
  const [noteIcerik, setNoteIcerik] = useState('');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeDetailNote, setActiveDetailNote] = useState<CoachNote | null>(null);

  React.useEffect(() => {
    setTempStudent(activeStudent);
    // Select first note of student if exists
    const firstNote = localNotes.find(n => n.studentId === activeStudent.id);
    if (firstNote) {
      setSelectedNoteId(firstNote.id);
    } else {
      setSelectedNoteId(null);
    }
  }, [activeStudent]);

  const handleSaveNote = () => {
    if (!noteBaslik.trim()) {
      setStatusMessage('Uyarı: Not başlığı boş bırakılamaz.');
      return;
    }

    if (editingNoteId) {
      setLocalNotes((prev) =>
        prev.map((n) =>
          n.id === editingNoteId
            ? {
                ...n,
                kategori: noteKategori as any,
                oncelik: noteOncelik as any,
                tarih: noteTarih,
                baslik: noteBaslik.trim(),
                icerik: noteIcerik.trim(),
              }
            : n
        )
      );
      setStatusMessage(`Not güncellendi: "${noteBaslik}"`);
      setEditingNoteId(null);
    } else {
      const newNote: CoachNote = {
        id: `note-${Date.now()}`,
        studentId: tempStudent.id,
        tarih: noteTarih,
        kategori: noteKategori as any,
        oncelik: noteOncelik as any,
        baslik: noteBaslik.trim(),
        icerik: noteIcerik.trim() || 'Açıklama girilmedi.',
      };
      setLocalNotes((prev) => [newNote, ...prev]);
      setSelectedNoteId(newNote.id);
      setStatusMessage(`Yeni not kaydedildi: "${noteBaslik}"`);
    }

    // Reset inputs
    setNoteBaslik('');
    setNoteIcerik('');
  };

  const handleStartEditNote = (note: CoachNote) => {
    setEditingNoteId(note.id);
    setNoteKategori(note.kategori);
    setNoteOncelik(note.oncelik);
    setNoteTarih(note.tarih);
    setNoteBaslik(note.baslik);
    setNoteIcerik(note.icerik);
    setStatusMessage(`Düzenleniyor: "${note.baslik}"`);
  };

  const handleDeleteNote = (noteId: string) => {
    const target = localNotes.find((n) => n.id === noteId);
    if (!target) return;
    setLocalNotes((prev) => prev.filter((n) => n.id !== noteId));
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
    }
    if (editingNoteId === noteId) {
      setEditingNoteId(null);
      setNoteBaslik('');
      setNoteIcerik('');
    }
    setStatusMessage(`Not silindi: "${target.baslik}"`);
  };

  const handleOpenDetailModal = (note: CoachNote) => {
    setActiveDetailNote(note);
    setIsDetailModalOpen(true);
    setStatusMessage(`Detay formu açıldı: "${note.baslik}"`);
  };

  const currentFile = WINFORMS_PROJECT_FILES[selectedFileIndex];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = (file: WinFormsFile) => {
    const element = document.createElement('a');
    const blob = new Blob([file.code], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(blob);
    element.download = file.name;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const studentNotes = notes.filter((n) => n.studentId === tempStudent.id);
  const studentStudies: any[] = [];
  const studentQuestions = questions.filter((q) => q.studentId === tempStudent.id);
  const studentExams = exams.filter((e) => e.studentId === tempStudent.id);
  const studentOutcomes = outcomes;

  const tabTitles = [
    'tabPageGenel (Genel Bilgiler)',
    'tabPageNotlar (Koç Notları)',
    'tabPageCalismalar (Günlük Çalışmalar)',
    'tabPageSorular (Soru Takibi)',
    'tabPageDenemeler (Denemeler)',
    'tabPageKazanimlar (Kazanımlar)',
    'tabPageRaporlar (Raporlar & Analiz)',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner explaining WinForms Mode */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold">
            <Monitor className="w-3.5 h-3.5" />
            <span>C# .NET Windows Forms (WinForms) Modu</span>
          </div>
          <h2 className="text-xl font-bold">
            Windows Forms Masaüstü Mimarisi ve C# Kodları
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Projenizi Visual Studio (.NET 8 / .NET Framework) üzerinde Windows Form olarak geliştirebilmeniz için birebir C# form tasarımını, modellerini, ComboBox bağlamalarını ve SQLite veritabanı sınıflarını hazırladık.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveViewMode('form-preview')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeViewMode === 'form-preview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>WinForms Ekranı (Canlı Önizleme)</span>
          </button>
          <button
            onClick={() => setActiveViewMode('csharp-code')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeViewMode === 'csharp-code'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>C# Proje Dosyaları (.cs)</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: WINFORMS VISUAL SIMULATOR */}
      {activeViewMode === 'form-preview' && (
        <div className="border border-slate-400 rounded-lg shadow-2xl bg-[#F0F0F0] overflow-hidden font-sans select-none text-[12px] text-slate-900">
          {/* Windows Titlebar */}
          <div className="bg-[#0078D7] text-white px-3 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white/20 rounded flex items-center justify-center text-[10px] font-bold">
                E
              </div>
              <span className="font-semibold text-xs tracking-wide">
                Eğitim Koçluğu - Öğrenci Profil Dosyası [FormOgrenciProfil.cs]
              </span>
            </div>

            {/* Window control buttons */}
            <div className="flex items-center">
              <button className="px-3 py-1 hover:bg-white/10 text-xs">
                <Minimize2 className="w-3 h-3" />
              </button>
              <button className="px-3 py-1 hover:bg-white/10 text-xs">
                <Maximize2 className="w-3 h-3" />
              </button>
              <button className="px-3 py-1 hover:bg-red-600 text-xs">
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* MenuStrip */}
          <div className="bg-[#F0F0F0] border-b border-[#D4D4D4] px-2 py-0.5 flex items-center gap-3 text-xs text-slate-800">
            <span className="hover:bg-[#E5E5E5] px-2 py-0.5 cursor-pointer rounded"><u>D</u>osya</span>
            <span className="hover:bg-[#E5E5E5] px-2 py-0.5 cursor-pointer rounded"><u>Ö</u>ğrenci</span>
            <span className="hover:bg-[#E5E5E5] px-2 py-0.5 cursor-pointer rounded"><u>D</u>eneme Girişi</span>
            <span className="hover:bg-[#E5E5E5] px-2 py-0.5 cursor-pointer rounded"><u>R</u>aporlar</span>
            <span className="hover:bg-[#E5E5E5] px-2 py-0.5 cursor-pointer rounded"><u>A</u>raçlar</span>
            <span className="hover:bg-[#E5E5E5] px-2 py-0.5 cursor-pointer rounded"><u>Y</u>ardım</span>
          </div>

          {/* ToolStrip */}
          <div className="bg-[#F8F9FA] border-b border-[#D4D4D4] px-3 py-1 flex items-center gap-2 text-xs">
            <button 
              onClick={() => setStatusMessage('Öğrenci bilgileri veritabanına kaydedildi.')}
              className="flex items-center gap-1 px-2 py-1 bg-white border border-[#CCCCCC] hover:bg-[#EAEAEA] rounded shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-blue-600" />
              <span>Kaydet</span>
            </button>
            <button 
              onClick={() => setStatusMessage('Yeni öğrenci ekleme formu açılıyor...')}
              className="flex items-center gap-1 px-2 py-1 bg-white border border-[#CCCCCC] hover:bg-[#EAEAEA] rounded shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Yeni Öğrenci (Ctrl+N)</span>
            </button>
            <div className="w-px h-4 bg-[#D4D4D4] mx-1" />
            <button 
              onClick={() => setStatusMessage('Veriler SQLite tablosundan yenilendi.')}
              className="flex items-center gap-1 px-2 py-1 bg-white border border-[#CCCCCC] hover:bg-[#EAEAEA] rounded shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span>Yenile</span>
            </button>
            <button 
              onClick={() => setStatusMessage('Öğrenci karnesi yazıcıya gönderiliyor...')}
              className="flex items-center gap-1 px-2 py-1 bg-white border border-[#CCCCCC] hover:bg-[#EAEAEA] rounded shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Yazdır</span>
            </button>
            <button 
              onClick={() => setStatusMessage('Öğrenci net raporu Excel (.xlsx) formatında dışa aktarıldı.')}
              className="flex items-center gap-1 px-2 py-1 bg-white border border-[#CCCCCC] hover:bg-[#EAEAEA] rounded shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Excel'e Aktar</span>
            </button>
          </div>

          {/* Form Body: SplitContainer */}
          <div className="p-3 grid grid-cols-1 md:grid-cols-4 gap-3 min-h-[560px]">
            {/* Left Panel: ListBox (Öğrenci Listesi) */}
            <div className="md:col-span-1 bg-white border border-[#A0A0A0] p-2 flex flex-col justify-between">
              <div>
                <div className="font-bold text-xs text-slate-800 pb-1 mb-2 border-b border-[#E0E0E0]">
                  Kayıtlı Öğrenciler (ListBox)
                </div>
                <div className="space-y-1">
                  {students.map((s) => {
                    const isSelected = s.id === tempStudent.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          onSelectStudent(s);
                          setTempStudent(s);
                          setStatusMessage(`${s.adSoyad} profili yüklendi.`);
                        }}
                        className={`px-2.5 py-1.5 cursor-pointer text-xs flex items-center justify-between border ${
                          isSelected
                            ? 'bg-[#0078D7] text-white border-[#005A9E]'
                            : 'hover:bg-[#E5F3FF] border-transparent text-slate-800'
                        }`}
                      >
                        <div className="truncate">
                          <span className="font-bold">{s.adSoyad}</span>
                          <span className={`block text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                            {s.sinif} • {s.alan}
                          </span>
                        </div>
                        <span className={`text-[10px] px-1 rounded ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {s.durum}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* GroupBox at bottom of listbox */}
              <div className="border border-[#D0D0D0] p-2 mt-3 bg-[#F9F9F9] rounded">
                <div className="text-[11px] font-bold text-slate-700">İstatistik:</div>
                <div className="text-[11px] text-slate-600">Toplam: {students.length} Öğrenci</div>
                <div className="text-[11px] text-slate-600">Aktif: {students.filter(s => s.durum === 'Aktif').length}</div>
              </div>
            </div>

            {/* Right Panel: TabControl & 7 TabPage */}
            <div className="md:col-span-3 flex flex-col bg-white border border-[#A0A0A0]">
              {/* TabControl Headers */}
              <div className="flex border-b border-[#A0A0A0] bg-[#ECECEC] px-1 pt-1 overflow-x-auto">
                {tabTitles.map((title, idx) => {
                  const isActive = activeTabPageIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveTabPageIndex(idx)}
                      className={`px-3 py-1.5 text-xs whitespace-nowrap border-t border-l border-r ${
                        isActive
                          ? 'bg-white font-bold text-slate-900 border-[#A0A0A0] -mb-px'
                          : 'bg-[#E1E1E1] text-slate-600 border-transparent hover:bg-[#F4F4F4]'
                      }`}
                    >
                      {title.split(' ')[1] || title}
                    </button>
                  );
                })}
              </div>

              {/* TabPage 0: Genel Bilgiler */}
              {activeTabPageIndex === 0 && (
                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                  {/* GroupBox: Öğrenci Kimlik Bilgileri */}
                  <fieldset className="border border-[#B0B0B0] p-3 rounded">
                    <legend className="px-1 text-xs font-bold text-slate-800">
                      Öğrenci Temel Bilgileri
                    </legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Adı Soyadı:
                        </label>
                        <input
                          type="text"
                          value={tempStudent.adSoyad}
                          onChange={(e) => setTempStudent({ ...tempStudent, adSoyad: e.target.value })}
                          className="w-full px-2 py-1 border border-[#7A7A7A] bg-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Doğum Tarihi (DateTimePicker):
                        </label>
                        <input
                          type="date"
                          value={tempStudent.dogumTarihi}
                          onChange={(e) => setTempStudent({ ...tempStudent, dogumTarihi: e.target.value })}
                          className="w-full px-2 py-1 border border-[#7A7A7A] bg-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Sınıf (ComboBox):
                        </label>
                        <select
                          value={tempStudent.sinif}
                          onChange={(e) => setTempStudent({ ...tempStudent, sinif: e.target.value as any })}
                          className="w-full px-2 py-1 border border-[#7A7A7A] bg-white text-xs"
                        >
                          <option value="9. Sınıf">9. Sınıf</option>
                          <option value="10. Sınıf">10. Sınıf</option>
                          <option value="11. Sınıf">11. Sınıf</option>
                          <option value="12. Sınıf">12. Sınıf</option>
                          <option value="Mezun">Mezun</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Alan (ComboBox):
                        </label>
                        <select
                          value={tempStudent.alan}
                          onChange={(e) => setTempStudent({ ...tempStudent, alan: e.target.value as any })}
                          className="w-full px-2 py-1 border border-[#7A7A7A] bg-white text-xs"
                        >
                          <option value="Sayısal">Sayısal</option>
                          <option value="Eşit Ağırlık">Eşit Ağırlık</option>
                          <option value="Sözel">Sözel</option>
                          <option value="Dil">Dil</option>
                        </select>
                      </div>
                    </div>
                  </fieldset>

                  {/* GroupBox: YKS Hedefleri */}
                  <fieldset className="border border-[#B0B0B0] p-3 rounded">
                    <legend className="px-1 text-xs font-bold text-slate-800">
                      YKS Hedefleri ve Sıralama
                    </legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          YKS Hedef Yılı (ComboBox):
                        </label>
                        <select
                          value={tempStudent.yksHedefYili}
                          onChange={(e) => setTempStudent({ ...tempStudent, yksHedefYili: e.target.value })}
                          className="w-full px-2 py-1 border border-[#7A7A7A] bg-white text-xs"
                        >
                          <option value="2026">2026</option>
                          <option value="2027">2027</option>
                          <option value="2028">2028</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Durum (ComboBox):
                        </label>
                        <select
                          value={tempStudent.durum}
                          onChange={(e) => setTempStudent({ ...tempStudent, durum: e.target.value as any })}
                          className="w-full px-2 py-1 border border-[#7A7A7A] bg-white text-xs"
                        >
                          <option value="Aktif">Aktif</option>
                          <option value="Pasif">Pasif</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Hedef Üniversite:
                        </label>
                        <input
                          type="text"
                          value={tempStudent.hedefUniversite}
                          onChange={(e) => setTempStudent({ ...tempStudent, hedefUniversite: e.target.value })}
                          className="w-full px-2 py-1 border border-[#7A7A7A] bg-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Hedef Bölüm:
                        </label>
                        <input
                          type="text"
                          value={tempStudent.hedefBolum}
                          onChange={(e) => setTempStudent({ ...tempStudent, hedefBolum: e.target.value })}
                          className="w-full px-2 py-1 border border-[#7A7A7A] bg-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Hedef Puan:
                        </label>
                        <input
                          type="text"
                          value={tempStudent.hedefPuan}
                          onChange={(e) => setTempStudent({ ...tempStudent, hedefPuan: e.target.value })}
                          className="w-full px-2 py-1 border border-[#7A7A7A] bg-white text-xs font-bold text-blue-700"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Hedef Sıralama:
                        </label>
                        <input
                          type="text"
                          value={tempStudent.hedefSiralama}
                          onChange={(e) => setTempStudent({ ...tempStudent, hedefSiralama: e.target.value })}
                          className="w-full px-2 py-1 border border-[#7A7A7A] bg-white text-xs font-bold text-emerald-700"
                        />
                      </div>
                    </div>
                  </fieldset>

                  {/* Koç Notu TextBox */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Öğrenci Genel Koç Notu (TextBox - Multiline):
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Öğrencinin genel durumu, çalışma alışkanlıkları ve motivasyon notları..."
                      className="w-full px-2 py-1 border border-[#7A7A7A] bg-white text-xs"
                      defaultValue="Öğrencinin hedef odaklılığı yüksek, haftalık 25 saat çalışma disiplini takip ediliyor."
                    />
                  </div>
                </div>
              )}

              {/* TabPage 1: Koç Notları (ComboBox & TextBox Girişi + ListBox + Çift Tık Detay) */}
              {activeTabPageIndex === 1 && (
                <div className="p-3 space-y-3 overflow-y-auto flex-1">
                  {/* GroupBox: Not Girişi ve Düzenleme */}
                  <fieldset className="border border-[#B0B0B0] p-3 rounded bg-[#FAFAFA]">
                    <legend className="px-1 text-xs font-bold text-slate-800">
                      {editingNoteId ? '✏️ Koç Notunu Düzenle' : '➕ Yeni Koç Notu Girişi'}
                    </legend>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Kategori (ComboBox):
                        </label>
                        <select
                          value={noteKategori}
                          onChange={(e) => setNoteKategori(e.target.value)}
                          className="w-full px-2 py-1 border border-[#7A7A7A] bg-white text-xs"
                        >
                          <option value="Haftalık Değerlendirme">Haftalık Değerlendirme</option>
                          <option value="Hedef & Strateji">Hedef & Strateji</option>
                          <option value="Ödev & Görev">Ödev & Görev</option>
                          <option value="Veli Görüşmesi">Veli Görüşmesi</option>
                          <option value="Sınav Analizi">Sınav Analizi</option>
                          <option value="Motivasyon & Rehberlik">Motivasyon & Rehberlik</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Öncelik (ComboBox):
                        </label>
                        <select
                          value={noteOncelik}
                          onChange={(e) => setNoteOncelik(e.target.value)}
                          className="w-full px-2 py-1 border border-[#7A7A7A] bg-white text-xs"
                        >
                          <option value="Normal">Normal</option>
                          <option value="Önemli">Önemli</option>
                          <option value="Kritik">Kritik</option>
                          <option value="Düşük">Düşük</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Tarih (DateTimePicker):
                        </label>
                        <input
                          type="date"
                          value={noteTarih}
                          onChange={(e) => setNoteTarih(e.target.value)}
                          className="w-full px-2 py-1 border border-[#7A7A7A] bg-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="mt-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Not Başlığı (TextBox):
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: TYT Matematik Netleri ve Geometri Planı"
                        value={noteBaslik}
                        onChange={(e) => setNoteBaslik(e.target.value)}
                        className="w-full px-2 py-1 border border-[#7A7A7A] bg-white text-xs"
                      />
                    </div>

                    <div className="mt-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Detaylı Not / Açıklama (TextBox - Multiline):
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Görüşme detayları, koçluk tavsiyeleri, çözülecek kaynaklar ve öğrencinin geri bildirimleri..."
                        value={noteIcerik}
                        onChange={(e) => setNoteIcerik(e.target.value)}
                        className="w-full px-2 py-1 border border-[#7A7A7A] bg-white text-xs"
                      />
                    </div>

                    {/* Kaydet & İptal Butonları */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        onClick={handleSaveNote}
                        className="px-3.5 py-1.5 bg-[#0078D7] hover:bg-[#0063B1] text-white text-xs font-bold rounded shadow-xs flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{editingNoteId ? '💾 Değişiklikleri Güncelle' : '💾 Veritabanına Kaydet'}</span>
                      </button>

                      {editingNoteId && (
                        <button
                          onClick={() => {
                            setEditingNoteId(null);
                            setNoteBaslik('');
                            setNoteIcerik('');
                            setStatusMessage('Düzenleme iptal edildi.');
                          }}
                          className="px-3 py-1.5 bg-white border border-[#A0A0A0] hover:bg-[#ECECEC] text-slate-700 text-xs rounded"
                        >
                          İptal
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setEditingNoteId(null);
                          setNoteBaslik('');
                          setNoteIcerik('');
                          setStatusMessage('Form yeni not için temizlendi.');
                        }}
                        className="px-3 py-1.5 bg-white border border-[#A0A0A0] hover:bg-[#ECECEC] text-slate-700 text-xs rounded flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Yeni Not Alanı</span>
                      </button>
                    </div>
                  </fieldset>

                  {/* GroupBox: Kayıtlı Notlar - Buton / Kart Görünümlü Liste */}
                  <fieldset className="border border-[#CBD5E1] p-3 rounded-lg bg-white shadow-xs">
                    <legend className="px-1.5 text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>📋 Öğrencinin Kayıtlı Koç Notları</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full font-semibold">
                        {localNotes.filter((n) => n.studentId === tempStudent.id).length} Kayıt
                      </span>
                    </legend>

                    {/* Kart/Buton Görünümlü Liste Konteyneri */}
                    <div className="space-y-2 min-h-[160px] max-h-[260px] overflow-y-auto pr-1">
                      {localNotes.filter((n) => n.studentId === tempStudent.id).length === 0 ? (
                        <div className="p-8 text-center text-slate-400 font-sans text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
                          Bu öğrenciye ait kayıtlı koç notu bulunmamaktadır. Yukarıdaki formdan yeni not ekleyebilirsiniz.
                        </div>
                      ) : (
                        localNotes
                          .filter((n) => n.studentId === tempStudent.id)
                          .map((note) => {
                            const isSelected = selectedNoteId === note.id;
                            return (
                              <div
                                key={note.id}
                                onClick={() => setSelectedNoteId(note.id)}
                                onDoubleClick={() => handleOpenDetailModal(note)}
                                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                                  isSelected
                                    ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-400'
                                    : 'bg-slate-50/50 hover:bg-slate-100/80 border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="space-y-1.5 min-w-0 flex-1">
                                  {/* Üst Etiketler */}
                                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                    <span
                                      className={`px-2 py-0.5 rounded-md font-bold tracking-wide ${
                                        note.oncelik === 'Kritik'
                                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                          : note.oncelik === 'Önemli'
                                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                          : 'bg-slate-200 text-slate-700'
                                      }`}
                                    >
                                      {note.oncelik}
                                    </span>

                                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                                      {note.kategori}
                                    </span>

                                    <span className="text-slate-500 font-mono text-[11px]">
                                      📅 {formatDate(note.tarih)}
                                    </span>
                                  </div>

                                  {/* Başlık */}
                                  <h4 className="text-xs font-bold text-slate-900 truncate">
                                    {note.baslik}
                                  </h4>

                                  {/* Kısa Önizleme */}
                                  <p className="text-[11px] text-slate-600 line-clamp-1">
                                    {note.icerik}
                                  </p>
                                </div>

                                {/* Kart İçi Hızlı Eylem Butonları */}
                                <div className="shrink-0 flex items-center gap-1.5 self-end sm:self-center">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenDetailModal(note);
                                    }}
                                    className="px-2.5 py-1 bg-white hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 text-[11px] font-semibold rounded-md shadow-2xs transition-colors flex items-center gap-1"
                                    title="Çift tıklayarak da açabilirsiniz"
                                  >
                                    <span>🔍 İncele</span>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartEditNote(note);
                                    }}
                                    className="px-2.5 py-1 bg-white hover:bg-slate-800 hover:text-white text-slate-700 border border-slate-300 text-[11px] font-semibold rounded-md shadow-2xs transition-colors"
                                  >
                                    ✏️ Düzenle
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm(`"${note.baslik}" başlıklı notu silmek istediğinize emin misiniz?`)) {
                                        handleDeleteNote(note.id);
                                      }
                                    }}
                                    className="px-2.5 py-1 bg-white hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 text-[11px] font-semibold rounded-md shadow-2xs transition-colors"
                                  >
                                    🗑️ Sil
                                  </button>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>

                    <div className="mt-2 text-[11px] text-slate-500 italic">
                      💡 Kartın herhangi bir yerine <strong>çift tıklayarak</strong> veya <strong>[🔍 İncele]</strong> butonuna basarak uzun açıklamanın tamamını okuyabilirsiniz.
                    </div>
                  </fieldset>
                </div>
              )}

              {/* TabPage 2: Günlük Çalışmalar */}
              {activeTabPageIndex === 2 && (
                <div className="p-3 space-y-3">
                  <div className="text-xs font-bold text-slate-700">
                    Günlük Çalışma Seansları (DataGridView):
                  </div>
                  <table className="w-full border border-[#D0D0D0] text-[11px]">
                    <thead className="bg-[#EAEAEA] border-b border-[#B0B0B0]">
                      <tr>
                        <th className="p-1.5 text-left">Tarih</th>
                        <th className="p-1.5 text-left">Ders</th>
                        <th className="p-1.5 text-left">Konu</th>
                        <th className="p-1.5 text-center">Süre</th>
                        <th className="p-1.5 text-center">Verimlilik</th>
                        <th className="p-1.5 text-center">Koç Onayı</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E0E0E0]">
                      {studentStudies.map((s) => (
                        <tr key={s.id} className="hover:bg-[#F5F5F5]">
                          <td className="p-1.5">{formatDate(s.tarih)}</td>
                          <td className="p-1.5 font-bold">{s.ders}</td>
                          <td className="p-1.5">{s.konu}</td>
                          <td className="p-1.5 text-center">{s.hedefSoruSayisi ? `${s.hedefSoruSayisi} soru` : `${s.hedefSureDakika} dk`}</td>
                          <td className="p-1.5 text-center">{s.gorevTuru}</td>
                          <td className="p-1.5 text-center">
                            {s.durum === 'Tamamlandı' ? '✓ Tamamlandı' : s.durum}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TabPage 3: Sorular */}
              {activeTabPageIndex === 3 && (
                <div className="p-3 space-y-3">
                  <div className="text-xs font-bold text-slate-700">
                    Soru Çözüm Kayıtları (DataGridView):
                  </div>
                  <table className="w-full border border-[#D0D0D0] text-[11px]">
                    <thead className="bg-[#EAEAEA] border-b border-[#B0B0B0]">
                      <tr>
                        <th className="p-1.5 text-left">Tarih</th>
                        <th className="p-1.5 text-left">Ders</th>
                        <th className="p-1.5 text-left">Konu</th>
                        <th className="p-1.5 text-center">D</th>
                        <th className="p-1.5 text-center">Y</th>
                        <th className="p-1.5 text-center">B</th>
                        <th className="p-1.5 text-center">Toplam</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E0E0E0]">
                      {studentQuestions.map((q) => (
                        <tr key={q.id} className="hover:bg-[#F5F5F5]">
                          <td className="p-1.5">{formatDate(q.tarih)}</td>
                          <td className="p-1.5 font-bold">{q.ders}</td>
                          <td className="p-1.5">{q.konu}</td>
                          <td className="p-1.5 text-center text-emerald-700 font-bold">{q.dogruSayisi}</td>
                          <td className="p-1.5 text-center text-rose-700 font-bold">{q.yanlisSayisi}</td>
                          <td className="p-1.5 text-center text-slate-500">{q.bosSayisi}</td>
                          <td className="p-1.5 text-center font-bold">{q.cozulenSoru || (q.dogruSayisi + q.yanlisSayisi + q.bosSayisi)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TabPage 4: Denemeler */}
              {activeTabPageIndex === 4 && (
                <div className="p-3 space-y-3">
                  <div className="text-xs font-bold text-slate-700">
                    TYT & AYT Deneme Netleri (DataGridView):
                  </div>
                  <table className="w-full border border-[#D0D0D0] text-[11px]">
                    <thead className="bg-[#EAEAEA] border-b border-[#B0B0B0]">
                      <tr>
                        <th className="p-1.5 text-left">Tür</th>
                        <th className="p-1.5 text-left">Sınav Adı</th>
                        <th className="p-1.5 text-left">Yayin</th>
                        <th className="p-1.5 text-center">Net</th>
                        <th className="p-1.5 text-center">Tahmini Puan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E0E0E0]">
                      {studentExams.map((e) => (
                        <tr key={e.id} className="hover:bg-[#F5F5F5]">
                          <td className="p-1.5 font-bold text-blue-700">{e.sinavTuru}</td>
                          <td className="p-1.5">{e.denemeAdi}</td>
                          <td className="p-1.5">{e.yayin}</td>
                          <td className="p-1.5 text-center font-black">{e.toplamNet}</td>
                          <td className="p-1.5 text-center font-bold text-emerald-700">{e.puan} P</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TabPage 5: Kazanımlar */}
              {activeTabPageIndex === 5 && (
                <div className="p-3 space-y-3">
                  <div className="text-xs font-bold text-slate-700">
                    Müfredat Konuları & Kazanım Durumları:
                  </div>
                  <table className="w-full border border-[#D0D0D0] text-[11px]">
                    <thead className="bg-[#EAEAEA] border-b border-[#B0B0B0]">
                      <tr>
                        <th className="p-1.5 text-left">Grup</th>
                        <th className="p-1.5 text-left">Ders</th>
                        <th className="p-1.5 text-left">Kazanım / Konu</th>
                        <th className="p-1.5 text-center">Kod</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E0E0E0]">
                      {studentOutcomes.map((o) => (
                        <tr key={o.id} className="hover:bg-[#F5F5F5]">
                          <td className="p-1.5 font-bold">{o.sinavTuru}</td>
                          <td className="p-1.5">{o.ders}</td>
                          <td className="p-1.5">{o.konu} - {o.aciklama}</td>
                          <td className="p-1.5 text-center font-bold">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-800">
                              {o.kazanimKodu}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TabPage 6: Raporlar & Analiz */}
              {activeTabPageIndex === 6 && (
                <div className="p-4 space-y-4">
                  <fieldset className="border border-[#B0B0B0] p-3 rounded bg-[#FBFBFB]">
                    <legend className="px-1 text-xs font-bold text-slate-800">
                      Hedef vs. Mevcut Durum Raporu (C# GDI+ / Chart Raporlaması)
                    </legend>
                    <div className="space-y-2 text-xs">
                      <div><strong>Hedef Üniversite:</strong> {tempStudent.hedefUniversite} - {tempStudent.hedefBolum}</div>
                      <div><strong>Hedeflenen YKS Puanı:</strong> {tempStudent.hedefPuan} | <strong>Sıralama:</strong> {tempStudent.hedefSiralama}</div>
                      <div><strong>Son Deneme Puanı:</strong> {studentExams[0]?.puan || 460} Puan (Net: {studentExams[0]?.toplamNet || 92})</div>
                      <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 font-bold rounded">
                        Gereken Net Artışı: +{(Number(tempStudent.hedefPuan) || 490) - (Number(studentExams[0]?.puan) || 460)} Puan (~9 Net)
                      </div>
                    </div>
                  </fieldset>
                </div>
              )}
            </div>
          </div>

          {/* StatusStrip at bottom */}
          <div className="bg-[#EAEAEA] border-t border-[#D4D4D4] px-3 py-1 flex items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center gap-3">
              <span>{statusMessage}</span>
              <div className="w-px h-3 bg-[#C0C0C0]" />
              <span>Veritabanı: EgitimKocluğu.db (SQLite)</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Seçili: {tempStudent.adSoyad}</span>
              <span>CAPS</span>
              <span>NUM</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: C# PROJECT CODE BROWSER */}
      {activeViewMode === 'csharp-code' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          {/* File Explorer Sidebar */}
          <div className="md:col-span-1 border-r border-slate-100 pr-4 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <FolderGit2 className="w-4 h-4 text-indigo-600" />
              <span>C# Proje Dosyaları</span>
            </div>

            <div className="space-y-1">
              {WINFORMS_PROJECT_FILES.map((file, idx) => (
                <button
                  key={file.name}
                  onClick={() => setSelectedFileIndex(idx)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    selectedFileIndex === idx
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    selectedFileIndex === idx ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {file.category}
                  </span>
                </button>
              ))}
            </div>

            {/* Quick instructions for Visual Studio */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-600 space-y-1 mt-4">
              <div className="font-bold text-slate-900">Visual Studio Kurulumu:</div>
              <p>1. "Windows Forms App (.NET 8.0 / .NET Framework)" projesi açın.</p>
              <p>2. NuGet'ten <code>System.Data.SQLite</code> paketini ekleyin.</p>
              <p>3. Yan taraftaki C# kodlarını projenize yapıştırın.</p>
            </div>
          </div>

          {/* Code Viewer Panel */}
          <div className="md:col-span-3 pl-0 md:pl-2 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{currentFile.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    {currentFile.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{currentFile.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadFile(currentFile)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>İndir (.cs)</span>
                </button>

                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Kopyalandı!' : 'Kodu Kopyala'}</span>
                </button>
              </div>
            </div>

            {/* Code Block */}
            <div className="bg-[#1E1E1E] text-slate-100 p-4 rounded-2xl overflow-x-auto text-xs font-mono leading-relaxed max-h-[500px] select-text">
              <pre>{currentFile.code}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Windows Forms Modal Popup: FormNotDetay */}
      {isDetailModalOpen && activeDetailNote && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#F0F0F0] border-2 border-[#005A9E] shadow-2xl rounded-t-md max-w-xl w-full overflow-hidden font-sans text-slate-900 select-none animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Titlebar */}
            <div className="bg-[#0078D7] text-white px-3 py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">
                  Koç Notu Detayı - [FormNotDetay.cs]
                </span>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-2 py-0.5 hover:bg-red-600 text-white text-xs font-bold rounded-xs transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3 bg-[#F4F4F4]">
              {/* Info Header */}
              <div className="bg-white p-3 border border-[#CCCCCC] rounded flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-500 font-semibold">ÖĞRENCİ:</div>
                  <div className="text-sm font-bold text-slate-900">{tempStudent.adSoyad}</div>
                  <div className="text-[11px] text-slate-500">{tempStudent.sinif} • {tempStudent.alan}</div>
                </div>

                <div className="text-right space-y-1">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                    activeDetailNote.oncelik === 'Kritik'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : activeDetailNote.oncelik === 'Önemli'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {activeDetailNote.oncelik} Öncelik
                  </span>
                  <div className="text-[11px] font-mono text-slate-600">
                    Tarih: {formatDate(activeDetailNote.tarih)}
                  </div>
                </div>
              </div>

              {/* Note Details */}
              <div className="bg-white p-3 border border-[#CCCCCC] rounded space-y-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                    Kategori: {activeDetailNote.kategori}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                    {activeDetailNote.baslik}
                  </h4>
                </div>

                <div className="border-t border-slate-100 pt-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Detaylı Açıklama ve Not Metni (TextBox - ReadOnly / Multiline):
                  </label>
                  <div className="p-3 bg-[#FAFAFA] border border-[#CCCCCC] rounded text-xs leading-relaxed text-slate-800 min-h-[120px] max-h-[220px] overflow-y-auto whitespace-pre-wrap select-text font-sans">
                    {activeDetailNote.icerik}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${activeDetailNote.baslik}\n\n${activeDetailNote.icerik}`);
                    setStatusMessage('Not metni panoya kopyalandı.');
                  }}
                  className="px-3 py-1.5 bg-white border border-[#A0A0A0] hover:bg-[#EAEAEA] text-slate-700 text-xs rounded shadow-xs"
                >
                  📋 Metni Kopyala
                </button>

                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-1.5 bg-[#0078D7] hover:bg-[#0063B1] text-white text-xs font-bold rounded shadow-xs"
                >
                  Kapat (DialogResult.OK)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
