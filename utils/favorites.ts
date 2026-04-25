import { FavoriteStation, GasStationModel, FuelType } from '@/types';

const FAVORITES_STORAGE_KEY = 'espaoil.favorites';

type RawFavorite = Partial<FavoriteStation> & {
  lat?: number | string;
  lon?: number | string;
  numericLat?: number | string;
  numericLon?: number | string;
  distance?: number | string;
  town?: string;
  lastKnownPrice?: number | string;
  lastKnownSchedule?: string;
};

const getIdentityValues = (input: {
  trader?: string;
  name?: string;
  municipality?: string;
  town?: string;
}) => {
  const traderRaw = typeof input.trader === 'string' ? input.trader.trim() : '';
  const nameRaw = typeof input.name === 'string' ? input.name.trim() : '';
  const municipalityRaw =
    typeof input.municipality === 'string'
      ? input.municipality.trim()
      : typeof input.town === 'string'
        ? input.town.trim()
        : '';

  const identityTrader = traderRaw || nameRaw || 'Gasolinera';
  const identityName = nameRaw || traderRaw || 'Sin nombre';
  const displayTrader = traderRaw || nameRaw || 'Gasolinera';
  const displayName = nameRaw || traderRaw || 'Sin nombre';

  return {
    identityTrader,
    identityName,
    displayTrader,
    displayName,
    municipality: municipalityRaw,
  };
};

export const generateStationIdFromModel = (station: GasStationModel, fuelType: FuelType): string => {
  const { identityTrader, identityName, municipality } = getIdentityValues(station);
  return generateStationId(station.latitude, station.longitude, fuelType, identityTrader, identityName, municipality);
};

const normalizeStationText = (value: string): string => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Genera un ID único para una gasolinera basado en sus coordenadas y tipo de combustible
 */
export const generateStationId = (
  lat: number,
  lon: number,
  fuelType: FuelType,
  trader = '',
  name = '',
  municipality = ''
): string => {
  const traderKey = normalizeStationText(trader);
  const nameKey = normalizeStationText(name);
  const municipalityKey = normalizeStationText(municipality);

  if (!traderKey && !nameKey && !municipalityKey) {
    return `${lat}-${lon}-${fuelType}`;
  }

  return `${lat}-${lon}-${fuelType}::${traderKey}::${nameKey}::${municipalityKey}`;
};

/**
 * Lee los favoritos desde localStorage
 */
export const getFavorites = (): FavoriteStation[] => {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('Favorites data is not an array, resetting');
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
      return [];
    }

    // Normalizar y soportar formato legacy (coords como string o lat/lon)
    const normalizedFavorites = parsed.flatMap((item: unknown): FavoriteStation[] => {
      if (typeof item !== 'object' || item === null) {
        return [];
      }

      const candidate = item as RawFavorite;
      const latitudeRaw = candidate.latitude ?? candidate.lat ?? candidate.numericLat;
      const longitudeRaw = candidate.longitude ?? candidate.lon ?? candidate.numericLon;
      const latitude =
        typeof latitudeRaw === 'number' ? latitudeRaw : typeof latitudeRaw === 'string' ? parseFloat(latitudeRaw) : NaN;
      const longitude =
        typeof longitudeRaw === 'number' ? longitudeRaw : typeof longitudeRaw === 'string' ? parseFloat(longitudeRaw) : NaN;
      const distance =
        typeof candidate.distance === 'number'
          ? candidate.distance
          : typeof candidate.distance === 'string'
            ? parseFloat(candidate.distance)
            : undefined;
      const lastKnownPrice =
        typeof candidate.lastKnownPrice === 'number'
          ? candidate.lastKnownPrice
          : typeof candidate.lastKnownPrice === 'string'
            ? parseFloat(candidate.lastKnownPrice)
            : undefined;

      const { identityTrader, identityName, displayTrader, displayName, municipality } = getIdentityValues(candidate);

      // Skip favorites without fuelType (legacy data) - they will be discarded
      if (!candidate.fuelType || !Object.values(FuelType).includes(candidate.fuelType)) {
        return [];
      }

      if (
        Number.isNaN(latitude) ||
        Number.isNaN(longitude)
      ) {
        return [];
      }

      const normalized: FavoriteStation = {
        id: generateStationId(latitude, longitude, candidate.fuelType as FuelType, identityTrader, identityName, municipality),
        trader: displayTrader,
        name: displayName,
        municipality,
        latitude,
        longitude,
        fuelType: candidate.fuelType as FuelType,
        distance: Number.isNaN(distance ?? NaN) ? undefined : distance,
        lastKnownPrice: Number.isNaN(lastKnownPrice ?? NaN) ? undefined : lastKnownPrice,
        lastKnownSchedule: typeof candidate.lastKnownSchedule === 'string' ? candidate.lastKnownSchedule : undefined,
        addedAt: typeof candidate.addedAt === 'number' ? candidate.addedAt : Date.now(),
      };

      return [normalized];
    });

    // Evitar duplicados por id
    const deduped = normalizedFavorites.reduce<FavoriteStation[]>((acc, favorite) => {
      if (!acc.some((item) => item.id === favorite.id)) {
        acc.push(favorite);
      }
      return acc;
    }, []);

    return deduped;
  } catch (error) {
    console.error('Error reading favorites from localStorage', error);
    return [];
  }
};

/**
 * Guarda los favoritos en localStorage
 */
export const saveFavorites = (favorites: FavoriteStation[]): void => {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('Error saving favorites to localStorage', error);
    // Si falla por quota exceeded, podríamos mostrar un error al usuario
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new Error('No hay suficiente espacio para guardar favoritos. Limpia algunos favoritos antiguos.');
    }
    throw error;
  }
};

/**
 * Añade una gasolinera a favoritos
 */
export const addFavorite = (station: GasStationModel, fuelType: FuelType): void => {
  const favorites = getFavorites();
  const { displayTrader, displayName, municipality } = getIdentityValues(station);
  const id = generateStationIdFromModel(station, fuelType);

  // Evitar duplicados
  if (favorites.some((fav) => fav.id === id)) {
    return;
  }

  const newFavorite: FavoriteStation = {
    id,
    trader: displayTrader,
    name: displayName,
    municipality,
    latitude: station.latitude,
    longitude: station.longitude,
    fuelType,
    distance: station.distance,
    lastKnownPrice: station.price > 0 ? station.price : undefined,
    lastKnownSchedule: station.schedule,
    addedAt: Date.now(),
  };

  favorites.push(newFavorite);
  saveFavorites(favorites);
};

/**
 * Elimina una gasolinera de favoritos
 */
export const removeFavorite = (id: string): void => {
  const favorites = getFavorites();
  const filtered = favorites.filter((fav) => fav.id !== id);
  saveFavorites(filtered);
};

/**
 * Comprueba si una gasolinera es favorita
 */
export const isFavorite = (
  stationOrLat: GasStationModel | number,
  fuelTypeOrLon?: FuelType | number,
  lon?: number,
  traderArg = '',
  nameArg = '',
  municipalityArg = ''
): boolean => {
  const favorites = getFavorites();
  if (typeof stationOrLat === 'number') {
    // Legacy: isFavorite(lat, lon, trader, name, municipality)
    // New: isFavorite(lat, fuelType, lon, trader, name, municipality)
    if (typeof fuelTypeOrLon === 'number') {
      // Legacy call: (lat, lon, trader, name, municipality)
      const hasDescriptor = Boolean(traderArg || nameArg || municipalityArg);
      if (!hasDescriptor) {
        return favorites.some((fav) => fav.latitude === stationOrLat && fav.longitude === (fuelTypeOrLon ?? 0));
      }
      // This is legacy and won't work with new fuelType requirement
      // Callers should use new signature
      return false;
    } else {
      // New call: (lat, fuelType, lon, trader, name, municipality)
      const fuelType = fuelTypeOrLon;
      if (!fuelType || !Object.values(FuelType).includes(fuelType)) {
        return false;
      }
      const hasDescriptor = Boolean(traderArg || nameArg || municipalityArg);
      if (!hasDescriptor) {
        return favorites.some((fav) => fav.latitude === stationOrLat && fav.longitude === (lon ?? 0) && fav.fuelType === fuelType);
      }

      const id = generateStationId(stationOrLat, lon ?? 0, fuelType, traderArg, nameArg, municipalityArg);
      return favorites.some((fav) => fav.id === id);
    }
  }

  const fuelType = fuelTypeOrLon;
  if (!fuelType || typeof fuelType !== 'string' || !Object.values(FuelType).includes(fuelType as FuelType)) {
    return false;
  }
  const id = generateStationIdFromModel(stationOrLat, fuelType as FuelType);
  return favorites.some((fav) => fav.id === id);
};

/**
 * Alterna el estado de favorito de una gasolinera
 * @returns true si se añadió a favoritos, false si se quitó
 */
export const toggleFavorite = (station: GasStationModel, fuelType: FuelType): boolean => {
  const { displayTrader, displayName, municipality } = getIdentityValues(station);
  const id = generateStationIdFromModel(station, fuelType);
  const favorites = getFavorites();
  const existingIndex = favorites.findIndex((fav) => fav.id === id);

  if (existingIndex >= 0) {
    // Ya existe, quitar
    favorites.splice(existingIndex, 1);
    saveFavorites(favorites);
    return false;
  }

  // No existe, añadir
  const newFavorite: FavoriteStation = {
    id,
    trader: displayTrader,
    name: displayName,
    municipality,
    latitude: station.latitude,
    longitude: station.longitude,
    fuelType,
    distance: station.distance,
    lastKnownPrice: station.price > 0 ? station.price : undefined,
    lastKnownSchedule: station.schedule,
    addedAt: Date.now(),
  };

  favorites.push(newFavorite);
  saveFavorites(favorites);
  return true;
};
