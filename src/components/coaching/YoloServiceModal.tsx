import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Server, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Sliders, 
  Terminal, 
  FileText, 
  Zap, 
  X, 
  ExternalLink,
  ShieldCheck,
  Eye,
  Layers,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Code,
  HelpCircle,
  Wand2,
  RotateCw,
  RotateCcw,
  Undo2,
  BookOpen
} from 'lucide-react';
import { 
  getYoloConfig, 
  saveYoloConfig, 
  testYoloConnection, 
  testYoloDetection,
  detectImageOrientationWithOcr
} from '../../lib/apiService';
import { YoloServiceConfig } from '../../types';
import { autoStraightenPageImage, rotateImageCanvas } from '../../utils/imageDewarper';

interface YoloServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const YoloServiceModal: React.FC<YoloServiceModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ayarlar' | 'test' | 'rehber' | 'dosyalar'>('ayarlar');

  const [config, setConfig] = useState<YoloServiceConfig>({
    enabled: false,
    serviceUrl: 'http://localhost:8000',
    confThreshold: 0.22,
    margin: 0,
    minSize: 35,
    autoDewarp: true,
    autoRotate: true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{
    success: boolean;
    status: string;
    latency_ms?: number;
    health?: any;
    error?: string;
  } | null>(null);

  // Live Test states
  const [testImageBase64, setTestImageBase64] = useState<string | null>(null);
  const [originalImageBase64, setOriginalImageBase64] = useState<string | null>(null);
  const [rotationStatusNotice, setRotationStatusNotice] = useState<string | null>(null);
  const [isStraightening, setIsStraightening] = useState<boolean>(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectResult, setDetectResult] = useState<any>(null);
  const [testConfThreshold, setTestConfThreshold] = useState<number>(0.22);
  const [testAutoDewarp, setTestAutoDewarp] = useState<boolean>(true);
  const [testAutoRotate, setTestAutoRotate] = useState<boolean>(true);

  // Package download & files state
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [packageFiles, setPackageFiles] = useState<Array<{ path: string; content: string }>>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copiedFile, setCopiedFile] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
      loadPackageFiles();
    }
  }, [isOpen]);

  const loadPackageFiles = async () => {
    try {
      const res = await fetch('/api/yolo-service/package-files');
      if (res.ok) {
        const data = await res.json();
        if (data.files && Array.isArray(data.files)) {
          setPackageFiles(data.files);
        }
      }
    } catch (e) {
      console.warn('Dosya listesi yüklenemedi:', e);
    }
  };

  const handleDownloadPackage = async () => {
    setIsDownloading(true);
    setDownloadSuccess(false);
    try {
      const response = await fetch('/api/yolo-service/download-package');
      const contentType = response.headers.get('content-type') || '';
      
      if (response.ok && (contentType.includes('zip') || contentType.includes('octet-stream'))) {
        const blob = await response.blob();
        if (blob.size > 200) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'deneme_yolo_ubuntu_paketi.zip';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          setDownloadSuccess(true);
          setTimeout(() => setDownloadSuccess(false), 3000);
          return;
        }
      }

      let files = packageFiles;
      if (!files || files.length === 0) {
        const jsonRes = await fetch('/api/yolo-service/package-files');
        const jsonData = await jsonRes.json();
        files = jsonData.files || [];
      }

      if (files.length === 0) {
        throw new Error('İndirilecek servis dosyaları bulunamadı.');
      }

      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      for (const f of files) {
        zip.file(f.path, f.content);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'deneme_yolo_ubuntu_paketi.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err: any) {
      console.error('Paket indirme hatası:', err);
      alert('Paket indirilemedi: ' + (err.message || 'Lütfen bağlantıyı kontrol edin.'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSingleFile = (file: { path: string; content: string }) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.path.split('/').pop() || 'file.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleCopyFileContent = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const data = await getYoloConfig();
      if (data && data.config) {
        setConfig(data.config);
        if (data.config.confThreshold) {
          setTestConfThreshold(data.config.confThreshold);
        }
        if (data.config.autoDewarp !== undefined) {
          setTestAutoDewarp(data.config.autoDewarp);
        }
        if (data.config.autoRotate !== undefined) {
          setTestAutoRotate(data.config.autoRotate);
        }
      }
      if (data && data.onlineStatus !== undefined) {
        setConnectionResult({
          success: data.onlineStatus,
          status: data.onlineStatus ? 'online' : 'offline',
          latency_ms: data.latency_ms,
          health: data.health
        });
      }
    } catch (e) {
      console.error('YOLO ayarları yüklenemedi:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveYoloConfig(config);
      await handleTestPing();
    } catch (e) {
      alert('Ayarlar kaydedilirken hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPing = async () => {
    setIsTestingConnection(true);
    setConnectionResult(null);
    try {
      const res = await testYoloConnection(config.serviceUrl);
      setConnectionResult(res);
    } catch (e: any) {
      setConnectionResult({
        success: false,
        status: 'offline',
        error: e.message || 'Bağlantı kurulamadı'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleOcrOrientation = async (base64Input?: string) => {
    const targetB64 = base64Input || testImageBase64 || originalImageBase64;
    if (!targetB64) return;
    setIsStraightening(true);
    setRotationStatusNotice("📖 OCR ile metin yönü analiz ediliyor...");
    try {
      const ocrRes = await detectImageOrientationWithOcr(targetB64);
      if (ocrRes.success) {
        const rot = ocrRes.rotationNeeded ?? 0;
        let finalB64 = targetB64;
        if (rot !== 0) {
          finalB64 = await rotateImageCanvas(targetB64, rot);
        }
        setTestImageBase64(finalB64);
        setDetectResult(null);
        const snippet = ocrRes.detectedText ? `"${ocrRes.detectedText}"` : "";
        const descText = rot === 0 ? 'Yazılar düzgün' : `${rot}° çevrildi`;
        setRotationStatusNotice(`📖 OCR: ${snippet} (${descText})`);
      } else {
        const res = await autoStraightenPageImage(targetB64);
        setTestImageBase64(res.straightenedBase64);
        setRotationStatusNotice(`✅ ${res.desc}`);
      }
    } catch (e: any) {
      console.warn("OCR yön tespiti hatası:", e);
      try {
        const res = await autoStraightenPageImage(targetB64);
        setTestImageBase64(res.straightenedBase64);
        setRotationStatusNotice(`✅ ${res.desc}`);
      } catch {}
    } finally {
      setIsStraightening(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setOriginalImageBase64(b64);
      setDetectResult(null);
      setRotationStatusNotice(null);

      // Anında (gecikmesiz) görsel yükleme ve boyut kontrolü
      const img = new Image();
      img.onload = async () => {
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;

        // Fotoğraf yatay çekilmişse (w > h) akıllı OCR ile doğrult
        if (origW > origH * 1.05 && testAutoRotate) {
          setTestImageBase64(b64);
          try {
            await handleOcrOrientation(b64);
          } catch {
            const res = await autoStraightenPageImage(b64);
            setTestImageBase64(res.straightenedBase64);
            setRotationStatusNotice(`✅ ${res.desc}`);
          }
        } else {
          setTestImageBase64(b64);
          setRotationStatusNotice("Görsel hazır. Sayfa yönünü aşağıdaki '180° Ters Çevir' veya '90° Çevir' butonlarıyla kontrol edebilirsiniz.");
        }
      };
      img.src = b64;
    };
    reader.readAsDataURL(file);
  };

  const handleManualRotate = async (angle: number) => {
    if (!testImageBase64) return;
    setIsStraightening(true);
    try {
      const rotated = await rotateImageCanvas(testImageBase64, angle);
      setTestImageBase64(rotated);
      setDetectResult(null);
      const angleText = angle === 90 ? '90° Sağa' : angle === -90 ? '90° Sola' : angle === 180 ? '180° Baş Aşağı' : `${angle}°`;
      setRotationStatusNotice(`🔄 Sayfa ${angleText} çevrildi.`);
    } catch (e: any) {
      console.warn("Döndürme hatası:", e);
    } finally {
      setIsStraightening(false);
    }
  };

  const handleManualAutoStraighten = async () => {
    await handleOcrOrientation();
  };

  const handleResetToOriginal = () => {
    if (originalImageBase64) {
      setTestImageBase64(originalImageBase64);
      setDetectResult(null);
      setRotationStatusNotice("Orijinal ham fotoğrafa dönüldü.");
    }
  };

  const handleRunDetectionTest = async () => {
    if (!testImageBase64) return;
    setIsDetecting(true);
    setDetectResult(null);
    try {
      // Görsel arayüzde zaten kullanıcı tarafından kontrol edilip onaylandığı için
      // Ubuntu tarafında yanlış bir ters döndürme yapılmaması adına arayüzdeki mevcut açıyı koruyarak tarıyoruz
      const res = await testYoloDetection(testImageBase64, {
        serviceUrl: config.serviceUrl,
        confThreshold: testConfThreshold,
        margin: config.margin,
        minSize: config.minSize,
        autoDewarp: testAutoDewarp,
        autoRotate: false,
        forceOrientation: 0
      });
      setDetectResult(res);
    } catch (e: any) {
      alert('Test sırasında hata oluştu: ' + (e.message || 'Bilinmeyen hata'));
    } finally {
      setIsDetecting(false);
    }
  };

  if (!isOpen) return null;

  const detectedQuestionsCount = detectResult?.total_questions ?? detectResult?.count ?? (detectResult?.questions?.length || 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200/90 max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/90 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
              <Cpu className="w-6 h-6 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Yerel YOLO & Ubuntu Soru Tespit Servisi
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  YOLOv8 / YOLOv11 NANO
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Filigran silme, yay (arc) düzeltme ve yarım soruları eleyen özel lokal mimari
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPackage}
              disabled={isDownloading}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer ${
                downloadSuccess 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white'
              }`}
              title="Ubuntu sunucu ve eğitim paketini indir"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Paketleniyor...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>İndirildi!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Paketi İndir (.ZIP)</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-2 bg-slate-100 border-b border-slate-200 text-xs font-bold px-4 sm:px-6 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('ayarlar')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeSubTab === 'ayarlar'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Servis & Model Ayarları</span>
          </button>

          <button
            onClick={() => setActiveSubTab('test')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeSubTab === 'test'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Canlı Görsel Testi</span>
          </button>

          <button
            onClick={() => setActiveSubTab('rehber')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeSubTab === 'rehber'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Ubuntu & Eğitim Rehberi</span>
          </button>

          <button
            onClick={() => setActiveSubTab('dosyalar')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeSubTab === 'dosyalar'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Dosyalar & Kodlar</span>
          </button>

          <div className="ml-auto sm:hidden shrink-0">
            <button
              onClick={handleDownloadPackage}
              disabled={isDownloading}
              className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center"
              title="Paketi İndir"
            >
              {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: AYARLAR */}
          {activeSubTab === 'ayarlar' && (
            <div className="space-y-5">
              {/* Ana Aç/Kapa ve Durum Kartı */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-sm">Yerel Ubuntu YOLO Servisini Aktif Et</span>
                    {config.enabled ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                        Açık
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider">
                        Devre Dışı
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Açık olduğunda, sınav fotoğrafları önce yerel Ubuntu sunucunuzdaki FastAPI YOLO servisine gönderilip kırpılır.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-13 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Sunucu URL & Test Ping */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                    Ubuntu Servis URL Adresi (FastAPI)
                  </label>
                  <button
                    onClick={handleTestPing}
                    disabled={isTestingConnection}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    {isTestingConnection ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>Bağlantıyı Test Et</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Server className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={config.serviceUrl}
                      onChange={(e) => setConfig({ ...config, serviceUrl: e.target.value })}
                      placeholder="http://192.168.1.50:8000 veya http://localhost:8000"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs font-mono text-slate-800 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Bağlantı Sonucu Rozeti */}
                {connectionResult && (
                  <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                    connectionResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    <div className="flex items-center gap-2">
                      {connectionResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold">
                          {connectionResult.success ? 'Servis Çevrimiçi' : 'Servise Bağlanılamadı'}
                        </span>
                        {connectionResult.latency_ms && (
                          <span className="text-[11px] opacity-75 ml-2">
                            ({connectionResult.latency_ms} ms yanıt süresi)
                          </span>
                        )}
                        {connectionResult.health?.model_loaded && (
                          <div className="text-[10px] text-emerald-700 mt-0.5">
                            Yüklü Model: <strong>{connectionResult.health.model_name}</strong>
                          </div>
                        )}
                        {connectionResult.error && (
                          <div className="text-[10px] text-rose-700 mt-0.5">
                            {connectionResult.error}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Gelişmiş Parametreler */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  <span>Kırpma ve Filtreleme Hassasiyeti</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  {/* Confidence Threshold */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>Güven Eşiği (Conf):</span>
                      <span className="font-mono text-indigo-600">%{Math.round(config.confThreshold * 100)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.95"
                      step="0.05"
                      value={config.confThreshold}
                      onChange={(e) => setConfig({ ...config, confThreshold: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500">
                      Yalnızca bu oranın üzerindeki kesin sorular kabul edilir.
                    </p>
                  </div>

                  {/* Kenar Marjı */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>Kenar Güvenlik Marjı:</span>
                      <span className="font-mono text-indigo-600">{config.margin} px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      step="2"
                      value={config.margin}
                      onChange={(e) => setConfig({ ...config, margin: parseInt(e.target.value) })}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500">
                      Sayfa kenarına yapışık yarım soruları elemek için tampon bölge.
                    </p>
                  </div>

                  {/* Min Boyut */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>Minimum Soru Boyutu:</span>
                      <span className="font-mono text-indigo-600">{config.minSize} px</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="150"
                      step="5"
                      value={config.minSize}
                      onChange={(e) => setConfig({ ...config, minSize: parseInt(e.target.value) })}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500">
                      Sayfa numarası veya küçük gürültüleri engeller.
                    </p>
                  </div>
                </div>

                {/* Auto Dewarp Checkbox */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800 text-xs">
                      Akıllı Çok Bantlı Yay (Arc / Dewarp) Düzeltme
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Kitapçık cilt kıvrımlarını ve bükülmeleri çok bantlı regresyon haritalamasıyla cetvel gibi düzleştirir.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.autoDewarp}
                      onChange={(e) => setConfig({ ...config, autoDewarp: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Auto Rotate & Deskew Checkbox */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800 text-xs">
                      Otomatik Dikleştirme (90°/180°/270° & İnce Açı Deskew)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Yan veya ters çekilmiş fotoğrafları dikey A4 portrait formatına getirir, küçük eğrilikleri dikleştirir.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.autoRotate ?? true}
                      onChange={(e) => setConfig({ ...config, autoRotate: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              {/* Alt Butonlar */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Ayarları Kaydet & Uygula</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CANLI GÖRSEL TESTİ */}
          {activeSubTab === 'test' && (
            <div className="space-y-5">
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-800">
                      Örnek Deneme Sayfası Canlı Testi
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Bir sayfa fotoğrafı seçin. YOLO modelinizin tespit ettiği yeşil soru çerçevelerini burada canlı görün.
                    </p>
                  </div>
                  <label className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer transition-colors shadow-xs flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{testImageBase64 ? 'Fotoğrafı Değiştir' : 'Fotoğraf Seç'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Hızlı Test Ayarları Çubuğu */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Güven Eşiği Test Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-700 text-[11px]">
                      <span>Test Güven Eşiği (Conf):</span>
                      <span className="font-mono text-indigo-600">%{Math.round(testConfThreshold * 100)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.10"
                      max="0.85"
                      step="0.02"
                      value={testConfThreshold}
                      onChange={(e) => setTestConfThreshold(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex items-center gap-1 pt-0.5">
                      <button
                        onClick={() => setTestConfThreshold(0.15)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${testConfThreshold === 0.15 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        %15 (Ultra)
                      </button>
                      <button
                        onClick={() => setTestConfThreshold(0.22)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${testConfThreshold === 0.22 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        %22 (Önerilen)
                      </button>
                      <button
                        onClick={() => setTestConfThreshold(0.35)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${testConfThreshold === 0.35 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        %35 (Dengeli)
                      </button>
                    </div>
                  </div>

                  {/* 90/180/270 Otomatik Dikleştirme Toggle */}
                  <div className="flex items-center justify-between pl-0 md:pl-3 md:border-l md:border-slate-200">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                        <RotateCw className="w-3 h-3 text-indigo-600" />
                        <span>Otomatik Dikleştirme</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {testAutoRotate ? '90°/180°/270° & Deskew' : 'Döndürme kapalı'}
                      </div>
                    </div>
                    <button
                      onClick={() => setTestAutoRotate(!testAutoRotate)}
                      className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-colors cursor-pointer ${
                        testAutoRotate ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {testAutoRotate ? 'Açık (Dikleştir)' : 'Kapalı'}
                    </button>
                  </div>

                  {/* Yay & Dewarp Düzeltme Toggle */}
                  <div className="flex items-center justify-between pl-0 md:pl-3 md:border-l md:border-slate-200">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                        <Wand2 className="w-3 h-3 text-emerald-600" />
                        <span>Akıllı Yay (Dewarp)</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {testAutoDewarp ? 'Çok bantlı eğrilik düzeltici' : 'Yay düzeltme kapalı'}
                      </div>
                    </div>
                    <button
                      onClick={() => setTestAutoDewarp(!testAutoDewarp)}
                      className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-colors cursor-pointer ${
                        testAutoDewarp ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {testAutoDewarp ? 'Açık (Dewarp)' : 'Kapalı'}
                    </button>
                  </div>
                </div>

                {testImageBase64 && (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    {/* Hızlı Dikleştirme & Döndürme Araç Çubuğu */}
                    <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                          <RotateCw className="w-4 h-4 text-indigo-600" />
                          <span>Görsel Yönü & Dikleştirme Kontrolü:</span>
                        </div>
                        {rotationStatusNotice && (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-lg animate-in fade-in">
                            {rotationStatusNotice}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <button
                          type="button"
                          onClick={() => handleManualRotate(90)}
                          disabled={isStraightening || isDetecting}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                          title="Görseli 90 derece saat yönünde çevir"
                        >
                          <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
                          <span>90° Sağa Çevir</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleManualRotate(-90)}
                          disabled={isStraightening || isDetecting}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                          title="Görseli 90 derece saat yönünün tersine çevir"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                          <span>90° Sola Çevir</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleManualRotate(180)}
                          disabled={isStraightening || isDetecting}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-300 text-amber-900 font-black shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                          title="Görsel baş aşağıysa 180 derece ters çevirip düzelt"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                          <span>180° Ters Çevir</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleManualAutoStraighten}
                          disabled={isStraightening || isDetecting}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                          title="Görseldeki Türkçe metinleri OCR ile okuyup tam doğru yöne dikleştirir"
                        >
                          {isStraightening ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5 text-indigo-200" />}
                          <span>📖 OCR ile Yönü Oku & Dikleştir</span>
                        </button>

                        {originalImageBase64 && originalImageBase64 !== testImageBase64 && (
                          <button
                            type="button"
                            onClick={handleResetToOriginal}
                            disabled={isStraightening || isDetecting}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium flex items-center gap-1 transition-all cursor-pointer"
                            title="Orijinal ilk yüklenen fotoğrafa geri dön"
                          >
                            <Undo2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>İlk Haline Dön</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                      <button
                        onClick={handleRunDetectionTest}
                        disabled={isDetecting || isStraightening}
                        className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition-all"
                      >
                        {isDetecting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                            <span>Ubuntu YOLO Analiz Ediyor...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 text-amber-400" />
                            <span>Ubuntu YOLO ile Testi Çalıştır</span>
                          </>
                        )}
                      </button>

                      <span className="text-[11px] text-slate-500">
                        Hedef Sunucu: <code className="text-slate-800 font-mono font-bold">{config.serviceUrl}</code>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Görsel Önizleme Alanı - Fotoğraf seçildiği andan itibaren her zaman dikey olarak görünür */}
              {testImageBase64 && (
                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-950 p-3 space-y-2 animate-in fade-in">
                  <div className="text-[11px] text-slate-300 font-mono flex items-center justify-between px-1 flex-wrap gap-2">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {detectResult?.preview_image 
                          ? 'YOLO Soru Sınırları & Kırpma Önizlemesi (Yeşil Çerçeveler)' 
                          : 'Dikey A4 Sayfa Önizlemesi (İşlenmeye Hazır)'}
                      </span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleManualRotate(180)}
                        disabled={isStraightening || isDetecting}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-xs"
                        title="Sayfa baş aşağıysa tek tıkla 180 derece ters çevir"
                      >
                        <RefreshCw className="w-3 h-3 text-amber-300" />
                        <span>Baş Aşağıysa: 180° Çevir</span>
                      </button>
                      <span className="text-[10px] text-slate-400">
                        {detectResult?.width && detectResult?.height 
                          ? `${detectResult.width}x${detectResult.height} px` 
                          : 'Önizleme'}
                      </span>
                    </div>
                  </div>

                  <div className="relative flex items-center justify-center bg-slate-900 rounded-xl overflow-hidden min-h-[300px]">
                    <img
                      src={detectResult?.preview_image || detectResult?.preview_image_base64 || testImageBase64}
                      alt="YOLO Tespit Önizlemesi"
                      className="max-h-[550px] w-auto max-w-full object-contain rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Görsel Sonuç ve İstatistik Alanı */}
              {detectResult && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {detectResult.success === false ? (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Test Sırasında Hata Oluştu</span>
                      </div>
                      <p className="text-[11px] text-rose-700">
                        {detectResult.error || 'Servis yanıt veremedi. Lütfen Ubuntu sunucunuzun açık ve servisin çalıştığından emin olun.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Durum Rozeti */}
                      <div className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        detectedQuestionsCount > 0 
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                          : 'bg-amber-50 border-amber-200 text-amber-950'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          {detectedQuestionsCount > 0 ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                          )}
                          <div>
                            <span className="font-black text-sm">
                              {detectedQuestionsCount > 0 
                                ? `🎉 ${detectedQuestionsCount} Adet Soru Başarıyla Tespit Edildi!` 
                                : `⚠️ Bu Görselde 0 Soru Tespit Edildi`}
                            </span>
                            {detectResult.model && (
                              <div className="text-[11px] opacity-85 mt-0.5">
                                Aktif Model: <strong className="font-mono">{detectResult.model}</strong>
                              </div>
                            )}
                          </div>
                        </div>

                        {detectResult.process_time_ms !== undefined && (
                          <span className="text-[10px] font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 self-start sm:self-auto">
                            İşlem Süresi: {detectResult.process_time_ms} ms
                          </span>
                        )}
                      </div>

                      {/* Düzeltme & Ön İşleme İstatistikleri Rozetleri */}
                      <div className="flex items-center gap-2 flex-wrap text-[11px]">
                        {detectResult.rotation_desc && (
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-medium flex items-center gap-1.5 shadow-2xs">
                            <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
                            <span><strong>Yön & Açı:</strong> {detectResult.rotation_desc}</span>
                          </span>
                        )}
                        {detectResult.dewarp_applied ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium flex items-center gap-1.5 shadow-2xs">
                            <Wand2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span><strong>Yay Düzeltildi:</strong> {detectResult.dewarp_sag_px}px (%{detectResult.dewarp_sag_percent}%)</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 font-medium flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-slate-400" />
                            <span>Sayfa Yayı Düzgün</span>
                          </span>
                        )}
                        {detectResult.model && (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-mono text-[10px]">
                            Model: {detectResult.model}
                          </span>
                        )}
                      </div>

                      {/* 0 Soru Tespit Edildiğinde Çözüm Rehberi */}
                      {detectedQuestionsCount === 0 && (
                        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-amber-950 text-xs space-y-2.5">
                          <div className="font-bold flex items-center gap-2 text-amber-900">
                            <HelpCircle className="w-4 h-4 text-amber-600" />
                            <span>Kutu Oluşmamasının 3 Temel Nedeni ve Çözümü:</span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                            <div className="p-2.5 rounded-xl bg-white border border-amber-200/60 space-y-1">
                              <strong className="text-amber-900 block font-bold">1. Temel Model Devrede:</strong>
                              <p className="text-slate-600">
                                Sunucuda <code>best.pt</code> yerine temel <code>yolov8n.pt</code> yüklü olabilir. Temel model soruları tanımaz. Sunucuda servisi yeniden başlatın:
                              </p>
                              <code className="text-[10px] font-mono bg-slate-100 px-1 py-0.5 rounded text-indigo-700 block">
                                sudo systemctl restart deneme_soru.service
                              </code>
                            </div>

                            <div className="p-2.5 rounded-xl bg-white border border-amber-200/60 space-y-1">
                              <strong className="text-amber-900 block font-bold">2. Güven Eşiği Yüksek:</strong>
                              <p className="text-slate-600">
                                Model soruları %30-40 güvenle bulmuş olabilir. Yukarıdaki kaydırıcıyı <strong>%15 (Ultra)</strong> veya <strong>%22</strong> seviyesine çekip tekrar deneyin.
                              </p>
                            </div>

                            <div className="p-2.5 rounded-xl bg-white border border-amber-200/60 space-y-1">
                              <strong className="text-amber-900 block font-bold">3. Dikleştirme & Yön:</strong>
                              <p className="text-slate-600">
                                Yukarıdaki <strong>"90° Sağa / Sola Çevir"</strong> butonlarıyla sayfanın başlığının üstte olduğundan emin olun ve testi tekrar çalıştırın.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tespit Edilen Soru Listesi Tablosu */}
                      {detectResult.questions && detectResult.questions.length > 0 && (
                        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                          <div className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Tespit Edilen Koordinatlar ({detectResult.questions.length} Soru)</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                            {detectResult.questions.map((q: any, i: number) => (
                              <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                                <div className="font-bold text-slate-800 flex items-center justify-between">
                                  <span>Soru {q.soru_no || i + 1}</span>
                                  <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">
                                    %{Math.round((q.confidence || 0.9) * 100)}
                                  </span>
                                </div>
                                <div className="text-[9px] font-mono text-slate-400 mt-1">
                                  {q.pixel_coords ? `[${q.pixel_coords.x1},${q.pixel_coords.y1}] → [${q.pixel_coords.x2},${q.pixel_coords.y2}]` : ''}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: UBUNTU & EĞİTİM REHBERİ */}
          {activeSubTab === 'rehber' && (
            <div className="space-y-4 text-xs leading-relaxed text-slate-700">
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-amber-400">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    <span>Ubuntu 4GB RAM & 4 Çekirdek CPU Mimarisi</span>
                  </div>
                  <button
                    onClick={handleDownloadPackage}
                    disabled={isDownloading}
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isDownloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    <span>Tüm Dosyaları İndir (.ZIP)</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-300">
                  Bu mimari, 4 GB RAM ve ekran kartsız Ubuntu sistemlerde kilitlenmeyi önlemek için özel olarak <code>imgsz=416</code>, <code>workers=1</code>, <code>gc.collect()</code> ve otomatik systemd yeniden başlatması ile optimize edilmiştir.
                </p>
              </div>

              {/* Steps Accordion / Cards */}
              <div className="space-y-3">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="font-black text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Kendi Bilgisayarınızda Veri Toplama & Etiketleme (LabelImg)</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    50-100 adet deneme sayfası fotoğrafı çekin. Ücretsiz <code>LabelImg</code> aracıyla fotoğrafları açın.
                  </p>
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium">
                    ⚠️ <strong>Kritik Kural:</strong> Sadece sayfada <strong>tam ve eksiksiz görünen soruları</strong> <code>question</code> etiketiyle işaretleyin. Kenarda yarım çıkmış veya şıkları kadraja girmemiş soruları bilerek boş bırakın! Böylece yapay zekâ yarım soruları gürültü saymayı öğrenecektir.
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="font-black text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Model Eğitimi (train.py)</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    İndirdiğiniz paketteki <code>train.py</code> scriptini kendi bilgisayarınızda çalıştırın:
                  </p>
                  <pre className="p-2.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                    pip install ultralytics torch opencv-python-headless{'\n'}
                    python train.py
                  </pre>
                  <p className="text-[11px] text-slate-600">
                    Eğitim bittiğinde oluşan <strong>best_question_detector.pt</strong> dosyasını alın.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="font-black text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">3</span>
                    <span>Ubuntu Sunucuda Servisi Başlatma</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Ubuntu makinenizde klasörün içine girip tek komutla kurulumu tamamlayın:
                  </p>
                  <pre className="p-2.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                    chmod +x setup_ubuntu.sh{'\n'}
                    ./setup_ubuntu.sh
                  </pre>
                  <p className="text-[11px] text-slate-600">
                    Servis Ubuntu arkasında <code>systemd</code> daemon'ı olarak 7/24 çalışacak ve <code>http://[UBUNTU_IP]:8000</code> portundan web uygulamamıza hizmet verecektir.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 space-y-2">
                  <div className="font-black text-indigo-950 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">4</span>
                    <span>Birden Fazla Eğitim Verme (Verileri Birleştirme veya Temizleme)</span>
                  </div>
                  <p className="text-[11px] text-indigo-900/90 leading-relaxed">
                    <strong>Evet!</strong> Modeli defalarca eğitebilirsiniz. <code>python train.py</code> komutunu çalıştırdığınızda script size iki kritik soru sorar:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-white border border-indigo-100 text-slate-700 space-y-1">
                      <strong className="text-indigo-950 flex items-center gap-1">➕ Veri Seti Seçimi:</strong>
                      <p>Önceki sayfaları koruyup yenilerini <strong>ÜZERİNE EKLEME</strong> veya eskiyi güvenle yedekleyip <strong>SİLEREK</strong> sadece yeni verilerle başlama.</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-indigo-100 text-slate-700 space-y-1">
                      <strong className="text-indigo-950 flex items-center gap-1">🧠 Model Ağırlığı (Fine-Tuning):</strong>
                      <p>Önceki <code>best_question_detector.pt</code> tecrübesini koruyarak devam etme veya sıfırdan temel modelle eğitme.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DOSYALAR & KODLAR */}
          {activeSubTab === 'dosyalar' && (
            <div className="space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                <div>
                  <div className="font-black text-indigo-950 text-sm flex items-center gap-2">
                    <Code className="w-4 h-4 text-indigo-600" />
                    <span>Ubuntu & Eğitim Dosyalarını Görüntüle ve Kopyala</span>
                  </div>
                  <p className="text-[11px] text-indigo-900/80 mt-0.5">
                    Zip indirmeden de tüm Python scriptlerini, servis yapılandırmalarını ve kurulum betiklerini buradan tek tıkla kopyalayabilir veya tek tek indirebilirsiniz.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadPackage}
                    disabled={isDownloading}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>Tümünü ZIP İndir</span>
                  </button>
                </div>
              </div>

              {packageFiles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Dosya Listesi Sol Kolon */}
                  <div className="md:col-span-1 space-y-1.5 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                    <div className="text-[10px] font-black uppercase text-slate-400 px-2 py-1 tracking-wider">
                      Paket Dosyaları ({packageFiles.length})
                    </div>
                    {packageFiles.map((file, idx) => (
                      <button
                        key={file.path}
                        onClick={() => {
                          setSelectedFileIndex(idx);
                          setCopiedFile(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-colors flex items-center justify-between cursor-pointer ${
                          selectedFileIndex === idx
                            ? 'bg-indigo-600 text-white font-bold shadow-xs'
                            : 'text-slate-700 hover:bg-slate-200/80'
                        }`}
                      >
                        <span className="truncate">{file.path}</span>
                        <FileText className="w-3 h-3 opacity-60 shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>

                  {/* Dosya İçeriği Sağ Kolon */}
                  <div className="md:col-span-3 space-y-2">
                    {packageFiles[selectedFileIndex] && (
                      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-950 text-slate-100 flex flex-col">
                        <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 font-mono text-xs text-indigo-300 font-bold">
                            <span>{packageFiles[selectedFileIndex].path}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyFileContent(packageFiles[selectedFileIndex].content)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              {copiedFile ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Kopyalandı!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Kodu Kopyala</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleDownloadSingleFile(packageFiles[selectedFileIndex])}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>İndir</span>
                            </button>
                          </div>
                        </div>

                        <pre className="p-4 font-mono text-[11px] overflow-x-auto max-h-[400px] text-emerald-300/90 leading-relaxed">
                          {packageFiles[selectedFileIndex].content}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                  <span>Dosyalar yükleniyor...</span>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
