import { D, type Dim, dimKey, eqDim, formatDim } from './dims';

export interface Unit {
  id: string;
  /** Unicode display symbol. */
  symbol: string;
  latex: string;
  dim: Dim;
  /** SI value = display value × factor (+ offset for absolute temperatures). */
  factor: number;
  /** Only for absolute temperature scales (°C). Ignored for temperature differences. */
  offset?: number;
}

const u = (id: string, symbol: string, latex: string, dim: Dim, factor: number, offset?: number): Unit => ({
  id, symbol, latex, dim, factor, ...(offset !== undefined && { offset }),
});

/**
 * Unit table. Within a dimension, earlier entries are preferred when the engine picks a
 * display unit for a computed result.
 */
export const UNITS: readonly Unit[] = [
  u('1', '', '', D.none, 1),
  // energy
  u('kJ', 'kJ', '\\mathrm{kJ}', D.energy, 1e3),
  u('J', 'J', '\\mathrm{J}', D.energy, 1),
  u('eV', 'eV', '\\mathrm{eV}', D.energy, 1.602176634e-19),
  u('kJ/mol', 'kJ mol⁻¹', '\\mathrm{kJ\\,mol^{-1}}', D.molarEnergy, 1e3),
  u('J/mol', 'J mol⁻¹', '\\mathrm{J\\,mol^{-1}}', D.molarEnergy, 1),
  u('J/K', 'J K⁻¹', '\\mathrm{J\\,K^{-1}}', D.entropy, 1),
  u('kJ/K', 'kJ K⁻¹', '\\mathrm{kJ\\,K^{-1}}', D.entropy, 1e3),
  u('J/(K mol)', 'J K⁻¹ mol⁻¹', '\\mathrm{J\\,K^{-1}\\,mol^{-1}}', D.molarEntropy, 1),
  u('kJ/(K mol)', 'kJ K⁻¹ mol⁻¹', '\\mathrm{kJ\\,K^{-1}\\,mol^{-1}}', D.molarEntropy, 1e3),
  u('J/(g K)', 'J g⁻¹ K⁻¹', '\\mathrm{J\\,g^{-1}\\,K^{-1}}', D.specificHeat, 1e3),
  u('J/(kg K)', 'J kg⁻¹ K⁻¹', '\\mathrm{J\\,kg^{-1}\\,K^{-1}}', D.specificHeat, 1),
  // temperature
  u('K', 'K', '\\mathrm{K}', D.temperature, 1),
  u('degC', '°C', '{}^\\circ\\mathrm{C}', D.temperature, 1, 273.15),
  // pressure
  u('kPa', 'kPa', '\\mathrm{kPa}', D.pressure, 1e3),
  u('Pa', 'Pa', '\\mathrm{Pa}', D.pressure, 1),
  u('bar', 'bar', '\\mathrm{bar}', D.pressure, 1e5),
  u('atm', 'atm', '\\mathrm{atm}', D.pressure, 101325),
  u('mmHg', 'mmHg', '\\mathrm{mmHg}', D.pressure, 101325 / 760),
  // volume
  u('dm3', 'dm³', '\\mathrm{dm^3}', D.volume, 1e-3),
  u('cm3', 'cm³', '\\mathrm{cm^3}', D.volume, 1e-6),
  u('m3', 'm³', '\\mathrm{m^3}', D.volume, 1),
  // amount, mass, molar mass
  u('mol', 'mol', '\\mathrm{mol}', D.amount, 1),
  u('mmol', 'mmol', '\\mathrm{mmol}', D.amount, 1e-3),
  u('umol', 'µmol', '\\mathrm{\\mu mol}', D.amount, 1e-6),
  u('g', 'g', '\\mathrm{g}', D.mass, 1e-3),
  u('kg', 'kg', '\\mathrm{kg}', D.mass, 1),
  u('mg', 'mg', '\\mathrm{mg}', D.mass, 1e-6),
  u('g/mol', 'g mol⁻¹', '\\mathrm{g\\,mol^{-1}}', D.molarMass, 1e-3),
  // concentration (mol dm⁻³ is 1000 mol m⁻³ in SI)
  u('mol/dm3', 'mol dm⁻³', '\\mathrm{mol\\,dm^{-3}}', D.concentration, 1e3),
  u('mmol/dm3', 'mmol dm⁻³', '\\mathrm{mmol\\,dm^{-3}}', D.concentration, 1),
  u('umol/dm3', 'µmol dm⁻³', '\\mathrm{\\mu mol\\,dm^{-3}}', D.concentration, 1e-3),
  u('mol/m3', 'mol m⁻³', '\\mathrm{mol\\,m^{-3}}', D.concentration, 1),
  // time
  u('s', 's', '\\mathrm{s}', D.time, 1),
  u('min', 'min', '\\mathrm{min}', D.time, 60),
  u('h', 'h', '\\mathrm{h}', D.time, 3600),
  u('d', 'd', '\\mathrm{d}', D.time, 86400),
  u('yr', 'yr', '\\mathrm{yr}', D.time, 365.25 * 86400),
  // rate constants and rates
  u('1/s', 's⁻¹', '\\mathrm{s^{-1}}', D.frequency, 1),
  u('1/min', 'min⁻¹', '\\mathrm{min^{-1}}', D.frequency, 1 / 60),
  u('1/h', 'h⁻¹', '\\mathrm{h^{-1}}', D.frequency, 1 / 3600),
  u('1/d', 'd⁻¹', '\\mathrm{d^{-1}}', D.frequency, 1 / 86400),
  u('1/yr', 'yr⁻¹', '\\mathrm{yr^{-1}}', D.frequency, 1 / (365.25 * 86400)),
  u('Hz', 'Hz', '\\mathrm{Hz}', D.frequency, 1),
  u('dm3/(mol s)', 'dm³ mol⁻¹ s⁻¹', '\\mathrm{dm^3\\,mol^{-1}\\,s^{-1}}', D.rateConst2, 1e-3),
  u('m3/(mol s)', 'm³ mol⁻¹ s⁻¹', '\\mathrm{m^3\\,mol^{-1}\\,s^{-1}}', D.rateConst2, 1),
  u('mol/(dm3 s)', 'mol dm⁻³ s⁻¹', '\\mathrm{mol\\,dm^{-3}\\,s^{-1}}', D.rate, 1e3),
  // electrochemistry
  u('V', 'V', '\\mathrm{V}', D.potential, 1),
  u('mV', 'mV', '\\mathrm{mV}', D.potential, 1e-3),
  u('C', 'C', '\\mathrm{C}', D.charge, 1),
  u('A', 'A', '\\mathrm{A}', D.current, 1),
  u('mA', 'mA', '\\mathrm{mA}', D.current, 1e-3),
  u('C/mol', 'C mol⁻¹', '\\mathrm{C\\,mol^{-1}}', D.chargePerAmount, 1),
  // length, spectroscopy
  u('nm', 'nm', '\\mathrm{nm}', D.length, 1e-9),
  u('cm', 'cm', '\\mathrm{cm}', D.length, 1e-2),
  u('m', 'm', '\\mathrm{m}', D.length, 1),
  u('pm', 'pm', '\\mathrm{pm}', D.length, 1e-12),
  u('dm3/(mol cm)', 'dm³ mol⁻¹ cm⁻¹', '\\mathrm{dm^3\\,mol^{-1}\\,cm^{-1}}', D.molarAbsorptivity, 0.1),
  u('m2/mol', 'm² mol⁻¹', '\\mathrm{m^2\\,mol^{-1}}', D.molarAbsorptivity, 1),
  // constants' units
  u('J s', 'J s', '\\mathrm{J\\,s}', D.energyTime, 1),
  u('m/s', 'm s⁻¹', '\\mathrm{m\\,s^{-1}}', D.velocity, 1),
  u('1/mol', 'mol⁻¹', '\\mathrm{mol^{-1}}', D.perAmount, 1),
];

const byId = new Map(UNITS.map((x) => [x.id, x]));

/** Ad hoc unit for a dimension with no named unit, expressed in SI base units. */
function siUnit(d: Dim): Unit {
  const symbol = formatDim(d);
  return { id: `si:${dimKey(d)}`, symbol, latex: `\\mathrm{${symbol}}`, dim: d, factor: 1 };
}

export function getUnit(id: string): Unit {
  const found = byId.get(id);
  if (found) return found;
  if (id.startsWith('si:')) {
    return siUnit(id.slice(3).split(',').map(Number) as unknown as Dim);
  }
  throw new Error(`Unknown unit "${id}"`);
}

export const unitsForDim = (d: Dim): Unit[] => UNITS.filter((x) => eqDim(x.dim, d));

/**
 * Pick a display unit for a computed SI value: the first preferred unit for that dimension
 * whose displayed magnitude is comfortable (10⁻³…10⁴), else the first one, else SI base units.
 */
export function unitForDim(d: Dim, siValue?: number): Unit {
  const candidates = unitsForDim(d).filter((x) => x.offset === undefined);
  if (candidates.length === 0) return siUnit(d);
  if (siValue !== undefined && siValue !== 0 && Number.isFinite(siValue)) {
    const comfy = candidates.find((x) => {
      const m = Math.abs(siValue / x.factor);
      return m >= 1e-3 && m < 1e4;
    });
    if (comfy) return comfy;
  }
  return candidates[0]!;
}
