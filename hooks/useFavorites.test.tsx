// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { GasStationModel } from '@/types';
import { useFavorites } from './useFavorites';

describe('useFavorites', () => {
  const mockStation: GasStationModel = {
    trader: 'REPSOL',
    name: 'E.S. GRAN VIA',
    town: 'MADRID',
    municipality: 'MADRID',
    schedule: 'L-D: 24H',
    price: '1.279',
    latitude: '40.416729',
    longitude: '-3.703339',
    distance: 2.5,
    numericPrice: 1.279,
    numericLat: 40.416729,
    numericLon: -3.703339,
  };

  const mockStation2: GasStationModel = {
    ...mockStation,
    trader: 'CEPSA',
    name: 'E.S. ALCALA',
    numericLat: 41.5,
    numericLon: -2.8,
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
      result.current.addFavorite(mockStation);
    });

    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0]).toMatchObject({
      trader: 'REPSOL',
      name: 'E.S. GRAN VIA',
      municipality: 'MADRID',
    });
    expect(result.current.favorites[0].id).toContain('40.416729--3.703339');
  });

  it('elimina un favorito correctamente', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockStation);
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
      isNowFavorite = result.current.toggleFavorite(mockStation);
    });

    expect(isNowFavorite!).toBe(true);
    expect(result.current.favorites).toHaveLength(1);

    // Segunda vez: quitar
    act(() => {
      isNowFavorite = result.current.toggleFavorite(mockStation);
    });

    expect(isNowFavorite!).toBe(false);
    expect(result.current.favorites).toHaveLength(0);
  });

  it('verifica si una gasolinera es favorita', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockStation);
    });

    expect(result.current.isFavorite(mockStation)).toBe(true);
    expect(result.current.isFavorite(mockStation2)).toBe(false);
  });

  it('obtiene un favorito por ID', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockStation);
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
      result.current.addFavorite(mockStation);
      result.current.addFavorite(mockStation2);
    });

    expect(result.current.favorites).toHaveLength(2);
    expect(result.current.isFavorite(mockStation)).toBe(true);
    expect(result.current.isFavorite(mockStation2)).toBe(true);
  });

  it('restaura el estado desde localStorage en el mount inicial', () => {
    // Simular favoritos guardados previamente
    const savedFavorites = [
      {
        id: '40.416729--3.703339',
        trader: 'REPSOL',
        name: 'E.S. GRAN VIA',
        municipality: 'MADRID',
        latitude: 40.416729,
        longitude: -3.703339,
        addedAt: Date.now(),
      },
    ];
    localStorage.setItem('espaoil.favorites', JSON.stringify(savedFavorites));

    const { result } = renderHook(() => useFavorites());

    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0].trader).toBe('REPSOL');
  });

  it('genera ID de estación correctamente', () => {
    const { result } = renderHook(() => useFavorites());

    const id = result.current.generateStationId(40.416729, -3.703339);
    expect(id).toBe('40.416729--3.703339');
  });

  it('distingue favoritos con mismas coordenadas', () => {
    const { result } = renderHook(() => useFavorites());
    const stationSameCoords: GasStationModel = {
      ...mockStation,
      trader: 'GASOLINERA',
      name: 'OTRA ESTACION',
    };

    act(() => {
      result.current.addFavorite(mockStation);
      result.current.addFavorite(stationSameCoords);
    });

    expect(result.current.favorites).toHaveLength(2);
    expect(result.current.isFavorite(mockStation)).toBe(true);
    expect(result.current.isFavorite(stationSameCoords)).toBe(true);
  });

  it('sincroniza cambios con localStorage', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.addFavorite(mockStation);
    });

    const stored = localStorage.getItem('espaoil.favorites');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].trader).toBe('REPSOL');
  });
});
