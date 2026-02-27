import React, { useEffect, useState } from 'react';
import { MapPinned } from 'lucide-react';
import { MAP_PROVIDER_LABELS, MapProvider } from '../types';
import { getMapProvider, setMapProvider } from '../utils/maps';

export const Settings: React.FC = () => {
  const [provider, setProvider] = useState<MapProvider>('google');

  useEffect(() => {
    setProvider(getMapProvider());
  }, []);

  const handleProviderChange = (nextProvider: MapProvider) => {
    setProvider(nextProvider);
    setMapProvider(nextProvider);
  };

  return (
    <div className="p-6 max-w-md mx-auto pt-10">
      <h1 className="text-2xl font-black text-gray-900 mb-6">Configuración</h1>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-5 text-gray-700">
        <div className="flex items-start gap-3">
          <div className="bg-red-50 text-red-600 p-2 rounded-lg">
            <MapPinned size={18} />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">App de mapas por defecto</h2>
            <p className="text-sm text-gray-500">Elige dónde abrir la ruta al pulsar en una gasolinera.</p>
          </div>
        </div>

        <div className="space-y-2">
          {(Object.keys(MAP_PROVIDER_LABELS) as MapProvider[]).map((option) => (
            <label
              key={option}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${provider === option ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
            >
              <span className="font-semibold text-gray-800">{MAP_PROVIDER_LABELS[option]}</span>
              <input
                type="radio"
                name="map-provider"
                checked={provider === option}
                onChange={() => handleProviderChange(option)}
                className="h-4 w-4 accent-red-600"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
