import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  FileText, 
  Trash2, 
  Eye, 
  Calendar, 
  AlertCircle,
  Tag
} from 'lucide-react';
import { CoachNote, NoteKategori, NoteOncelik } from '../../../types';
import { NoteDetailModal } from '../../modals/NoteDetailModal';
import { formatDate } from '../../../utils/dateUtils';

interface CoachNotesTabProps {
  notes: CoachNote[];
  onAddNote: (note: Omit<CoachNote, 'id'>) => void;
  onDeleteNote: (id: string) => void;
  studentName: string;
}

export const CoachNotesTab: React.FC<CoachNotesTabProps> = ({
  notes,
  onAddNote,
  onDeleteNote,
  studentName,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedNote, setSelectedNote] = useState<CoachNote | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');

  // Form states
  const [tarih, setTarih] = useState(new Date().toISOString().split('T')[0]);
  const [kategori, setKategori] = useState<NoteKategori>('Haftalık Değerlendirme');
  const [oncelik, setOncelik] = useState<NoteOncelik>('Normal');
  const [baslik, setBaslik] = useState('');
  const [icerik, setIcerik] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!baslik.trim() || !icerik.trim()) return;

    onAddNote({
      studentId: '',
      tarih,
      kategori,
      oncelik,
      baslik: baslik.trim(),
      icerik: icerik.trim(),
    });

    setBaslik('');
    setIcerik('');
    setShowAddForm(false);
  };

  const filteredNotes = notes.filter((n) => {
    const matchesCategory = selectedCategory === 'Tümü' || n.kategori === selectedCategory;
    const matchesSearch =
      n.baslik.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.icerik.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Action & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Koç notlarında ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          />
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Koç Notu Ekle</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          'Tümü',
          'Haftalık Değerlendirme',
          'Hedef & Strateji',
          'Ödev & Görev',
          'Veli Görüşmesi',
          'Sınav Analizi',
          'Motivasyon & Rehberlik',
        ].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Add Note Form */}
      {showAddForm && (
        <div className="bg-white border-2 border-indigo-500/30 rounded-3xl p-6 sm:p-7 shadow-lg space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-900">
              Yeni Koçluk ve Görüşme Notu Oluştur
            </h4>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Kapat
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tarih</label>
                <input
                  type="date"
                  required
                  value={tarih}
                  onChange={(e) => setTarih(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value as NoteKategori)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Haftalık Değerlendirme">Haftalık Değerlendirme</option>
                  <option value="Hedef & Strateji">Hedef & Strateji</option>
                  <option value="Ödev & Görev">Ödev & Görev</option>
                  <option value="Veli Görüşmesi">Veli Görüşmesi</option>
                  <option value="Sınav Analizi">Sınav Analizi</option>
                  <option value="Motivasyon & Rehberlik">Motivasyon & Rehberlik</option>
                  <option value="Genel">Genel</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Öncelik Seviyesi</label>
                <select
                  value={oncelik}
                  onChange={(e) => setOncelik(e.target.value as NoteOncelik)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Normal">Normal</option>
                  <option value="Önemli">Önemli</option>
                  <option value="Kritik">Kritik</option>
                  <option value="Düşük">Düşük</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Not Başlığı *</label>
              <input
                type="text"
                required
                placeholder="Örn: TYT Türkçe Zaman Yönetimi ve AYT Fizik Durumu"
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Detaylı Koç Notu & Alınan Kararlar *</label>
              <textarea
                rows={4}
                required
                placeholder="Görüşme içeriği, öğrencinin soru çözüm performansı, hedeflenen netler ve verilen haftalık ödevler..."
                value={icerik}
                onChange={(e) => setIcerik(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
              >
                Notu Kaydet
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {note.kategori}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                        note.oncelik === 'Kritik'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : note.oncelik === 'Önemli'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {note.oncelik}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(note.tarih)}</span>
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 leading-snug">{note.baslik}</h4>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {note.icerik}
                </p>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelectedNote(note)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>İncele</span>
                </button>

                <button
                  onClick={() => onDeleteNote(note.id)}
                  className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition-colors"
                  title="Notu Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">Henüz koçluk notu bulunmuyor.</p>
            <p className="text-[11px]">Yukarıdaki butona tıklayarak ilk görüşme notunuzu kaydedebilirsiniz.</p>
          </div>
        )}
      </div>

      {/* Note Detail Inspection Modal */}
      {selectedNote && (
        <NoteDetailModal
          note={selectedNote}
          onClose={() => setSelectedNote(null)}
          onDelete={onDeleteNote}
        />
      )}
    </div>
  );
};
