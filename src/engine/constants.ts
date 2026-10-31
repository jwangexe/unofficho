/** Physical constants (SI). CODATA 2018 exact values where defined exactly. */
export const R = 8.314462618; // J K⁻¹ mol⁻¹
export const F = 96485.33212; // C mol⁻¹
export const h = 6.62607015e-34; // J s
export const kB = 1.380649e-23; // J K⁻¹
export const NA = 6.02214076e23; // mol⁻¹
export const c = 299792458; // m s⁻¹
export const e = 1.602176634e-19; // C
/** Standard pressure, 1 bar. */
export const P_STD = 1e5; // Pa
/** Standard concentration, 1 mol dm⁻³ = 1000 mol m⁻³. */
export const C_STD = 1e3; // mol m⁻³

export interface ConstantInfo {
  id: string;
  label: string;
  latex: string;
  name: string;
  value: number; // SI
  unit: string; // display unit id
}

/** Shown in the constants tray. Values in SI; displayed in `unit`. */
export const CONSTANTS: readonly ConstantInfo[] = [
  { id: 'R', label: 'R', latex: 'R', name: 'Gas constant', value: R, unit: 'J/(K mol)' },
  { id: 'F', label: 'F', latex: 'F', name: 'Faraday constant', value: F, unit: 'C/mol' },
  { id: 'h', label: 'h', latex: 'h', name: 'Planck constant', value: h, unit: 'J s' },
  { id: 'kB', label: 'k_B', latex: 'k_\\mathrm{B}', name: 'Boltzmann constant', value: kB, unit: 'J/K' },
  { id: 'NA', label: 'N_A', latex: 'N_\\mathrm{A}', name: 'Avogadro constant', value: NA, unit: '1/mol' },
  { id: 'c', label: 'c', latex: 'c', name: 'Speed of light', value: c, unit: 'm/s' },
  { id: 'pstd', label: 'p°', latex: 'p^\\circ', name: 'Standard pressure', value: P_STD, unit: 'bar' },
  { id: 'cstd', label: 'c°', latex: 'c^\\circ', name: 'Standard concentration', value: C_STD, unit: 'mol/dm3' },
  { id: 'Kw', label: 'K_w', latex: 'K_\\mathrm{w}', name: 'Ionic product of water (25 °C)', value: 1.0e-14, unit: '1' },
];
