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
  ArrowRight
} from 'lucide-react';
import { 
  getYoloConfig, 
  saveYoloConfig, 
  testYoloConnection, 
  testYoloDetection 
} from '../../lib/apiService';
import { YoloServiceConfig } from '../../types';

interface YoloServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const YoloServiceModal: React.FC<YoloServiceModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ayarlar' | 'test' | 'rehber'>('ayarlar');

  const [config, setConfig] = useState<YoloServiceConfig>({
    enabled: false,
    serviceUrl: 'http://localhost:8000',
    confThreshold: 0.5,
    margin: 10,
    minSize: 50,
    autoDewarp: true
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
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectResult, setDetectResult] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const data = await getYoloConfig();
      if (data && data.config) {
        setConfig(data.config);
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setTestImageBase64(reader.result as string);
      setDetectResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRunDetectionTest = async () => {
    if (!testImageBase64) return;
    setIsDetecting(true);
    setDetectResult(null);
    try {
      const res = await testYoloDetection(testImageBase64, {
        serviceUrl: config.serviceUrl,
        confThreshold: config.confThreshold,
        margin: config.margin,
        minSize: config.minSize
      });
      setDetectResult(res);
    } catch (e: any) {
      alert('Test sırasında hata oluştu: ' + (e.message || 'Bilinmeyen hata'));
    } finally {
      setIsDetecting(false);
    }
  };

  if (!isOpen) return null;

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
            <a
              href="/api/yolo-service/download-package"
              download
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs transition-colors shadow-sm"
              title="Ubuntu sunucu ve eğitim paketini indir"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Paketi İndir (.ZIP)</span>
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-2 bg-slate-100 border-b border-slate-200 text-xs font-bold px-4 sm:px-6">
          <button
            onClick={() => setActiveSubTab('ayarlar')}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
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
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
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
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'rehber'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Ubuntu & Eğitim Rehberi</span>
          </button>

          <div className="ml-auto sm:hidden">
            <a
              href="/api/yolo-service/download-package"
              download
              className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center"
              title="Paketi İndir"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: AYARLAR */}
          {activeSubTab === 'ayarlar' && (
            <div className="space-y-5">
              {/* Status Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border bg-slate-50 border-slate-200">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full ${
                    !config.enabled 
                      ? 'bg-slate-400' 
                      : connectionResult?.success 
                        ? 'bg-emerald-500 ring-4 ring-emerald-100 animate-pulse' 
                        : 'bg-rose-500 ring-4 ring-rose-100'
                  }`} />
                  <div>
                    <div className="text-xs font-black text-slate-900 flex items-center gap-2">
                      <span>Yerel Servis Durumu:</span>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] ${
                        !config.enabled
                          ? 'bg-slate-200 text-slate-700'
                          : connectionResult?.success
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                      }`}>
                        {!config.enabled ? 'Devre Dışı (Gemini Aktif)' : connectionResult?.success ? 'Çevrimiçi & Hazır' : 'Çevrimdışı / Ulaşılamıyor'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {connectionResult?.latency_ms 
                        ? `Gecikme: ${connectionResult.latency_ms} ms • Model: ${connectionResult.health?.model_name || 'Özel Model'}`
                        : config.enabled ? 'Ubuntu sunucunuzda servisin çalıştığından emin olun.' : 'Yerel servisi aktif ettiğinizde sorular önce kendi YOLO modelinizle tespit edilir.'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTestPing}
                  disabled={isTestingConnection}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {isTestingConnection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>Bağlantıyı Test Et</span>
                </button>
              </div>

              {/* Toggle Switch */}
              <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-indigo-600" />
                    Soru Tespitinde Yerel YOLO Modelini Kullan
                  </h4>
                  <p className="text-[11px] text-indigo-900/80 mt-0.5">
                    Aktif olduğunda deneme sayfaları doğrudan yerel Ubuntu/PC servisinizden taranır. Servis yanıt vermezse sistem kesintisiz olarak Gemini Vision'a geçer.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Service URL Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-slate-500" />
                  Ubuntu / Yerel Servis API Adresi (URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.serviceUrl}
                    onChange={(e) => setConfig({ ...config, serviceUrl: e.target.value })}
                    placeholder="http://localhost:8000 veya http://192.168.1.50:8000"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, serviceUrl: 'http://localhost:8000' })}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Localhost
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Ubuntu sunucunuz yerel ağdaysa IP adresini ve portunu yazın (Örn: <code>http://192.168.1.100:8000</code>).
                </p>
              </div>

              {/* Filters & Precision Tuning */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-800">Güven Eşiği (Conf)</label>
                    <span className="text-xs font-black text-indigo-700 font-mono">
                      %{Math.round(config.confThreshold * 100)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="0.9"
                    step="0.05"
                    value={config.confThreshold}
                    onChange={(e) => setConfig({ ...config, confThreshold: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                  <p className="text-[10px] text-slate-500">
                    Önerilen: %50. Düşük değer daha çok kutu bulur, yüksek değer kesinliği artırır.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-800">Kenar Marjı (Margin)</label>
                    <span className="text-xs font-black text-indigo-700 font-mono">
                      {config.margin} px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="30"
                    step="1"
                    value={config.margin}
                    onChange={(e) => setConfig({ ...config, margin: parseInt(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                  <p className="text-[10px] text-slate-500">
                    <strong>Yarım Soruları Eler:</strong> Sayfa kenarlarına {config.margin} px'den yakın kesik kutuları otomatik siler.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-800">Min. Kutu Boyutu</label>
                    <span className="text-xs font-black text-indigo-700 font-mono">
                      {config.minSize} px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={config.minSize}
                    onChange={(e) => setConfig({ ...config, minSize: parseInt(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                  <p className="text-[10px] text-slate-500">
                    Küçük logo, sembol ve leke şeklindeki gürültüleri filtreler.
                  </p>
                </div>
              </div>

              {/* Dewarp & Watermark info card */}
              <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950 space-y-0.5">
                  <div className="font-bold">Otomatik Yay (Arc) Düzeltme & Filigran Temizleme Aktif</div>
                  <div className="text-[11px] text-emerald-800">
                    Her sayfada önce 4 köşe perspektifi dikleştirilir, kitap kıvrımından kaynaklanan yaylanma matematiksel olarak düzeltilir ve arkadaki gri filigranlar (ters baskılar) silinir.
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Kapat
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Ayarları Kaydet ve Doğrula</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CANLI TEST ALANI */}
          {activeSubTab === 'test' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black text-slate-900">Canlı Görsel Tespit & Koordinat Testi</h4>
                  <p className="text-[11px] text-slate-500">
                    Bir sayfa fotoğrafı yükleyin; yerel YOLO servisinizin koordinatları ve elenen yarım soruları nasıl bulduğunu anında görün.
                  </p>
                </div>
                <label className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Fotoğraf Seç</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {testImageBase64 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Yüklü Fotoğraf</span>
                    <button
                      type="button"
                      onClick={handleRunDetectionTest}
                      disabled={isDetecting}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {isDetecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>Yerel Servisle Tara</span>
                    </button>
                  </div>

                  {/* Detection Results */}
                  {detectResult && (
                    <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                        <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Tespit Tamamlandı ({detectResult.process_time_ms || 0} ms)
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold font-mono">
                            {detectResult.total_questions || detectResult.questions?.length || 0} Tam Soru Bulundu
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-bold">
                            Model: {detectResult.model || 'YOLOv8n'}
                          </span>
                        </div>
                      </div>

                      {/* Display Coordinates List */}
                      {detectResult.questions && detectResult.questions.length > 0 && (
                        <div className="max-h-40 overflow-y-auto bg-white rounded-xl p-2.5 border border-slate-200 text-[11px] font-mono space-y-1">
                          {detectResult.questions.map((q: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between border-b border-slate-100 pb-1">
                              <span className="font-bold text-indigo-700">Soru #{q.soru_no || idx + 1}:</span>
                              <span className="text-slate-600">
                                Kutu: [{q.normalized_box.join(', ')}]
                              </span>
                              <span className="text-emerald-600 font-bold">
                                Güven: %{Math.round(q.confidence * 100)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Image Preview Box */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center p-2 max-h-[420px]">
                    <img
                      src={detectResult?.preview_image || testImageBase64}
                      alt="Test Sayfası"
                      className="max-h-[400px] object-contain rounded-lg"
                    />
                  </div>
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
                  <a
                    href="/api/yolo-service/download-package"
                    download
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1.5"
                  >
                    <Download className="w-3 h-3" />
                    <span>Tüm Dosyaları İndir (.ZIP)</span>
                  </a>
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

        </div>

      </div>
    </div>
  );
};
