import React from 'react';
import { Home, Info } from 'lucide-react';

interface Props {
  currentView: 'home' | 'about';
  onViewChange: (view: 'home' | 'about') => void;
}

export const BottomNav: React.FC<Props> = ({ currentView, onViewChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 flex justify-around items-center pb-safe z-50">
      <button 
        onClick={() => onViewChange('home')}
        className={`flex flex-col items-center gap-1 p-2 ${currentView === 'home' ? 'text-red-600' : 'text-gray-400'}`}
      >
        <Home size={24} />
        <span className="text-[10px] font-medium">Inicio</span>
      </button>
      <button 
        onClick={() => onViewChange('about')}
        className={`flex flex-col items-center gap-1 p-2 ${currentView === 'about' ? 'text-red-600' : 'text-gray-400'}`}
      >
        <Info size={24} />
        <span className="text-[10px] font-medium">About</span>
      </button>
    </div>
  );
};