import React from 'react';
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

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto">
      <header className="text-center mb-6">
        <h1 className="text-2xl font-black tracking-tight text-gray-900">EspaOil</h1>
      </header>

      {/* Controls Section */}
      <section className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 space-y-4 mb-6">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Modo de búsqueda</label>
          <div className="flex gap-2 bg-gray-200 p-1 rounded-xl">
            <button
              onClick={() => setSearchMode('location')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${searchMode === 'location' ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-300'}`}
            >
              Mi ubicación
            </button>
            <button
              onClick={() => setSearchMode('address')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${searchMode === 'address' ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-300'}`}
            >
              Dirección
            </button>
          </div>
        </div>

        {searchMode === 'address' && (
          <div className="relative">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Dirección</label>
            <input
              type="text"
              value={addressQuery}
              onChange={(e) => handleAddressQueryChange(e.target.value)}
              placeholder="Ej: Gran Vía 1, Madrid"
              className="w-full bg-red-50 border border-red-100 text-red-900 font-semibold rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            {addressQuery.trim().length >= 3 && (suggestionsLoading || addressSuggestions.length > 0) && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-sm max-h-60 overflow-auto z-20">
                {suggestionsLoading && (
                  <div className="px-3 py-2 text-sm text-gray-400">Buscando sugerencias...</div>
                )}

                {!suggestionsLoading &&
                  addressSuggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.lat}-${suggestion.lon}-${index}`}
                      type="button"
                      onClick={() => handleSelectAddressSuggestion(suggestion)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-red-50 border-b border-gray-100 last:border-b-0"
                    >
                      {suggestion.label}
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo de combustible</label>
          <div className="relative">
            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value as FuelType)}
              className="w-full appearance-none bg-red-50 border border-red-100 text-red-900 font-semibold rounded-xl py-3 px-4 pr-8 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {Object.entries(FUEL_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-red-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <label className="block text-xs font-bold text-gray-500 uppercase">Radio de búsqueda (km)</label>
            <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 rounded">{radius} km</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="100" 
            value={radius} 
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
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

      {/* Status Indicator */}
      {locationStatus === 'idle' && !searched && (
         <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-8 animate-pulse">
           <div className="w-2 h-2 bg-green-500 rounded-full"></div>
           Listo para buscar
         </div>
      )}
      
      {locationStatus === 'locating' && searchMode === 'location' && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <div className="animate-bounce mb-4 text-red-200">
             <MapPin size={48} />
          </div>
          <p>Obteniendo ubicación precisa...</p>
        </div>
      )}

      {locationStatus === 'locating' && searchMode === 'address' && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <div className="animate-pulse mb-4 text-red-200">
            <Search size={48} />
          </div>
          <p>Buscando dirección...</p>
        </div>
      )}

      {/* Results Section */}
      {searched && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
             <h2 className="text-sm font-bold text-gray-900">Resultados ({stations.length})</h2>
             <span className="text-xs text-gray-400">
              {sortBy === 'price' ? 'más baratas primero' : 'más cercanas primero'}
             </span>
          </div>

          <div className="flex gap-2 mb-4 bg-gray-200 p-1 rounded-xl">
            <button 
              onClick={() => setSortBy('price')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${sortBy === 'price' ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-300'}`}
            >
              Precio
            </button>
            <button 
              onClick={() => setSortBy('distance')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${sortBy === 'distance' ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-300'}`}
            >
              Distancia
            </button>
          </div>

          {stations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-300">
              <Search size={48} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500 font-medium">No se encontraron gasolineras</p>
              <p className="text-sm text-gray-400">Intenta aumentar el radio de búsqueda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedStations.map((station, index) => (
                <GasStationCard key={`${station.latitude}-${station.longitude}-${index}`} station={station} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};