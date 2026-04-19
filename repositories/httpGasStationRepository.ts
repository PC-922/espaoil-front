import { CONFIG } from '../config';
import { GasStationModel } from '../types';
import { getMockGasStations } from '../services/mockData';
import { FetchGasStationsParams, GasStationRepository } from './gasStationRepository';

export class HttpGasStationRepository implements GasStationRepository {
  async getNearbyStations(params: FetchGasStationsParams): Promise<GasStationModel[]> {
    const { lat, lon, radiusKm, gasType, sortBy } = params;

    if (!CONFIG.API_BASE_URL) {
      console.warn('⚠️ API_BASE_URL no configurada. Usando datos simulados (Mocks).');
      return getMockGasStations(lat, lon, radiusKm, gasType);
    }

    const distanceMeters = radiusKm * 1000;
    const queryParams = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      distance: distanceMeters.toString(),
      gasType,
      sortBy,
    });
    const requestUrl = `${CONFIG.API_BASE_URL}/gas-stations/near?${queryParams.toString()}`;

    try {
      const response = await fetch(requestUrl);
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      const data = await response.json() as unknown[];
      
      // Coerce types and calculate distance if not provided by server
      return data.map((station: unknown) => {
        const s = station as Record<string, unknown>;
        const stationLat = typeof s.latitude === 'string' ? parseFloat(s.latitude) : (s.latitude as number);
        const stationLon = typeof s.longitude === 'string' ? parseFloat(s.longitude) : (s.longitude as number);
        
        // Calculate distance using Haversine formula if server doesn't provide it
        const deg2rad = (deg: number): number => deg * (Math.PI / 180);
        
        let distance = s.distance;
        if (!distance || distance === null) {
          const R = 6371; // Radius of the earth in km
          const dLat = deg2rad(stationLat - lat);
          const dLon = deg2rad(stationLon - lon);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat)) *
            Math.cos(deg2rad(stationLat)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distance = R * c; // Distance in km
        } else {
          distance = typeof distance === 'string' ? parseFloat(distance as string) : (distance as number);
        }
        
        return {
          trader: s.name as string || 'Unknown', // Use name as trader if not provided
          name: s.name as string || s.trader as string || 'Unknown',
          town: s.town as string || '',
          municipality: s.municipality as string || '',
          schedule: s.schedule as string || '',
          price: typeof s.price === 'string' ? parseFloat(s.price as string) : (s.price as number),
          latitude: stationLat,
          longitude: stationLon,
          distance: distance as number,
        } as GasStationModel;
      });
    } catch (error) {
      console.error('Failed to fetch gas stations', error);
      throw error;
    }
  }
}

export const defaultGasStationRepository = new HttpGasStationRepository();
