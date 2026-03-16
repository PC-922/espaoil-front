import { MapProvider } from '../types';

const MAP_PROVIDER_STORAGE_KEY = 'espaoil.mapProvider';
const DEFAULT_MAP_PROVIDER: MapProvider = 'google';
let cachedMapProvider: MapProvider | null = null;

export const getMapProvider = (): MapProvider => {
  if (cachedMapProvider) {
    return cachedMapProvider;
  }

  try {
    const value = localStorage.getItem(MAP_PROVIDER_STORAGE_KEY);
    if (value === 'google' || value === 'apple' || value === 'waze') {
      cachedMapProvider = value;
      return value;
    }
  } catch {
    // noop
  }

  cachedMapProvider = DEFAULT_MAP_PROVIDER;
  return DEFAULT_MAP_PROVIDER;
};

export const setMapProvider = (provider: MapProvider): void => {
  try {
    localStorage.setItem(MAP_PROVIDER_STORAGE_KEY, provider);
    cachedMapProvider = provider;
  } catch {
    // noop
  }
};

export const buildMapUrl = (provider: MapProvider, lat: number, lon: number): string => {
  const destination = `${lat},${lon}`;

  if (provider === 'apple') {
    return `https://maps.apple.com/?daddr=${destination}&dirflg=d`;
  }

  if (provider === 'waze') {
    return `https://www.waze.com/ul?ll=${destination}&navigate=yes`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
};
