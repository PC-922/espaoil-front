import { defaultGasStationRepository } from '../repositories/httpGasStationRepository';
import { FetchGasStationsParams } from '../repositories/gasStationRepository';
import { GasStationModel } from '../types';

export const getGasStations = async (params: FetchGasStationsParams): Promise<GasStationModel[]> => {
  return defaultGasStationRepository.getNearbyStations(params);
};