# Fonts

Self-hosted, subset to Latin, Greek, punctuation, super/subscripts, arrows and the maths signs used in units
(`pyftsubset` from fontTools; see the `unicode-range` in `src/index.css`).

- `source-serif-4-600.woff2`: Source Serif 4 (Adobe), the 600 weight at optical size 32. h1 and h2 only.
- `fira-mono-400.woff2`, `fira-mono-700.woff2`: Fira Mono (Mozilla). Values and units in chips. Chosen over
  JetBrains Mono and IBM Plex Mono because those lack the superscript minus (⁻) that every unit like mol⁻¹ uses.

Both are under the SIL Open Font License 1.1 (https://openfontlicense.org).
