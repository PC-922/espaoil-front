import { FuelType, GasStationModel, SortOption } from '../types';

export interface FetchGasStationsParams {
  lat: number;
  lon: number;
  radiusKm: number;
  gasType: FuelType;
  sortBy: SortOption;
}

export interface GasStationRepository {
  getNearbyStations(params: FetchGasStationsParams): Promise<GasStationModel[]>;
}
