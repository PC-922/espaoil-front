import React, { useState } from 'react';
import { MapPinned } from 'lucide-react';
import { MAP_PROVIDER_LABELS, MapProvider } from '../types';
import { getMapProvider, setMapProvider } from '../utils/maps';
import {
  FAVORITES_REFRESH_INTERVAL_OPTIONS_MS,
  formatRefreshIntervalLabel,
  getFavoritesRefreshIntervalMs,
  setFavoritesRefreshIntervalMs,
} from '../utils/favoritesRefresh';

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
  const [favoritesRefreshIntervalMs, setFavoritesRefreshIntervalState] = useState<number>(() =>
    getFavoritesRefreshIntervalMs()
  );

  const handleProviderChange = (nextProvider: MapProvider) => {
    setProvider(nextProvider);
    setMapProvider(nextProvider);
  };

  const handleFavoritesRefreshIntervalChange = (value: number) => {
    setFavoritesRefreshIntervalState(value);
    setFavoritesRefreshIntervalMs(value);
  };

  return (
    <div className="ui-page space-y-4">
      <header className="ui-rise">
        <p className="ui-brand text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">EspaOil</p>
        <h1 className="mt-1 text-2xl font-black text-gray-900">Configuracion</h1>
        <p className="mt-1 text-sm font-medium text-gray-600">Elige la app de mapas para abrir rutas desde resultados.</p>
      </header>

      <section className="ui-card ui-fade space-y-4 p-4 text-gray-700">
        <div className="flex items-start gap-3">
          <div className="ui-radius-control bg-[var(--color-accent-soft)] p-2 text-[var(--color-accent)]">
            <MapPinned size={18} />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Mapa por defecto</h2>
            <p className="text-sm font-medium text-gray-600">Selecciona donde quieres abrir la navegacion.</p>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          {(Object.keys(MAP_PROVIDER_LABELS) as MapProvider[]).map((option) => (
            <label
              key={option}
              className={`ui-radius-control flex min-h-12 items-center justify-between border p-3 transition-colors ${provider === option ? 'border-red-200 bg-[var(--color-accent-soft)]' : 'cursor-pointer border-[var(--color-border)] bg-white hover:bg-gray-50'}`}
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

        <div className="ui-divider pt-4">
          <h2 className="font-bold text-gray-900">Actualizacion de precios en favoritos</h2>
          <p className="mt-1 text-sm font-medium text-gray-600">
            Define cada cuanto tiempo se actualizan automaticamente los precios.
          </p>

          <div className="mt-3 space-y-2">
            {FAVORITES_REFRESH_INTERVAL_OPTIONS_MS.map((optionMs) => (
              <label
                key={optionMs}
                className={`ui-radius-control flex min-h-12 items-center justify-between border p-3 transition-colors ${favoritesRefreshIntervalMs === optionMs ? 'border-red-200 bg-[var(--color-accent-soft)]' : 'cursor-pointer border-[var(--color-border)] bg-white hover:bg-gray-50'}`}
              >
                <span className="font-semibold text-gray-800">{formatRefreshIntervalLabel(optionMs)}</span>
                <input
                  type="radio"
                  name="favorites-refresh-interval"
                  checked={favoritesRefreshIntervalMs === optionMs}
                  onChange={() => handleFavoritesRefreshIntervalChange(optionMs)}
                  className="h-4 w-4 accent-red-600"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="ui-divider pt-4">
          <p className="text-sm font-semibold text-gray-900">Version {__APP_VERSION__}</p>
          <p className="mt-1 text-xs font-medium text-gray-500">Build {FORMATTED_BUILD_DATE}</p>
        </div>
      </section>
    </div>
  );
};
