import React, { useCallback, useEffect, useState } from 'react';
import { Heart, RefreshCw, Search } from 'lucide-react';
import { FuelType, FUEL_LABELS, GasStationModel } from '../types';
import { GasStationCard } from '../components/GasStationCard';
import { useFavorites } from '../hooks/useFavorites';
import { getGasStations } from '../services/gasStationService';
import { CONFIG } from '../config';
import { formatRefreshIntervalLabel, getFavoritesRefreshIntervalMs } from '../utils/favoritesRefresh';

interface FavoriteWithPrice {
  station: GasStationModel;
  loading: boolean;
}

interface FavoritePriceCacheEntry {
  station: GasStationModel;
  fuelType: FuelType;
  fetchedAt: number;
}

const normalizeIdentityText = (value: unknown): string => {
  const safeValue = typeof value === 'string' ? value : '';
  return safeValue
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
};

const selectMatchingStation = (
  favorite: { trader: string; name: string; municipality: string; latitude: number; longitude: number },
  stations: GasStationModel[]
): GasStationModel | undefined => {
  const favoriteTrader = normalizeIdentityText(favorite.trader);
  const favoriteName = normalizeIdentityText(favorite.name);
  const favoriteMunicipality = normalizeIdentityText(favorite.municipality);

  const byDistance = [...stations].sort((a, b) => a.distance - b.distance);

  const nearest = byDistance[0];
  const nearestDistance = nearest ? nearest.distance : Number.POSITIVE_INFINITY;
  const nearCandidates = byDistance.filter((station) => station.distance <= nearestDistance + 0.05);

  const exactMatch = nearCandidates.find((station) => {
    return (
      normalizeIdentityText(station.trader) === favoriteTrader &&
      normalizeIdentityText(station.name) === favoriteName &&
      normalizeIdentityText(station.municipality) === favoriteMunicipality
    );
  });

  if (exactMatch) {
    return exactMatch;
  }

  const nameAndMunicipalityMatch = nearCandidates.find((station) => {
    return (
      normalizeIdentityText(station.name) === favoriteName &&
      normalizeIdentityText(station.municipality) === favoriteMunicipality
    );
  });

  if (nameAndMunicipalityMatch) {
    return nameAndMunicipalityMatch;
  }

  return nearest;
};

const applyFavoriteDistance = (station: GasStationModel, favoriteDistance?: number): GasStationModel => {
  if (typeof favoriteDistance !== 'number' || Number.isNaN(favoriteDistance)) {
    return station;
  }

  return {
    ...station,
    distance: favoriteDistance,
  };
};

const FAVORITES_PRICE_CACHE_KEY = 'espaoil.favorites.price-cache';

const getPriceCache = (): Record<string, FavoritePriceCacheEntry> => {
  try {
    const raw = localStorage.getItem(FAVORITES_PRICE_CACHE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }

    return parsed as Record<string, FavoritePriceCacheEntry>;
  } catch {
    return {};
  }
};

const savePriceCache = (cache: Record<string, FavoritePriceCacheEntry>): void => {
  try {
    localStorage.setItem(FAVORITES_PRICE_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving favorites price cache', error);
  }
};

const fetchStationsForFavorite = async (fav: { latitude: number; longitude: number }, gasType: FuelType): Promise<GasStationModel[]> => {
  const primary = await getGasStations({
    lat: fav.latitude,
    lon: fav.longitude,
    radiusKm: 0.5,
    gasType,
    sortBy: 'distance',
  });

  if (primary.length > 0) {
    return primary;
  }

  const fallback = await getGasStations({
    lat: fav.latitude,
    lon: fav.longitude,
    radiusKm: 2,
    gasType,
    sortBy: 'distance',
  });

  return fallback;
};

export const Favorites: React.FC = () => {
  const { favorites, removeFavorite } = useFavorites();
  const [fuelType, setFuelType] = useState<FuelType>(
    FuelType[CONFIG.DEFAULT_FUEL_TYPE as keyof typeof FuelType]
  );
  const [favoritesWithPrices, setFavoritesWithPrices] = useState<Map<string, FavoriteWithPrice>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refreshTick, setRefreshTick] = useState<number>(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [refreshIntervalMs, setRefreshIntervalMs] = useState<number>(() => getFavoritesRefreshIntervalMs());

  const handleFuelTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFuelType(e.target.value as FuelType);
    },
    []
  );

  const handleManualRefresh = useCallback(() => {
    setRefreshTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      setRefreshIntervalMs(getFavoritesRefreshIntervalMs());
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Fetch de precios para favoritos
  useEffect(() => {
    let cancelled = false;

    const fetchFavoritePrices = async () => {
      if (favorites.length === 0) {
        setFavoritesWithPrices(new Map());
        setLastUpdatedAt(null);
        return;
      }

      const now = Date.now();
      const cache = getPriceCache();
      const newMap = new Map<string, FavoriteWithPrice>();
      const forceRefresh = refreshTick > 0;
      const favoritesToFetch = favorites.filter((fav) => {
        if (forceRefresh) {
          return true;
        }

        const cached = cache[fav.id];
        if (!cached) {
          return true;
        }

        const isFresh = now - cached.fetchedAt < refreshIntervalMs;
        const sameFuelType = cached.fuelType === fuelType;
        if (isFresh && sameFuelType) {
          newMap.set(fav.id, {
            station: applyFavoriteDistance(cached.station, fav.distance),
            loading: false,
          });
          return false;
        }

        return true;
      });

      setIsLoading(favoritesToFetch.length > 0);

      // Inicializar con estado loading
      favoritesToFetch.forEach((fav) => {
        newMap.set(fav.id, {
          station: {
            trader: fav.trader,
            name: fav.name,
            town: fav.municipality,
            municipality: fav.municipality,
            schedule: fav.lastKnownSchedule ?? 'Cargando...',
            price: fav.lastKnownPrice ?? 0,
            latitude: fav.latitude,
            longitude: fav.longitude,
            distance: fav.distance ?? 0,
          },
          loading: true,
        });
      });

      setFavoritesWithPrices(newMap);

      // Fetch de precios para cada favorito
      const promises = favoritesToFetch.map(async (fav) => {
        try {
          const stations = await fetchStationsForFavorite(fav, fuelType);

          // Buscar la gasolinera más cercana (debería ser la misma)
          if (stations.length > 0 && !cancelled) {
            const matchedStation = selectMatchingStation(fav, stations);
            if (!matchedStation) {
              return;
            }
            cache[fav.id] = {
              station: matchedStation,
              fuelType,
              fetchedAt: now,
            };
            newMap.set(fav.id, {
              station: applyFavoriteDistance(matchedStation, fav.distance),
              loading: false,
            });
          } else if (!cancelled) {
            const existingCached = cache[fav.id];
            if (existingCached && existingCached.fuelType === fuelType) {
              newMap.set(fav.id, {
                station: applyFavoriteDistance(existingCached.station, fav.distance),
                loading: false,
              });
              return;
            }

            // No se encontró precio, usar datos básicos
            newMap.set(fav.id, {
              station: {
                trader: fav.trader,
                name: fav.name,
                town: fav.municipality,
                municipality: fav.municipality,
                schedule: fav.lastKnownSchedule ?? 'N/D',
                price: fav.lastKnownPrice ?? 0,
                latitude: fav.latitude,
                longitude: fav.longitude,
                distance: fav.distance ?? 0,
              },
              loading: false,
            });
          }
        } catch (error) {
          console.error(`Error fetching price for favorite ${fav.id}`, error);
          if (!cancelled) {
            newMap.set(fav.id, {
              station: {
                trader: fav.trader,
                name: fav.name,
                town: fav.municipality,
                municipality: fav.municipality,
                schedule: fav.lastKnownSchedule ?? 'Error',
                price: fav.lastKnownPrice ?? 0,
                latitude: fav.latitude,
                longitude: fav.longitude,
                distance: fav.distance ?? 0,
              },
              loading: false,
            });
          }
        }
      });

      await Promise.all(promises);

      if (!cancelled) {
        if (favoritesToFetch.length > 0) {
          savePriceCache(cache);
        }
        setFavoritesWithPrices(new Map(newMap));
        const mostRecentUpdate = favorites.reduce<number | null>((latest, favorite) => {
          const cached = cache[favorite.id];
          if (!cached || cached.fuelType !== fuelType) {
            return latest;
          }

          if (latest === null || cached.fetchedAt > latest) {
            return cached.fetchedAt;
          }

          return latest;
        }, null);
        setLastUpdatedAt(mostRecentUpdate);
        setIsLoading(false);
      }
    };

    fetchFavoritePrices();

    return () => {
      cancelled = true;
    };
  }, [favorites, fuelType, refreshIntervalMs, refreshTick]);

  const sortedFavorites = Array.from(favoritesWithPrices.entries()).sort(([, a], [, b]) => {
    // Ordenar por precio (más barato primero)
    return a.station.price - b.station.price;
  });

  return (
    <div className="ui-page space-y-5">
      <header className="ui-rise space-y-2">
        <p className="ui-brand text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">
          EspaOil
        </p>
        <h1 className="text-[1.75rem] font-black leading-[1.05] text-[var(--color-text)]">
          Mis gasolineras favoritas
        </h1>
        <p className="max-w-[34ch] text-sm font-medium text-[var(--color-muted)]">
          Compara precios de tus gasolineras de confianza en un solo lugar.
        </p>
      </header>

      {favorites.length > 0 && (
        <section className="ui-card ui-rise p-4">
          <div className="space-y-3">
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-gray-600">
              Combustible
            </label>
            <div className="relative">
              <select
                value={fuelType}
                onChange={handleFuelTypeChange}
                className="ui-select appearance-none px-3 py-2.5 pr-9 text-sm font-semibold focus:outline-none"
              >
                {Object.entries(FUEL_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>

            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="ui-radius-control inline-flex min-h-9 items-center gap-2 border border-red-100 bg-[var(--color-accent-soft)] px-3 py-2 text-xs font-bold text-[var(--color-accent)] transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              Actualizar precios ahora
            </button>
          </div>
        </section>
      )}

      {favorites.length === 0 ? (
        <section className="ui-card ui-fade py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-soft)]">
            <Heart size={32} className="text-[var(--color-accent)]" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">No tienes favoritos aún</h2>
          <p className="mt-2 text-sm text-gray-600">
            Busca gasolineras y añádelas a favoritos para verlas aquí.
          </p>
          <p className="mt-4 text-sm font-medium text-gray-700">
            Haz clic en el corazón de cualquier gasolinera para añadirla.
          </p>
        </section>
      ) : (
        <section className="ui-fade space-y-3">
          <div className="flex items-end justify-between">
            <h2 className="text-sm font-black tracking-wide text-gray-900">
              Favoritos ({favorites.length})
            </h2>
            <div className="text-right">
              {lastUpdatedAt && !isLoading && (
                <p className="text-xs font-medium text-gray-600">
                  Ultima actualizacion: {new Date(lastUpdatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
              {isLoading && (
                <span className="flex items-center justify-end gap-2 text-xs font-medium text-gray-600">
                  <span className="h-3 w-3 animate-spin rounded-full border-b-2 border-gray-600"></span>
                  Actualizando precios...
                </span>
              )}
            </div>
          </div>

          {sortedFavorites.length === 0 && isLoading ? (
            <div className="ui-card py-8 text-center">
              <Search size={42} className="mx-auto mb-2 text-gray-300" />
              <p className="font-semibold text-gray-700">Cargando favoritos...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedFavorites.map(([favoriteId, item]) => (
                <GasStationCard
                  key={favoriteId}
                  station={item.station}
                  isFavorite={true}
                  onToggleFavorite={() => removeFavorite(favoriteId)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-3 pt-2">
        <div className="ui-divider"></div>
        <h2 className="text-sm font-black uppercase tracking-wide text-gray-900">
          Sobre los favoritos
        </h2>
        <div className="space-y-2 text-sm text-gray-700">
          <p>Tus favoritos se guardan en este navegador.</p>
          <p>Usa el corazón para añadir o quitar estaciones en cualquier momento.</p>
          <p>Los precios se actualizan automaticamente cada {formatRefreshIntervalLabel(refreshIntervalMs)}.</p>
          <p>Si quieres, puedes pulsar "Actualizar precios ahora" para refrescarlos al instante.</p>
          <p>En Configuracion puedes cambiar cada cuanto tiempo se actualizan los precios.</p>
        </div>
      </section>
    </div>
  );
};
