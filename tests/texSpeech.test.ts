import { describe, expect, it } from 'vitest';
import { richTextSpeech, texToSpeech } from '@/ui/texSpeech';

describe('texToSpeech', () => {
  it('reads fractions, subscripts and powers', () => {
    expect(texToSpeech('\\dfrac{k_{1}k_{2}[\\mathrm{A}]}{k_{-1}}')).toBe('k 1 k 2 [A] over k minus 1');
    expect(texToSpeech('[\\mathrm{I}]^{1/2}')).toBe('[I] to the power 1/2');
    expect(texToSpeech('[\\mathrm{NO}]^{2}')).toBe('[NO] squared');
    expect(texToSpeech('k_{-1}[\\mathrm{M}] \\gg k_{2}')).toBe('k minus 1 [M] much greater than k 2');
    expect(texToSpeech('[\\mathrm{A^*}]')).toBe('[A star]');
    expect(texToSpeech('[\\mathrm{R^+}][\\mathrm{X^-}]')).toBe('[R plus][X minus]');
    expect(texToSpeech('[\\mathrm{R^\\bullet}]')).toBe('[R radical]');
  });
  it('turns inline maths in text into words', () => {
    expect(richTextSpeech('$V_\\mathrm{max}/2$')).toBe('V max /2');
  });
});
