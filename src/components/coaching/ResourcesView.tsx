import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Search, 
  SlidersHorizontal,
  BookmarkCheck,
  Award,
  HelpCircle,
  TrendingUp,
  Tag
} from 'lucide-react';
import { BookResource, BookDifficulty } from '../../types';

interface ResourcesViewProps {
  books: BookResource[];
  onAddBook: (book: Omit<BookResource, 'id'>) => void;
  onDeleteBook: (id: string) => void;
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({
  books,
  onAddBook,
  onDeleteBook
}) => {
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Form State
  const [newBookName, setNewBookName] = useState('');
  const [newPublisher, setNewPublisher] = useState('');
  const [newSubject, setNewSubject] = useState('Matematik');
  const [newDifficulty, setNewDifficulty] = useState<BookDifficulty>('Orta');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState('');

  // Extract all unique subjects
  const allSubjects = Array.from(new Set(books.map((b) => b.subject))).sort();

  // Filter books
  const filteredBooks = books.filter((book) => {
    const matchesSearch = 
      book.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      book.publisher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || book.subject === selectedSubject;
    const matchesDifficulty = selectedDifficulty === 'all' || book.difficulty === selectedDifficulty;
    return matchesSearch && matchesSubject && matchesDifficulty;
  });

  // Calculate statistics
  const totalBooks = books.length;
  const easyCount = books.filter(b => b.difficulty === 'Kolay').length;
  const mediumCount = books.filter(b => b.difficulty === 'Orta').length;
  const hardCount = books.filter(b => b.difficulty === 'Zor').length;

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newBookName.trim() || !newPublisher.trim()) {
      setFormError('Lütfen kitap adı ve yayınevi alanlarını doldurun.');
      return;
    }

    onAddBook({
      name: newBookName.trim(),
      publisher: newPublisher.trim(),
      subject: newSubject,
      difficulty: newDifficulty
    });

    // Reset Form
    setNewBookName('');
    setNewPublisher('');
    setNewSubject('Matematik');
    setNewDifficulty('Orta');
    setShowAddForm(false);
  };

  // Helper styles for difficulty
  const getDifficultyStyles = (diff: BookDifficulty) => {
    switch (diff) {
      case 'Kolay':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Orta':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Zor':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Subject Colors
  const getSubjectBadgeStyle = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes('matematik') || s.includes('geometri')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200/60';
    }
    if (s.includes('fizik') || s.includes('kimya') || s.includes('biyoloji') || s.includes('fen')) {
      return 'bg-sky-50 text-sky-700 border-sky-200/60';
    }
    if (s.includes('türkçe') || s.includes('edebiyat')) {
      return 'bg-teal-50 text-teal-700 border-teal-200/60';
    }
    return 'bg-purple-50 text-purple-700 border-purple-200/60';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Title Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-indigo-50 text-indigo-600">
              <BookOpen className="w-6 h-6" />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              YKS Kaynak Kitaplar Havuzu
            </h1>
          </div>
          <p className="text-xs font-semibold text-slate-500">
            Haftalık programda soru çözümü planlarken öğrencilere atanabilecek piyasadaki tüm popüler yayınlar ve zorluk seviyeleri.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-sm shadow-indigo-100 self-start md:self-center transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Kaynak Kitap Ekle</span>
        </button>
      </div>

      {/* Quick Catalog Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Toplam Kitap</div>
            <div className="text-lg font-black text-slate-900">{totalBooks}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <BookmarkCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kolay Seviye</div>
            <div className="text-lg font-black text-emerald-700">{easyCount}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orta Seviye</div>
            <div className="text-lg font-black text-amber-700">{mediumCount}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zor Seviye</div>
            <div className="text-lg font-black text-rose-700">{hardCount}</div>
          </div>
        </div>
      </div>

      {/* Add New Book Inline Collapse Section */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-5 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <span>📖</span> Yeni Kitap Kaydı Tanımla
            </h3>
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)}
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Book Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Kitap Adı</label>
              <input
                type="text"
                placeholder="Örn: 3D AYT Matematik Soru Bankası"
                value={newBookName}
                onChange={(e) => setNewBookName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Publisher */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Yayınevi / Yayın</label>
              <input
                type="text"
                placeholder="Örn: 3D Yayınları"
                value={newPublisher}
                onChange={(e) => setNewPublisher(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Subject Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">İlişkili Ders</label>
              <select
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {['Matematik', 'Geometri', 'Türkçe', 'Edebiyat', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya', 'Felsefe', 'Genel'].map((subj) => (
                  <option key={subj} value={subj}>{subj}</option>
                ))}
              </select>
            </div>

            {/* Difficulty Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Zorluk Derecesi</label>
              <select
                value={newDifficulty}
                onChange={(e) => setNewDifficulty(e.target.value as BookDifficulty)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Kolay">Kolay (Temel Seviye)</option>
                <option value="Orta">Orta (ÖSYM Seviyesi)</option>
                <option value="Zor">Zor (İleri Seviye / Derece)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all active:scale-95"
            >
              Havuzuna Kaydet
            </button>
          </div>
        </form>
      )}

      {/* Filtering Control Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Keyword Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Kitap adı veya yayınevi ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Filtering Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Filtreler:</span>
            </div>

            {/* Subject Select */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">Tüm Dersler</option>
              {allSubjects.map((subj) => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>

            {/* Difficulty Select */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">Tüm Seviyeler</option>
              <option value="Kolay">Sadece Kolay</option>
              <option value="Orta">Sadece Orta</option>
              <option value="Zor">Sadece Zor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Catalog Grid View */}
      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((book) => (
            <div 
              key={book.id} 
              className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all duration-200 relative group flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                {/* Header row: Subject & Difficulty */}
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${getSubjectBadgeStyle(book.subject)}`}>
                    {book.subject}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${getDifficultyStyles(book.difficulty)}`}>
                    {book.difficulty}
                  </span>
                </div>

                {/* Book Info */}
                <div>
                  <h4 className="text-xs font-black text-slate-800 line-clamp-2 min-h-[2rem]">
                    {book.name}
                  </h4>
                  <div className="flex items-center gap-1 mt-1">
                    <Tag className="w-3 h-3 text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-500">{book.publisher}</span>
                  </div>
                </div>
              </div>

              {/* Action: Delete Book */}
              <div className="flex justify-end pt-3 mt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    if (confirm(`"${book.name}" kaynağını havuzdan silmek istediğinize emin misiniz?`)) {
                      onDeleteBook(book.id);
                    }
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                  title="Kaynağı Havuzdan Kaldır"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto">
          <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-xs font-black text-slate-700">Hiç Kitap Bulunamadı</h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Aradığınız ders veya zorluk seviyesinde kriterlere uyan bir kitap yok. Üstteki ekleme butonuyla yenisini ekleyebilirsiniz!
          </p>
        </div>
      )}
    </div>
  );
};
