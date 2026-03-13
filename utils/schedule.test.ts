import { describe, expect, it } from 'vitest';
import { formatDaysForDisplay, getScheduleLiveStatus, getScheduleOpenStatus, parseSchedule } from './schedule';

describe('parseSchedule', () => {
  it('parsea formato simple 24H', () => {
    const parsed = parseSchedule('24H');

    expect(parsed.is24h).toBe(true);
    expect(parsed.confidence).toBe('high');
    expect(parsed.blocks).toEqual([{ days: 'L-D', hours: '24H' }]);
  });

  it('parsea rango de dias con 24H', () => {
    const parsed = parseSchedule('L-D: 24H');

    expect(parsed.is24h).toBe(true);
    expect(parsed.confidence).toBe('high');
    expect(parsed.blocks).toEqual([{ days: 'L-D', hours: '24H' }]);
  });

  it('parsea un unico bloque horario', () => {
    const parsed = parseSchedule('L-D: 06:00-22:00');

    expect(parsed.is24h).toBe(false);
    expect(parsed.confidence).toBe('high');
    expect(parsed.blocks).toEqual([{ days: 'L-D', hours: '06:00-22:00' }]);
  });

  it('parsea varios bloques separados por punto y coma', () => {
    const parsed = parseSchedule('L-S: 06:00-00:30; D: 08:00-00:30');

    expect(parsed.is24h).toBe(false);
    expect(parsed.confidence).toBe('high');
    expect(parsed.blocks).toEqual([
      { days: 'L-S', hours: '06:00-00:30' },
      { days: 'D', hours: '08:00-00:30' },
    ]);
  });

  it('degrada a baja confianza con formato no estandar', () => {
    const parsed = parseSchedule('Horario especial festivos');

    expect(parsed.confidence).toBe('low');
    expect(parsed.blocks).toEqual([]);
    expect(parsed.raw).toBe('Horario especial festivos');
  });

  it('convierte dias abreviados a formato legible', () => {
    expect(formatDaysForDisplay('L-D')).toBe('Lunes a Domingo');
    expect(formatDaysForDisplay('L-S')).toBe('Lunes a Sabado');
    expect(formatDaysForDisplay('D')).toBe('Domingo');
  });

  it('marca abierto ahora en horario diurno', () => {
    const parsed = parseSchedule('L-D: 06:00-22:00');
    const now = new Date(2026, 2, 13, 10, 0, 0);

    expect(getScheduleOpenStatus(parsed, now)).toBe('open');
  });

  it('marca cerrado ahora fuera de rango horario', () => {
    const parsed = parseSchedule('L-D: 06:00-22:00');
    const now = new Date(2026, 2, 13, 23, 15, 0);

    expect(getScheduleOpenStatus(parsed, now)).toBe('closed');
  });

  it('soporta tramos nocturnos cruzando medianoche', () => {
    const parsed = parseSchedule('L-S: 20:00-02:00');
    const now = new Date(2026, 2, 14, 1, 0, 0);

    expect(getScheduleOpenStatus(parsed, now)).toBe('open');
  });

  it('informa la proxima apertura cuando esta cerrado en el mismo dia', () => {
    const parsed = parseSchedule('L-D: 06:00-22:30');
    const now = new Date(2026, 2, 13, 5, 30, 0);

    const liveStatus = getScheduleLiveStatus(parsed, now);
    expect(liveStatus.status).toBe('closed');
    expect(liveStatus.nextOpeningLabel).toBe('hoy a las 06:00');
  });

  it('informa la proxima apertura indicando manana cuando aplica', () => {
    const parsed = parseSchedule('L-S: 06:00-22:00');
    const now = new Date(2026, 2, 13, 23, 0, 0);

    const liveStatus = getScheduleLiveStatus(parsed, now);
    expect(liveStatus.status).toBe('closed');
    expect(liveStatus.nextOpeningLabel).toBe('manana a las 06:00');
  });

  it('informa la proxima apertura con dia explicito cuando no es hoy o manana', () => {
    const parsed = parseSchedule('L-V: 08:00-20:00');
    const now = new Date(2026, 2, 14, 21, 0, 0);

    const liveStatus = getScheduleLiveStatus(parsed, now);
    expect(liveStatus.status).toBe('closed');
    expect(liveStatus.nextOpeningLabel).toBe('Lunes a las 08:00');
  });
});
