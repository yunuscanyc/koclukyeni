import React, { useState } from 'react';
import { X, Sparkles, Send, Loader2, Bot, BookOpen, Lightbulb } from 'lucide-react';
import { Student } from '../../types';

interface AICoachAskModalProps {
  student?: Student | null;
  activeStudent?: Student | null;
  isOpen?: boolean;
  onClose: () => void;
}

export const AICoachAskModal: React.FC<AICoachAskModalProps> = ({
  student,
  activeStudent,
  isOpen = true,
  onClose,
}) => {
  const currentStudent = student || activeStudent || null;
  const [question, setQuestion] = useState('');
  const [subject, setSubject] = useState('Genel YKS & Rehberlik');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;


  const quickPrompts = [
    'Geometride netlerimi 5 netten 10 nete nasıl çıkarırım?',
    'TYT Paragrafta süre yetiştiremiyorum, 35 dakikaya nasıl indiririm?',
    'AYT Matematikte Türev ve İntegral için en verimli çalışma sırası nedir?',
    'Son 3 ayda deneme netlerimi plato seviyesinden nasıl zıplatırım?',
  ];

  const handleAsk = async (promptText?: string) => {
    const q = promptText || question;
    if (!q.trim()) return;

    setIsLoading(true);
    setResponse(null);

    const context = currentStudent
      ? `Öğrenci: ${currentStudent.adSoyad}, Sınıf: ${currentStudent.sinif}, Alan: ${currentStudent.alan}, Hedef: ${currentStudent.hedefUniversite} - ${currentStudent.hedefBolum}, Hedef Puan: ${currentStudent.hedefPuan}, Hedef Sıralama: ${currentStudent.hedefSiralama}`
      : 'Genel YKS Öğrencisi';

    try {
      const res = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          subject,
          context,
        }),
      });

      const data = await res.json();
      setResponse(data.answer || 'Yanıt alınamadı.');
    } catch (err: any) {
      setResponse('Bağlantı hatası oluştu, lütfen tekrar deneyiniz.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Yapay Zekâ Eğitim Koçuna Sor</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Gemini AI
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {student ? `${student.adSoyad} için özel strateji & rehberlik` : 'YKS ve MEB müfredatı asistanı'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Prompts */}
        <div className="space-y-1.5 shrink-0">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Hızlı Soru Kalıpları</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setQuestion(p);
                  handleAsk(p);
                }}
                className="text-left text-[11px] font-medium bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-2 shrink-0">
          <div className="flex gap-2">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shrink-0"
            >
              <option value="Genel YKS & Rehberlik">Genel Rehberlik</option>
              <option value="TYT-AYT Matematik">Matematik</option>
              <option value="Geometri">Geometri</option>
              <option value="Fizik">Fizik</option>
              <option value="Kimya">Kimya</option>
              <option value="Biyoloji">Biyoloji</option>
              <option value="Türkçe & Edebiyat">Türkçe/Edebiyat</option>
              <option value="Tarih & Coğrafya">Sosyal Bilimler</option>
            </select>

            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Öğrenciniz için taktik, kaynak veya konu anlatım stratejisi sorun..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => handleAsk()}
                disabled={isLoading || !question.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all disabled:opacity-40"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Response Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50/70 border border-slate-200 rounded-2xl p-5 text-xs text-slate-800 leading-relaxed min-h-[160px]">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <p className="font-semibold text-slate-600">Yapay zekâ koçluk stratejisi hazırlıyor...</p>
            </div>
          ) : response ? (
            <div className="space-y-3 font-sans whitespace-pre-line">
              <div className="flex items-center gap-2 text-indigo-600 font-bold border-b border-slate-200 pb-2">
                <Bot className="w-4 h-4" />
                <span>Eğitim Koçu Analizi:</span>
              </div>
              <div>{response}</div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-1 py-8 text-center">
              <Bot className="w-8 h-8 text-slate-300" />
              <p className="font-medium text-slate-600">Sorunuzu yazın veya hızlı sorulardan birini seçin</p>
              <p className="text-[11px] text-slate-400">MEB müfredatına ve öğrenci hedeflerine uyumlu yanıtlar üretilir.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
