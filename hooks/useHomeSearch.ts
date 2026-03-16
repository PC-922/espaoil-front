import { useEffect, useMemo, useState } from 'react';
import { CONFIG } from '../config';
import { defaultGasStationRepository } from '../repositories/httpGasStationRepository';
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
        radius: parsed.radius,
        sortBy: parsed.sortBy,
        stations: parsed.stations as GasStationModel[],
        searched: parsed.searched,
        searchMode: parsed.searchMode,
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
  const [storedState] = useState<HomePersistedState | null>(() => getStoredHomeState());
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

    let idleCallbackId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const persistState = () => {
      try {
        sessionStorage.setItem(HOME_STATE_STORAGE_KEY, JSON.stringify(stateToPersist));
      } catch {
        // noop
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleCallbackId = (window as Window & { requestIdleCallback: (cb: () => void, options?: { timeout: number }) => number }).requestIdleCallback(
        persistState,
        { timeout: 500 }
      );
    } else {
      timeoutId = globalThis.setTimeout(persistState, 0);
    }

    return () => {
      if (
        typeof window !== 'undefined' &&
        'cancelIdleCallback' in window &&
        typeof idleCallbackId === 'number'
      ) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleCallbackId);
      }
      if (typeof timeoutId !== 'undefined') {
        globalThis.clearTimeout(timeoutId);
      }
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

  const handleAddressQueryChange = (value: string) => {
    setAddressQuery(value);
    if (selectedSuggestion?.label !== value.trim()) {
      setSelectedSuggestion(null);
    }
  };

  const handleSelectAddressSuggestion = (suggestion: AddressSuggestion) => {
    setAddressQuery(suggestion.label);
    setSelectedSuggestion(suggestion);
    setAddressSuggestions([]);
    setSuggestionsLoading(false);
  };

  const handleSearch = async () => {
    setLocationStatus('locating');
    setLoading(true);

    try {
      let lat: number;
      let lon: number;

      if (searchMode === 'address') {
        const trimmedAddress = addressQuery.trim();
        if (!trimmedAddress) {
          setLocationStatus('error');
          alert('Escribe una dirección para buscar.');
          return;
        }

        if (selectedSuggestion && selectedSuggestion.label === trimmedAddress) {
          lat = selectedSuggestion.lat;
          lon = selectedSuggestion.lon;
        } else {
          const coordinates = await geocodeAddress(trimmedAddress);
          lat = coordinates.lat;
          lon = coordinates.lon;
        }
      } else {
        if (!navigator.geolocation) {
          alert('La geolocalización no está soportada por tu navegador.');
          setLocationStatus('error');
          return;
        }

        if (!window.isSecureContext) {
          setLocationStatus('error');
          alert('Para usar geolocalización en móvil debes abrir la app en HTTPS (o localhost).');
          return;
        }

        let position: GeolocationPosition;

        try {
          position = await getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        } catch {
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
      const data = await defaultGasStationRepository.getNearbyStations({
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
  };

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
