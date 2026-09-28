import React, { ReactNode } from 'react';
import { AlertCircle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage?: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  public static getDerivedStateFromError(error: any): State {
    return { 
      hasError: true, 
      errorMessage: error?.message || 'Beklenmeyen bir arayüz hatası oluştu.' 
    };
  }

  public componentDidCatch(error: any, errorInfo: any) {
    console.warn('UI Graceful Recovery:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  private handleClearAndReset = () => {
    try {
      localStorage.removeItem('yks_kocluk_auth_session_v1');
      localStorage.removeItem('yks_cached_students');
      sessionStorage.clear();
    } catch {}
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Oturum Güvenli Modda</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Arayüz koruma modu devrede. Kaldığınız yerden devam etmek için yenileyebilir veya oturumu sıfırlayabilirsiniz.
              </p>
              {this.state.errorMessage && (
                <p className="text-xs text-amber-300/80 bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/40 font-mono text-left break-words">
                  {this.state.errorMessage}
                </p>
              )}
            </div>
            <div className="space-y-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-indigo-600/30"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Yeniden Başlat</span>
              </button>
              <button
                type="button"
                onClick={this.handleClearAndReset}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Önbelleği Temizle & Giriş Ekranına Dön</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
