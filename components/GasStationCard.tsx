import React from 'react';
import { Fuel, Navigation } from 'lucide-react';
import { GasStationModel } from '../types';
import { formatDistance, formatPrice } from '../utils/geo';

interface Props {
  station: GasStationModel;
}

export const GasStationCard: React.FC<Props> = ({ station }) => {
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.numericLat},${station.numericLon}`;

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <div className="bg-red-50 text-red-600 p-3 rounded-xl h-12 w-12 flex items-center justify-center shrink-0">
            <Fuel size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 uppercase leading-tight">{station.trader}</h3>
            <p className="text-sm text-gray-500 line-clamp-1">{station.name}, {station.municipality}</p>
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
              <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{station.schedule}</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 font-medium">
              <Navigation size={12} />
              <span>{formatDistance(station.distance)}</span>
            </div>
          </div>
        </div>
        
        <div className="text-right shrink-0">
          <div className="text-2xl font-black text-gray-900 leading-none">
            {formatPrice(station.numericPrice)}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">€/L</div>
        </div>
      </div>
      
      <div className="flex justify-end pt-2 border-t border-gray-50">
        <a 
          href={mapsUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
        >
          Ver ruta en el mapa
        </a>
      </div>
    </div>
  );
};