import React, { useEffect, useState } from 'react';
import { Home } from './views/Home';
import { About } from './views/About';
import { Settings } from './views/Settings';
import { BottomNav } from './components/BottomNav';
import { InstallPwaPrompt } from './components/InstallPwaPrompt';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'about' | 'settings'>('home');

  useEffect(() => {
    const ensureNamedMeta = (name: string, content: string): void => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    const ensurePropertyMeta = (property: string, content: string): void => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    const metadataByView = {
      home: {
        title: 'Gasolineras baratas en Espana | Precio gasolina hoy | EspaOil',
        description:
          'Encuentra gasolineras baratas cerca de ti en Espana, compara precio gasolina hoy por distancia o coste y llega rapido con Google Maps, Apple Maps o Waze.',
      },
      about: {
        title: 'Sobre EspaOil | Datos y actualizacion de precios de gasolina',
        description:
          'Descubre como funciona EspaOil, de donde obtiene los datos y cada cuanto se actualizan los precios de gasolina en Espana.',
      },
      settings: {
        title: 'Ajustes de busqueda | EspaOil',
        description:
          'Personaliza como buscas gasolineras cerca de ti y ordena resultados por precio o distancia en EspaOil.',
      },
    };

    const metadata = metadataByView[currentView];

    document.title = metadata.title;
    ensureNamedMeta('description', metadata.description);
    ensurePropertyMeta('og:title', metadata.title);
    ensurePropertyMeta('og:description', metadata.description);
    ensureNamedMeta('twitter:title', metadata.title);
    ensureNamedMeta('twitter:description', metadata.description);
  }, [currentView]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <main className="w-full">
        {currentView === 'home' && <Home />}
        {currentView === 'about' && <About />}
        {currentView === 'settings' && <Settings />}
      </main>
      
      {/* PWA Install Prompt - Smartly shows only when needed */}
      <InstallPwaPrompt />

      <Analytics />
      <SpeedInsights />
      
      <BottomNav currentView={currentView} onViewChange={setCurrentView} />
    </div>
  );
};

export default App;
