import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { Button } from './Button';

export const InstallPwaPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 1. Check if already installed (Standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    // 2. Check if user previously dismissed the prompt
    const hasDismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (hasDismissed) return;

    // 3. Detect iOS
    const iosCheck = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iosCheck);

    if (iosCheck) {
      // Show immediately for iOS if not dismissed
      setIsVisible(true);
    } else {
      // 4. Capture 'beforeinstallprompt' event for Android/Chrome
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsVisible(true);
      };

      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 animate-[slideUp_0.3s_ease-out]">
      <div className="bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden">
        {/* Header Gradient */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 p-3 flex justify-between items-center text-white">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Download size={18} />
            <span>Instalar App</span>
          </div>
          <button onClick={handleDismiss} className="text-white/80 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4 font-medium">
            Instala EspaOil para acceder más rápido y usarla a pantalla completa.
          </p>

          {isIOS ? (
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-gray-200 p-1 rounded text-blue-500"><Share size={16} /></span>
                <span>1. Pulsa el botón <strong>Compartir</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-gray-200 p-1 rounded text-gray-700"><PlusSquare size={16} /></span>
                <span>2. Selecciona <strong>Añadir a inicio</strong></span>
              </div>
            </div>
          ) : (
            <Button onClick={handleInstallClick} fullWidth className="text-sm py-2">
              Instalar ahora
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};