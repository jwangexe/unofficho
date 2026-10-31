/**
 * A rough spoken form of a LaTeX string, for accessible names of buttons whose only content
 * is maths (screen readers and browsers do not reliably name a button from MathML).
 * "\dfrac{k_1k_2[A]}{k_{-1}}" → "k 1 k 2 [A] over k −1".
 */
function group(s: string, i: number): [string, number] {
  // Read a {…} group, a command with its argument (\mathrm{max}), or a single character.
  if (s[i] === '\\') {
    const name = s.slice(i + 1).match(/^[A-Za-z]+/)?.[0] ?? s[i + 1] ?? '';
    const end = i + 1 + name.length;
    if (s[end] !== '{') return [s.slice(i, end), end];
    const [, j] = group(s, end);
    return [s.slice(i, j), j];
  }
  if (s[i] !== '{') return [s[i] ?? '', i + 1];
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === '{') depth++;
    else if (s[j] === '}' && --depth === 0) return [s.slice(i + 1, j), j + 1];
  }
  return [s.slice(i + 1), s.length];
}

const WORDS: Record<string, string> = {
  gg: ' much greater than ',
  ll: ' much less than ',
  approx: ' approximately ',
  times: ' times ',
  cdot: ' times ',
  circ: ' standard ',
  ln: 'ln ',
  log: 'log ',
  Delta: 'Delta ',
  alpha: 'alpha',
  beta: 'beta',
  bullet: ' radical',
};

export function texToSpeech(tex: string): string {
  let out = '';
  for (let i = 0; i < tex.length; ) {
    const c = tex[i]!;
    if (c === '\\') {
      const name = tex.slice(i + 1).match(/^[A-Za-z]+|^./)?.[0] ?? '';
      i += 1 + name.length;
      if (/^[dt]?frac$/.test(name)) {
        const [a, j] = group(tex, i);
        const [b, k] = group(tex, j);
        out += `${texToSpeech(a)} over ${texToSpeech(b)}`;
        i = k;
      } else if (['mathrm', 'text', 'mathit', 'operatorname'].includes(name)) {
        const [a, j] = group(tex, i);
        out += texToSpeech(a);
        i = j;
      } else if (name === 'sqrt') {
        const [a, j] = group(tex, i);
        out += `square root of ${texToSpeech(a)}`;
        i = j;
      } else out += WORDS[name] ?? (name.length > 1 ? ` ${name} ` : '');
    } else if (c === '_' || c === '^') {
      const [a, j] = group(tex, i + 1);
      const spoken = texToSpeech(a);
      // Superscripts that are labels, not powers: A*, R⁺, X⁻, R•.
      const label: Record<string, string> = { '*': 'star', '∗': 'star', plus: 'plus', minus: 'minus', radical: 'radical' };
      out +=
        c === '_' ? ` ${spoken} ` : label[spoken] ? ` ${label[spoken]} ` : spoken === '2' ? ' squared ' : ` to the power ${spoken} `;
      i = j;
    } else if (c === '{' || c === '}') i++;
    else {
      out += c === '-' ? ' minus ' : c === '+' ? ' plus ' : c === '=' ? ' equals ' : c;
      i++;
    }
  }
  return out.replace(/\s+/g, ' ').trim();
}

/** Text that may contain $…$ maths, as plain words. */
export const richTextSpeech = (s: string) => s.replace(/\$([^$]+)\$/g, (_, t: string) => texToSpeech(t));
