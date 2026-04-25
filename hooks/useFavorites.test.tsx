// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { GasStationModel, FuelType } from '@/types';
import { useFavorites } from './useFavorites';

describe('useFavorites', () => {
  const mockStation: GasStationModel = {
    trader: 'REPSOL',
    name: 'E.S. GRAN VIA',
    town: 'MADRID',
    municipality: 'MADRID',
    schedule: 'L-D: 24H',
    price: 1.279,
    latitude: 40.416729,
    longitude: -3.703339,
    distance: 2.5,
    fuelType: FuelType.GASOLINA_95_E5,
  };

  const mockStation2: GasStationModel = {
    ...mockStation,
    trader: 'CEPSA',
    name: 'E.S. ALCALA',
    latitude: 41.5,
    longitude: -2.8,
    fuelType: FuelType.GASOIL_A,
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('inicializa con array vacio si no hay favoritos', () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([]);
  });

  it('añade un favorito correctamente', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockStation, mockStation.fuelType!);
    });

    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0]).toMatchObject({
      trader: 'REPSOL',
      name: 'E.S. GRAN VIA',
      municipality: 'MADRID',
    });
    expect(result.current.favorites[0].id).toContain('40.416729--3.703339');
    expect(result.current.favorites[0].fuelType).toBe(FuelType.GASOLINA_95_E5);
  });

  it('elimina un favorito correctamente', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockStation, mockStation.fuelType!);
    });

    const id = result.current.favorites[0].id;

    act(() => {
      result.current.removeFavorite(id);
    });

    expect(result.current.favorites).toHaveLength(0);
  });

  it('alterna el estado de favorito correctamente', () => {
    const { result } = renderHook(() => useFavorites());

    let isNowFavorite: boolean;

    // Primera vez: añadir
    act(() => {
      isNowFavorite = result.current.toggleFavorite(mockStation, mockStation.fuelType!);
    });

    expect(isNowFavorite!).toBe(true);
    expect(result.current.favorites).toHaveLength(1);

    // Segunda vez: quitar
    act(() => {
      isNowFavorite = result.current.toggleFavorite(mockStation, mockStation.fuelType!);
    });

    expect(isNowFavorite!).toBe(false);
    expect(result.current.favorites).toHaveLength(0);
  });

  it('verifica si una gasolinera es favorita', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockStation, mockStation.fuelType!);
    });

    expect(result.current.isFavorite(mockStation, mockStation.fuelType!)).toBe(true);
    expect(result.current.isFavorite(mockStation2, mockStation2.fuelType!)).toBe(false);
  });

  it('obtiene un favorito por ID', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockStation, mockStation.fuelType!);
    });

    const favoriteId = result.current.favorites[0].id;
    const favorite = result.current.getFavoriteById(favoriteId);
    expect(favorite).toBeDefined();
    expect(favorite?.trader).toBe('REPSOL');
  });

  it('devuelve undefined si el favorito no existe', () => {
    const { result } = renderHook(() => useFavorites());

    const favorite = result.current.getFavoriteById('non-existent');
    expect(favorite).toBeUndefined();
  });

  it('maneja múltiples favoritos correctamente', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockStation, mockStation.fuelType!);
      result.current.addFavorite(mockStation2, mockStation2.fuelType!);
    });

    expect(result.current.favorites).toHaveLength(2);
    expect(result.current.isFavorite(mockStation, mockStation.fuelType!)).toBe(true);
    expect(result.current.isFavorite(mockStation2, mockStation2.fuelType!)).toBe(true);
  });

  it('restaura el estado desde localStorage en el mount inicial', () => {
    // Simular favoritos guardados previamente
    const savedFavorites = [
      {
        id: '40.416729--3.703339-GASOLINA_95_E5',
        trader: 'REPSOL',
        name: 'E.S. GRAN VIA',
        municipality: 'MADRID',
        latitude: 40.416729,
        longitude: -3.703339,
        fuelType: FuelType.GASOLINA_95_E5,
        addedAt: Date.now(),
      },
    ];
    localStorage.setItem('espaoil.favorites', JSON.stringify(savedFavorites));

    const { result } = renderHook(() => useFavorites());

    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0].trader).toBe('REPSOL');
    expect(result.current.favorites[0].fuelType).toBe(FuelType.GASOLINA_95_E5);
  });

  it('genera ID de estación correctamente', () => {
    const { result } = renderHook(() => useFavorites());

    const id = result.current.generateStationId(40.416729, -3.703339, FuelType.GASOLINA_95_E5);
    expect(id).toBe('40.416729--3.703339-GASOLINA_95_E5');
  });

  it('distingue favoritos con mismas coordenadas pero diferente combustible', () => {
    const { result } = renderHook(() => useFavorites());
    const stationSameCoordsOtherFuel: GasStationModel = {
      ...mockStation,
      fuelType: FuelType.GASOIL_A,
    };

    act(() => {
      result.current.addFavorite(mockStation, mockStation.fuelType!);
      result.current.addFavorite(stationSameCoordsOtherFuel, stationSameCoordsOtherFuel.fuelType!);
    });

    expect(result.current.favorites).toHaveLength(2);
    expect(result.current.isFavorite(mockStation, mockStation.fuelType!)).toBe(true);
    expect(result.current.isFavorite(stationSameCoordsOtherFuel, stationSameCoordsOtherFuel.fuelType!)).toBe(true);
  });

  it('sincroniza cambios con localStorage', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockStation, mockStation.fuelType!);
    });

    const stored = localStorage.getItem('espaoil.favorites');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].trader).toBe('REPSOL');
    expect(parsed[0].fuelType).toBe(FuelType.GASOLINA_95_E5);
  });
});
