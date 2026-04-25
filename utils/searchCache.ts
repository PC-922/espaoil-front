import { GasStationModel, FuelType } from '../types';

interface SearchCacheEntry {
  stations: GasStationModel[];
  timestamp: number;
  params: {
    lat: number;
    lon: number;
    radiusKm: number;
    fuelType: FuelType;
  };
}

const SEARCH_CACHE_KEY = 'espaoil.search-cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Obtiene las estaciones del cache si son válidas
 * Retorna null si no existe cache o si ha expirado
 */
export const getSearchCache = (
  lat: number,
  lon: number,
  radiusKm: number,
  fuelType: FuelType
): GasStationModel[] | null => {
  try {
    const raw = localStorage.getItem(SEARCH_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const cached = JSON.parse(raw) as SearchCacheEntry;
    const now = Date.now();
    const isExpired = now - cached.timestamp > CACHE_TTL_MS;

    if (isExpired) {
      clearSearchCache();
      return null;
    }

    // Verificar que los parámetros coinciden con tolerancia de ~50 metros (0.0005 grados)
    const LOCATION_TOLERANCE = 0.0005;
    const paramsMatch =
      Math.abs(cached.params.lat - lat) < LOCATION_TOLERANCE &&
      Math.abs(cached.params.lon - lon) < LOCATION_TOLERANCE &&
      cached.params.radiusKm === radiusKm &&
      cached.params.fuelType === fuelType;

    if (!paramsMatch || cached.stations.length === 0) {
      return null;
    }

    return cached.stations;
  } catch {
    return null;
  }
};

/**
 * Guarda las estaciones en el cache con timestamp actual
 */
export const setSearchCache = (
  lat: number,
  lon: number,
  radiusKm: number,
  fuelType: FuelType,
  stations: GasStationModel[]
): void => {
  try {
    const entry: SearchCacheEntry = {
      stations,
      timestamp: Date.now(),
      params: {
        lat,
        lon,
        radiusKm,
        fuelType,
      },
    };
    localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(entry));
  } catch (error) {
    console.error('Error saving search cache', error);
  }
};

/**
 * Verifica si el cache es válido (existe y no ha expirado)
 */
export const isCacheValid = (
  lat: number,
  lon: number,
  radiusKm: number,
  fuelType: FuelType
): boolean => {
  const cached = getSearchCache(lat, lon, radiusKm, fuelType);
  return cached !== null && cached.length > 0;
};

/**
 * Limpia el cache de búsqueda
 */
export const clearSearchCache = (): void => {
  try {
    localStorage.removeItem(SEARCH_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing search cache', error);
  }
};
