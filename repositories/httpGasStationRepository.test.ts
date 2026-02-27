import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONFIG } from '../config';
import { FuelType } from '../types';
import { HttpGasStationRepository } from './httpGasStationRepository';

const mockGetMockGasStations = vi.fn();

vi.mock('../services/mockData', () => ({
  getMockGasStations: (...args: unknown[]) => mockGetMockGasStations(...args),
}));

describe('HttpGasStationRepository', () => {
  const repository = new HttpGasStationRepository();
  const originalApiBaseUrl = CONFIG.API_BASE_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    CONFIG.API_BASE_URL = originalApiBaseUrl;
  });

  afterEach(() => {
    CONFIG.API_BASE_URL = originalApiBaseUrl;
    vi.unstubAllGlobals();
  });

  it('normaliza respuesta API y calcula distancia', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            trader: 'REPSOL',
            name: 'ESTACIÓN TEST',
            town: 'MADRID',
            municipality: 'MADRID',
            schedule: '24H',
            price: '1.499',
            latitude: '40.4200',
            longitude: '-3.7000',
          },
        ],
      })
    );

    const result = await repository.getNearbyStations({
      lat: 40.4168,
      lon: -3.7038,
      radiusKm: 10,
      gasType: FuelType.GASOLINA_95_E5,
    });

    expect(result).toHaveLength(1);
    expect(result[0].numericPrice).toBe(1.499);
    expect(result[0].numericLat).toBe(40.42);
    expect(result[0].numericLon).toBe(-3.7);
    expect(result[0].distance).toBeGreaterThan(0);
  });

  it('lanza error cuando la API responde no-ok', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
      })
    );

    await expect(
      repository.getNearbyStations({
        lat: 40.4,
        lon: -3.7,
        radiusKm: 5,
        gasType: FuelType.GASOIL_A,
      })
    ).rejects.toThrow('API Error: Internal Server Error');

    expect(errorSpy).toHaveBeenCalled();
  });

  it('usa mocks cuando no hay API_BASE_URL', async () => {
    CONFIG.API_BASE_URL = '';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    mockGetMockGasStations.mockResolvedValue([
      {
        trader: 'MOCK',
        name: 'MOCK STATION',
        town: 'SEVILLA',
        municipality: 'SEVILLA',
        schedule: '24H',
        price: 1.3,
        latitude: 37.389,
        longitude: -5.984,
      },
    ]);

    const result = await repository.getNearbyStations({
      lat: 37.3886,
      lon: -5.9823,
      radiusKm: 12,
      gasType: FuelType.GASOLINA_95_E5,
    });

    expect(mockGetMockGasStations).toHaveBeenCalledOnce();
    expect(warnSpy).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].numericPrice).toBe(1.3);
  });
});
