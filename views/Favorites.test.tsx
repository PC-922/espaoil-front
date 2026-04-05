// @vitest-environment jsdom

import { render, screen, cleanup } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { Favorites } from './Favorites';

const mockUseFavorites = vi.fn(() => ({
  favorites: [],
  isFavorite: vi.fn(() => false),
  toggleFavorite: vi.fn(),
}));

vi.mock('../hooks/useFavorites', () => ({
  useFavorites: () => mockUseFavorites(),
}));

vi.mock('../services/gasStationService', () => ({
  getGasStations: vi.fn(() => Promise.resolve([])),
}));

describe('Favorites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFavorites.mockReturnValue({
      favorites: [],
      isFavorite: vi.fn(() => false),
      toggleFavorite: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('muestra mensaje de empty state cuando no hay favoritos', () => {
    render(<Favorites />);

    const heading = screen.getByText('No tienes favoritos aún');
    const description = screen.getByText('Busca gasolineras y añádelas a favoritos para verlas aquí.');
    
    expect(heading).toBeTruthy();
    expect(description).toBeTruthy();
  });

  it('renderiza el título correctamente', () => {
    render(<Favorites />);

    const title = screen.getByText('Mis gasolineras favoritas');
    const brand = screen.getByText('EspaOil');
    
    expect(title).toBeTruthy();
    expect(brand).toBeTruthy();
  });
});
