import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = resolve(__dirname, '../../assets/fonts');

function loadFont(file: string, baseName: string): { filename: string; buffer: Buffer; bytes: number; hash: string } {
  const buffer = readFileSync(resolve(FONTS_DIR, file));
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 10);
  return {
    filename: `${baseName}.${hash}.woff2`,
    buffer,
    bytes: buffer.length,
    hash,
  };
}

export const ATKINSON_FONT = loadFont('atkinson-hyperlegible-next-latin.woff2', 'atkinson-hyperlegible-next');
export const LITERATA_FONT = loadFont('literata-latin.woff2', 'literata');

export const FONT_ASSETS: Record<string, Buffer> = {
  [ATKINSON_FONT.filename]: ATKINSON_FONT.buffer,
  'atkinson-hyperlegible-next.woff2': ATKINSON_FONT.buffer,
  [LITERATA_FONT.filename]: LITERATA_FONT.buffer,
  'literata.woff2': LITERATA_FONT.buffer,
};

export const TOTAL_FONT_BYTES = ATKINSON_FONT.bytes + LITERATA_FONT.bytes;

export const PUBLIC_FONT_FACE_CSS = `@font-face {
  font-family: 'Literata';
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url('/assets/fonts/${LITERATA_FONT.filename}') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
  font-family: 'Literata Fallback';
  src: local('Georgia'), local('Times New Roman');
  size-adjust: 102%;
  ascent-override: 94%;
  descent-override: 24%;
  line-gap-override: 0%;
}
@font-face {
  font-family: 'Atkinson Hyperlegible Next';
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url('/assets/fonts/${ATKINSON_FONT.filename}') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
  font-family: 'Atkinson Fallback';
  src: local('Arial'), local('Helvetica Neue'), local('Helvetica');
  size-adjust: 100%;
  ascent-override: 92%;
  descent-override: 22%;
  line-gap-override: 0%;
}`;

export const PUBLIC_FONT_PRELOAD_HTML = [
  `<link rel="preload" href="/assets/fonts/${LITERATA_FONT.filename}" as="font" type="font/woff2" crossorigin />`,
  `<link rel="preload" href="/assets/fonts/${ATKINSON_FONT.filename}" as="font" type="font/woff2" crossorigin />`,
].join('\n  ');
