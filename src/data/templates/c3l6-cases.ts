import { defineCase, type CaseStudy } from '@/engine/caseStudy';

/**
 * C3L6 case studies: an unfamiliar system explained in the stem, then three short linked
 * parts. Later parts are given the earlier answers ("from (a)"), as in a scaffolded paper.
 */
export const c3l6Cases: CaseStudy[] = [
  defineCase({
    id: 'case-hydrogencarbonate',
    topic: 'stoich',
    title: 'Identifying a Group 1 hydrogencarbonate',
    intro:
      'A white powder is the hydrogencarbonate of a Group 1 metal, MHCO₃. On strong heating it decomposes: 2MHCO₃(s) → M₂CO₃(s) + H₂O(g) + CO₂(g). A {m} sample lost {dm} in mass when heated to constant mass. M(H₂O) = {Mw}, M(CO₂) = {Mc}.',
    params: {
      m: { unit: 'g', min: 2, max: 6, decimals: 2 },
      Ar: { unit: 'g/mol', choices: [23.0, 39.1, 85.5], decimals: 1 },
      Mw: { unit: 'g/mol', choices: [18.0], decimals: 1 },
      Mc: { unit: 'g/mol', choices: [44.0], decimals: 1 },
      Mh: { unit: 'g/mol', choices: [61.0], decimals: 1 },
    },
    setup: [
      { id: 'M', op: 'add', inputs: ['p.Ar', 'p.Mh'] },
      { id: 'n', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'p.m', M: 'n.M' } },
      { id: 'pair', op: 'scale', inputs: ['n.n'], coef: 0.5 },
      { id: 'Mpair', op: 'add', inputs: ['p.Mw', 'p.Mc'] },
      { id: 'dm', formula: 'moles-mass', solveFor: 'm', inputs: { n: 'n.pair', M: 'n.Mpair' } },
    ],
    given: [
      { key: 'm', label: 'm(sample)', from: 'p.m' },
      { key: 'dm', label: 'mass lost', from: 'n.dm', unit: 'g', decimals: 3 },
      { key: 'Mw', label: 'M(H₂O)', from: 'p.Mw' },
      { key: 'Mc', label: 'M(CO₂)', from: 'p.Mc' },
    ],
    levels: ['c3l6'],
    parts: [
      {
        id: 'case-hydrogencarbonate-a',
        title: 'Amount of MHCO₃',
        difficulty: 2,
        reference: [
          { id: 'Mpair', label: 'Mass lost per 2 mol MHCO₃', op: 'add', inputs: ['g.Mw', 'g.Mc'] },
          { id: 'pair', label: 'n(H₂O) = n(CO₂)', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'g.dm', M: 'n.Mpair' } },
          { id: 'n', label: 'n(MHCO₃)', formula: 'mole-ratio', solveFor: 'nB', inputs: { nA: 'n.pair', a: '#1', b: '#2' } },
        ],
        answer: { node: 'n', label: 'n(MHCO₃)', unit: 'mol' },
        misconceptions: [
          {
            reference: [
              { id: 'Mpair', op: 'add', inputs: ['g.Mw', 'g.Mc'] },
              { id: 'pair', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'g.dm', M: 'n.Mpair' } },
            ],
            answer: 'pair',
            message: 'That is the amount of H₂O (or CO₂) lost. The equation shows two MHCO₃ for each of them.',
          },
          {
            reference: [
              { id: 'c', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'g.dm', M: 'g.Mc' } },
              { id: 'n', formula: 'mole-ratio', solveFor: 'nB', inputs: { nA: 'n.c', a: '#1', b: '#2' } },
            ],
            answer: 'n',
            message: 'Both water and carbon dioxide escape, so the mass lost is H₂O + CO₂ (62.0 g per 2 mol MHCO₃), not CO₂ alone.',
          },
        ],
        wordings: ['Calculate the amount, in mol, of MHCO₃ in the sample.', 'How many moles of the hydrogencarbonate were heated?'],
        approachText: 'Mass lost on heating a hydrogencarbonate; find the amount that decomposed.',
        explanation:
          'Both products that escape, H₂O and CO₂, are formed in equal amounts, so the mass lost corresponds to (18.0 + 44.0) g for every 2 mol MHCO₃. n(H₂O) = mass lost ÷ 62.0, and n(MHCO₃) = 2 × n(H₂O).',
        reviewed: false,
      },
      {
        id: 'case-hydrogencarbonate-b',
        title: 'Molar mass of MHCO₃',
        difficulty: 1,
        given: [{ key: 'na', label: 'n(MHCO₃) from (a)', from: 'n.n', unit: 'mol', sig: 3 }],
        reference: [{ id: 'M', label: 'M(MHCO₃)', formula: 'moles-mass', solveFor: 'M', inputs: { m: 'g.m', n: 'g.na' } }],
        answer: { node: 'M', label: 'M(MHCO₃)', unit: 'g/mol' },
        misconceptions: [
          {
            reference: [{ id: 'M', formula: 'moles-mass', solveFor: 'M', inputs: { m: 'g.dm', n: 'g.na' } }],
            answer: 'M',
            message: 'Use the mass of the whole sample, not the mass lost.',
          },
        ],
        wordings: ['Using the amount from (a), calculate the molar mass of MHCO₃.', 'What is the molar mass of the hydrogencarbonate?'],
        approachText: 'Mass and amount of a sample known; find its molar mass.',
        explanation: 'M = m ÷ n, using the mass of the original sample and the amount from (a).',
        reviewed: false,
      },
      {
        id: 'case-hydrogencarbonate-c',
        title: 'Identify the metal',
        difficulty: 1,
        given: [
          { key: 'Mb', label: 'M(MHCO₃) from (b)', from: 'n.M', unit: 'g/mol', decimals: 1 },
          { key: 'Mh', label: 'M(HCO₃)', from: 'p.Mh' },
        ],
        reference: [{ id: 'Ar', label: 'Ar(M)', op: 'sub', inputs: ['g.Mb', 'g.Mh'] }],
        answer: { node: 'Ar', label: 'Ar(M)', unit: 'g/mol' },
        wordings: [
          'The HCO₃ part of the formula has M = {Mh}. Find the relative atomic mass of M, and use it to identify the metal.',
          'Deduce the relative atomic mass of M (M(HCO₃) = {Mh}) and name the metal.',
        ],
        approachText: 'Molar mass of MHCO₃ known; find the metal.',
        explanation:
          'Ar(M) = M(MHCO₃) − M(HCO₃). Compare with the Group 1 metals: Li 6.9, Na 23.0, K 39.1, Rb 85.5, Cs 132.9.',
        reviewed: false,
      },
    ],
  }),

  defineCase({
    id: 'case-drug-elimination',
    topic: 'kinetics',
    title: 'How long does a drug last?',
    intro:
      'After an injection, a drug is removed from the blood plasma by a first-order process: the rate of removal is proportional to its concentration. The plasma concentration is {c0} straight after the dose and {c1} after {t1}. The drug stops working once its concentration falls below {cmin}.',
    params: {
      k: { unit: '1/h', min: 0.05, max: 0.4, sig: 3 },
      c0: { unit: 'umol/dm3', min: 20, max: 80, sig: 3 },
      t1: { unit: 'h', min: 1, max: 6, decimals: 1 },
      frac: { unit: '1', min: 0.05, max: 0.25 },
    },
    setup: [
      { id: 'c1', formula: 'first-order', solveFor: 'A', inputs: { A0: 'p.c0', k: 'p.k', t: 'p.t1' } },
      { id: 'cmin', op: 'mul', inputs: ['p.c0', 'p.frac'] },
    ],
    given: [
      { key: 'c0', label: 'c₀', from: 'p.c0' },
      { key: 't1', label: 't₁', from: 'p.t1' },
      { key: 'c1', label: 'c at t₁', from: 'n.c1', unit: 'umol/dm3', sig: 3 },
      { key: 'cmin', label: 'c(minimum effective)', from: 'n.cmin', unit: 'umol/dm3', sig: 2 },
    ],
    // The second reading must have fallen noticeably, and the threshold be below it.
    constraint: (v) => v.c1! < 0.9 * v.c0! && v.cmin! < 0.95 * v.c1!,
    levels: ['c3l6'],
    parts: [
      {
        id: 'case-drug-elimination-a',
        title: 'Rate constant',
        difficulty: 2,
        reference: [{ id: 'k', label: 'k', formula: 'first-order', solveFor: 'k', inputs: { A0: 'g.c0', A: 'g.c1', t: 'g.t1' } }],
        answer: { node: 'k', label: 'k', unit: '1/h' },
        misconceptions: [
          {
            reference: [
              { id: 'r', op: 'div', inputs: ['g.c0', 'g.c1'] },
              { id: 'l', op: 'log10', inputs: ['n.r'] },
              { id: 'k', op: 'div', inputs: ['n.l', 'g.t1'] },
            ],
            answer: 'k',
            message: 'The integrated first-order rate law uses natural logs: ln(c₀/c) = kt.',
          },
        ],
        wordings: ['Calculate the rate constant for removal of the drug.', 'Find the first-order rate constant, k, in h⁻¹.'],
        approachText: 'First-order decay; two concentrations at known times.',
        explanation: 'For a first-order process, ln(c₀/c) = kt, so k = ln(c₀/c₁) ÷ t₁.',
        reviewed: false,
      },
      {
        id: 'case-drug-elimination-b',
        title: 'Half-life',
        difficulty: 1,
        given: [{ key: 'ka', label: 'k from (a)', from: 'p.k', unit: '1/h', sig: 3 }],
        reference: [{ id: 'th', label: 't½', formula: 'half-life-first', solveFor: 'thalf', inputs: { k: 'g.ka' } }],
        answer: { node: 'th', label: 't½', unit: 'h' },
        misconceptions: [
          {
            reference: [{ id: 'th', op: 'div', inputs: ['#1', 'g.ka'] }],
            answer: 'th',
            message: 't½ = ln 2 ÷ k for a first-order process, not 1 ÷ k.',
          },
        ],
        wordings: ['Using k from (a), calculate the half-life of the drug in the plasma.', 'What is the half-life of the drug?'],
        approachText: 'First-order rate constant known; find the half-life.',
        explanation: 'For first order, t½ = ln 2 ÷ k. It does not depend on the dose, which is why doses can be timed by half-lives.',
        reviewed: false,
      },
      {
        id: 'case-drug-elimination-c',
        title: 'Time until the next dose',
        difficulty: 2,
        given: [{ key: 'ka', label: 'k from (a)', from: 'p.k', unit: '1/h', sig: 3 }],
        reference: [{ id: 't', label: 't', formula: 'first-order', solveFor: 't', inputs: { A0: 'g.c0', A: 'g.cmin', k: 'g.ka' } }],
        answer: { node: 't', label: 't', unit: 'h' },
        misconceptions: [
          {
            reference: [{ id: 't', formula: 'first-order', solveFor: 't', inputs: { A0: 'g.c1', A: 'g.cmin', k: 'g.ka' } }],
            answer: 't',
            message: 'Measure the time from the dose, starting at c₀, not from the second reading.',
          },
        ],
        wordings: [
          'How long after the injection does the drug stop working?',
          'After how many hours should the next dose be given, if it is given when the concentration reaches the minimum effective value?',
        ],
        approachText: 'First-order decay with k known; find when the concentration reaches a threshold.',
        explanation: 't = ln(c₀/c_min) ÷ k, counting from the moment of the dose.',
        reviewed: false,
      },
    ],
  }),

  defineCase({
    id: 'case-ester-equilibrium',
    topic: 'equilibrium',
    title: 'Pushing an esterification further',
    intro:
      'Ethanoic acid and ethanol react reversibly: CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O. In experiment 1, a mixture of total volume {V} reached equilibrium containing {na} of acid, {nb} of ethanol, {ne} of ester and {nw} of water. In experiment 2, {a2} of acid and {b2} of ethanol are mixed in the same volume and left to reach equilibrium at the same temperature.',
    params: {
      V: { unit: 'cm3', min: 100, max: 250, decimals: 0 },
      a0: { unit: 'mol', min: 0.5, max: 1.5, sig: 3 },
      b0: { unit: 'mol', min: 0.5, max: 1.5, sig: 3 },
      K: { unit: '1', min: 3.5, max: 4.5, sig: 3 },
      a2: { unit: 'mol', min: 0.3, max: 1, sig: 2 },
      b2: { unit: 'mol', min: 1.5, max: 4, sig: 2 },
    },
    setup: [
      { id: 'ca', formula: 'concentration', solveFor: 'c', inputs: { n: 'p.a0', V: 'p.V' } },
      { id: 'cb', formula: 'concentration', solveFor: 'c', inputs: { n: 'p.b0', V: 'p.V' } },
      {
        id: 'xi',
        formula: 'ice',
        solveFor: 'xi',
        inputs: { K: 'p.K', nu1: '#-1', X01: 'n.ca', nu2: '#-1', X02: 'n.cb', nu3: '#1', X03: '#0@mol/dm3', nu4: '#1', X04: '#0@mol/dm3' },
      },
      { id: 'ne', formula: 'concentration', solveFor: 'n', inputs: { c: 'n.xi', V: 'p.V' } },
      { id: 'na', op: 'sub', inputs: ['p.a0', 'n.ne'] },
      { id: 'nb', op: 'sub', inputs: ['p.b0', 'n.ne'] },
      { id: 'ca2', formula: 'concentration', solveFor: 'c', inputs: { n: 'p.a2', V: 'p.V' } },
      { id: 'cb2', formula: 'concentration', solveFor: 'c', inputs: { n: 'p.b2', V: 'p.V' } },
      {
        id: 'xi2',
        formula: 'ice',
        solveFor: 'xi',
        inputs: { K: 'p.K', nu1: '#-1', X01: 'n.ca2', nu2: '#-1', X02: 'n.cb2', nu3: '#1', X03: '#0@mol/dm3', nu4: '#1', X04: '#0@mol/dm3' },
      },
      { id: 'ne2', formula: 'concentration', solveFor: 'n', inputs: { c: 'n.xi2', V: 'p.V' } },
    ],
    given: [
      { key: 'V', label: 'V', from: 'p.V' },
      { key: 'na', label: 'n(acid), exp. 1', from: 'n.na', unit: 'mol', sig: 3 },
      { key: 'nb', label: 'n(ethanol), exp. 1', from: 'n.nb', unit: 'mol', sig: 3 },
      { key: 'ne', label: 'n(ester), exp. 1', from: 'n.ne', unit: 'mol', sig: 3 },
      { key: 'nw', label: 'n(water), exp. 1', from: 'n.ne', unit: 'mol', sig: 3 },
      { key: 'a2', label: 'n(acid) at start, exp. 2', from: 'p.a2' },
      { key: 'b2', label: 'n(ethanol) at start, exp. 2', from: 'p.b2' },
    ],
    levels: ['c3l6'],
    parts: [
      {
        id: 'case-ester-equilibrium-a',
        title: 'Kc from experiment 1',
        difficulty: 2,
        reference: [
          { id: 'top', label: 'n(ester) × n(water)', op: 'mul', inputs: ['g.ne', 'g.nw'] },
          { id: 'bot', label: 'n(acid) × n(ethanol)', op: 'mul', inputs: ['g.na', 'g.nb'] },
          { id: 'K', label: 'Kc', op: 'div', inputs: ['n.top', 'n.bot'] },
        ],
        answer: { node: 'K', label: 'Kc', unit: '1' },
        misconceptions: [
          {
            reference: [
              { id: 'top', op: 'mul', inputs: ['g.ne', 'g.nw'] },
              { id: 'bot', op: 'mul', inputs: ['g.na', 'g.nb'] },
              { id: 'K', op: 'div', inputs: ['n.bot', 'n.top'] },
            ],
            answer: 'K',
            message: 'Products go on top: Kc = [ester][water] ÷ ([acid][ethanol]).',
          },
        ],
        wordings: [
          'Calculate Kc for the reaction from the results of experiment 1.',
          'Use experiment 1 to find the equilibrium constant, Kc. Explain why you do not need the volume.',
        ],
        approachText: 'Equilibrium amounts of all four species known; find Kc.',
        explanation:
          'Kc = [ester][water] ÷ ([acid][ethanol]). Each concentration is n ÷ V, and with two species on each side the volumes cancel, so the amounts can be used directly and Kc has no units.',
        reviewed: false,
      },
      {
        id: 'case-ester-equilibrium-b',
        title: 'Ester formed in experiment 2',
        difficulty: 3,
        given: [{ key: 'Ka', label: 'Kc from (a)', from: 'p.K', unit: '1', sig: 3 }],
        reference: [
          { id: 'ca', label: '[acid]₀', formula: 'concentration', solveFor: 'c', inputs: { n: 'g.a2', V: 'g.V' } },
          { id: 'cb', label: '[ethanol]₀', formula: 'concentration', solveFor: 'c', inputs: { n: 'g.b2', V: 'g.V' } },
          {
            id: 'xi',
            label: '[ester] at equilibrium',
            formula: 'ice',
            solveFor: 'xi',
            inputs: { K: 'g.Ka', nu1: '#-1', X01: 'n.ca', nu2: '#-1', X02: 'n.cb', nu3: '#1', X03: '#0@mol/dm3', nu4: '#1', X04: '#0@mol/dm3' },
          },
          { id: 'n', label: 'n(ester)', formula: 'concentration', solveFor: 'n', inputs: { c: 'n.xi', V: 'g.V' } },
        ],
        answer: { node: 'n', label: 'n(ester)', unit: 'mol' },
        wordings: [
          'Using Kc from (a), calculate the amount of ester present at equilibrium in experiment 2.',
          'How many moles of ethyl ethanoate are there when experiment 2 reaches equilibrium?',
        ],
        approachText: 'Kc known; initial amounts of both reactants known, no products; find the equilibrium amount of product.',
        explanation:
          'Let x mol of ester form. At equilibrium: acid a − x, ethanol b − x, ester x, water x. Then Kc = x² ÷ ((a − x)(b − x)), a quadratic in x. Take the root that leaves every amount positive.',
        reviewed: false,
      },
      {
        id: 'case-ester-equilibrium-c',
        title: 'How much of the acid reacted?',
        difficulty: 1,
        given: [{ key: 'ne2', label: 'n(ester) from (b)', from: 'n.ne2', unit: 'mol', sig: 3 }],
        reference: [{ id: 'f', label: 'Fraction of acid converted', op: 'div', inputs: ['g.ne2', 'g.a2'] }],
        answer: { node: 'f', label: 'Acid converted', unit: '%' },
        misconceptions: [
          {
            reference: [{ id: 'f', op: 'div', inputs: ['g.ne2', 'g.b2'] }],
            answer: 'f',
            message: 'That is the percentage of the ethanol that reacted. The question asks about the acid.',
          },
        ],
        wordings: [
          'What percentage of the ethanoic acid was converted to ester in experiment 2?',
          'Calculate the percentage of the acid that reacted in experiment 2, and compare it with experiment 1.',
        ],
        approachText: 'Amount of product and of the limiting reactant at the start known; find the percentage converted.',
        explanation:
          'Each mole of ester uses one mole of acid, so the percentage converted is n(ester) ÷ n(acid at start) × 100. Using a large excess of ethanol pushes the equilibrium to the right (Le Chatelier), so far more of the acid is converted than in experiment 1.',
        reviewed: false,
      },
    ],
  }),

  defineCase({
    id: 'case-brass-colorimetry',
    topic: 'other',
    title: 'Copper in brass by colorimetry',
    intro:
      'Brass is an alloy of copper and zinc. A {mb} sample was dissolved in nitric acid, excess ammonia was added to form the deep-blue [Cu(NH₃)₄]²⁺ ion, and the solution was made up to {V}. Its absorbance at 600 nm in a cell of path length {l} was {A}. Under these conditions the complex has ε = {eps}; zinc ions do not absorb. M(Cu) = {M}.',
    params: {
      mb: { unit: 'g', min: 0.15, max: 0.35, decimals: 3 },
      frac: { unit: '1', min: 0.58, max: 0.7 },
      eps: { unit: 'dm3/(mol cm)', choices: [52.0], decimals: 1 },
      l: { unit: 'cm', choices: [1.0], decimals: 2 },
      V: { unit: 'cm3', choices: [250], decimals: 1 },
      M: { unit: 'g/mol', choices: [63.5], decimals: 1 },
    },
    setup: [
      { id: 'mCu', op: 'mul', inputs: ['p.mb', 'p.frac'] },
      { id: 'n', formula: 'moles-mass', solveFor: 'n', inputs: { m: 'n.mCu', M: 'p.M' } },
      { id: 'c', formula: 'concentration', solveFor: 'c', inputs: { n: 'n.n', V: 'p.V' } },
      { id: 'A', formula: 'beer-lambert', solveFor: 'A', inputs: { eps: 'p.eps', l: 'p.l', c: 'n.c' } },
    ],
    given: [
      { key: 'mb', label: 'm(brass)', from: 'p.mb' },
      { key: 'V', label: 'V(solution)', from: 'p.V' },
      { key: 'l', label: 'l', from: 'p.l' },
      { key: 'A', label: 'A', from: 'n.A', unit: '1', decimals: 3 },
      { key: 'eps', label: 'ε', from: 'p.eps' },
      { key: 'M', label: 'M(Cu)', from: 'p.M' },
    ],
    levels: ['c3l6'],
    todoVerify: ['ε of [Cu(NH₃)₄]²⁺ near 600 nm is taken as about 52 dm³ mol⁻¹ cm⁻¹; check against a literature value (it is stated as data in the question).'],
    parts: [
      {
        id: 'case-brass-colorimetry-a',
        title: 'Concentration of the copper complex',
        difficulty: 1,
        reference: [{ id: 'c', label: '[Cu(NH₃)₄²⁺]', formula: 'beer-lambert', solveFor: 'c', inputs: { A: 'g.A', eps: 'g.eps', l: 'g.l' } }],
        answer: { node: 'c', label: 'c(Cu²⁺)', unit: 'mol/dm3' },
        wordings: ['Calculate the concentration of copper in the solution.', 'Use the Beer–Lambert law to find the concentration of [Cu(NH₃)₄]²⁺.'],
        approachText: 'Absorbance, molar absorption coefficient and path length known; find the concentration.',
        explanation: 'A = εlc, so c = A ÷ (εl). Each complex ion contains one copper, so this is also the copper concentration.',
        reviewed: false,
      },
      {
        id: 'case-brass-colorimetry-b',
        title: 'Mass of copper in the sample',
        difficulty: 2,
        given: [{ key: 'ca', label: 'c from (a)', from: 'n.c', unit: 'mol/dm3', sig: 3 }],
        reference: [
          { id: 'n', label: 'n(Cu)', formula: 'concentration', solveFor: 'n', inputs: { c: 'g.ca', V: 'g.V' } },
          { id: 'm', label: 'm(Cu)', formula: 'moles-mass', solveFor: 'm', inputs: { n: 'n.n', M: 'g.M' } },
        ],
        answer: { node: 'm', label: 'm(Cu)', unit: 'g' },
        wordings: ['Using the concentration from (a), calculate the mass of copper in the brass sample.', 'What mass of copper did the sample contain?'],
        approachText: 'Concentration and total volume of a solution known; find the mass of the metal it contains.',
        explanation: 'n(Cu) = c × V (V in dm³); all of it came from the sample. Then m = n × M.',
        reviewed: false,
      },
      {
        id: 'case-brass-colorimetry-c',
        title: 'Percentage of copper',
        difficulty: 1,
        given: [{ key: 'mCu', label: 'm(Cu) from (b)', from: 'n.mCu', unit: 'g', sig: 3 }],
        reference: [{ id: 'P', label: 'Copper by mass', op: 'div', inputs: ['g.mCu', 'g.mb'] }],
        answer: { node: 'P', label: 'Cu by mass', unit: '%' },
        wordings: ['What is the percentage by mass of copper in the brass?', 'Calculate the copper content of the brass as a percentage by mass.'],
        approachText: 'Mass of a component and of the whole sample known.',
        explanation: '% Cu = m(Cu) ÷ m(brass) × 100. Brasses are usually 55–70% copper, which is a useful check.',
        reviewed: false,
      },
    ],
  }),
];
