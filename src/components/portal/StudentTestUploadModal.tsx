import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Trash2, 
  Plus, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  BookOpen, 
  Eye, 
  Image as ImageIcon,
  ArrowRight,
  Send,
  HelpCircle,
  Clock,
  Layers,
  FileCheck
} from 'lucide-react';
import { Student, OgrenciSinavKaydi, Kazanim, DenemeSinavi } from '../../types';
import { analyzeAndSaveStudentTest } from '../../lib/apiService';
import { compressImageFile } from '../../utils/imageCompressor';

interface StudentTestUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  curriculum?: Kazanim[];
  onTestUploaded: (archive: OgrenciSinavKaydi, newDeneme?: DenemeSinavi) => void;
}

export const StudentTestUploadModal: React.FC<StudentTestUploadModalProps> = ({
  isOpen,
  onClose,
  student,
  curriculum = [],
  onTestUploaded,
}) => {
  // Form States
  const [testName, setTestName] = useState('');
  const [sinavTuru, setSinavTuru] = useState<'TYT' | 'AYT'>('TYT');
  const [isPracticeExam, setIsPracticeExam] = useState<boolean>(false);
  const [studentNote, setStudentNote] = useState('');
  const [manualQuestionCount, setManualQuestionCount] = useState<string>('20');
  const [manualDogruCount, setManualDogruCount] = useState<string>('');
  const [manualYanlisCount, setManualYanlisCount] = useState<string>('');
  const [showManualStats, setShowManualStats] = useState(false);

  // Photos State: array of base64 data URLs
  const [photos, setPhotos] = useState<string[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  // Processing & Status States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedArchive, setCompletedArchive] = useState<OgrenciSinavKaydi | null>(null);

  // Input refs
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Helper to process photo files in parallel with high speed
  const processPhotoFiles = async (fileList: FileList | null, sourceLabel: string) => {
    if (!fileList || fileList.length === 0) return;

    setErrorMessage(null);
    setIsProcessingPhoto(true);

    try {
      const filesArray = Array.from(fileList);
      const results = await Promise.all(
        filesArray.map(async (file) => {
          if (!file) return null;
          try {
            const compressed = await compressImageFile(file);
            return compressed && compressed.length > 50 ? compressed : null;
          } catch (err: any) {
            console.warn(`${sourceLabel} fotoğraf hatası:`, err);
            return null;
          }
        })
      );

      const validPhotos = results.filter(Boolean) as string[];
      if (validPhotos.length > 0) {
        setPhotos((prev) => [...prev, ...validPhotos]);
      } else {
        setErrorMessage(`${sourceLabel} fotoğrafları işlenemedi. Lütfen tekrar deneyin.`);
      }
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  // Handle Multi-file selection from gallery
  const handleGalleryFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await processPhotoFiles(e.target.files, 'Galeri');
    e.target.value = '';
  };

  // Handle Single or sequential camera snap
  const handleCameraSnap = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await processPhotoFiles(e.target.files, 'Kamera');
    e.target.value = '';
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Submit & Start Background AI Analysis or Direct Coach Send
  const handleSaveAndAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) {
      setErrorMessage('Lütfen çözdüğünüz teste bir isim veriniz.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    const hasPhotos = photos.length > 0;
    setProcessStep(
      hasPhotos
        ? 'Test kaydediliyor ve yapay zekâ analizine aktarılıyor...'
        : 'Test kaydediliyor ve koçunuza iletiliyor...'
    );

    const archiveId = `arch-student-${Date.now()}`;
    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0];
    const formattedTime = now.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const parsedTotal = parseInt(manualQuestionCount) || (hasPhotos ? photos.length * 4 : 20);
    const parsedDogru = parseInt(manualDogruCount) || 0;
    const parsedYanlis = parseInt(manualYanlisCount) || 0;
    const parsedBos = Math.max(0, parsedTotal - parsedDogru - parsedYanlis);
    const calculatedNet = Math.max(0, Number((parsedDogru - (parsedYanlis * 0.25)).toFixed(2)));

    const localArchive: OgrenciSinavKaydi = {
      id: archiveId,
      studentId: student.id,
      ogrenciAdSoyad: student.adSoyad,
      sinavTuru,
      sinavAdi: testName.trim(),
      tarih: formattedDate,
      toplamSoru: parsedTotal,
      dogruSayisi: parsedDogru,
      yanlisSayisi: parsedYanlis,
      bosSayisi: parsedBos,
      toplamNet: calculatedNet,
      net: calculatedNet,
      sorular: [],
      sayfaFotolari: photos,
      fotografYollari: photos,
      isNew: true,
      ogrenciYukledi: true,
      yuklemeZamani: formattedTime,
      durum: 'Yeni',
      isDeneme: isPracticeExam,
      aiStatus: hasPhotos ? 'processing' : 'completed',
      aiStatusMessage: hasPhotos
        ? 'Yapay zekâ soruları çözüyor (Devam ediyor)...'
        : 'Test koça iletildi (Öğrenci bildirimi)',
      ogrenciNotu: studentNote.trim(),
    };

    let newPracticeExam: DenemeSinavi | undefined = undefined;
    if (isPracticeExam) {
      newPracticeExam = {
        id: `exam-${archiveId}`,
        studentId: student.id,
        denemeAdi: testName.trim(),
        yayin: 'Optik / AI Yüklemesi',
        sinavTuru,
        tarih: formattedDate,
        toplamNet: calculatedNet,
        puan: Math.round(100 + calculatedNet * 3.8),
        dersler: [
          {
            dersAdi: sinavTuru === 'TYT' ? 'TYT Genel' : 'AYT Genel',
            dogru: parsedDogru,
            yanlis: parsedYanlis,
            bos: parsedBos,
            net: calculatedNet,
          },
        ],
        kocYorumu: studentNote.trim() || 'Optik AI Yüklemesinden Eklenen Deneme Sınavı Kaydı',
      };
    }

    try {
      const response = await analyzeAndSaveStudentTest({
        archiveId,
        studentId: student.id,
        studentName: student.adSoyad,
        testName: testName.trim(),
        sinavTuru,
        studentNote: studentNote.trim(),
        images: photos,
        existingCurriculum: curriculum,
      });

      const finalArchive: OgrenciSinavKaydi = response && response.archive 
        ? { 
            ...response.archive, 
            isDeneme: isPracticeExam,
            sayfaFotolari: (response.archive.sayfaFotolari && response.archive.sayfaFotolari.length > 0) 
              ? response.archive.sayfaFotolari 
              : ((response.archive.fotografYollari && response.archive.fotografYollari.length > 0) ? response.archive.fotografYollari : photos),
            fotografYollari: (response.archive.fotografYollari && response.archive.fotografYollari.length > 0) 
              ? response.archive.fotografYollari 
              : ((response.archive.sayfaFotolari && response.archive.sayfaFotolari.length > 0) ? response.archive.sayfaFotolari : photos),
          } 
        : localArchive;
      onTestUploaded(finalArchive, newPracticeExam);
      setCompletedArchive(finalArchive);
    } catch (err: any) {
      console.warn('Arka plan API kaydı uyarısı (lokal test güvenle korundu):', err);
      onTestUploaded(localArchive, newPracticeExam);
      setCompletedArchive(localArchive);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinishModal = () => {
    // Reset and close
    setTestName('');
    setPhotos([]);
    setStudentNote('');
    setManualQuestionCount('20');
    setManualDogruCount('');
    setManualYanlisCount('');
    setShowManualStats(false);
    setCompletedArchive(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200 font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto relative">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Çözülen Testi Fotoğrafla & Yükle</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500 text-white">
                  Yapay Zekâ Çözümlü
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Fotoğrafları ekleyin; yapay zekâ soruları çözsün, MEB kazanımlarını çıkarıp koçunuza iletsin.
              </p>
            </div>
          </div>

          {!isProcessing && (
            <button
              onClick={handleFinishModal}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Completed Success View */}
        {completedArchive ? (
          <div className="p-6 sm:p-8 space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {completedArchive.aiStatus === 'processing'
                    ? 'Test Kaydedildi & Yapay Zekâ İşliyor'
                    : 'Test Başarıyla Koça Gönderildi'}
                </span>
              </span>
              <h4 className="text-xl font-black text-slate-900">{completedArchive.sinavAdi}</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Testiniz koçunuzun ekranına <strong>"YENİ"</strong> uyarısıyla iletildi. Koçunuz tüm detayları inceleyebilir.
              </p>
            </div>

            {/* Score Summary Card */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 max-w-md mx-auto grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-2xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Soru</div>
                <div className="text-base font-black text-slate-800">{completedArchive.toplamSoru}</div>
              </div>
              <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 shadow-2xs">
                <div className="text-[10px] font-bold text-emerald-600 uppercase">Doğru</div>
                <div className="text-base font-black text-emerald-700">{completedArchive.dogruSayisi}</div>
              </div>
              <div className="p-2 bg-rose-50 rounded-xl border border-rose-100 shadow-2xs">
                <div className="text-[10px] font-bold text-rose-600 uppercase">Yanlış</div>
                <div className="text-base font-black text-rose-700">{completedArchive.yanlisSayisi}</div>
              </div>
              <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100 shadow-2xs">
                <div className="text-[10px] font-bold text-indigo-600 uppercase">Net</div>
                <div className="text-base font-black text-indigo-700">{completedArchive.toplamNet.toFixed(2)}</div>
              </div>
            </div>

            {/* Questions preview or Status note */}
            {completedArchive.sorular && completedArchive.sorular.length > 0 ? (
              <div className="text-left bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4 max-w-md mx-auto max-h-48 overflow-y-auto space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Çözülen Sorular & Kazanımlar ({completedArchive.sorular.length})</span>
                  <span className="text-[10px] text-slate-400">Yapay Zekâ Taraması</span>
                </div>
                {completedArchive.sorular.map((q) => (
                  <div key={q.soruNo} className="text-xs p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-start justify-between gap-2 shadow-2xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-700">
                          {q.soruNo}
                        </span>
                        <span>{q.ders} - {q.konu}</span>
                      </div>
                      {q.kazanimAciklama && (
                        <div className="text-[11px] text-slate-500 line-clamp-1">{q.kazanimAciklama}</div>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-bold text-slate-600">Seçim: {q.isaretlenenSik || 'Boş'}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                        q.dogruMu ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {q.dogruMu ? 'DOĞRU' : 'YANLIŞ'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : completedArchive.aiStatus === 'processing' ? (
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 max-w-md mx-auto flex items-center gap-3 text-left">
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
                <div>
                  <div className="font-bold">Yapay Zekâ Soruları Çözüyor ⏳</div>
                  <div className="text-indigo-700 text-[11px]">
                    Fotoğraflarınız sıraya alındı ve arka planda çözülüyor. Portala dönebilirsiniz, işlem bittiğinde kartınız otomatik güncellenecektir.
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 max-w-md mx-auto text-left">
                ✓ Test kaydınız ve notunuz koçunuza başarıyla iletildi.
              </div>
            )}

            <button
              onClick={handleFinishModal}
              className="w-full max-w-md mx-auto py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2"
            >
              <span>Portalıma Dön</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Upload Form */
          <form onSubmit={handleSaveAndAnalyze} className="p-5 sm:p-6 space-y-5">
            {/* Error banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Step 1: Test Name & Type */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>1. Test ve Sınav Bilgileri</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">Test / Deneme Adı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: 3D TYT Matematik Test 4, Limit AYT Yaprak Test"
                    value={testName}
                    onChange={(e) => {
                      setTestName(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    disabled={isProcessing}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Sınav Türü</label>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setSinavTuru('TYT')}
                      disabled={isProcessing}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        sinavTuru === 'TYT'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      TYT
                    </button>
                    <button
                      type="button"
                      onClick={() => setSinavTuru('AYT')}
                      disabled={isProcessing}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        sinavTuru === 'AYT'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      AYT
                    </button>
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
                    disabled={isProcessing}
                    className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <div className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      🎯 Bu sınav bir denemedir
                    </div>
                    <div className="text-[11px] font-medium text-indigo-700">
                      İşaretlendiğinde bu sınav 'Denemelerim' ekranında da kaydedilecek ve deneme istatistiklerine eklenecektir.
                    </div>
                  </div>
                </label>
              </div>

              {/* Optional Manual Question/Score Entry */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowManualStats(!showManualStats)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                >
                  <span>{showManualStats ? '− Soru & Doğru/Yanlış alanlarını gizle' : '+ İsteğe Bağlı: Soru Sayısı ve Doğru/Yanlış Girişi'}</span>
                </button>

                {showManualStats && (
                  <div className="grid grid-cols-3 gap-2.5 mt-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/90 animate-in fade-in duration-150">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600">Toplam Soru</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="20"
                        value={manualQuestionCount}
                        onChange={(e) => setManualQuestionCount(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-emerald-700">Doğru</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={manualDogruCount}
                        onChange={(e) => setManualDogruCount(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-rose-700">Yanlış</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={manualYanlisCount}
                        onChange={(e) => setManualYanlisCount(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-semibold text-rose-800"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Multi-Photo Actions (Camera & Gallery) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-indigo-600" />
                  <span>2. Soru Fotoğraflarını Ekle ({photos.length} Sayfa)</span>
                </div>
                <span className="text-[11px] text-slate-400">Çoklu fotoğraf desteklenir</span>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                className="hidden"
                onChange={handleGalleryFiles}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                capture="environment"
                className="hidden"
                onChange={handleCameraSnap}
              />

              {/* Processing notification */}
              {isProcessingPhoto && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold animate-pulse shadow-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
                  <span>Fotoğraf işleniyor ve sisteme kaydediliyor, lütfen bekleyin...</span>
                </div>
              )}

              {/* Photo Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isProcessing || isProcessingPhoto}
                  className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-indigo-900 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2 text-xs font-bold active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    {isProcessingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  </div>
                  <span>{isProcessingPhoto ? 'İşleniyor...' : '📷 Fotoğraf Çek (Kamera)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={isProcessing || isProcessingPhoto}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 transition-all flex items-center justify-center gap-2 text-xs font-bold active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <Upload className="w-4 h-4" />
                  </div>
                  <span>📁 Galeriden Çoklu Seç</span>
                </button>
              </div>

              {/* Thumbnails list */}
              {photos.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-500">Eklenen Sayfalar / Fotoğraflar:</div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200/80">
                    {photos.map((photo, index) => (
                      <div
                        key={index}
                        className="relative group aspect-3/4 rounded-xl overflow-hidden border border-slate-300 bg-black/5 shadow-2xs"
                      >
                        <img
                          src={photo}
                          alt={`Sayfa ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-slate-900/80 text-white text-[9px] font-bold">
                          Sayfa {index + 1}
                        </div>
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto(photo)}
                            className="p-1 rounded-lg bg-white/90 text-slate-900 hover:bg-white"
                            title="Büyüt"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index)}
                            className="p-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="aspect-3/4 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-indigo-600 transition-all text-[11px] font-bold"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Sayfa Ekle</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-center space-y-1.5">
                  <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="text-xs font-bold text-slate-600">Fotoğraf Eklenmedi (İsteğe Bağlı)</div>
                  <div className="text-[11px] text-slate-400">
                    Soru fotoğraflarını eklerseniz yapay zekâ soruları otomatik çözecektir. Fotoğraf eklemeden de test adı girip doğrudan koçunuza iletebilirsiniz.
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Optional Student Note */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Koçuna Özel Not (İsteğe Bağlı)</span>
                <span className="text-[10px] text-slate-400">Örn: Hangi sorularda zorlandın?</span>
              </label>
              <textarea
                rows={2}
                placeholder="Örn: Hocam 4. ve 7. sorularda şıklar arasında çok kararsız kaldım, bir göz atabilir misiniz?"
                value={studentNote}
                onChange={(e) => setStudentNote(e.target.value)}
                disabled={isProcessing}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-2xs resize-none"
              />
            </div>

            {/* Processing Overlay inside modal if working */}
            {isProcessing && (
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-center gap-3 animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600 shrink-0" />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold">{processStep}</div>
                  <div className="text-[11px] text-indigo-700">Lütfen bekleyin, test kaydı alınıyor...</div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all"
              >
                Vazgeç
              </button>

              <button
                type="submit"
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all flex items-center gap-2 active:scale-98"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Kaydediliyor...</span>
                  </>
                ) : photos.length > 0 ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Testi Kaydet & Yapay Zekâ Çözsün ({photos.length} Sayfa)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Testi Kaydet & Koça Gönder</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Full Image Preview Lightbox */}
        {previewPhoto && (
          <div className="fixed inset-0 z-60 bg-black/90 p-4 flex flex-col items-center justify-center animate-in fade-in duration-150">
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/20 text-white hover:bg-white/30"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewPhoto}
              alt="Büyük Önizleme"
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        )}

      </div>
    </div>
  );
};
