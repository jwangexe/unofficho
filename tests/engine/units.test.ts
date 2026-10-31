import { describe, expect, it } from 'vitest';
import { convert, displayValue, formatQuantity, fromSI, qty, toSI } from '@/engine/quantity';
import { formatNumber } from '@/engine/format';
import { D, formatDim } from '@/engine/dims';
import { unitForDim, UNITS } from '@/engine/units';

describe('units', () => {
  it('converts absolute temperatures with the offset, differences without', () => {
    expect(toSI(25, 'degC')).toBeCloseTo(298.15, 12);
    expect(toSI(10, 'degC', 'delta-temp')).toBe(10);
    expect(fromSI(373.15, 'degC')).toBeCloseTo(100, 12);
  });

  it('pressure, volume, energy, time and concentration factors', () => {
    expect(toSI(1, 'atm') / toSI(1, 'bar')).toBeCloseTo(1.01325, 12);
    expect(toSI(760, 'mmHg')).toBeCloseTo(101325, 6);
    expect(toSI(1, 'kPa') * toSI(1, 'dm3')).toBeCloseTo(1, 12); // kPa·dm³ = J
    expect(toSI(2.5, 'kJ/mol')).toBe(2500);
    expect(toSI(1, 'h')).toBe(3600);
    expect(toSI(0.1, 'mol/dm3')).toBeCloseTo(100, 12);
    expect(toSI(250, 'cm3')).toBeCloseTo(2.5e-4, 15);
    expect(toSI(1, '1/min')).toBeCloseTo(1 / 60, 15);
  });

  it('convert changes only the display unit', () => {
    const q = qty(-92.4, 'kJ/mol');
    const res = convert(q, 'J/mol');
    expect(res.ok && displayValue(res.value)).toBeCloseTo(-92400, 9);
    expect(res.ok && res.value.value).toBe(q.value);
    expect(convert(q, 'K').ok).toBe(false);
  });

  it('every unit id is unique', () => {
    const ids = UNITS.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('picks a comfortable display unit for computed values', () => {
    expect(unitForDim(D.molarEnergy, -33306).id).toBe('kJ/mol');
    expect(unitForDim(D.energy, 0.5).id).toBe('J');
    expect(unitForDim(D.temperature, 300).id).toBe('K');
  });

  it('falls back to SI base units for unnamed dimensions', () => {
    expect(formatDim(D.energy)).toBe('kg m² s⁻²');
    expect(unitForDim([0, 1, -2, 0, 0, 0]).symbol).toBe('m s⁻²');
  });
});

describe('formatting', () => {
  it('formats to significant figures', () => {
    expect(formatNumber(-33.3066)).toBe('−33.3');
    expect(formatNumber(2.5)).toBe('2.50');
    expect(formatNumber(1234.5)).toBe('1230');
    expect(formatNumber(0.0012345, 3)).toBe('0.00123');
    expect(formatNumber(1.8e-5)).toBe('1.80 × 10⁻⁵');
    expect(formatNumber(6.0221e23, 4)).toBe('6.022 × 10²³');
    expect(formatNumber(9.9996, 3)).toBe('10.0');
  });

  it('formats quantities with unit symbols', () => {
    expect(formatQuantity(qty(-92.4, 'kJ/mol'))).toBe('−92.4 kJ mol⁻¹');
    expect(formatQuantity(qty(1.8e-5, '1'))).toBe('1.80 × 10⁻⁵');
  });
});
