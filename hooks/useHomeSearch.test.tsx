// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FuelType, GasStationModel } from '../types';

const mockGetNearbyStations = vi.fn();

vi.mock('../repositories/httpGasStationRepository', () => ({
  defaultGasStationRepository: {
    getNearbyStations: (...args: unknown[]) => mockGetNearbyStations(...args),
  },
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
      })
    );

    const { result } = renderHook(() => useHomeSearch());

    expect(result.current.fuelType).toBe(FuelType.GASOIL_A);
    expect(result.current.radius).toBe(35);
    expect(result.current.sortBy).toBe('distance');
    expect(result.current.searched).toBe(true);
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
    expect(mockGetNearbyStations).not.toHaveBeenCalled();
  });
});
