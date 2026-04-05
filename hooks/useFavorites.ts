import { useCallback, useEffect, useState } from 'react';
import { FavoriteStation, GasStationModel } from '@/types';
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

  const addFavorite = useCallback((station: GasStationModel) => {
    addFavoriteUtil(station);
    setFavorites(getFavoritesUtil());
  }, []);

  const removeFavorite = useCallback((id: string) => {
    removeFavoriteUtil(id);
    setFavorites(getFavoritesUtil());
  }, []);

  const toggleFavorite = useCallback((station: GasStationModel): boolean => {
    const isNowFavorite = toggleFavoriteUtil(station);
    setFavorites(getFavoritesUtil());
    return isNowFavorite;
  }, []);

  const isFavorite = useCallback(
    (
      stationOrLat: GasStationModel | number,
      lon?: number,
      trader = '',
      name = '',
      municipality = ''
    ): boolean => {
      if (typeof stationOrLat === 'number') {
        const hasDescriptor = Boolean(trader || name || municipality);
        if (!hasDescriptor) {
          return favorites.some((fav) => fav.latitude === stationOrLat && fav.longitude === (lon ?? 0));
        }

        const id = generateStationId(stationOrLat, lon ?? 0, trader, name, municipality);
        return favorites.some((fav) => fav.id === id);
      }

      const id = generateStationIdFromModel(stationOrLat);
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
