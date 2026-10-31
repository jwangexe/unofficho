/** Shorthand constructors for common variable specs. */
import { D } from '../dims';
import type { VarSpec } from '../formula';

type Opts = Partial<VarSpec>;

export const temp = (sym = 'T', label = 'T', latex = 'T', o: Opts = {}): VarSpec => ({
  sym, label, latex, name: 'Temperature', dim: D.temperature, kind: 'abs-temp', unit: 'K', typical: 298, ...o,
});

export const deltaT = (o: Opts = {}): VarSpec => ({
  sym: 'dT', label: 'ΔT', latex: '\\Delta T', name: 'Temperature change',
  dim: D.temperature, kind: 'delta-temp', unit: 'K', sign: 'signed', ...o,
});

/** Molar energy (kJ mol⁻¹), signed by default. */
export const molarEnergy = (sym: string, label: string, latex: string, name: string, o: Opts = {}): VarSpec => ({
  sym, label, latex, name, dim: D.molarEnergy, unit: 'kJ/mol', sign: 'signed', ...o,
});

export const dimensionless = (sym: string, label: string, latex: string, name: string, o: Opts = {}): VarSpec => ({
  sym, label, latex, name, dim: D.none, unit: '1', ...o,
});

export const conc = (sym: string, label: string, latex: string, name: string, o: Opts = {}): VarSpec => ({
  sym, label, latex, name, dim: D.concentration, unit: 'mol/dm3', ...o,
});

export const time = (sym = 't', label = 't', latex = 't', o: Opts = {}): VarSpec => ({
  sym, label, latex, name: 'Time', dim: D.time, unit: 's', ...o,
});

export const firstOrderK = (sym = 'k', label = 'k', latex = 'k', o: Opts = {}): VarSpec => ({
  sym, label, latex, name: 'Rate constant', dim: D.frequency, unit: '1/s', ...o,
});

export const potential = (sym: string, label: string, latex: string, name: string, o: Opts = {}): VarSpec => ({
  sym, label, latex, name, dim: D.potential, unit: 'V', sign: 'signed', ...o,
});

/** Two-temperature variables for two-point formulas. */
export const T1 = temp('T1', 'T₁', 'T_1');
export const T2 = temp('T2', 'T₂', 'T_2');
