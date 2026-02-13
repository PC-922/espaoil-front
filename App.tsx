import React, { useState } from 'react';
import { Home } from './views/Home';
import { About } from './views/About';
import { BottomNav } from './components/BottomNav';
import { InstallPwaPrompt } from './components/InstallPwaPrompt';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'about'>('home');

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <main className="w-full">
        {currentView === 'home' && <Home />}
        {currentView === 'about' && <About />}
      </main>
      
      {/* PWA Install Prompt - Smartly shows only when needed */}
      <InstallPwaPrompt />
      
      <BottomNav currentView={currentView} onViewChange={setCurrentView} />
    </div>
  );
};

export default App;