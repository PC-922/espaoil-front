// API Response Shape
export interface GasStation {
  trader: string;
  name: string;
  town: string;
  municipality: string;
  schedule: string;
  price: number | string; // API output example shows "1.279" as string or number
  latitude: number | string;
  longitude: number | string;
}

// Internal model with calculated fields
export interface GasStationModel extends GasStation {
  distance: number; // calculated distance in km
  numericPrice: number;
  numericLat: number;
  numericLon: number;
}

export enum FuelType {
  GASOLINA_95_E5 = 'GASOLINA_95_E5',
  GASOLINA_95_E5_PREMIUM = 'GASOLINA_95_E5_PREMIUM',
  GASOLINA_95_E10 = 'GASOLINA_95_E10',
  GASOLINA_98_E5 = 'GASOLINA_98_E5',
  GASOLINA_98_E10 = 'GASOLINA_98_E10',
  GASOIL_A = 'GASOIL_A',
  GASOIL_B = 'GASOIL_B',
  GASOIL_PREMIUM = 'GASOIL_PREMIUM',
  BIODIESEL = 'BIODIESEL',
  BIOETANOL = 'BIOETANOL',
  GAS_NATURAL_COMPRIMIDO = 'GAS_NATURAL_COMPRIMIDO',
  GAS_NATURAL_LICUADO = 'GAS_NATURAL_LICUADO',
  GASES_LICUADOS_PETROLEO = 'GASES_LICUADOS_PETROLEO',
  HIDROGENO = 'HIDROGENO',
}

export const FUEL_LABELS: Record<FuelType, string> = {
  [FuelType.GASOLINA_95_E5]: '95 E5',
  [FuelType.GASOLINA_95_E5_PREMIUM]: '95 E5 Premium',
  [FuelType.GASOLINA_95_E10]: '95 E10',
  [FuelType.GASOLINA_98_E5]: '98 E5',
  [FuelType.GASOLINA_98_E10]: '98 E10',
  [FuelType.GASOIL_A]: 'Gasoil A',
  [FuelType.GASOIL_B]: 'Gasoil B',
  [FuelType.GASOIL_PREMIUM]: 'Gasoil Premium',
  [FuelType.BIODIESEL]: 'Biodiesel',
  [FuelType.BIOETANOL]: 'Bioetanol',
  [FuelType.GAS_NATURAL_COMPRIMIDO]: 'Gas Natural Comprimido',
  [FuelType.GAS_NATURAL_LICUADO]: 'Gas Natural Licuado',
  [FuelType.GASES_LICUADOS_PETROLEO]: 'Gases licuados del petróleo',
  [FuelType.HIDROGENO]: 'Hidrógeno',
};

export interface Coordinates {
  lat: number;
  lon: number;
}

export type SortOption = 'price' | 'distance';

export type MapProvider = 'google' | 'apple' | 'waze';

export const MAP_PROVIDER_LABELS: Record<MapProvider, string> = {
  google: 'Google Maps',
  apple: 'Apple Maps',
  waze: 'Waze',
};
