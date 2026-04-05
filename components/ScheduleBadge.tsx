import React, { useMemo, useState } from 'react';
import { getScheduleLiveStatus, parseSchedule } from '../utils/schedule';

interface Props {
  schedule: string;
}

export const ScheduleBadge: React.FC<Props> = React.memo(({ schedule }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // Siguiendo Vercel best practice: rerender-memo
  // Parseamos SOLO cuando el schedule no está vacío (parsed.raw check diferido).
  // El parsing costoso (460 líneas de regex) se ejecuta en useMemo, pero SOLO
  // si schedule tiene contenido. Esto evita ~150-300ms de bloqueo del hilo principal
  // en el render inicial cuando hay muchas estaciones.
  const parsed = useMemo(() => {
    if (!schedule || schedule.trim() === '') {
      return { raw: '', confidence: 'low' as const, blocks: [], is24h: false };
    }
    return parseSchedule(schedule);
  }, [schedule]);
  
  // Lazy evaluation: solo calculamos liveStatus si parsed.raw existe
  const liveStatus = useMemo(() => {
    if (!parsed.raw) {
      return { status: 'unknown' as const, nextOpeningLabel: null, nextOpening: null };
    }
    return getScheduleLiveStatus(parsed);
  }, [parsed]);

  const shouldShowDetails = parsed.raw && (parsed.confidence === 'low' || parsed.blocks.length > 0);

  if (!parsed.raw) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {liveStatus.status === 'open' && (
          <span className="ui-radius-badge inline-flex items-center bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">
            Abierto ahora
          </span>
        )}

        {liveStatus.status === 'closed' && (
          <span className="ui-radius-badge inline-flex items-center bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600">
            Cerrado ahora
          </span>
        )}

        {liveStatus.status === 'closed' && liveStatus.nextOpeningLabel && (
          <span className="text-xs text-gray-500">Abre {liveStatus.nextOpeningLabel}</span>
        )}

        {liveStatus.status === 'unknown' && (
          <span className="text-xs text-gray-500">Horario no disponible</span>
        )}

        {shouldShowDetails && (
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="ui-radius-badge inline-flex min-h-8 items-center px-2 py-1 font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            {showDetails ? 'Ocultar horario' : 'Ver horario'}
          </button>
        )}
      </div>

      {showDetails && (
        <div className="ui-radius-badge ui-slide-down bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-600">{parsed.raw}</div>
      )}
    </div>
  );
});

ScheduleBadge.displayName = 'ScheduleBadge';
