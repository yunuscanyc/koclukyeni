import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Target, 
  FileText, 
  AlertCircle,
  Tag,
  Check,
  BookmarkCheck,
  Sparkles
} from 'lucide-react';
import { Student, BookResource, StudentAssignedResource, BookDifficulty } from '../../../types';
import { formatDate } from '../../../utils/dateUtils';

interface AssignedResourcesTabProps {
  student: Student;
  books: BookResource[];
  assignedResources: StudentAssignedResource[];
  onAssignResource: (resource: Omit<StudentAssignedResource, 'id'>) => void;
  onDeleteResource: (id: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
}

export const AssignedResourcesTab: React.FC<AssignedResourcesTabProps> = ({
  student,
  books = [],
  assignedResources = [],
  onAssignResource,
  onDeleteResource,
  onToggleComplete
}) => {
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'completed'>('active');

  // Form State
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [bookName, setBookName] = useState('');
  const [publisher, setPublisher] = useState('');
  const [subject, setSubject] = useState('Matematik');
  const [difficulty, setDifficulty] = useState<BookDifficulty>('Orta');
  const [targetDurationDays, setTargetDurationDays] = useState<number>(14);
  const [targetDate, setTargetDate] = useState<string>('');
  const [hedefSoruSayisi, setHedefSoruSayisi] = useState<number | undefined>(undefined);
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');

  // Filter student's resources
  const studentResources = assignedResources.filter(r => r.studentId === student.id);
  
  const activeResources = studentResources.filter(r => !r.completed);
  const completedResources = studentResources.filter(r => r.completed);

  const displayedResources = studentResources.filter(r => {
    if (filterMode === 'active') return !r.completed;
    if (filterMode === 'completed') return r.completed;
    return true;
  });

  // Handle selecting a book from pool
  const handleSelectPoolBook = (bookId: string) => {
    setSelectedBookId(bookId);
    if (!bookId) return;
    const found = books.find(b => b.id === bookId);
    if (found) {
      setBookName(found.name);
      setPublisher(found.publisher);
      setSubject(found.subject);
      setDifficulty(found.difficulty);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!bookName.trim()) {
      setFormError('Lütfen atanacak kaynak kitap adını giriniz.');
      return;
    }

    onAssignResource({
      studentId: student.id,
      bookId: selectedBookId || undefined,
      bookName: bookName.trim(),
      publisher: publisher.trim() || 'Genel',
      subject: subject || 'Matematik',
      difficulty,
      targetDurationDays: targetDurationDays ? Number(targetDurationDays) : undefined,
      targetDate: targetDate || undefined,
      hedefSoruSayisi: hedefSoruSayisi ? Number(hedefSoruSayisi) : undefined,
      note: note.trim(),
      assignedDate: new Date().toISOString().split('T')[0],
      completed: false
    });

    // Reset Form
    setSelectedBookId('');
    setBookName('');
    setPublisher('');
    setSubject('Matematik');
    setDifficulty('Orta');
    setTargetDurationDays(14);
    setTargetDate('');
    setHedefSoruSayisi(undefined);
    setNote('');
    setShowAssignForm(false);
  };

  const getDifficultyBadge = (diff?: BookDifficulty) => {
    switch (diff) {
      case 'Kolay':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'Orta':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      case 'Zor':
        return 'bg-rose-50 text-rose-700 border-rose-200/80';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200/80';
    }
  };

  const completionPercent = studentResources.length > 0 
    ? Math.round((completedResources.length / studentResources.length) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-indigo-50 text-indigo-600">
              <BookOpen className="w-6 h-6" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Öğrenciye Atanan Kaynaklar
            </h2>
          </div>
          <p className="text-xs font-semibold text-slate-500">
            {student.adSoyad} isimli öğrencinin çözmesi gereken kaynak kitapları ve koç tarafından verilen hedef süreleri takip edin.
          </p>
        </div>

        <button
          onClick={() => setShowAssignForm(!showAssignForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-sm transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Kaynak Ataması Yap</span>
        </button>
      </div>

      {/* Progress & Stat Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Devam Eden Kaynaklar</div>
            <div className="text-lg font-black text-slate-900">{activeResources.length} Adet</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tamamlanan Kaynaklar</div>
            <div className="text-lg font-black text-emerald-700">{completedResources.length} Adet</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-1.5 flex flex-col justify-center">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Tamamlama Oranı</span>
            <span className="text-indigo-600 font-black">{completionPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Assign Resource Form */}
      {showAssignForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>{student.adSoyad} İçin Kaynak Atama Formu</span>
            </h3>
            <button 
              type="button" 
              onClick={() => setShowAssignForm(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Kapat
            </button>
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              ⚠️ {formError}
            </div>
          )}

          {/* Quick Select from Pool */}
          {books.length > 0 && (
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-indigo-900 uppercase tracking-wider">
                📚 Hazır Kaynak Havuzundan Seç (İsteğe Bağlı)
              </label>
              <select
                value={selectedBookId}
                onChange={(e) => handleSelectPoolBook(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Yeni / Havuz Dışı Özel Kitap Gir --</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    [{b.subject} - {b.difficulty}] {b.publisher} - {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Book Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Kaynak Kitap Adı *</label>
              <input
                type="text"
                placeholder="Örn: Bilgi Sarmal AYT Matematik"
                value={bookName}
                onChange={(e) => setBookName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Publisher */}
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Yayınevi</label>
              <input
                type="text"
                placeholder="Örn: Bilgi Sarmal"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">İlişkili Ders</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {['Matematik', 'Geometri', 'Türkçe', 'Edebiyat', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya', 'Felsefe', 'Genel'].map((subj) => (
                  <option key={subj} value={subj}>{subj}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Target Duration Days */}
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Hedef Bitiş Süresi (Gün)</label>
              <input
                type="number"
                min="1"
                placeholder="Örn: 14"
                value={targetDurationDays || ''}
                onChange={(e) => setTargetDurationDays(e.target.value ? Number(e.target.value) : 0)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Target Date */}
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider"> Veya Hedef Tarih</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Target Questions Count */}
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Hedef Soru Sayısı (İsteğe Bağlı)</label>
              <input
                type="number"
                placeholder="Örn: 300"
                value={hedefSoruSayisi || ''}
                onChange={(e) => setHedefSoruSayisi(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Note / Instruction */}
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Koç Notu & Talimatlar</label>
            <input
              type="text"
              placeholder="Örn: Trigonometri ve Türev bölümlerindeki tüm testler bitirilecek."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-xs transition-all active:scale-95"
            >
              Atamayı Kaydet ve Öğrenciye İlet
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'active'
                ? 'bg-indigo-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Devam Edenler ({activeResources.length})
          </button>
          <button
            onClick={() => setFilterMode('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'completed'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tamamlananlar ({completedResources.length})
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tümü ({studentResources.length})
          </button>
        </div>
      </div>

      {/* List Display */}
      {displayedResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedResources.map((res) => (
            <div 
              key={res.id}
              className={`bg-white border rounded-2xl p-5 shadow-2xs flex flex-col justify-between transition-all ${
                res.completed ? 'border-emerald-200/90 bg-emerald-50/20' : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60 inline-block mb-1">
                      {res.subject}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 leading-snug">
                      {res.bookName}
                    </h3>
                    <p className="text-[11px] font-bold text-slate-500">
                      Yayın: {res.publisher}
                    </p>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border shrink-0 ${getDifficultyBadge(res.difficulty)}`}>
                    {res.difficulty || 'Orta'}
                  </span>
                </div>

                {/* Info Badges (Duration & Target) */}
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  {res.targetDurationDays && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-800 font-bold">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Hedef Süre: {res.targetDurationDays} Gün</span>
                    </div>
                  )}

                  {res.targetDate && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200/80 text-sky-800 font-bold">
                      <Calendar className="w-3.5 h-3.5 text-sky-600" />
                      <span>Son Tarih: {formatDate(res.targetDate)}</span>
                    </div>
                  )}

                  {res.hedefSoruSayisi && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200/80 text-purple-800 font-bold">
                      <Target className="w-3.5 h-3.5 text-purple-600" />
                      <span>Hedef: {res.hedefSoruSayisi} Soru</span>
                    </div>
                  )}
                </div>

                {/* Coach Note */}
                {res.note && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
                    <span className="font-extrabold text-indigo-900">Koç Notu: </span>
                    {res.note}
                  </div>
                )}
              </div>

              {/* Card Footer: Status & Actions */}
              <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] font-bold text-slate-400">
                  Atandı: {formatDate(res.assignedDate)}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleComplete(res.id, !res.completed)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      res.completed
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-emerald-600 hover:text-white'
                    }`}
                  >
                    {res.completed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Tamamlandı ({formatDate(res.completedDate)})</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Tamamlandı Olarak İşaretle</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Bu kaynak atamasını kaldırmak istediğinize emin misiniz?')) {
                        onDeleteResource(res.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                    title="Atamayı Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center">
          <BookmarkCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-xs font-black text-slate-700">Henüz Kaynak Ataması Yok</h3>
          <p className="text-[11px] text-slate-500 mt-1">
            "Yeni Kaynak Ataması Yap" butonuna tıklayarak {student.adSoyad} için çözülmesi gereken kaynak kitap atayabilirsiniz.
          </p>
        </div>
      )}

    </div>
  );
};
