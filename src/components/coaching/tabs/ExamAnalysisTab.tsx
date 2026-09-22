import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  RotateCw,
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  Trash2, 
  Save, 
  Play, 
  Loader2, 
  Plus, 
  Image as ImageIcon,
  HelpCircle,
  FileCheck,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Student, OgrenciSinavKaydi, SinavSorusu, DenemeSinavi } from '../../../types';
import { compressImageFile } from '../../../utils/imageCompressor';
import { QuestionSolutionView } from '../QuestionSolutionView';

interface ExamAnalysisTabProps {
  student: Student;
  onSaveExamArchive: (archive: OgrenciSinavKaydi, newDeneme?: Omit<DenemeSinavi, 'id'>) => void;
  onNavigateToHistory: () => void;
}

export const ExamAnalysisTab: React.FC<ExamAnalysisTabProps> = ({
  student,
  onSaveExamArchive,
  onNavigateToHistory,
}) => {
  // Session State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sinavAdi, setSinavAdi] = useState('3D TYT Türkiye Geneli 2. Deneme');
  const [sinavTuru, setSinavTuru] = useState<'TYT' | 'AYT'>('TYT');
  const [tarih, setTarih] = useState(new Date().toISOString().split('T')[0]);
  const [isPracticeExam, setIsPracticeExam] = useState<boolean>(true);

  // Page photo & OCR states
  const [currentPageNo, setCurrentPageNo] = useState(1);
  const [currentImageBase64, setCurrentImageBase64] = useState<string | null>(null);
  const [isAnalyzingPage, setIsAnalyzingPage] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Zoom & Pan & Rotation
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Accumulated questions & pages in this exam session
  const [sorular, setSorular] = useState<SinavSorusu[]>([]);
  const [sayfaFotolari, setSayfaFotolari] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start new exam session
  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sinavAdi.trim()) return;
    setIsSessionActive(true);
    setSorular([]);
    setSayfaFotolari([]);
    setCurrentPageNo(1);
    setCurrentImageBase64(null);
  };

  // Handle Image Upload / Camera Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file);
      setCurrentImageBase64(compressed);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setAnalysisError(null);
    } catch (err) {
      console.warn("Fotoğraf sıkıştırma hatası:", err);
    }
  };

  // Analyze page with Gemini Vision OCR
  const handleAnalyzePage = async () => {
    if (!currentImageBase64) return;
    setIsAnalyzingPage(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/ai/analyze-exam-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: currentImageBase64,
          sinavTuru,
          sayfaNo: currentPageNo,
          studentName: student.adSoyad,
        }),
      });

      const data = await response.json();
      if (data.success && data.sorular && Array.isArray(data.sorular) && data.sorular.length > 0) {
        const newQuestions: SinavSorusu[] = data.sorular.map((s: any, idx: number) => {
          const rawCozum = s.cozumDetayi || s.cozum || '';
          const studentAns = s.ogrenciCevabi || s.isaretlenenSik || 'A';
          return {
            soruNo: s.soruNo || sorular.length + idx + 1,
            ders: s.ders || 'Matematik',
            unite: s.unite || '',
            konu: s.konu || 'Genel Soru',
            kazanimKodu: s.kazanimKodu || '',
            kazanimAciklama: s.kazanimAciklama || '',
            cozumDetayi: rawCozum,
            cozum: rawCozum,
            ogrenciCevabi: studentAns,
            isaretlenenSik: studentAns,
            dogruCevap: s.dogruCevap || 'A',
            dogruMu: s.dogruMu !== undefined ? Boolean(s.dogruMu) : (studentAns === s.dogruCevap && studentAns !== 'Boş'),
            analizNotu: s.analizNotu || '',
            sayfaNo: currentPageNo,
            sayfaFotoUrl: currentImageBase64,
          };
        });

        setSorular((prev) => [...prev, ...newQuestions]);
        if (!sayfaFotolari.includes(currentImageBase64)) {
          setSayfaFotolari((prev) => [...prev, currentImageBase64]);
        }

        // Advance page counter and reset image for next page
        setCurrentPageNo((prev) => prev + 1);
        setCurrentImageBase64(null);
      } else {
        setAnalysisError(data.error || 'Görselde soru tespit edilemedi veya yapay zekâ analiz yapamadı. Lütfen daha net bir fotoğraf yükleyin.');
      }
    } catch (err: any) {
      setAnalysisError('Sayfa analizi sırasında sunucu bağlantı hatası oluştu: ' + (err?.message || ''));
    } finally {
      setIsAnalyzingPage(false);
    }
  };

  // Zoom and rotation controls
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };
  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
  };

  // Pan image with mouse dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Toggle correct/wrong for a question manually
  // Toggle question status
  const handleToggleQuestionStatus = (index: number) => {
    setSorular((prev) => {
      const copy = [...prev];
      copy[index].dogruMu = !copy[index].dogruMu;
      return copy;
    });
  };

  // Update question solution
  const handleUpdateSolution = (index: number, newSolution: string) => {
    setSorular((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        cozumDetayi: newSolution,
        cozum: newSolution,
      };
      return copy;
    });
  };

  // Delete question
  const handleDeleteQuestion = (index: number) => {
    setSorular((prev) => prev.filter((_, i) => i !== index));
  };

  // Finish exam and save
  const handleFinishAndSaveExam = () => {
    if (sorular.length === 0) {
      alert('Kaydedilecek soru bulunmuyor. Lütfen en az bir sayfa analiz ediniz.');
      return;
    }

    const dogruSayisi = sorular.filter((s) => s.dogruMu).length;
    const bosSayisi = sorular.filter((s) => s.ogrenciCevabi === 'Boş' || !s.ogrenciCevabi).length;
    const yanlisSayisi = Math.max(0, sorular.length - dogruSayisi - bosSayisi);
    
    // Boşluk doldurma / açık uçlu soruları net hesabına katma, sadece çoktan seçmeli test tiplerini kat:
    const testQ = sorular.filter((s) => !s.soruTuru || s.soruTuru === 'coktan_secmeli');
    const testD = testQ.filter((s) => s.dogruMu).length;
    const testB = testQ.filter((s) => s.ogrenciCevabi === 'Boş' || !s.ogrenciCevabi).length;
    const testY = Math.max(0, testQ.length - testD - testB);
    const toplamNet = Number(Math.max(0, testD - testY * 0.25).toFixed(2));

    const examArchiveRecord: OgrenciSinavKaydi = {
      id: 'arch-' + Date.now(),
      studentId: student.id,
      sinavAdi,
      sinavTuru,
      tarih,
      toplamSoru: sorular.length,
      dogruSayisi,
      yanlisSayisi,
      bosSayisi,
      toplamNet,
      sayfaFotolari: sayfaFotolari.length > 0 ? sayfaFotolari : currentImageBase64 ? [currentImageBase64] : [],
      sorular,
    };

    // Calculate lesson branch nets
    const lessonMap = new Map<string, { dogru: number; yanlis: number; bos: number; testDogru: number; testYanlis: number }>();
    sorular.forEach((s) => {
      const current = lessonMap.get(s.ders) || { dogru: 0, yanlis: 0, bos: 0, testDogru: 0, testYanlis: 0 };
      const isTest = !s.soruTuru || s.soruTuru === 'coktan_secmeli';
      if (s.dogruMu) {
        current.dogru += 1;
        if (isTest) current.testDogru += 1;
      } else if (s.ogrenciCevabi === 'Boş') {
        current.bos += 1;
      } else {
        current.yanlis += 1;
        if (isTest) current.testYanlis += 1;
      }
      lessonMap.set(s.ders, current);
    });

    const dersler = Array.from(lessonMap.entries()).map(([dersAdi, counts]) => ({
      dersAdi,
      dogru: counts.dogru,
      yanlis: counts.yanlis,
      bos: counts.bos,
      net: Number(Math.max(0, counts.testDogru - counts.testYanlis * 0.25).toFixed(2)),
    }));

    const newPracticeExam: Omit<DenemeSinavi, 'id'> = {
      studentId: student.id,
      denemeAdi: sinavAdi,
      yayin: 'Fotoğraflı Optik Analiz',
      sinavTuru,
      tarih,
      toplamNet,
      puan: Math.round(100 + toplamNet * 3.8),
      dersler,
      kocYorumu: `AI Optik ile ${sorular.length} soru tespit edildi. ${dogruSayisi} Doğru, ${yanlisSayisi} Yanlış, ${bosSayisi} Boş.`,
    };

    onSaveExamArchive(examArchiveRecord, isPracticeExam ? newPracticeExam : undefined);
    setIsSessionActive(false);
    onNavigateToHistory();
  };

  const dogruSayisi = sorular.filter((s) => s.dogruMu).length;
  const bosSayisi = sorular.filter((s) => s.ogrenciCevabi === 'Boş' || !s.ogrenciCevabi).length;
  const yanlisSayisi = Math.max(0, sorular.length - dogruSayisi - bosSayisi);
  const testQCurrent = sorular.filter((s) => !s.soruTuru || s.soruTuru === 'coktan_secmeli');
  const testDCurrent = testQCurrent.filter((s) => s.dogruMu).length;
  const testBCurrent = testQCurrent.filter((s) => s.ogrenciCevabi === 'Boş' || !s.ogrenciCevabi).length;
  const testYCurrent = Math.max(0, testQCurrent.length - testDCurrent - testBCurrent);
  const currentNet = Number(Math.max(0, testDCurrent - testYCurrent * 0.25).toFixed(2));

  return (
    <div className="space-y-6">
      {/* Session Header / Setup */}
      {!isSessionActive ? (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                8. Fotoğraflı Sınav & Kazanım Analizi Oturumu
              </h3>
              <p className="text-xs text-slate-500">
                Öğrencinin çözdüğü kitapçık veya optik form fotoğraflarını yapay zekâ ile sayfa sayfa analiz edin
              </p>
            </div>
          </div>

          <form onSubmit={handleStartSession} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deneme / Sınav Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 3D TYT Türkiye Geneli 2. Deneme"
                  value={sinavAdi}
                  onChange={(e) => setSinavAdi(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sınav Türü</label>
                <select
                  value={sinavTuru}
                  onChange={(e) => setSinavTuru(e.target.value as 'TYT' | 'AYT')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="TYT">TYT (120 Soru)</option>
                  <option value="AYT">AYT (80 Soru)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Uygulama Tarihi</label>
                <input
                  type="date"
                  value={tarih}
                  onChange={(e) => setTarih(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Öğrenci</label>
                <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
                  {student.adSoyad} ({student.sinif} - {student.alan})
                </div>
              </div>
            </div>

            {/* Deneme Sınavı İşaretleme Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-3 cursor-pointer p-3 bg-indigo-50/70 hover:bg-indigo-50 border border-indigo-200/80 rounded-2xl transition-all">
                <input
                  type="checkbox"
                  checked={isPracticeExam}
                  onChange={(e) => setIsPracticeExam(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                    🎯 Bu sınav bir denemedir
                  </div>
                  <div className="text-[11px] font-medium text-indigo-700">
                    İşaretlendiğinde bu analiz sonuçları 'Denemeler' sekmesinde de kaydedilecek ve sınav istatistiklerine eklenecektir.
                  </div>
                </div>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all active:scale-95"
              >
                <Play className="w-4 h-4" />
                <span>Analiz Oturumunu Başlat</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Active Analysis Session View */
        <div className="space-y-6 animate-in fade-in">
          {/* Active Session Info Bar */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                  {sinavTuru}
                </span>
                <h3 className="text-base font-bold text-slate-900">{sinavAdi}</h3>
              </div>
              <p className="text-xs text-slate-400">
                Tarih: {tarih} • Şu anki Sayfa: <strong className="text-slate-700">Sayfa {currentPageNo}</strong> • Toplam İşlenen Soru: <strong className="text-indigo-700">{sorular.length}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">
                Net: <strong className="text-indigo-700 text-sm">{currentNet}</strong> ({dogruSayisi} D / {yanlisSayisi} Y)
              </div>

              <button
                onClick={handleFinishAndSaveExam}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>🏁 Sınavı Bitir ve Kaydet</span>
              </button>
            </div>
          </div>

          {/* 2-Column Working Area: Interactive Page Viewer (Left) + Question List / Results (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Side: Photo Upload & Zoomable Viewer */}
            <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Sayfa {currentPageNo} Fotoğrafı
                  </h4>
                </div>

                {/* Zoom controls */}
                {currentImageBase64 && (
                  <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={handleZoomIn}
                      className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200"
                      title="Yakınlaştır"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleZoomOut}
                      className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200"
                      title="Uzaklaştır"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleRotate}
                      className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200"
                      title="90° Döndür"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleResetZoom}
                      className="p-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200"
                      title="Sıfırla"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-bold text-slate-500 px-1.5">
                      {Math.round(zoom * 100)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Viewport Box */}
              <div className="relative w-full h-[420px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center select-none">
                {currentImageBase64 ? (
                  <div
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden"
                  >
                    <img
                      src={currentImageBase64}
                      alt="Kitapçık Sayfası"
                      style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                        transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                        transformOrigin: 'center center',
                      }}
                      className="max-w-full max-h-full object-contain pointer-events-none"
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer p-8 text-center text-slate-400 space-y-3 hover:text-slate-200 transition-colors"
                  >
                    <Upload className="w-10 h-10 mx-auto text-indigo-400 animate-bounce" />
                    <div>
                      <p className="text-xs font-bold text-white">
                        Sayfa {currentPageNo} Fotoğrafını Yükleyin veya Çekin
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        JPG, PNG veya akıllı telefon kamerası ile kitapçık sayfasını seçin
                      </p>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Analysis error */}
              {analysisError && (
                <div className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{analysisError}</span>
                </div>
              )}

              {/* Bottom Action for Page */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  {currentImageBase64 ? 'Farklı Fotoğraf Seç' : 'Fotoğraf Seç'}
                </button>

                <button
                  type="button"
                  disabled={!currentImageBase64 || isAnalyzingPage}
                  onClick={handleAnalyzePage}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all disabled:opacity-50 active:scale-95"
                >
                  {isAnalyzingPage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sayfa Taranıyor & Sorular Çözülüyor...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>🤖 Bu Sayfayı Çöz ve Sınava Ekle</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Side: Detected Questions List */}
            <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="text-sm font-bold text-slate-900">
                  Tespit Edilen Sorular ({sorular.length} Soru)
                </h4>
                <span className="text-[11px] text-slate-400">
                  Doğru/Yanlış durumunu değiştirmek için ikona tıklayın
                </span>
              </div>

              {/* Questions Scrollable Table/Cards */}
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {sorular.length > 0 ? (
                  sorular.map((s, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border transition-all text-xs space-y-2 ${
                        s.dogruMu
                          ? 'bg-emerald-50/40 border-emerald-200/80'
                          : s.ogrenciCevabi === 'Boş'
                          ? 'bg-slate-50 border-slate-200'
                          : 'bg-rose-50/40 border-rose-200/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                            {s.soruNo}
                          </span>
                          <span className="font-bold text-slate-900">{s.ders}</span>
                          <span className="text-slate-400">•</span>
                          <span className="font-semibold text-slate-700">{s.konu}</span>
                          {s.kazanimKodu && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white text-indigo-700 border border-slate-200">
                              {s.kazanimKodu}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleQuestionStatus(idx)}
                            className="p-1 rounded-lg hover:bg-white transition-colors"
                            title="Doğru/Yanlış Değiştir"
                          >
                            {s.dogruMu ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-rose-600" />
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteQuestion(idx)}
                            className="text-slate-300 hover:text-rose-600 p-1 rounded transition-colors"
                            title="Soruyu Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Options & Analysis */}
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/40">
                        <div className="flex items-center gap-2">
                          <span>
                            Öğrenci: <strong className="text-slate-900 font-bold">{s.ogrenciCevabi || 'Boş'}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Doğru Cevap: <strong className="text-emerald-700 font-bold">{s.dogruCevap}</strong>
                          </span>
                          <span>•</span>
                          <span className="text-slate-400">Sayfa {s.sayfaNo}</span>
                        </div>

                        {s.analizNotu && (
                          <span className="text-slate-500 italic max-w-xs truncate" title={s.analizNotu}>
                            💬 {s.analizNotu}
                          </span>
                        )}
                      </div>

                      {/* AI Step-by-step Solution Display & Editor */}
                      <QuestionSolutionView
                        cozumDetayi={s.cozumDetayi || s.cozum}
                        unite={s.unite}
                        konu={s.konu}
                        ders={s.ders}
                        soruNo={s.soruNo}
                        kazanimKodu={s.kazanimKodu}
                        kazanimAciklama={s.kazanimAciklama}
                        dogruCevap={s.dogruCevap}
                        ogrenciCevabi={s.ogrenciCevabi}
                        dogruMu={s.dogruMu}
                        canEdit={true}
                        onSaveSolution={(newSol) => handleUpdateSolution(idx, newSol)}
                      />
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center text-slate-400 space-y-2">
                    <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold">Henüz bu oturumda soru işlenmedi.</p>
                    <p className="text-[11px]">Sol taraftan sayfa fotoğrafını yükleyip "Bu Sayfayı Çöz ve Sınava Ekle" butonuna basın.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
