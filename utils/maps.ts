import { MapProvider } from '../types';

const MAP_PROVIDER_STORAGE_KEY = 'espaoil.mapProvider';
const DEFAULT_MAP_PROVIDER: MapProvider = 'google';

export const getMapProvider = (): MapProvider => {
  try {
    const value = localStorage.getItem(MAP_PROVIDER_STORAGE_KEY);
    if (value === 'google' || value === 'apple' || value === 'waze') {
      return value;
    }
  } catch {
    // noop
  }

  return DEFAULT_MAP_PROVIDER;
};

export const setMapProvider = (provider: MapProvider): void => {
  try {
    localStorage.setItem(MAP_PROVIDER_STORAGE_KEY, provider);
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
