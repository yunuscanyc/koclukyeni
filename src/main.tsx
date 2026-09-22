import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';
import 'katex/dist/katex.min.css';
// Safe Service Worker Management
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // If in development or running inside an iframe (like AI Studio preview), actively clean up any stale service workers
  const isIframe = window.self !== window.top;
  if (!import.meta.env.PROD || isIframe) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister().catch(() => {});
      }
    }).catch(() => {});
    if ('caches' in window) {
      caches.keys().then((keys) => {
        for (const k of keys) {
          caches.delete(k).catch(() => {});
        }
      }).catch(() => {});
    }
  } else {
    // Only in production standalone environment, dynamically import and register PWA
    import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onNeedRefresh() {
          console.log('[PWA] Yeni sürüm mevcut.');
        },
        onOfflineReady() {
          console.log('[PWA] Çevrimdışı moda hazır.');
        },
      });
    }).catch(() => {});
  }
}

// Prevent uncaught background errors and network rejections from kicking the preview out
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('[Safe Preview Shield] Unhandled promise intercepted:', event.reason);
    event.preventDefault();
  });

  window.addEventListener('error', (event) => {
    console.warn('[Safe Preview Shield] Window error intercepted:', event.message || event.error);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

