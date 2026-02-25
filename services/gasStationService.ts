import { CONFIG } from '../config';
import { FuelType, GasStation, GasStationModel } from '../types';
import { calculateDistance } from '../utils/geo';
import { getMockGasStations } from './mockData';

interface FetchParams {
  lat: number;
  lon: number;
  radiusKm: number;
  gasType: FuelType;
}

export const getGasStations = async (params: FetchParams): Promise<GasStationModel[]> => {
  const { lat, lon, radiusKm, gasType } = params;

  let rawData: GasStation[] = [];

  // Check if API URL is configured, otherwise use Mock Data
  if (!CONFIG.API_BASE_URL) {
    console.warn("⚠️ API_BASE_URL no configurada. Usando datos simulados (Mocks).");
    rawData = await getMockGasStations(lat, lon, radiusKm, gasType);
  } else {
    // Real API Call
    const distanceMeters = radiusKm * 1000;
    const queryParams = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      distance: distanceMeters.toString(),
      gasType,
    });
    const requestUrl = `${CONFIG.API_BASE_URL}/gas-stations/near?${queryParams.toString()}`;

    try {
      const response = await fetch(requestUrl);
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      rawData = await response.json();
    } catch (error) {
      console.error("Failed to fetch gas stations", error);
      throw error;
    }
  }

  // Map and enrich data with calculated fields for sorting and displaying
  return rawData.map((station) => {
    const sLat = typeof station.latitude === 'string' ? parseFloat(station.latitude) : station.latitude;
    const sLon = typeof station.longitude === 'string' ? parseFloat(station.longitude) : station.longitude;
    const sPrice = typeof station.price === 'string' ? parseFloat(station.price) : station.price;

    return {
      ...station,
      numericLat: sLat,
      numericLon: sLon,
      numericPrice: sPrice,
      distance: calculateDistance({ lat, lon }, { lat: sLat, lon: sLon }),
    };
  });
};