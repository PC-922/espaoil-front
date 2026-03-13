export interface ScheduleBlock {
  days: string;
  hours: string;
}

export interface ParsedSchedule {
  is24h: boolean;
  blocks: ScheduleBlock[];
  raw: string;
  confidence: 'high' | 'low';
}

export type ScheduleOpenStatus = 'open' | 'closed' | 'unknown';

export interface ScheduleLiveStatus {
  status: ScheduleOpenStatus;
  nextOpening: Date | null;
  nextOpeningLabel: string | null;
}

const DAY_BLOCK_REGEX = /^([^:]+?)\s*:\s*(.+)$/;
const DAY_WITH_24H_REGEX = /^([A-Za-zÁÉÍÓÚÑ\-\s]+?)\s+(24\s*H|24\/7)$/i;
const HOURS_RANGE_REGEX = /^\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2}$/;
const DAY_ORDER = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;
const DAY_TOKEN_TO_INDEX: Record<string, number> = {
  L: 1,
  LU: 1,
  LUN: 1,
  LUNES: 1,
  M: 2,
  MA: 2,
  MAR: 2,
  MARTES: 2,
  X: 3,
  MI: 3,
  MIE: 3,
  MIERCOLES: 3,
  J: 4,
  JU: 4,
  JUE: 4,
  JUEVES: 4,
  V: 5,
  VI: 5,
  VIE: 5,
  VIERNES: 5,
  S: 6,
  SA: 6,
  SAB: 6,
  SABADO: 6,
  D: 0,
  DO: 0,
  DOM: 0,
  DOMINGO: 0,
};
const INDEX_TO_DAY_LABEL: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miercoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sabado',
};

const normalizeText = (value: string): string =>
  value.replace(/\s+/g, ' ').replace(/\s*[-–]\s*/g, '-').trim();

const splitSegments = (value: string): string[] =>
  value
    .split(/[;|]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

const is24hToken = (value: string): boolean => /^(24\s*H|24\/7)$/i.test(normalizeText(value));

const hasRangeHours = (value: string): boolean => HOURS_RANGE_REGEX.test(normalizeText(value));

const normalizeDayToken = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\./g, '')
    .replace(/\s+/g, '')
    .trim();

const dayOrderIndex = (token: string): number => DAY_ORDER.findIndex((day) => day === token);

const dayTokenToIndex = (token: string): number | null => {
  const normalized = normalizeDayToken(token);
  return DAY_TOKEN_TO_INDEX[normalized] ?? null;
};

const parseDaysExpression = (days: string): Set<number> | null => {
  const normalized = normalizeText(days).toUpperCase();
  if (!normalized) return null;

  const compact = normalized.replace(/\s+/g, '');
  if (compact === 'L-D') {
    return new Set([0, 1, 2, 3, 4, 5, 6]);
  }

  const rangeParts = compact.split('-');
  if (rangeParts.length === 2) {
    const startToken = rangeParts[0][0];
    const endToken = rangeParts[1][0];
    const startOrder = dayOrderIndex(startToken as (typeof DAY_ORDER)[number]);
    const endOrder = dayOrderIndex(endToken as (typeof DAY_ORDER)[number]);

    if (startOrder !== -1 && endOrder !== -1) {
      const set = new Set<number>();
      let idx = startOrder;
      while (true) {
        const token = DAY_ORDER[idx];
        const dayIndex = dayTokenToIndex(token);
        if (dayIndex !== null) {
          set.add(dayIndex);
        }

        if (idx === endOrder) break;
        idx = (idx + 1) % DAY_ORDER.length;
      }

      return set;
    }
  }

  const parts = normalized
    .split(/[,/]/)
    .map((part) => normalizeText(part))
    .filter(Boolean);

  if (!parts.length) {
    return null;
  }

  const result = new Set<number>();
  for (const part of parts) {
    const dayIndex = dayTokenToIndex(part);
    if (dayIndex === null) {
      return null;
    }
    result.add(dayIndex);
  }

  return result;
};

const parseMinutes = (timeValue: string): number | null => {
  const [hoursRaw, minutesRaw] = timeValue.split(':');
  const hours = Number.parseInt(hoursRaw, 10);
  const minutes = Number.parseInt(minutesRaw, 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (hours < 0 || hours > 24 || minutes < 0 || minutes > 59) return null;
  if (hours === 24 && minutes !== 0) return null;

  return hours * 60 + minutes;
};

const parseHourRange = (hours: string): { start: number; end: number } | null => {
  const normalized = normalizeText(hours);
  if (!hasRangeHours(normalized)) return null;

  const [startRaw, endRaw] = normalized.split('-').map((v) => v.trim());
  const start = parseMinutes(startRaw);
  const end = parseMinutes(endRaw);
  if (start === null || end === null) return null;

  return { start, end };
};

const previousDayIndex = (dayIndex: number): number => (dayIndex === 0 ? 6 : dayIndex - 1);

const startOfDay = (date: Date): Date => {
  const base = new Date(date);
  base.setHours(0, 0, 0, 0);
  return base;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const toDateAtMinutes = (date: Date, minutes: number): Date => {
  const result = new Date(date);
  const safeMinutes = Math.max(0, Math.min(minutes, 24 * 60));
  result.setHours(Math.floor(safeMinutes / 60), safeMinutes % 60, 0, 0);
  return result;
};

const capitalizeFirst = (value: string): string => {
  if (!value) return value;
  return value[0].toUpperCase() + value.slice(1);
};

const formatHourLabel = (date: Date): string =>
  date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

const formatNextOpeningLabel = (nextOpening: Date, now: Date): string => {
  const openingDay = startOfDay(nextOpening).getTime();
  const nowDay = startOfDay(now).getTime();
  const diffDays = Math.round((openingDay - nowDay) / (24 * 60 * 60 * 1000));
  const hour = formatHourLabel(nextOpening);

  if (diffDays === 0) {
    return `hoy a las ${hour}`;
  }

  if (diffDays === 1) {
    return `manana a las ${hour}`;
  }

  const weekday = capitalizeFirst(
    nextOpening.toLocaleDateString('es-ES', {
      weekday: 'long',
    })
  );

  return `${weekday} a las ${hour}`;
};

const evaluateCurrentState = (parsed: ParsedSchedule, now: Date): { status: ScheduleOpenStatus; hasEvaluableBlock: boolean } => {
  if (!parsed.blocks.length || parsed.confidence === 'low') {
    return { status: 'unknown', hasEvaluableBlock: false };
  }

  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let hasEvaluableBlock = false;

  for (const block of parsed.blocks) {
    const daySet = parseDaysExpression(block.days);
    if (!daySet || daySet.size === 0) {
      continue;
    }

    if (is24hToken(block.hours)) {
      hasEvaluableBlock = true;
      if (daySet.has(currentDay)) {
        return { status: 'open', hasEvaluableBlock };
      }
      continue;
    }

    const range = parseHourRange(block.hours);
    if (!range) {
      continue;
    }

    hasEvaluableBlock = true;
    if (range.start <= range.end) {
      if (daySet.has(currentDay) && currentMinutes >= range.start && currentMinutes < range.end) {
        return { status: 'open', hasEvaluableBlock };
      }
    } else {
      const previousDay = previousDayIndex(currentDay);
      if ((daySet.has(currentDay) && currentMinutes >= range.start) || (daySet.has(previousDay) && currentMinutes < range.end)) {
        return { status: 'open', hasEvaluableBlock };
      }
    }
  }

  return { status: hasEvaluableBlock ? 'closed' : 'unknown', hasEvaluableBlock };
};

const findNextOpening = (parsed: ParsedSchedule, now: Date): Date | null => {
  const baseDay = startOfDay(now);
  const candidates: Date[] = [];

  for (let offset = 0; offset <= 7; offset += 1) {
    const dayDate = addDays(baseDay, offset);
    const dayIndex = dayDate.getDay();

    for (const block of parsed.blocks) {
      const daySet = parseDaysExpression(block.days);
      if (!daySet || !daySet.has(dayIndex)) {
        continue;
      }

      if (is24hToken(block.hours)) {
        const openingAt = toDateAtMinutes(dayDate, 0);
        if (openingAt > now) {
          candidates.push(openingAt);
        }
        continue;
      }

      const range = parseHourRange(block.hours);
      if (!range) {
        continue;
      }

      const openingAt = toDateAtMinutes(dayDate, range.start);
      if (openingAt > now) {
        candidates.push(openingAt);
      }
    }
  }

  if (!candidates.length) {
    return null;
  }

  candidates.sort((a, b) => a.getTime() - b.getTime());
  return candidates[0];
};

export const formatDaysForDisplay = (days: string): string => {
  const daySet = parseDaysExpression(days);
  if (!daySet || daySet.size === 0) {
    return normalizeText(days);
  }

  const orderedDays = [1, 2, 3, 4, 5, 6, 0].filter((day) => daySet.has(day));
  if (orderedDays.length === 7) {
    return 'Lunes a Domingo';
  }

  if (orderedDays.length === 1) {
    return INDEX_TO_DAY_LABEL[orderedDays[0]];
  }

  const consecutive = orderedDays.every((day, index) => {
    if (index === 0) return true;
    return day === orderedDays[index - 1] + 1;
  });

  if (consecutive) {
    return `${INDEX_TO_DAY_LABEL[orderedDays[0]]} a ${INDEX_TO_DAY_LABEL[orderedDays[orderedDays.length - 1]]}`;
  }

  return orderedDays.map((day) => INDEX_TO_DAY_LABEL[day]).join(', ');
};

export const getScheduleOpenStatus = (parsed: ParsedSchedule, now = new Date()): ScheduleOpenStatus => {
  return evaluateCurrentState(parsed, now).status;
};

export const getScheduleLiveStatus = (parsed: ParsedSchedule, now = new Date()): ScheduleLiveStatus => {
  const current = evaluateCurrentState(parsed, now);

  if (current.status === 'open') {
    return {
      status: 'open',
      nextOpening: null,
      nextOpeningLabel: null,
    };
  }

  if (current.status === 'unknown') {
    return {
      status: 'unknown',
      nextOpening: null,
      nextOpeningLabel: null,
    };
  }

  const nextOpening = findNextOpening(parsed, now);
  return {
    status: 'closed',
    nextOpening,
    nextOpeningLabel: nextOpening ? formatNextOpeningLabel(nextOpening, now) : null,
  };
};

export const parseSchedule = (schedule: string): ParsedSchedule => {
  const raw = normalizeText(schedule || '');

  if (!raw) {
    return {
      raw,
      is24h: false,
      blocks: [],
      confidence: 'low',
    };
  }

  const segments = splitSegments(raw);
  const blocks: ScheduleBlock[] = [];
  let lowConfidence = false;
  let has24hBlock = false;

  for (const segment of segments) {
    const dayBlockMatch = segment.match(DAY_BLOCK_REGEX);
    if (dayBlockMatch) {
      const days = normalizeText(dayBlockMatch[1]);
      const hours = normalizeText(dayBlockMatch[2]);

      if (is24hToken(hours)) {
        has24hBlock = true;
      }

      if (!is24hToken(hours) && !hasRangeHours(hours)) {
        lowConfidence = true;
      }

      blocks.push({ days, hours });
      continue;
    }

    const day24hMatch = segment.match(DAY_WITH_24H_REGEX);
    if (day24hMatch) {
      blocks.push({
        days: normalizeText(day24hMatch[1]),
        hours: '24H',
      });
      has24hBlock = true;
      continue;
    }

    if (is24hToken(segment)) {
      blocks.push({
        days: 'L-D',
        hours: '24H',
      });
      has24hBlock = true;
      continue;
    }

    lowConfidence = true;
  }

  const is24h =
    blocks.length > 0 &&
    blocks.every((block) => is24hToken(block.hours)) &&
    (blocks.some((block) => block.days.toUpperCase() === 'L-D') || blocks.length === 1 || has24hBlock);

  return {
    raw,
    is24h,
    blocks,
    confidence: lowConfidence ? 'low' : 'high',
  };
};
