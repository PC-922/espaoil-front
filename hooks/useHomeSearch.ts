import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CONFIG } from '../config';
import { getGasStations } from '../services/gasStationService';
import { FuelType, GasStationModel, SortOption } from '../types';
import { AddressSuggestion, geocodeAddress, searchAddressSuggestions } from '../utils/geocoding';

const HOME_STATE_STORAGE_KEY = 'espaoil.homeState';

interface HomePersistedState {
  fuelType: FuelType;
  radius: number;
  sortBy: SortOption;
  stations: GasStationModel[];
  searched: boolean;
  searchMode: SearchMode;
}

type SearchMode = 'location' | 'address';

const getStoredHomeState = (): HomePersistedState | null => {
  try {
    const raw = sessionStorage.getItem(HOME_STATE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<HomePersistedState>;
    const isValidFuelType =
      typeof parsed.fuelType === 'string' &&
      Object.values(FuelType).includes(parsed.fuelType as FuelType);
    const isValidSort = parsed.sortBy === 'price' || parsed.sortBy === 'distance';
    const isValidRadius = typeof parsed.radius === 'number' && Number.isFinite(parsed.radius);
    const isValidStations = Array.isArray(parsed.stations);
    const isValidSearched = typeof parsed.searched === 'boolean';
    const isValidSearchMode = parsed.searchMode === 'location' || parsed.searchMode === 'address';

    if (
      isValidFuelType &&
      isValidSort &&
      isValidRadius &&
      isValidStations &&
      isValidSearched &&
      isValidSearchMode
    ) {
      return {
        fuelType: parsed.fuelType as FuelType,
        radius: parsed.radius!,
        sortBy: parsed.sortBy!,
        stations: parsed.stations as GasStationModel[],
        searched: parsed.searched!,
        searchMode: parsed.searchMode!,
      };
    }

    sessionStorage.removeItem(HOME_STATE_STORAGE_KEY);
  } catch {
    // noop
  }

  return null;
};

const getCurrentPosition = (options: PositionOptions): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
};

const getGeolocationErrorMessage = (error: GeolocationPositionError): string => {
  if (error.code === error.PERMISSION_DENIED) {
    return 'El acceso a la ubicación fue denegado. Revisa los permisos del navegador y del sistema.';
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return 'No se pudo determinar tu ubicación en este momento. Intenta de nuevo en unos segundos.';
  }
  if (error.code === error.TIMEOUT) {
    return 'La obtención de ubicación tardó demasiado. Intenta de nuevo con mejor señal.';
  }
  return 'No se pudo obtener tu ubicación por un error inesperado.';
};

export const useHomeSearch = () => {
  // storedState solo se lee en el mount inicial, no necesita ser estado React
  const storedState = useRef(getStoredHomeState()).current;

  const [searchMode, setSearchMode] = useState<SearchMode>(storedState?.searchMode ?? 'location');
  const [addressQuery, setAddressQuery] = useState<string>('');
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState<boolean>(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AddressSuggestion | null>(null);
  const [fuelType, setFuelType] = useState<FuelType>(
    storedState?.fuelType ?? FuelType[CONFIG.DEFAULT_FUEL_TYPE as keyof typeof FuelType]
  );
  const [radius, setRadius] = useState<number>(storedState?.radius ?? CONFIG.DEFAULT_SEARCH_RADIUS_KM);
  const [stations, setStations] = useState<GasStationModel[]>(storedState?.stations ?? []);
  const [loading, setLoading] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'success' | 'error'>('idle');
  const [sortBy, setSortBy] = useState<SortOption>(storedState?.sortBy ?? 'price');
  const [searched, setSearched] = useState<boolean>(storedState?.searched ?? false);

  useEffect(() => {
    const stateToPersist: HomePersistedState = {
      fuelType,
      radius,
      sortBy,
      stations,
      searched,
      searchMode,
    };

    // Siguiendo Vercel best practice: js-request-idle-callback
    // Aumentamos el debounce a 2000ms para reducir frecuencia de escrituras
    // y usamos SOLO requestIdleCallback sin timeout forzado para evitar
    // bloquear el hilo principal durante interacciones del usuario (reduce INP).
    const debounceId = globalThis.setTimeout(() => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as Window & { requestIdleCallback: (cb: () => void, options?: { timeout: number }) => number }).requestIdleCallback(
          () => {
            try {
              sessionStorage.setItem(HOME_STATE_STORAGE_KEY, JSON.stringify(stateToPersist));
            } catch {
              // noop - quota exceeded o storage bloqueado
            }
          },
          { timeout: 3000 } // timeout largo para no forzar durante interacciones
        );
      }
    }, 2000);

    return () => {
      globalThis.clearTimeout(debounceId);
    };
  }, [fuelType, radius, sortBy, stations, searched, searchMode]);

  const sortedStations = useMemo(() => {
    return [...stations].sort((a, b) => {
      if (sortBy === 'price') {
        return a.numericPrice - b.numericPrice;
      }
      return a.distance - b.distance;
    });
  }, [stations, sortBy]);

  useEffect(() => {
    let cancelled = false;
    let debounceId: number | undefined;

    const run = async () => {
      if (searchMode !== 'address') {
        setAddressSuggestions([]);
        setSuggestionsLoading(false);
        return;
      }

      const trimmedAddress = addressQuery.trim();
      if (trimmedAddress.length < 3) {
        setAddressSuggestions([]);
        setSuggestionsLoading(false);
        return;
      }

      if (selectedSuggestion && selectedSuggestion.label.trim() === trimmedAddress) {
        setAddressSuggestions([]);
        setSuggestionsLoading(false);
        return;
      }

      setSuggestionsLoading(true);
      try {
        const suggestions = await searchAddressSuggestions(trimmedAddress, 5);
        if (!cancelled) {
          setAddressSuggestions(suggestions);
        }
      } catch {
        if (!cancelled) {
          setAddressSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setSuggestionsLoading(false);
        }
      }
    };

    debounceId = window.setTimeout(() => {
      run();
    }, 300);

    return () => {
      cancelled = true;
      if (typeof debounceId === 'number') {
        window.clearTimeout(debounceId);
      }
    };
  }, [searchMode, addressQuery, selectedSuggestion]);

  const handleAddressQueryChange = useCallback((value: string) => {
    setAddressQuery(value);
    if (selectedSuggestion?.label !== value.trim()) {
      setSelectedSuggestion(null);
    }
  }, [selectedSuggestion]);

  const handleSelectAddressSuggestion = useCallback((suggestion: AddressSuggestion) => {
    setAddressQuery(suggestion.label);
    setSelectedSuggestion(suggestion);
    setAddressSuggestions([]);
    setSuggestionsLoading(false);
  }, []);

  const handleSearch = useCallback(async () => {
    // Validaciones síncronas antes del bloque async
    if (searchMode === 'address') {
      const trimmedAddress = addressQuery.trim();
      if (!trimmedAddress) {
        setLocationStatus('error');
        alert('Escribe una dirección para buscar.');
        return;
      }
    } else {
      if (!navigator.geolocation) {
        setLocationStatus('error');
        alert('La geolocalización no está soportada por tu navegador.');
        return;
      }
      if (!window.isSecureContext) {
        setLocationStatus('error');
        alert('Para usar geolocalización en móvil debes abrir la app en HTTPS (o localhost).');
        return;
      }
    }

    setLocationStatus('locating');
    setLoading(true);

    try {
      let lat: number;
      let lon: number;

      if (searchMode === 'address') {
        const trimmedAddress = addressQuery.trim();

        if (selectedSuggestion && selectedSuggestion.label === trimmedAddress) {
          lat = selectedSuggestion.lat;
          lon = selectedSuggestion.lon;
        } else {
          const coordinates = await geocodeAddress(trimmedAddress);
          lat = coordinates.lat;
          lon = coordinates.lon;
        }
      } else {
        let position: GeolocationPosition;

        try {
          position = await getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        } catch (firstError) {
          // Solo reintentar si NO es denegación de permisos — en ese caso el segundo
          // intento también fallaría y haría esperar al usuario 20 segundos extra.
          if (
            firstError instanceof GeolocationPositionError &&
            firstError.code === firstError.PERMISSION_DENIED
          ) {
            throw firstError;
          }
          position = await getCurrentPosition({
            enableHighAccuracy: false,
            timeout: 20000,
            maximumAge: 60000,
          });
        }

        lat = position.coords.latitude;
        lon = position.coords.longitude;
      }

      setLocationStatus('success');
      const data = await getGasStations({
        lat,
        lon,
        radiusKm: radius,
        gasType: fuelType,
      });
      setStations(data);
      setSearched(true);
      setAddressSuggestions([]);
    } catch (error) {
      setLocationStatus('error');
      console.error(error);

      if (error instanceof GeolocationPositionError) {
        alert(getGeolocationErrorMessage(error));
      } else if (error instanceof Error) {
        alert(error.message || 'Error al conectar con el servidor.');
      } else {
        alert('Error al conectar con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  }, [searchMode, addressQuery, selectedSuggestion, radius, fuelType]);

  return {
    searchMode,
    setSearchMode,
    addressQuery,
    setAddressQuery,
    addressSuggestions,
    suggestionsLoading,
    handleAddressQueryChange,
    handleSelectAddressSuggestion,
    fuelType,
    setFuelType,
    radius,
    setRadius,
    loading,
    locationStatus,
    sortBy,
    setSortBy,
    searched,
    stations,
    sortedStations,
    handleSearch,
  };
};
