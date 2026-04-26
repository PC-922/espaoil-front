import { useCallback, useEffect, useState } from 'react';
import { FavoriteStation, GasStationModel, FuelType } from '@/types';
import {
  addFavorite as addFavoriteUtil,
  generateStationId,
  generateStationIdFromModel,
  getFavorites as getFavoritesUtil,
  removeFavorite as removeFavoriteUtil,
  toggleFavorite as toggleFavoriteUtil,
} from '@/utils/favorites';

/**
 * Hook para manejar favoritos con estado reactivo
 * Sincroniza automáticamente con localStorage
 */
export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteStation[]>(() => getFavoritesUtil());

  // Sincronizar con localStorage cuando cambie el estado
  useEffect(() => {
    // Escuchar cambios en localStorage desde otras pestañas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'espaoil.favorites') {
        setFavorites(getFavoritesUtil());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const addFavorite = useCallback((station: GasStationModel, fuelType: FuelType) => {
    addFavoriteUtil(station, fuelType);
    setFavorites(getFavoritesUtil());
  }, []);

  const removeFavorite = useCallback((id: string) => {
    removeFavoriteUtil(id);
    setFavorites(getFavoritesUtil());
  }, []);

  const toggleFavorite = useCallback((station: GasStationModel, fuelType: FuelType): boolean => {
    const isNowFavorite = toggleFavoriteUtil(station, fuelType);
    setFavorites(getFavoritesUtil());
    return isNowFavorite;
  }, []);

  const isFavorite = useCallback(
    (
      stationOrLat: GasStationModel | number,
      fuelTypeOrLon?: FuelType | number,
      lon?: number,
      trader = '',
      name = '',
      municipality = ''
    ): boolean => {
      if (typeof stationOrLat === 'number') {
        if (typeof fuelTypeOrLon === 'number') {
          // Legacy: isFavorite(lat, lon, trader, name, municipality)
          const hasDescriptor = Boolean(trader || name || municipality);
          if (!hasDescriptor) {
            return favorites.some((fav) => fav.latitude === stationOrLat && fav.longitude === fuelTypeOrLon);
          }
          // Legacy with descriptor won't work anymore
          return false;
        } else {
          // New: isFavorite(lat, fuelType, lon, trader, name, municipality)
          const fuelType = fuelTypeOrLon;
          if (!fuelType || !Object.values(FuelType).includes(fuelType)) {
            return false;
          }
          const hasDescriptor = Boolean(trader || name || municipality);
          if (!hasDescriptor) {
            return favorites.some((fav) => fav.latitude === stationOrLat && fav.longitude === (lon ?? 0) && fav.fuelType === fuelType);
          }
          const id = generateStationId(stationOrLat, lon ?? 0, fuelType, trader, name, municipality);
          return favorites.some((fav) => fav.id === id);
        }
      }

      const fuelType = fuelTypeOrLon;
      if (!fuelType || typeof fuelType !== 'string' || !Object.values(FuelType).includes(fuelType as FuelType)) {
        return false;
      }
      const id = generateStationIdFromModel(stationOrLat, fuelType as FuelType);
      return favorites.some((fav) => fav.id === id);
    },
    [favorites]
  );

  const isFavoriteById = useCallback(
    (id: string): boolean => {
      return favorites.some((fav) => fav.id === id);
    },
    [favorites]
  );

  const getFavoriteById = useCallback(
    (id: string): FavoriteStation | undefined => {
      return favorites.find((fav) => fav.id === id);
    },
    [favorites]
  );

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    isFavoriteById,
    getFavoriteById,
    generateStationId,
    generateStationIdFromModel,
  };
};
