import React, { useMemo } from 'react';
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

  return (
    <div className="ui-page">
      <header className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">EspaOil</p>
        <h1 className="mt-1 text-[1.35rem] font-black leading-tight text-[var(--color-text)]">Gasolineras baratas cerca de ti</h1>
        <p className="mt-1.5 text-sm text-gray-600">Compara por precio o distancia y abre ruta al instante.</p>
      </header>

      <section className="ui-card mb-4 space-y-3 p-3.5">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">Modo de busqueda</label>
          <div className="ui-radius-control grid grid-cols-2 gap-1.5 bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setSearchMode('location')}
              className={`ui-radius-control border px-3 py-2 text-sm font-bold transition-colors ${searchMode === 'location' ? 'border-red-200 bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-transparent text-gray-600'}`}
            >
              Mi ubicación
            </button>
            <button
              type="button"
              onClick={() => setSearchMode('address')}
              className={`ui-radius-control border px-3 py-2 text-sm font-bold transition-colors ${searchMode === 'address' ? 'border-red-200 bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-transparent text-gray-600'}`}
            >
              Dirección
            </button>
          </div>
        </div>

        {searchMode === 'address' && (
          <div className="relative">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">Direccion</label>
            <input
              type="text"
              value={addressQuery}
              onChange={(e) => handleAddressQueryChange(e.target.value)}
              placeholder="Ej: Gran Vía 1, Madrid"
              className="ui-input px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            {addressQuery.trim().length >= 3 && (suggestionsLoading || addressSuggestions.length > 0) && (
              <div className="ui-radius-control absolute left-0 right-0 z-20 mt-1.5 max-h-56 overflow-auto border border-[var(--color-border)] bg-white">
                {suggestionsLoading && (
                  <div className="px-3 py-2.5 text-sm text-gray-400">Buscando sugerencias...</div>
                )}

                {!suggestionsLoading &&
                  addressSuggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.lat}-${suggestion.lon}-${index}`}
                      type="button"
                      onClick={() => handleSelectAddressSuggestion(suggestion)}
                      className="w-full border-b border-gray-100 px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 last:border-b-0"
                    >
                      {suggestion.label}
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">Tipo de combustible</label>
          <div className="relative">
            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value as FuelType)}
              className="ui-select appearance-none px-3 py-2.5 pr-9 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
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
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-500">Radio de busqueda (km)</label>
            <span className="ui-radius-badge bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-900">{radius} km</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="100" 
            value={radius} 
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-red-600"
          />
        </div>

        <Button 
          onClick={handleSearch} 
          fullWidth 
          disabled={loading}
        >
          {loading ? (
             <span className="flex items-center gap-2">
               <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
               Buscando...
             </span>
          ) : (
            <>
              {searchMode === 'location' ? <LocateFixed size={18} /> : <Search size={18} />}
              Buscar Gasolineras
            </>
          )}
        </Button>
      </section>

      {locationStatus === 'idle' && !searched && (
         <div className="ui-radius-control mb-4 flex items-center justify-center gap-2 border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-gray-700">
           <div className="w-2 h-2 bg-green-500 rounded-full"></div>
           Listo para buscar
          </div>
      )}
      
      {locationStatus === 'locating' && searchMode === 'location' && (
        <div className="ui-card flex flex-col items-center justify-center py-8 text-gray-500">
          <div className="mb-3 text-red-400">
             <MapPin size={48} />
          </div>
          <p>Obteniendo ubicación precisa...</p>
        </div>
      )}

      {locationStatus === 'locating' && searchMode === 'address' && (
        <div className="ui-card flex flex-col items-center justify-center py-8 text-gray-500">
          <div className="mb-3 text-red-400">
            <Search size={48} />
          </div>
          <p>Buscando dirección...</p>
        </div>
      )}

      {searched && !loading && (
        <div className="space-y-4">
          <div className="mb-1 flex items-center justify-between">
             <h2 className="text-sm font-bold text-gray-900">Resultados ({stations.length})</h2>
              <span className="text-xs text-gray-500">
               {sortBy === 'price' ? 'más baratas primero' : 'más cercanas primero'}
              </span>
            </div>

          <div className="ui-radius-control mb-3 grid grid-cols-2 gap-1.5 bg-gray-100 p-1">
            <button 
              type="button"
              onClick={() => setSortBy('price')}
              className={`ui-radius-control border px-3 py-2 text-sm font-bold transition-colors ${sortBy === 'price' ? 'border-red-200 bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-transparent text-gray-600'}`}
            >
              Precio
            </button>
            <button 
              type="button"
              onClick={() => setSortBy('distance')}
              className={`ui-radius-control border px-3 py-2 text-sm font-bold transition-colors ${sortBy === 'distance' ? 'border-red-200 bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-transparent text-gray-600'}`}
            >
              Distancia
            </button>
          </div>

          {stations.length === 0 ? (
             <div className="ui-card py-8 text-center border-dashed border-gray-300">
               <Search size={48} className="mx-auto text-gray-300 mb-2" />
               <p className="text-gray-500 font-medium">No se encontraron gasolineras</p>
               <p className="text-sm text-gray-400">Intenta aumentar el radio de búsqueda</p>
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
        </div>
      )}

      <section className="ui-card mt-6 space-y-3 p-4">
        <h2 className="text-lg font-black text-gray-900">Guia rapida</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          EspaOil te permite encontrar gasolineras cercanas por ubicacion o direccion, filtrar por combustible y ordenar por precio o distancia para decidir mas rapido.
        </p>
        <div className="space-y-3 border-t border-gray-100 pt-3 text-sm text-gray-600">
          <div>
            <h3 className="font-bold text-gray-800">Como ahorrar mas al repostar?</h3>
            <p>Ordena por precio, ajusta el radio de busqueda y compara opciones cercanas antes de iniciar la ruta.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-800">De donde salen los precios?</h3>
            <p>De fuentes oficiales publicadas por el Ministerio para la Transicion Ecologica y el Reto Demografico.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Cada cuanto se actualiza la informacion?</h3>
            <p>Mostramos la informacion mas reciente disponible para cada estacion para facilitar una comparacion fiable.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
