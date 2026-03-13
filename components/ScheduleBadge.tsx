import React, { useMemo, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { getScheduleLiveStatus, parseSchedule } from '../utils/schedule';

interface Props {
  schedule: string;
}

export const ScheduleBadge: React.FC<Props> = ({ schedule }) => {
  const [showDetails, setShowDetails] = useState(false);
  const parsed = useMemo(() => parseSchedule(schedule), [schedule]);
  const liveStatus = useMemo(() => getScheduleLiveStatus(parsed), [parsed]);

  const shouldShowDetails = parsed.raw && (parsed.confidence === 'low' || parsed.blocks.length > 0);

  if (!parsed.raw) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {liveStatus.status === 'open' && (
          <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">
            Abierto ahora
          </span>
        )}

        {liveStatus.status === 'closed' && (
          <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600">
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
            className="inline-flex items-center rounded-md px-1.5 py-0.5 font-semibold text-red-600 hover:text-red-700"
          >
            {showDetails ? 'Ocultar horario' : 'Ver horario'}
          </button>
        )}
      </div>

      {showDetails && (
        <div className="rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-500">{parsed.raw}</div>
      )}
    </div>
  );
};
