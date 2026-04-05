// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GasStationModel } from '@/types';
import {
  addFavorite,
  generateStationId,
  getFavorites,
  isFavorite,
  removeFavorite,
  saveFavorites,
  toggleFavorite,
} from './favorites';

describe('favorites utilities', () => {
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

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('generateStationId', () => {
    it('genera un ID basado en coordenadas', () => {
      const id = generateStationId(40.416729, -3.703339);
      expect(id).toBe('40.416729--3.703339');
    });

    it('distingue estaciones con mismas coordenadas por identidad', () => {
      const id1 = generateStationId(28.119, -16.74, 'Gasolinera', 'GMOIL', 'Adeje');
      const id2 = generateStationId(28.119, -16.74, 'Gasolinera', 'TGAS-TU TREBOL', 'Adeje');
      expect(id1).not.toBe(id2);
    });

    it('genera IDs diferentes para coordenadas diferentes', () => {
      const id1 = generateStationId(40.416729, -3.703339);
      const id2 = generateStationId(41.5, -2.8);
      expect(id1).not.toBe(id2);
    });
  });

  describe('getFavorites', () => {
    it('devuelve un array vacío si no hay favoritos', () => {
      const favorites = getFavorites();
      expect(favorites).toEqual([]);
    });

    it('devuelve favoritos guardados en localStorage', () => {
      const mockFavorites = [
        {
          id: '40.416729--3.703339',
          trader: 'REPSOL',
          name: 'E.S. GRAN VIA',
          municipality: 'MADRID',
          latitude: 40.416729,
          longitude: -3.703339,
          addedAt: 1712345678901,
        },
      ];
      localStorage.setItem('espaoil.favorites', JSON.stringify(mockFavorites));

      const favorites = getFavorites();
      expect(favorites).toHaveLength(1);
      expect(favorites[0]).toMatchObject({
        trader: 'REPSOL',
        name: 'E.S. GRAN VIA',
        municipality: 'MADRID',
        latitude: 40.416729,
        longitude: -3.703339,
      });
      expect(favorites[0].id).toContain('40.416729--3.703339');
    });

    it('devuelve array vacío si los datos están corruptos', () => {
      localStorage.setItem('espaoil.favorites', 'invalid-json');
      const favorites = getFavorites();
      expect(favorites).toEqual([]);
    });

    it('filtra favoritos con estructura inválida', () => {
      const mixedData = [
        {
          id: '40.416729--3.703339',
          trader: 'REPSOL',
          name: 'E.S. GRAN VIA',
          municipality: 'MADRID',
          latitude: 40.416729,
          longitude: -3.703339,
          addedAt: 1712345678901,
        },
        { invalid: 'object' }, // estructura inválida
        null,
      ];
      localStorage.setItem('espaoil.favorites', JSON.stringify(mixedData));

      const favorites = getFavorites();
      expect(favorites).toHaveLength(1);
      expect(favorites[0].id).toContain('40.416729--3.703339');
    });
  });

  describe('saveFavorites', () => {
    it('guarda favoritos en localStorage', () => {
      const favorites = [
        {
          id: '40.416729--3.703339',
          trader: 'REPSOL',
          name: 'E.S. GRAN VIA',
          municipality: 'MADRID',
          latitude: 40.416729,
          longitude: -3.703339,
          addedAt: 1712345678901,
        },
      ];

      saveFavorites(favorites);

      const stored = localStorage.getItem('espaoil.favorites');
      expect(stored).toBe(JSON.stringify(favorites));
    });

    it('lanza error con mensaje específico si se excede la quota', () => {
      // Mock localStorage.setItem para simular QuotaExceededError
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw quotaError;
      });

      expect(() => saveFavorites([])).toThrow(
        'No hay suficiente espacio para guardar favoritos'
      );
    });
  });

  describe('addFavorite', () => {
    it('añade una gasolinera a favoritos', () => {
      addFavorite(mockStation);

      const favorites = getFavorites();
      expect(favorites).toHaveLength(1);
      expect(favorites[0]).toMatchObject({
        trader: 'REPSOL',
        name: 'E.S. GRAN VIA',
        municipality: 'MADRID',
        latitude: 40.416729,
        longitude: -3.703339,
        distance: 2.5,
        lastKnownPrice: 1.279,
        lastKnownSchedule: 'L-D: 24H',
      });
      expect(favorites[0].id).toContain('40.416729--3.703339');
      expect(favorites[0].addedAt).toBeGreaterThan(0);
    });

    it('no añade duplicados', () => {
      addFavorite(mockStation);
      addFavorite(mockStation);

      const favorites = getFavorites();
      expect(favorites).toHaveLength(1);
    });

    it('puede añadir múltiples favoritos diferentes', () => {
      const station2: GasStationModel = {
        ...mockStation,
        numericLat: 41.5,
        numericLon: -2.8,
      };

      addFavorite(mockStation);
      addFavorite(station2);

      const favorites = getFavorites();
      expect(favorites).toHaveLength(2);
    });
  });

  describe('removeFavorite', () => {
    it('elimina un favorito por ID', () => {
      addFavorite(mockStation);
      const id = getFavorites()[0].id;

      removeFavorite(id);

      const favorites = getFavorites();
      expect(favorites).toHaveLength(0);
    });

    it('no afecta otros favoritos al eliminar uno', () => {
      const station2: GasStationModel = {
        ...mockStation,
        numericLat: 41.5,
        numericLon: -2.8,
        trader: 'CEPSA',
      };

      addFavorite(mockStation);
      addFavorite(station2);

      const id = getFavorites().find((fav) => fav.trader === 'REPSOL')?.id ?? '';
      removeFavorite(id);

      const favorites = getFavorites();
      expect(favorites).toHaveLength(1);
      expect(favorites[0].trader).toBe('CEPSA');
    });

    it('no hace nada si el ID no existe', () => {
      addFavorite(mockStation);
      removeFavorite('non-existent-id');

      const favorites = getFavorites();
      expect(favorites).toHaveLength(1);
    });
  });

  describe('isFavorite', () => {
    it('devuelve true si la gasolinera es favorita', () => {
      addFavorite(mockStation);
      const result = isFavorite(mockStation.numericLat, mockStation.numericLon);
      expect(result).toBe(true);
    });

    it('devuelve false si la gasolinera no es favorita', () => {
      const result = isFavorite(mockStation.numericLat, mockStation.numericLon);
      expect(result).toBe(false);
    });
  });

  describe('toggleFavorite', () => {
    it('añade a favoritos si no existe y devuelve true', () => {
      const result = toggleFavorite(mockStation);

      expect(result).toBe(true);
      const favorites = getFavorites();
      expect(favorites).toHaveLength(1);
    });

    it('quita de favoritos si existe y devuelve false', () => {
      addFavorite(mockStation);
      const result = toggleFavorite(mockStation);

      expect(result).toBe(false);
      const favorites = getFavorites();
      expect(favorites).toHaveLength(0);
    });

    it('alterna correctamente el estado varias veces', () => {
      const result1 = toggleFavorite(mockStation); // añadir
      const result2 = toggleFavorite(mockStation); // quitar
      const result3 = toggleFavorite(mockStation); // añadir

      expect(result1).toBe(true);
      expect(result2).toBe(false);
      expect(result3).toBe(true);

      const favorites = getFavorites();
      expect(favorites).toHaveLength(1);
    });
  });
});
