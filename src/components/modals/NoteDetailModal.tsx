import React from 'react';
import { X, Calendar, Tag, AlertTriangle, FileText, Trash2 } from 'lucide-react';
import { CoachNote } from '../../types';
import { formatDate } from '../../utils/dateUtils';

interface NoteDetailModalProps {
  note: CoachNote | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const NoteDetailModal: React.FC<NoteDetailModalProps> = ({
  note,
  onClose,
  onDelete,
}) => {
  if (!note) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl">
              {note.kategori}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                note.oncelik === 'Kritik'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : note.oncelik === 'Önemli'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {note.oncelik} Öncelik
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title & Date */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(note.tarih)}</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 leading-snug">{note.baslik}</h3>
        </div>

        {/* Note Content */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-sm text-slate-800 leading-relaxed whitespace-pre-line max-h-72 overflow-y-auto">
          {note.icerik}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            onClick={() => {
              onDelete(note.id);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Notu Sil</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
