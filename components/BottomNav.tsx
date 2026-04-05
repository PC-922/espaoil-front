import React, { useCallback } from 'react';
import { Heart, Home, Settings } from 'lucide-react';

interface Props {
  currentView: 'home' | 'favorites' | 'settings';
  onViewChange: (view: 'home' | 'favorites' | 'settings') => void;
}

export const BottomNav: React.FC<Props> = React.memo(({ currentView, onViewChange }) => {
  // Siguiendo Vercel best practice: rerender-memo
  // Evitamos funciones inline en handlers de navegación (interacciones críticas para INP)
  const handleHomeClick = useCallback(() => {
    onViewChange('home');
  }, [onViewChange]);

  const handleFavoritesClick = useCallback(() => {
    onViewChange('favorites');
  }, [onViewChange]);

  const handleSettingsClick = useCallback(() => {
    onViewChange('settings');
  }, [onViewChange]);

  return (
    <div className="ui-bottom-nav fixed bottom-0 left-0 right-0 z-50 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5">
      <div className="mx-auto grid w-full max-w-xl grid-cols-3 gap-1 px-2 pb-1">
        <button
          type="button"
          onClick={handleHomeClick}
          className={`ui-nav-btn flex min-h-[56px] flex-col items-center justify-center gap-1 px-2 transition-colors ${currentView === 'home' ? 'ui-nav-btn-active' : ''}`}
        >
          <Home size={20} />
          <span className="text-[11px] font-bold">Inicio</span>
        </button>
        <button
          type="button"
          onClick={handleFavoritesClick}
          className={`ui-nav-btn flex min-h-[56px] flex-col items-center justify-center gap-1 px-2 transition-colors ${currentView === 'favorites' ? 'ui-nav-btn-active' : ''}`}
        >
          <Heart size={20} />
          <span className="text-[11px] font-bold">Favoritos</span>
        </button>
        <button
          type="button"
          onClick={handleSettingsClick}
          className={`ui-nav-btn flex min-h-[56px] flex-col items-center justify-center gap-1 px-2 transition-colors ${currentView === 'settings' ? 'ui-nav-btn-active' : ''}`}
        >
          <Settings size={20} />
          <span className="text-[11px] font-bold">Ajustes</span>
        </button>
      </div>
    </div>
  );
});

BottomNav.displayName = 'BottomNav';
