import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  User, 
  Copy, 
  Check, 
  RotateCcw, 
  Loader2, 
  Sparkles,
  Lightbulb
} from 'lucide-react';
import { Student } from '../../types';

interface AICoachChatProps {
  activeStudent: Student | null;
}

interface CoachChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const AICoachChat: React.FC<AICoachChatProps> = ({ activeStudent }) => {
  const [messages, setMessages] = useState<CoachChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: activeStudent
        ? `Merhaba Koç! Şu anda **${activeStudent.adSoyad}** (${activeStudent.sinif} - ${activeStudent.alan}) profilini inceliyorsunuz.

Hedef: **${activeStudent.hedefUniversite} - ${activeStudent.hedefBolum}** (Hedef Puan: ${activeStudent.hedefPuan}).

Öğrenciye özel ders çalışma programı hazırlama, net artırma taktikleri, deneme sınavı stratejileri veya motivasyon yöntemleri hakkında dilediğinizi sorabilirsiniz.`
        : `Merhaba! Ben YKS Eğitim Koçluğu Yapay Zeka Danışmanınızım. 🎯

Öğrencilerinizin YKS hazırlık süreçleri, haftalık ders programları, branş net artırma stratejileri ve sınav psikolojisi hakkında sorularınızı yanıtlayabilirim.`,
      timestamp: 'Şimdi',
    },
  ]);

  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const samplePrompts = [
    'TYT Matematik 25 netten 35 nete nasıl çıkarılır?',
    'Öğrencinin TYT denemesinde 165 dakikayı derslere göre dağıtma stratejisi nedir?',
    'AYT Fizik elektrik ve manyetizma için 2 haftalık hızlandırma kampı hazırla.',
    'Sınav kaygısı yaşayan 12. sınıf öğrencisi için koçluk motivasyon konuşması yaz.',
  ];

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || inputQuestion;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: CoachChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuestion('');
    setIsLoading(true);

    const contextPrefix = activeStudent
      ? `Aktif Öğrenci: ${activeStudent.adSoyad}, Sınıf: ${activeStudent.sinif}, Alan: ${activeStudent.alan}, Hedef: ${activeStudent.hedefUniversite} ${activeStudent.hedefBolum}, Hedef Puan: ${activeStudent.hedefPuan}.\n`
      : '';

    try {
      const response = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend.trim(),
          context: contextPrefix,
        }),
      });

      const data = await response.json();

      const aiMessage: CoachChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.answer || 'Yanıt alınamadı.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      const errorMessage: CoachChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: 'Bağlantı hatası oluştu, lütfen sorunuzu tekrar gönderin.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-14rem)] min-h-[580px] flex flex-col bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">YKS Koçluk Asistanı</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Gemini 3.8 Destekli
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {activeStudent ? `Öğrenci: ${activeStudent.adSoyad}` : 'Tüm öğrenciler için koçluk rehberliği'}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                id: 'welcome-reset',
                sender: 'ai',
                text: 'Sohbet sıfırlandı. Yeni bir koçluk sorusu veya planı yazabilirsiniz.',
                timestamp: 'Şimdi',
              },
            ]);
          }}
          className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          title="Sohbeti Temizle"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 border border-slate-200 text-slate-800'
              }`}
            >
              <div className="whitespace-pre-line">{msg.text}</div>

              <div className="flex items-center justify-between gap-4 mt-2.5 pt-2 text-[10px] opacity-70 border-t border-black/5">
                <span>{msg.timestamp}</span>
                {msg.sender === 'ai' && (
                  <button
                    onClick={() => handleCopy(msg.text, msg.id)}
                    className="flex items-center gap-1 hover:opacity-100 transition-opacity"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Kopyalandı</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Kopyala</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Koçluk stratejisi ve tavsiyeler hazırlanıyor...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preset Suggestions */}
      {messages.length <= 2 && (
        <div className="px-4 sm:px-6 py-2 bg-slate-50/50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 shrink-0">Hızlı Sorular:</span>
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="text-xs font-medium text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-300 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="ai-coach-prompt-input"
            type="text"
            placeholder="Bir koçluk konusu veya öğrenci hedefi hakkında soru sorun..."
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder-slate-400"
          />
          <button
            id="ai-coach-send-btn"
            type="submit"
            disabled={isLoading || !inputQuestion.trim()}
            className="w-12 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-xs transition-all disabled:opacity-50 active:scale-95 shrink-0"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
};
