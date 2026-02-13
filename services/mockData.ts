import { FuelType, GasStation } from '../types';

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
): Promise<GasStation[]> => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 800));

  const count = Math.floor(Math.random() * 10) + 5; // Generate between 5 and 15 stations
  const stations: GasStation[] = [];

  for (let i = 0; i < count; i++) {
    // Generate random coordinates within the rough radius
    // 1 deg latitude ~= 111 km
    // 1 deg longitude ~= 111 km * cos(latitude)
    const latOffset = (Math.random() - 0.5) * 2 * (radiusKm / 111);
    const lonOffset = (Math.random() - 0.5) * 2 * (radiusKm / (111 * Math.cos(lat * Math.PI / 180)));
    
    // Slight randomness to ensure some are "outside" if we were strictly checking radius, 
    // but here we generate them inside the box defined by radius for convenience.
    
    const trader = TRADERS[Math.floor(Math.random() * TRADERS.length)];
    const basePrice = 1.300;
    const priceVariance = Math.random() * 0.4; // 0.00 to 0.40
    const price = (basePrice + priceVariance).toFixed(3);

    stations.push({
      trader: trader,
      name: `ESTACIÓN DE SERVICIO ${trader} (MOCK)`,
      town: 'CIUDAD SIMULADA',
      municipality: 'MUNICIPIO DE PRUEBA',
      schedule: SCHEDULES[Math.floor(Math.random() * SCHEDULES.length)],
      price: price, // API usually returns price as string or number
      latitude: lat + latOffset,
      longitude: lon + lonOffset
    });
  }

  return stations;
};