import { useEffect, useMemo, useState } from 'react';
import { CONFIG } from '../config';
import { getGasStations } from '../services/gasStationService';
import { FuelType, GasStationModel, SortOption } from '../types';

const HOME_STATE_STORAGE_KEY = 'espaoil.homeState';

interface HomePersistedState {
  fuelType: FuelType;
  radius: number;
  sortBy: SortOption;
  stations: GasStationModel[];
  searched: boolean;
}

const getStoredHomeState = (): HomePersistedState | null => {
  try {
    const raw = localStorage.getItem(HOME_STATE_STORAGE_KEY);
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

    if (isValidFuelType && isValidSort && isValidRadius && isValidStations && isValidSearched) {
      return {
        fuelType: parsed.fuelType as FuelType,
        radius: parsed.radius,
        sortBy: parsed.sortBy,
        stations: parsed.stations as GasStationModel[],
        searched: parsed.searched,
      };
    }
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
    };

    try {
      localStorage.setItem(HOME_STATE_STORAGE_KEY, JSON.stringify(stateToPersist));
    } catch {
      // noop
    }
  }, [fuelType, radius, sortBy, stations, searched]);

  const sortedStations = useMemo(() => {
    return [...stations].sort((a, b) => {
      if (sortBy === 'price') {
        return a.numericPrice - b.numericPrice;
      }
      return a.distance - b.distance;
    });
  }, [stations, sortBy]);

  const handleSearch = async () => {
    setLocationStatus('locating');
    setLoading(true);

    if (!navigator.geolocation) {
      alert('La geolocalización no está soportada por tu navegador.');
      setLocationStatus('error');
      setLoading(false);
      return;
    }

    if (!window.isSecureContext) {
      setLocationStatus('error');
      setLoading(false);
      alert('Para usar geolocalización en móvil debes abrir la app en HTTPS (o localhost).');
      return;
    }

    try {
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

      setLocationStatus('success');
      const data = await getGasStations({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        radiusKm: radius,
        gasType: fuelType,
      });
      setStations(data);
      setSearched(true);
    } catch (error) {
      setLocationStatus('error');
      console.error(error);

      if (error instanceof GeolocationPositionError) {
        alert(getGeolocationErrorMessage(error));
      } else {
        alert('Error al conectar con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
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
