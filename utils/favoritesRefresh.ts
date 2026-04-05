import { CONFIG } from '@/config';

const FAVORITES_REFRESH_INTERVAL_STORAGE_KEY = 'espaoil.favorites.refreshIntervalMs';

export const FAVORITES_REFRESH_INTERVAL_OPTIONS_MS = [
  60 * 1000,
  5 * 60 * 1000,
  10 * 60 * 1000,
  15 * 60 * 1000,
  30 * 60 * 1000,
] as const;

export const getFavoritesRefreshIntervalMs = (): number => {
  const rawValue = localStorage.getItem(FAVORITES_REFRESH_INTERVAL_STORAGE_KEY);
  if (!rawValue) {
    return CONFIG.FAVORITES_PRICE_REFRESH_INTERVAL_MS;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed)) {
    return CONFIG.FAVORITES_PRICE_REFRESH_INTERVAL_MS;
  }

  const isAllowed = FAVORITES_REFRESH_INTERVAL_OPTIONS_MS.includes(
    parsed as (typeof FAVORITES_REFRESH_INTERVAL_OPTIONS_MS)[number]
  );
  return isAllowed ? parsed : CONFIG.FAVORITES_PRICE_REFRESH_INTERVAL_MS;
};

export const setFavoritesRefreshIntervalMs = (value: number): void => {
  localStorage.setItem(FAVORITES_REFRESH_INTERVAL_STORAGE_KEY, value.toString());
};

export const formatRefreshIntervalLabel = (valueMs: number): string => {
  const minutes = Math.max(1, Math.round(valueMs / (60 * 1000)));
  return minutes === 1 ? '1 minuto' : `${minutes} minutos`;
};
