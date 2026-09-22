import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X, CheckCircle, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'button' | 'compact' | 'banner';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If the app is already installed and opened in standalone mode, hide the prompt
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  // Header compact pill style (For top navbar)
  if (variant === 'header') {
    if (isInstallable) {
      return (
        <button
          id="pwa-install-header-btn"
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm hover:from-indigo-700 hover:to-violet-700 transition-all active:scale-95 disabled:opacity-50 ${className}`}
          title="Uygulamayı Cihazınıza Yükleyin (PWA)"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Uygulamayı Yükle</span>
        </button>
      );
    }

    if (isIOS) {
      return (
        <>
          <button
            id="pwa-ios-header-btn"
            onClick={() => setShowIOSGuide(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-all active:scale-95 ${className}`}
            title="iPhone / iPad'e Yükle"
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
            <span>Ana Ekrana Ekle</span>
          </button>

          {showIOSGuide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">iPhone / iPad'e Yükleme</h3>
                      <p className="text-[11px] text-slate-500">Hızlı erişim ve tam ekran deneyimi</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowIOSGuide(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-3.5 text-xs text-slate-600">
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      1
                    </div>
                    <div>
                      Safari alt çubuğundaki <strong className="text-slate-900 inline-flex items-center gap-1 font-semibold"><Share className="w-3.5 h-3.5 text-indigo-600 inline" /> Paylaş</strong> butonuna dokunun.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      2
                    </div>
                    <div>
                      Menüyü aşağı kaydırıp <strong className="text-slate-900 inline-flex items-center gap-1 font-semibold"><PlusSquare className="w-3.5 h-3.5 text-indigo-600 inline" /> Ana Ekrana Ekle</strong> seçeneğini seçin.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      3
                    </div>
                    <div>
                      Sağ üstteki <strong>Ekle</strong> butonuna basarak uygulamayı telefonunuzun ana ekranından anında açın!
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="mt-5 w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
                >
                  Anladım
                </button>
              </div>
            </div>
          )}
        </>
      );
    }

    return null;
  }

  // Banner variant for home screen or login page
  if (variant === 'banner') {
    if (!isInstallable && !isIOS) return null;

    return (
      <div className={`p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-purple-500/10 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">Uygulama Olarak Yükleyin (PWA)</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">PWA</span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Tarayıcı çubuğu olmadan tam ekran, çevrimdışı önbellekleme ve masaüstü/mobil uygulama deneyimi.
            </p>
          </div>
        </div>

        <div>
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Cihaza Yükle</span>
            </button>
          )}

          {isIOS && (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              <span>iOS Kurulum Rehberi</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
};
