import React, { useState } from 'react';
import { MapPinned } from 'lucide-react';
import { MAP_PROVIDER_LABELS, MapProvider } from '../types';
import { getMapProvider, setMapProvider } from '../utils/maps';

// Constante de módulo: __APP_BUILD_DATE__ es un valor de compilación que nunca
// cambia en runtime, por lo que no tiene sentido recalcularlo en cada render.
const FORMATTED_BUILD_DATE = new Date(__APP_BUILD_DATE__).toLocaleString('es-ES', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export const Settings: React.FC = () => {
  // Inicialización lazy: getMapProvider() es síncrono, no necesita useEffect.
  // Esto evita el ciclo render→effect→setState→render que causaba un render extra.
  const [provider, setProvider] = useState<MapProvider>(() => getMapProvider());

  const handleProviderChange = (nextProvider: MapProvider) => {
    setProvider(nextProvider);
    setMapProvider(nextProvider);
  };

  return (
    <div className="ui-page">
      <header className="mb-4">
        <h1 className="text-2xl font-black text-gray-900">Configuracion</h1>
        <p className="mt-1 text-sm text-gray-600">Personaliza como quieres abrir las rutas desde los resultados.</p>
      </header>

      <div className="ui-card space-y-4 p-4 text-gray-700">
        <div className="flex items-start gap-3">
          <div className="ui-radius-control bg-[var(--color-accent-soft)] p-2 text-[var(--color-accent)]">
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
              className={`ui-radius-control flex min-h-12 items-center justify-between border p-3 transition-colors ${provider === option ? 'border-red-200 bg-[var(--color-accent-soft)]' : 'cursor-pointer border-[var(--color-border)] bg-white'}`}
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

        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-gray-900">Version {__APP_VERSION__}</p>
          <p className="mt-1 text-xs text-gray-500">Build {FORMATTED_BUILD_DATE}</p>
        </div>
      </div>
    </div>
  );
};
