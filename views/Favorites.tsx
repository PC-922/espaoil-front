import React, {useEffect, useState} from 'react';
import {Heart, Search} from 'lucide-react';
import {FUEL_LABELS, FuelType, GasStationModel} from '../types';
import {GasStationCard} from '../components/GasStationCard';
import {useFavorites} from '../hooks/useFavorites';
import {getGasStations} from '../services/gasStationService';
import {getSearchCache, setSearchCache} from '../utils/searchCache';

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
const FAVORITES_REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutos

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
  const [favoritesWithPrices, setFavoritesWithPrices] = useState<Map<string, FavoriteWithPrice>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch de precios para favoritos
  useEffect(() => {
    let cancelled = false;

    const fetchFavoritePrices = async () => {
      if (favorites.length === 0) {
        setFavoritesWithPrices(new Map());
        return;
      }

      const now = Date.now();
      const cache = getPriceCache();
      const newMap = new Map<string, FavoriteWithPrice>();
      const favoritesToFetch = favorites.filter((fav) => {
        const cached = cache[fav.id];
        if (!cached) {
          return true;
        }

        const isFresh = now - cached.fetchedAt < FAVORITES_REFRESH_INTERVAL_MS;
        // Each favorite has its own fuel type, so always use that
        const sameFuelType = cached.fuelType === fav.fuelType;
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
            fuelType: fav.fuelType,
          },
          loading: true,
        });
      });

      setFavoritesWithPrices(newMap);

      // Fetch de precios para cada favorito
      const promises = favoritesToFetch.map(async (fav) => {
        try {
          // Intentar obtener del cache global primero
          const cachedGlobal = getSearchCache(fav.latitude, fav.longitude, 0.5, fav.fuelType);
          if (cachedGlobal && cachedGlobal.length > 0) {
            const matchedStation = selectMatchingStation(fav, cachedGlobal);
            if (matchedStation) {
              cache[fav.id] = {
                station: { ...matchedStation, fuelType: fav.fuelType },
                fuelType: fav.fuelType,
                fetchedAt: now,
              };
              newMap.set(fav.id, {
                station: applyFavoriteDistance({ ...matchedStation, fuelType: fav.fuelType }, fav.distance),
                loading: false,
              });
              return;
            }
          }

          // Si no hay cache global, hacer fetch
          const stations = await fetchStationsForFavorite(fav, fav.fuelType);

          // Buscar la gasolinera más cercana (debería ser la misma)
          if (stations.length > 0 && !cancelled) {
            // Guardar en cache global
            setSearchCache(fav.latitude, fav.longitude, 0.5, fav.fuelType, stations);

            const matchedStation = selectMatchingStation(fav, stations);
            if (!matchedStation) {
              return;
            }
            cache[fav.id] = {
              station: { ...matchedStation, fuelType: fav.fuelType },
              fuelType: fav.fuelType,
              fetchedAt: now,
            };
            newMap.set(fav.id, {
              station: applyFavoriteDistance({ ...matchedStation, fuelType: fav.fuelType }, fav.distance),
              loading: false,
            });
          } else if (!cancelled) {
            const existingCached = cache[fav.id];
            if (existingCached && existingCached.fuelType === fav.fuelType) {
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
                fuelType: fav.fuelType,
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
                fuelType: fav.fuelType,
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
        setIsLoading(false);
      }
    };

    fetchFavoritePrices();

    return () => {
      cancelled = true;
    };
  }, [favorites]);

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
        <section className="ui-fade space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-gray-600">
              <span className="h-3 w-3 animate-spin rounded-full border-b-2 border-gray-600"></span>
              Actualizando precios...
            </div>
          )}

          {sortedFavorites.length === 0 && isLoading ? (
            <div className="ui-card py-8 text-center">
              <Search size={42} className="mx-auto mb-2 text-gray-300" />
              <p className="font-semibold text-gray-700">Cargando favoritos...</p>
            </div>
          ) : (
            // Agrupar por tipo de combustible
            Object.entries(
              sortedFavorites.reduce<Record<string, Array<[string, FavoriteWithPrice]>>>((acc, entry) => {
                const fuelType = entry[1].station.fuelType || 'UNKNOWN';
                if (!acc[fuelType]) {
                  acc[fuelType] = [];
                }
                acc[fuelType].push(entry);
                return acc;
              }, {})
            ).map(([fuelType, items]) => (
              <div key={fuelType} className="space-y-3">
                <h3 className="text-sm font-black tracking-wide text-gray-900">
                  {FUEL_LABELS[fuelType as FuelType] || fuelType} ({items.length})
                </h3>
                <div className="space-y-3">
                  {items.map(([favoriteId, item]) => (
                    <GasStationCard
                      key={favoriteId}
                      station={item.station}
                      isFavorite={true}
                      onToggleFavorite={() => removeFavorite(favoriteId)}
                    />
                  ))}
                </div>
              </div>
            ))
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
         </div>
      </section>
    </div>
  );
};
