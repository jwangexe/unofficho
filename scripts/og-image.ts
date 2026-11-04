/**
 * Draws public/og.png, the 1200×630 image shown when a link to the site is shared or appears
 * with a large preview. Run by hand after changing the name or tagline: `node scripts/og-image.ts`.
 */
import sharp from 'sharp';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0f1117"/>
  <g transform="translate(810 75) scale(0.8)" fill="none" stroke-width="28" stroke-linejoin="round" stroke-linecap="round">
    <polygon points="256,112 380.7,184 380.7,328 256,400 131.3,328 131.3,184" stroke="#7dd3c0"/>
    <circle cx="256" cy="256" r="62" stroke="#f5b94a"/>
  </g>
  <g font-family="Helvetica Neue, Helvetica, Arial, sans-serif">
    <text x="80" y="250" font-size="104" font-weight="700" fill="#e8eaf0" letter-spacing="-2">Unoff<tspan fill="#7dd3c0">IChO</tspan></text>
    <text x="80" y="335" font-size="44" font-weight="600" fill="#e8eaf0">Interactive chemistry olympiad practice</text>
    <text x="80" y="395" font-size="34" fill="#9aa1b2">IChO · UKChO · C3L6 · A-Level</text>
    <text x="80" y="540" font-size="30" fill="#7dd3c0">Free · works offline · unofficho.org</text>
  </g>
</svg>`;

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile('public/og.png');
console.log('wrote public/og.png');
