import React, { useMemo } from 'react';
import { Fuel, Heart, Navigation } from 'lucide-react';
import { GasStationModel, MAP_PROVIDER_LABELS } from '../types';
import { formatDistance, formatPrice } from '../utils/geo';
import { buildMapUrl, getMapProvider } from '../utils/maps';
import { ScheduleBadge } from './ScheduleBadge';

interface Props {
  station: GasStationModel;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const GasStationCard: React.FC<Props> = React.memo(
  ({ station, isFavorite = false, onToggleFavorite }) => {
    const hasValidPrice = station.numericPrice > 0;
    const stationLabel =
      typeof station.name === 'string' && station.name.trim().length > 0
        ? station.name
        : typeof station.trader === 'string' && station.trader.trim().length > 0
          ? station.trader
          : 'Gasolinera';
    const mapProvider = getMapProvider();
    const mapsUrl = useMemo(
      () => buildMapUrl(mapProvider, station.numericLat, station.numericLon),
      [mapProvider, station.numericLat, station.numericLon]
    );

    const handleFavoriteClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onToggleFavorite?.();
    };

    return (
      <article className="ui-card ui-fade relative flex flex-col gap-3 p-3.5">
        <div className="grid grid-cols-[1fr_auto] items-start gap-x-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="ui-radius-control flex h-9 w-9 shrink-0 items-center justify-center bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <Fuel size={20} />
            </div>
            <h3 className="truncate text-base font-black uppercase leading-tight tracking-wide text-[var(--color-text)]">
              {stationLabel}
            </h3>
          </div>

          <div className="flex items-center justify-end gap-2">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={handleFavoriteClick}
                className="flex h-8 w-8 items-center justify-center transition-all active:scale-95"
                aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              >
                <Heart
                  size={17}
                  className={`transition-all duration-200 ${isFavorite ? 'fill-red-600 text-red-600 scale-110' : 'text-gray-400 hover:text-red-600 hover:scale-110'}`}
                />
              </button>
            )}

            <div className="text-right">
            {hasValidPrice ? (
              <div className="flex items-end justify-end gap-1">
                <div className="text-[1.65rem] font-black leading-none text-gray-900">
                  {formatPrice(station.numericPrice)}
                </div>
                <div className="pb-0.5 text-[10px] font-semibold leading-none text-gray-500">€/l</div>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-1">
                <div className="text-base font-black leading-none text-gray-700">—</div>
                <div className="text-[10px] font-semibold leading-none text-gray-500">Sin precio actualizado</div>
              </div>
            )}
            </div>
          </div>

          <span className="ui-radius-pill inline-flex w-fit items-center bg-[var(--color-accent-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-accent)]">
            {station.municipality}
          </span>

          <div className="flex items-center justify-end gap-1 whitespace-nowrap text-sm font-bold text-gray-800">
            <Navigation size={14} />
            <span>{formatDistance(station.distance)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="min-w-0 flex-1">
            <ScheduleBadge schedule={station.schedule} />
          </div>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ui-radius-badge inline-flex min-h-8 items-center gap-1 border border-red-100 bg-[var(--color-accent-soft)] px-2.5 py-1 text-xs font-bold leading-none text-[var(--color-accent)] transition-colors hover:brightness-95"
          >
            Abrir en {MAP_PROVIDER_LABELS[mapProvider]}
          </a>
        </div>
      </article>
    );
  },
  (prevProps, nextProps) => {
    // Comparación personalizada: re-renderizar si cambia isFavorite o la estación
    return (
      prevProps.isFavorite === nextProps.isFavorite &&
      prevProps.station.numericLat === nextProps.station.numericLat &&
      prevProps.station.numericLon === nextProps.station.numericLon &&
      prevProps.station.numericPrice === nextProps.station.numericPrice
    );
  }
);

GasStationCard.displayName = 'GasStationCard';
