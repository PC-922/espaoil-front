import React from 'react';
import { Home, Settings } from 'lucide-react';

interface Props {
  currentView: 'home' | 'settings';
  onViewChange: (view: 'home' | 'settings') => void;
}

export const BottomNav: React.FC<Props> = ({ currentView, onViewChange }) => {
  return (
    <div className="ui-bottom-nav fixed bottom-0 left-0 right-0 z-50 px-2 pb-safe pt-1">
      <div className="mx-auto grid w-full max-w-xl grid-cols-2 gap-1 px-2 py-1">
        <button
          type="button"
          onClick={() => onViewChange('home')}
          className={`ui-nav-btn ui-radius-control flex min-h-[56px] flex-col items-center justify-center gap-1 px-2 transition-colors ${currentView === 'home' ? 'ui-nav-btn-active' : ''}`}
        >
          <Home size={20} />
          <span className="text-[11px] font-semibold">Inicio</span>
        </button>
        <button
          type="button"
          onClick={() => onViewChange('settings')}
          className={`ui-nav-btn ui-radius-control flex min-h-[56px] flex-col items-center justify-center gap-1 px-2 transition-colors ${currentView === 'settings' ? 'ui-nav-btn-active' : ''}`}
        >
          <Settings size={20} />
          <span className="text-[11px] font-semibold">Ajustes</span>
        </button>
      </div>
    </div>
  );
};
