/**
 * Mechanisms for steady-state and pre-equilibrium derivations (Calculations → Mechanisms,
 * and <Mechanism id="…" /> in the Book). Steps are elementary, so rates follow mass action.
 * Step syntax: "A + M -> A* + M"; a coefficient is a number and a space: "2 NO -> N2O2".
 */
import type { Mechanism } from '@/engine/mechanism';

export const MECHANISMS: readonly Mechanism[] = [
  {
    id: 'mech-consecutive',
    title: 'Reversible formation of an intermediate',
    topic: 'kinetics',
    blurb: 'A forms an intermediate I reversibly; I goes on to the product.',
    species: { A: 'A', I: 'I', P: 'P' },
    steps: [
      { eq: 'A -> I', k: 'k1', back: 'km1' },
      { eq: 'I -> P', k: 'k2' },
    ],
    intermediates: ['I'],
    rate: { species: 'P' },
    challenges: [
      { ss: ['I'], pe: [] },
      { ss: [], pe: [0] },
    ],
    explanation:
      'Steady state on I gives k₁k₂[A]/(k₋₁ + k₂), with no assumption about which step is faster. Pre-equilibrium is its limit when k₋₁ ≫ k₂; the opposite limit, k₂ ≫ k₋₁, makes step 1 rate-determining.',
    reviewed: false,
  },
  {
    id: 'mech-lindemann',
    title: 'Lindemann–Hinshelwood (unimolecular gas reaction)',
    topic: 'kinetics',
    blurb: 'Collisions with any gas molecule M energise A to A*, which either reacts or is deactivated.',
    species: { A: 'A', M: 'M', 'A*': 'A^*', P: 'P' },
    steps: [
      { eq: 'A + M -> A* + M', k: 'k1', back: 'km1' },
      { eq: 'A* -> P', k: 'k2' },
    ],
    intermediates: ['A*'],
    rate: { species: 'P' },
    challenges: [
      { ss: ['A*'], pe: [] },
      { ss: [], pe: [0] },
    ],
    explanation:
      'Steady state on A* gives k₁k₂[A][M]/(k₋₁[M] + k₂). At high pressure k₋₁[M] ≫ k₂ and the reaction is first order (k₁k₂/k₋₁); at low pressure it becomes second order, k₁[A][M], because energising collisions are rate-limiting.',
    reviewed: false,
  },
  {
    id: 'mech-michaelis-menten',
    title: 'Michaelis–Menten enzyme kinetics',
    topic: 'kinetics',
    blurb: 'Enzyme E binds substrate S reversibly; the complex ES releases product P and free enzyme.',
    species: { E: 'E', S: 'S', ES: 'ES', P: 'P' },
    steps: [
      { eq: 'E + S -> ES', k: 'k1', back: 'km1' },
      { eq: 'ES -> E + P', k: 'k2' },
    ],
    intermediates: ['ES'],
    rate: { species: 'P' },
    conserve: { total: 'E0', tex: '[\\mathrm{E}]_0', free: 'E', species: ['E', 'ES'] },
    challenges: [
      { ss: ['ES'], pe: [] },
      { ss: [], pe: [0] },
    ],
    explanation:
      'The free enzyme is not known, so use the mass balance [E] = [E]₀ − [ES] before solving. Dividing top and bottom by k₁ gives v = k₂[E]₀[S]/($K_\\mathrm{M}$ + [S]) with $K_\\mathrm{M}$ = (k₋₁ + k₂)/k₁. Pre-equilibrium instead gives $K_\\mathrm{S}$ = k₋₁/k₁ in place of $K_\\mathrm{M}$.',
    reviewed: false,
  },
  {
    id: 'mech-competitive-inhibition',
    title: 'Competitive inhibition',
    topic: 'kinetics',
    blurb: 'An inhibitor I binds free enzyme reversibly, competing with the substrate.',
    species: { E: 'E', S: 'S', ES: 'ES', I: 'I', EI: 'EI', P: 'P' },
    steps: [
      { eq: 'E + S -> ES', k: 'k1', back: 'km1' },
      { eq: 'ES -> E + P', k: 'k2' },
      { eq: 'E + I -> EI', k: 'k3', back: 'km3' },
    ],
    intermediates: ['ES', 'EI'],
    rate: { species: 'P' },
    conserve: { total: 'E0', tex: '[\\mathrm{E}]_0', free: 'E', species: ['E', 'ES', 'EI'] },
    challenges: [
      { ss: ['ES', 'EI'], pe: [] },
      { ss: ['ES'], pe: [2] },
    ],
    explanation:
      'With the mass balance [E]₀ = [E] + [ES] + [EI], the result has the Michaelis–Menten form with $K_\\mathrm{M}$ multiplied by (1 + [I]/$K_\\mathrm{I}$), where $K_\\mathrm{I}$ = k₋₃/k₃: $V_\\mathrm{max}$ is unchanged, only the apparent $K_\\mathrm{M}$ grows.',
    reviewed: false,
  },
  {
    id: 'mech-no-oxidation',
    title: '2NO + O₂ → 2NO₂ via N₂O₂',
    topic: 'kinetics',
    blurb: 'NO dimerises reversibly; the dimer reacts with O₂.',
    species: { NO: 'NO', O2: 'O_2', N2O2: 'N_2O_2', NO2: 'NO_2' },
    steps: [
      { eq: '2 NO -> N2O2', k: 'k1', back: 'km1' },
      { eq: 'N2O2 + O2 -> 2 NO2', k: 'k2' },
    ],
    intermediates: ['N2O2'],
    rate: { species: 'NO2' },
    challenges: [
      { ss: [], pe: [0] },
      { ss: ['N2O2'], pe: [] },
    ],
    explanation:
      'Two NO2 form per step-2 event, so d[NO₂]/dt carries a factor of 2. Pre-equilibrium gives a third-order rate law, 2k₁k₂[NO]²[O₂]/k₋₁; since the dimerisation is exothermic, the apparent activation energy can be negative.',
    reviewed: false,
  },
  {
    id: 'mech-sn1-common-ion',
    title: 'Sₙ1 with a common-ion effect',
    topic: 'kinetics',
    blurb: 'RX ionises reversibly to a carbocation, which is captured by the nucleophile Nu⁻.',
    species: { RX: 'RX', 'R+': 'R^+', 'X-': 'X^-', 'Nu-': 'Nu^-', RNu: 'RNu' },
    steps: [
      { eq: 'RX -> R+ + X-', k: 'k1', back: 'km1' },
      { eq: 'R+ + Nu- -> RNu', k: 'k2' },
    ],
    intermediates: ['R+'],
    rate: { species: 'RNu' },
    challenges: [{ ss: ['R+'], pe: [] }],
    explanation:
      'Steady state on R⁺ gives k₁k₂[RX][Nu⁻]/(k₋₁[X⁻] + k₂[Nu⁻]). Added X⁻ slows the reaction (common-ion effect); when capture by Nu⁻ wins, k₂[Nu⁻] ≫ k₋₁[X⁻], and the familiar first-order rate k₁[RX] appears.',
    reviewed: false,
  },
  {
    id: 'mech-ozone',
    title: 'Decomposition of ozone',
    topic: 'kinetics',
    blurb: 'O₃ dissociates reversibly to O₂ and an O atom, which attacks a second O₃.',
    species: { O3: 'O_3', O2: 'O_2', O: 'O' },
    steps: [
      { eq: 'O3 -> O2 + O', k: 'k1', back: 'km1' },
      { eq: 'O + O3 -> 2 O2', k: 'k2' },
    ],
    intermediates: ['O'],
    rate: { species: 'O3', sign: -1 },
    challenges: [
      { ss: ['O'], pe: [] },
      { ss: [], pe: [0] },
    ],
    explanation:
      'O₃ is consumed in both steps, so −d[O₃]/dt picks up a factor of 2: 2k₁k₂[O₃]²/(k₋₁[O₂] + k₂[O₃]). When k₋₁[O₂] dominates, the rate is inhibited by O₂: 2k₁k₂[O₃]²/(k₋₁[O₂]).',
    reviewed: false,
  },
  {
    id: 'mech-hydrogen-iodine',
    title: 'H₂ + I₂ via iodine atoms',
    topic: 'kinetics',
    blurb: 'I₂ dissociates reversibly into atoms; two atoms react with H₂ in a termolecular step.',
    species: { H2: 'H_2', I2: 'I_2', I: 'I', HI: 'HI' },
    steps: [
      { eq: 'I2 -> 2 I', k: 'k1', back: 'km1' },
      { eq: 'H2 + 2 I -> 2 HI', k: 'k2' },
    ],
    intermediates: ['I'],
    rate: { species: 'HI' },
    challenges: [
      { ss: [], pe: [0] },
      { ss: ['I'], pe: [] },
    ],
    explanation:
      'Pre-equilibrium gives [I]² = (k₁/k₋₁)[I₂], and so d[HI]/dt = 2k₁k₂[H₂][I₂]/k₋₁: the same second-order law as a one-step H₂ + I₂ collision, which is why rate laws alone cannot prove a mechanism.',
    reviewed: false,
  },
  {
    id: 'mech-radical-polymerisation',
    title: 'Radical chain polymerisation',
    topic: 'kinetics',
    blurb: 'An initiator gives two radicals; radicals add monomer (staying radicals) and terminate in pairs.',
    species: { In: 'In', 'R': 'R^\\bullet', M: 'M', Pol: 'Pol' },
    steps: [
      { eq: 'In -> 2 R', k: 'kd' },
      { eq: 'R + M -> R', k: 'kp' },
      { eq: '2 R -> Pol', k: 'kt' },
    ],
    intermediates: ['R'],
    rate: { species: 'M', sign: -1 },
    challenges: [{ ss: ['R'], pe: [] }],
    explanation:
      'Propagation neither makes nor destroys radicals, so in the steady state initiation balances termination: $2k_\\mathrm{d}$[In] = $2k_\\mathrm{t}$[R•]². Monomer is used at $k_\\mathrm{p}$[R•][M], giving the half order in initiator.',
    todoVerify: ['Factor-of-2 conventions for termination differ between texts; this uses d[R•]/dt = −2kₜ[R•]².'],
    reviewed: false,
  },
  {
    id: 'mech-two-intermediates',
    title: 'Two intermediates in sequence',
    topic: 'kinetics',
    blurb: 'A and B combine reversibly to I₁, which rearranges to I₂; I₂ is trapped by C.',
    species: { A: 'A', B: 'B', I1: 'I_1', I2: 'I_2', C: 'C', P: 'P' },
    steps: [
      { eq: 'A + B -> I1', k: 'k1', back: 'km1' },
      { eq: 'I1 -> I2', k: 'k2' },
      { eq: 'I2 + C -> P', k: 'k3' },
    ],
    intermediates: ['I1', 'I2'],
    rate: { species: 'P' },
    challenges: [
      { ss: ['I1', 'I2'], pe: [] },
      { ss: ['I2'], pe: [0] },
    ],
    explanation:
      'With both intermediates in steady state, everything that forms I₂ is trapped, so the rate is set by the formation of I₂: k₁k₂[A][B]/(k₋₁ + k₂). Neither k₃ nor [C] appears.',
    reviewed: false,
  },
];

export const mechanismById = new Map(MECHANISMS.map((m) => [m.id, m]));
