import React, { useCallback, useMemo } from 'react';
import { LocateFixed, MapPin, Search } from 'lucide-react';
import { FuelType, FUEL_LABELS } from '../types';
import { Button } from '../components/Button';
import { GasStationCard } from '../components/GasStationCard';
import { useHomeSearch } from '../hooks/useHomeSearch';

export const Home: React.FC = () => {
  const {
    searchMode,
    setSearchMode,
    addressQuery,
    addressSuggestions,
    suggestionsLoading,
    handleAddressQueryChange,
    handleSelectAddressSuggestion,
    fuelType,
    setFuelType,
    radius,
    setRadius,
    loading,
    locationStatus,
    sortBy,
    setSortBy,
    searched,
    stations,
    sortedStations,
    handleSearch,
  } = useHomeSearch();

  const stationKeyByRef = useMemo(() => {
    return new Map(
      stations.map((station, index) => [
        station,
        `${station.numericLat}-${station.numericLon}-${station.trader}-${station.name}-${index}`,
      ])
    );
  }, [stations]);

  // Handlers estables con useCallback para evitar recrearlos en cada render
  const handleSetLocationMode = useCallback(() => setSearchMode('location'), [setSearchMode]);
  const handleSetAddressMode = useCallback(() => setSearchMode('address'), [setSearchMode]);
  const handleFuelTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => setFuelType(e.target.value as FuelType),
    [setFuelType]
  );
  const handleRadiusChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setRadius(parseInt(e.target.value, 10)),
    [setRadius]
  );
  const handleSortByPrice = useCallback(() => setSortBy('price'), [setSortBy]);
  const handleSortByDistance = useCallback(() => setSortBy('distance'), [setSortBy]);
  const handleAddressInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => handleAddressQueryChange(e.target.value),
    [handleAddressQueryChange]
  );

  // Extracción de banners de estado mutuamente excluyentes a una función de render.
  // Usar ternarios en lugar de && encadenados evita el riesgo de renderizar "0"
  // si alguna expresión fuera numérica, y hace explícito que los casos se excluyen.
  const renderStatusBanner = () => {
    if (locationStatus === 'idle' && !searched) {
      return (
        <div className="ui-radius-control mb-4 flex items-center justify-center gap-2 border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-gray-700">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Listo para buscar
        </div>
      );
    }
    if (locationStatus === 'locating') {
      return searchMode === 'location' ? (
        <div className="ui-card flex flex-col items-center justify-center py-8 text-gray-500">
          <div className="mb-3 text-red-400">
            <MapPin size={48} />
          </div>
          <p>Obteniendo ubicación precisa...</p>
        </div>
      ) : (
        <div className="ui-card flex flex-col items-center justify-center py-8 text-gray-500">
          <div className="mb-3 text-red-400">
            <Search size={48} />
          </div>
          <p>Buscando dirección...</p>
        </div>
      );
    }
    return null;
  };

  // La condición usa booleano explícito para el dropdown de sugerencias,
  // evitando el riesgo de renderizar "0" si la expresión fuera numérica.
  const showSuggestionsDropdown =
    addressQuery.trim().length >= 3 && (suggestionsLoading || addressSuggestions.length > 0);

  const hasResults = searched && !loading && stations.length > 0;

  return (
    <div className="ui-page space-y-5">
      <header className="ui-rise space-y-2">
        <p className="ui-brand text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">EspaOil</p>
        <h1 className="text-[1.75rem] font-black leading-[1.05] text-[var(--color-text)]">Gasolineras baratas cerca de ti</h1>
        <p className="max-w-[34ch] text-sm font-medium text-[var(--color-muted)]">Busca por ubicacion o direccion, compara en segundos y abre ruta al momento.</p>
      </header>

      <section className="ui-card ui-rise space-y-4 p-4">
        <div>
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-gray-600">Modo de busqueda</label>
          <div className="ui-radius-control grid grid-cols-2 gap-1.5 bg-[var(--color-surface-muted)] p-1">
            <button
              type="button"
              onClick={handleSetLocationMode}
              className={`ui-radius-control border px-3 py-2.5 text-sm font-bold transition-colors ${searchMode === 'location' ? 'border-red-200 bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-transparent text-gray-600'}`}
            >
              Mi ubicacion
            </button>
            <button
              type="button"
              onClick={handleSetAddressMode}
              className={`ui-radius-control border px-3 py-2.5 text-sm font-bold transition-colors ${searchMode === 'address' ? 'border-red-200 bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-transparent text-gray-600'}`}
            >
              Direccion
            </button>
          </div>
        </div>

        {searchMode === 'address' && (
          <div className="ui-slide-down relative">
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-gray-600">Direccion</label>
            <input
              type="text"
              value={addressQuery}
              onChange={handleAddressInputChange}
              placeholder="Ej: Gran Via 1, Madrid"
              className="ui-input px-3 py-2.5 text-sm font-semibold focus:outline-none"
            />

            {showSuggestionsDropdown && (
              <div className="ui-radius-control absolute left-0 right-0 z-20 mt-1.5 max-h-56 overflow-auto border border-[var(--color-border)] bg-white">
                {suggestionsLoading && <div className="px-3 py-2.5 text-sm text-gray-500">Buscando sugerencias...</div>}

                {!suggestionsLoading &&
                  addressSuggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.lat}-${suggestion.lon}-${index}`}
                      type="button"
                      onClick={() => handleSelectAddressSuggestion(suggestion)}
                      className="w-full border-b border-gray-100 px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 last:border-b-0"
                    >
                      {suggestion.label}
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-gray-600">Combustible</label>
            <div className="relative">
              <select
                value={fuelType}
                onChange={handleFuelTypeChange}
                className="ui-select appearance-none px-3 py-2.5 pr-9 text-sm font-semibold focus:outline-none"
              >
                {Object.entries(FUEL_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-600">Radio (km)</label>
              <span className="ui-radius-badge bg-[var(--color-surface-muted)] px-2 py-0.5 text-[11px] font-bold text-gray-900">{radius} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={radius}
              onChange={handleRadiusChange}
              className="h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-red-600"
            />
          </div>
        </div>

        <Button
          onClick={handleSearch}
          fullWidth
          disabled={loading}
          className="mt-1"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></span>
              Buscando...
            </span>
          ) : (
            <>
              {searchMode === 'location' ? <LocateFixed size={18} /> : <Search size={18} />}
              Buscar gasolineras
            </>
          )}
        </Button>
      </section>

      {renderStatusBanner()}

      {searched && !loading && (
        <section className="ui-fade space-y-3">
          <div className="flex items-end justify-between">
            <h2 className="text-sm font-black tracking-wide text-gray-900">Resultados ({stations.length})</h2>
            <span className="text-xs font-medium text-gray-600">
              {sortBy === 'price' ? 'mas baratas primero' : 'mas cercanas primero'}
            </span>
          </div>

          <div className={`ui-radius-control z-20 grid grid-cols-2 gap-1.5 border border-[var(--color-border)] bg-white p-1 ${hasResults ? 'sticky top-2' : ''}`}>
            <button
              type="button"
              onClick={handleSortByPrice}
              className={`ui-radius-control border px-3 py-2 text-sm font-bold transition-colors ${sortBy === 'price' ? 'border-red-200 bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-transparent text-gray-600'}`}
            >
              Precio
            </button>
            <button
              type="button"
              onClick={handleSortByDistance}
              className={`ui-radius-control border px-3 py-2 text-sm font-bold transition-colors ${sortBy === 'distance' ? 'border-red-200 bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-transparent text-gray-600'}`}
            >
              Distancia
            </button>
          </div>

          {stations.length === 0 ? (
            <div className="ui-card py-8 text-center">
              <Search size={42} className="mx-auto mb-2 text-gray-300" />
              <p className="font-semibold text-gray-700">No se encontraron gasolineras</p>
              <p className="text-sm text-gray-500">Prueba con un radio de busqueda mayor.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedStations.map((station) => (
                <GasStationCard
                  key={stationKeyByRef.get(station) ?? `${station.numericLat}-${station.numericLon}-${station.trader}-${station.name}`}
                  station={station}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-3 pt-2">
        <div className="ui-divider"></div>
        <h2 className="text-sm font-black uppercase tracking-wide text-gray-900">Guia rapida</h2>
        <div className="space-y-2 text-sm text-gray-700">
          <p>1. Busca con tu ubicacion o escribe una direccion.</p>
          <p>2. Ordena por precio para ahorrar o por distancia para llegar antes.</p>
          <p>3. Abre ruta en tu app de mapas favorita.</p>
        </div>
      </section>
    </div>
  );
};
