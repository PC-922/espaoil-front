import { FuelType, GasStationModel } from '../types';

export interface FetchGasStationsParams {
  lat: number;
  lon: number;
  radiusKm: number;
  gasType: FuelType;
}

export interface GasStationRepository {
  getNearbyStations(params: FetchGasStationsParams): Promise<GasStationModel[]>;
}
