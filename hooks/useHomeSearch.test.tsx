// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CONFIG } from '../config';
import { FuelType, GasStationModel } from '../types';

const mockGetNearbyStations = vi.fn();
const mockGeocodeAddress = vi.fn();
const mockSearchAddressSuggestions = vi.fn();

vi.mock('../repositories/httpGasStationRepository', () => ({
  defaultGasStationRepository: {
    getNearbyStations: (...args: unknown[]) => mockGetNearbyStations(...args),
  },
}));

vi.mock('../utils/geocoding', () => ({
  geocodeAddress: (...args: unknown[]) => mockGeocodeAddress(...args),
  searchAddressSuggestions: (...args: unknown[]) => mockSearchAddressSuggestions(...args),
}));

import { useHomeSearch } from './useHomeSearch';

const setMockGeolocation = (
  implementation: (success: PositionCallback, error?: PositionErrorCallback) => void
) => {
  Object.defineProperty(window.navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: implementation,
    },
  });
};

const sampleStation = (overrides?: Partial<GasStationModel>): GasStationModel => ({
  trader: 'REPSOL',
  name: 'ESTACIÓN TEST',
  town: 'MADRID',
  municipality: 'MADRID',
  schedule: '24H',
  price: '1.499',
  latitude: '40.4200',
  longitude: '-3.7000',
  numericPrice: 1.499,
  numericLat: 40.42,
  numericLon: -3.7,
  distance: 3.1,
  ...overrides,
});

describe('useHomeSearch', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockSearchAddressSuggestions.mockResolvedValue([]);
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);

    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    });
  });

  it('restaura el estado persistido desde localStorage', () => {
    localStorage.setItem(
      'espaoil.homeState',
      JSON.stringify({
        fuelType: FuelType.GASOIL_A,
        radius: 35,
        sortBy: 'distance',
        stations: [sampleStation({ distance: 2.2 })],
        searched: true,
        persistedAt: Date.now(),
        searchMode: 'address',
      })
    );

    const { result } = renderHook(() => useHomeSearch());

    expect(result.current.fuelType).toBe(FuelType.GASOIL_A);
    expect(result.current.radius).toBe(35);
    expect(result.current.sortBy).toBe('distance');
    expect(result.current.searched).toBe(true);
    expect(result.current.searchMode).toBe('address');
    expect(result.current.addressQuery).toBe('');
    expect(result.current.sortedStations).toHaveLength(1);
    expect(result.current.sortedStations[0].distance).toBe(2.2);
  });

  it('realiza búsqueda y actualiza estado en flujo exitoso', async () => {
    const repositoryData = [sampleStation({ distance: 1.2 }), sampleStation({ distance: 0.7, numericPrice: 1.45 })];
    mockGetNearbyStations.mockResolvedValue(repositoryData);

    setMockGeolocation((success) => {
      success({
        coords: {
          latitude: 40.4168,
          longitude: -3.7038,
          accuracy: 1,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition);
    });

    const { result } = renderHook(() => useHomeSearch());

    await act(async () => {
      await result.current.handleSearch();
    });

    expect(mockGetNearbyStations).toHaveBeenCalledOnce();
    expect(result.current.searched).toBe(true);
    expect(result.current.locationStatus).toBe('success');
    expect(result.current.loading).toBe(false);
    expect(result.current.stations).toHaveLength(2);
  });

  it('ignora el estado persistido cuando supera 30 minutos', () => {
    localStorage.setItem(
      'espaoil.homeState',
      JSON.stringify({
        fuelType: FuelType.GASOIL_A,
        radius: 35,
        sortBy: 'distance',
        stations: [sampleStation({ distance: 2.2 })],
        searched: true,
        persistedAt: Date.now() - 31 * 60 * 1000,
        searchMode: 'location',
      })
    );

    const { result } = renderHook(() => useHomeSearch());

    expect(result.current.fuelType).toBe(FuelType[CONFIG.DEFAULT_FUEL_TYPE as keyof typeof FuelType]);
    expect(result.current.radius).toBe(CONFIG.DEFAULT_SEARCH_RADIUS_KM);
    expect(result.current.sortBy).toBe('price');
    expect(result.current.searched).toBe(false);
    expect(result.current.sortedStations).toEqual([]);
  });

  it('realiza búsqueda por dirección cuando el modo es address', async () => {
    mockGeocodeAddress.mockResolvedValue({ lat: 40.4168, lon: -3.7038 });
    mockGetNearbyStations.mockResolvedValue([sampleStation({ distance: 0.5 })]);

    const { result } = renderHook(() => useHomeSearch());

    act(() => {
      result.current.setSearchMode('address');
      result.current.setAddressQuery('Gran Vía 1, Madrid');
    });

    await act(async () => {
      await result.current.handleSearch();
    });

    expect(mockGeocodeAddress).toHaveBeenCalledWith('Gran Vía 1, Madrid');
    expect(mockGetNearbyStations).toHaveBeenCalledOnce();
    expect(result.current.locationStatus).toBe('success');
    expect(result.current.searched).toBe(true);
  });

  it('usa la sugerencia seleccionada para buscar sin geocodificar de nuevo', async () => {
    mockSearchAddressSuggestions.mockResolvedValue([
      { label: 'Gran Vía, Madrid, España', lat: 40.42, lon: -3.7 },
    ]);
    mockGetNearbyStations.mockResolvedValue([sampleStation({ distance: 0.4 })]);

    const { result } = renderHook(() => useHomeSearch());

    act(() => {
      result.current.setSearchMode('address');
      result.current.handleAddressQueryChange('Gran Vía');
    });

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.handleSelectAddressSuggestion({
        label: 'Gran Vía, Madrid, España',
        lat: 40.42,
        lon: -3.7,
      });
    });

    await act(async () => {
      await result.current.handleSearch();
    });

    expect(mockGeocodeAddress).not.toHaveBeenCalled();
    expect(mockGetNearbyStations).toHaveBeenCalledWith(
      expect.objectContaining({ lat: 40.42, lon: -3.7 })
    );
  });

  it('muestra error si se busca por dirección sin texto', async () => {
    const { result } = renderHook(() => useHomeSearch());

    act(() => {
      result.current.setSearchMode('address');
      result.current.setAddressQuery('   ');
    });

    await act(async () => {
      await result.current.handleSearch();
    });

    expect(window.alert).toHaveBeenCalledWith('Escribe una dirección para buscar.');
    expect(mockGeocodeAddress).not.toHaveBeenCalled();
    expect(mockGetNearbyStations).not.toHaveBeenCalled();
    expect(result.current.locationStatus).toBe('error');
  });

  it('marca error si geolocalización no está disponible', async () => {
    Object.defineProperty(window.navigator, 'geolocation', {
      configurable: true,
      value: undefined,
    });

    const { result } = renderHook(() => useHomeSearch());

    await act(async () => {
      await result.current.handleSearch();
    });

    expect(result.current.locationStatus).toBe('error');
    expect(result.current.loading).toBe(false);
    expect(window.alert).toHaveBeenCalledWith('La geolocalización no está soportada por tu navegador.');
    expect(mockGeocodeAddress).not.toHaveBeenCalled();
    expect(mockGetNearbyStations).not.toHaveBeenCalled();
  });
});
