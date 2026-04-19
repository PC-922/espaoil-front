import { CONFIG } from '../config';

export interface AddressSuggestion {
  label: string;
  lat: number;
  lon: number;
}

export const searchAddressSuggestions = async (query: string, limit = 5): Promise<AddressSuggestion[]> => {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 3) {
    return [];
  }

  const queryParams = new URLSearchParams({
    q: trimmedQuery,
    limit: String(limit),
  });

  const response = await fetch(`${CONFIG.API_BASE_URL}/geocoding/search?${queryParams.toString()}`);

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as AddressSuggestion[];

  if (!Array.isArray(data)) {
    return [];
  }

  return data;
};

export const geocodeAddress = async (address: string): Promise<{ lat: number; lon: number }> => {
  const queryParams = new URLSearchParams({ q: address });

  const response = await fetch(`${CONFIG.API_BASE_URL}/geocoding/resolve?${queryParams.toString()}`);

  if (!response.ok) {
    throw new Error('No se pudo convertir la dirección en coordenadas.');
  }

  const data = (await response.json()) as { lat: number; lon: number };

  if (!Number.isFinite(data?.lat) || !Number.isFinite(data?.lon)) {
    throw new Error('La dirección encontrada no tiene coordenadas válidas.');
  }

  return { lat: data.lat, lon: data.lon };
};
