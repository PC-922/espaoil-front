import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { Button } from './Button';

// BeforeInstallPromptEvent no está en los tipos DOM estándar de TypeScript,
// por lo que se declara localmente para evitar el uso de `any`.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPwaPrompt: React.FC = React.memo(() => {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // 1. Check if already installed (Standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone;
    if (isStandalone) return;

    // 2. Check if user previously dismissed the prompt
    const hasDismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (hasDismissed) return;

    // 3. Detect iOS
    const iosCheck = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
    setIsIOS(iosCheck);

    if (iosCheck) {
      // Show immediately for iOS if not dismissed
      setIsVisible(true);
    } else {
      // 4. Capture 'beforeinstallprompt' event for Android/Chrome
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
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
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-0 right-0 z-40 px-4">
      <div className="ui-card mx-auto w-full max-w-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] p-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text)]">
            <Download size={18} className="text-[var(--color-accent)]" />
            <span>Instalar app</span>
          </div>
          <button type="button" onClick={handleDismiss} className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          <p className="mb-3 text-sm font-medium text-gray-600">
            Instala EspaOil para acceder más rápido y usarla a pantalla completa.
          </p>

          {isIOS ? (
            <div className="ui-radius-control border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
              <div className="mb-2 flex items-center gap-2">
                <span className="ui-radius-badge bg-gray-200 p-1 text-blue-500"><Share size={16} /></span>
                <span>1. Pulsa el botón <strong>Compartir</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="ui-radius-badge bg-gray-200 p-1 text-gray-700"><PlusSquare size={16} /></span>
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
});

InstallPwaPrompt.displayName = 'InstallPwaPrompt';
