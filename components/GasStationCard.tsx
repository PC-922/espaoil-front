import React, { useMemo } from 'react';
import { Fuel, Navigation } from 'lucide-react';
import { GasStationModel, MAP_PROVIDER_LABELS } from '../types';
import { formatDistance, formatPrice } from '../utils/geo';
import { buildMapUrl, getMapProvider } from '../utils/maps';
import { ScheduleBadge } from './ScheduleBadge';

interface Props {
  station: GasStationModel;
}

export const GasStationCard: React.FC<Props> = React.memo(({ station }) => {
  const mapProvider = getMapProvider();
  const mapsUrl = useMemo(
    () => buildMapUrl(mapProvider, station.numericLat, station.numericLon),
    [mapProvider, station.numericLat, station.numericLon]
  );

  return (
    <article className="ui-card ui-fade flex flex-col gap-3 p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-2.5">
          <div className="ui-radius-control flex h-9 w-9 shrink-0 items-center justify-center bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            <Fuel size={20} />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <h3 className="truncate text-sm font-black uppercase leading-tight tracking-wide text-[var(--color-text)]">{station.trader}</h3>
            <p className="line-clamp-2 text-sm font-medium text-gray-600">{station.name}</p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[1.7rem] font-black leading-none text-gray-900">
            {formatPrice(station.numericPrice)}
          </div>
          <div className="mt-0.5 text-xs font-semibold text-gray-500">EUR/L</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="ui-radius-pill inline-flex items-center bg-[var(--color-accent-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-accent)]">
          {station.municipality}
        </span>
        <div className="flex items-center gap-1 whitespace-nowrap text-sm font-bold text-gray-800">
          <Navigation size={14} />
          <span>{formatDistance(station.distance)}</span>
        </div>
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 pt-0.5">
          <ScheduleBadge schedule={station.schedule} />
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ui-radius-badge inline-flex min-h-9 items-center gap-1 border border-red-100 bg-[var(--color-accent-soft)] px-2.5 py-1 text-xs font-bold leading-none text-[var(--color-accent)] transition-colors hover:brightness-95"
        >
          Abrir en {MAP_PROVIDER_LABELS[mapProvider]}
        </a>
      </div>
    </article>
  );
});

GasStationCard.displayName = 'GasStationCard';
