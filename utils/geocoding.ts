interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

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
    format: 'jsonv2',
    limit: String(limit),
    addressdetails: '0',
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${queryParams.toString()}`);

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as NominatimResult[];

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((result) => {
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return null;
      }

      return {
        label: result.display_name,
        lat,
        lon,
      };
    })
    .filter((result): result is AddressSuggestion => result !== null);
};

export const geocodeAddress = async (address: string): Promise<{ lat: number; lon: number }> => {
  const queryParams = new URLSearchParams({
    q: address,
    format: 'jsonv2',
    limit: '1',
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${queryParams.toString()}`);

  if (!response.ok) {
    throw new Error('No se pudo convertir la dirección en coordenadas.');
  }

  const data = (await response.json()) as NominatimResult[];

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No encontramos esa dirección. Prueba con más detalle.');
  }

  const firstResult = data[0];
  const lat = parseFloat(firstResult.lat);
  const lon = parseFloat(firstResult.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error('La dirección encontrada no tiene coordenadas válidas.');
  }

  return { lat, lon };
};
