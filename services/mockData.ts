import { FuelType, GasStationModel } from '../types';

const TRADERS = ['REPSOL', 'CEPSA', 'BP', 'GALP', 'SHELL', 'PLENOIL', 'BALLENOIL', 'AVIA'];
const SCHEDULES = ['L-D: 24H', 'L-D: 06:00-22:00', 'L-S: 07:00-23:00'];

/**
 * Generates random gas stations around a central point.
 */
export const getMockGasStations = async (
  lat: number, 
  lon: number, 
  radiusKm: number, 
  gasType: FuelType
): Promise<GasStationModel[]> => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 800));

  const count = Math.floor(Math.random() * 10) + 5; // Generate between 5 and 15 stations
  const stations: GasStationModel[] = [];

  for (let i = 0; i < count; i++) {
    // Generate random coordinates within the rough radius
    // 1 deg latitude ~= 111 km
    // 1 deg longitude ~= 111 km * cos(latitude)
    const latOffset = (Math.random() - 0.5) * 2 * (radiusKm / 111);
    const lonOffset = (Math.random() - 0.5) * 2 * (radiusKm / (111 * Math.cos(lat * Math.PI / 180)));
    
    const stationLat = lat + latOffset;
    const stationLon = lon + lonOffset;
    // Approximate distance for mock data (straight-line, rough)
    const distanceKm = Math.sqrt(latOffset * latOffset + lonOffset * lonOffset) * 111;

    const trader = TRADERS[Math.floor(Math.random() * TRADERS.length)];
    const basePrice = 1.300;
    const priceVariance = Math.random() * 0.4; // 0.00 to 0.40
    const price = parseFloat((basePrice + priceVariance).toFixed(3));

    stations.push({
      trader,
      name: `ESTACIÓN DE SERVICIO ${trader} (MOCK)`,
      town: 'CIUDAD SIMULADA',
      municipality: 'MUNICIPIO DE PRUEBA',
      schedule: SCHEDULES[Math.floor(Math.random() * SCHEDULES.length)],
      price,
      latitude: stationLat,
      longitude: stationLon,
      distance: distanceKm,
    });
  }

  void gasType; // param used by real API; mock ignores it
  return stations;
};
