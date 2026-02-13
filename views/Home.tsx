import React, { useState, useEffect } from 'react';
import { LocateFixed, MapPin, Search } from 'lucide-react';
import { CONFIG } from '../config';
import { FuelType, FUEL_LABELS, GasStationModel, SortOption } from '../types';
import { getGasStations } from '../services/gasStationService';
import { Button } from '../components/Button';
import { GasStationCard } from '../components/GasStationCard';

export const Home: React.FC = () => {
  const [fuelType, setFuelType] = useState<FuelType>(FuelType[CONFIG.DEFAULT_FUEL_TYPE as keyof typeof FuelType]);
  const [radius, setRadius] = useState<number>(CONFIG.DEFAULT_SEARCH_RADIUS_KM);
  const [stations, setStations] = useState<GasStationModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'success' | 'error'>('idle');
  const [sortBy, setSortBy] = useState<SortOption>('price');
  const [searched, setSearched] = useState<boolean>(false);

  // Sorting Logic
  const sortedStations = React.useMemo(() => {
    return [...stations].sort((a, b) => {
      if (sortBy === 'price') {
        return a.numericPrice - b.numericPrice;
      }
      return a.distance - b.distance;
    });
  }, [stations, sortBy]);

  const handleSearch = async () => {
    setLocationStatus('locating');
    setLoading(true);

    if (!navigator.geolocation) {
      alert("La geolocalización no está soportada por tu navegador.");
      setLocationStatus('error');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLocationStatus('success');
        try {
          const data = await getGasStations({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            radiusKm: radius,
            gasType: fuelType
          });
          setStations(data);
          setSearched(true);
        } catch (error) {
          console.error(error);
          alert("Error al conectar con el servidor.");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error(error);
        setLocationStatus('error');
        setLoading(false);
        alert("No se pudo obtener tu ubicación. Por favor, revisa los permisos.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto">
      <header className="text-center mb-6">
        <h1 className="text-2xl font-black tracking-tight text-gray-900">EspaOil</h1>
      </header>

      {/* Controls Section */}
      <section className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 space-y-4 mb-6">
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
              <LocateFixed size={18} />
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
      
      {locationStatus === 'locating' && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <div className="animate-bounce mb-4 text-red-200">
             <MapPin size={48} />
          </div>
          <p>Obteniendo ubicación precisa...</p>
        </div>
      )}

      {/* Results Section */}
      {searched && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
             <h2 className="text-sm font-bold text-gray-900">Resultados ({stations.length})</h2>
             <span className="text-xs text-gray-400">más baratas primero</span>
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