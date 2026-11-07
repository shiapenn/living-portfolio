import QRCode from 'qrcode';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes a buffer to an RFC 4648 Base32 string (unpadded, standard for TOTP).
 */
export function bufferToBase32(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes an RFC 4648 Base32 string to a Buffer.
 * Ignores whitespace, hyphens, and padding ('=').
 */
export function base32ToBuffer(base32Str: string): Buffer {
  const clean = base32Str.toUpperCase().replace(/[\s\-=]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) {
      throw new Error(`Invalid Base32 character encountered: '${clean[i]}'`);
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Converts a hex secret string to Base32 representation.
 */
export function hexToBase32(hex: string): string {
  const cleanHex = hex.trim();
  const buf = Buffer.from(cleanHex, 'hex');
  return bufferToBase32(buf);
}

/**
 * Converts a Base32 secret string back to hex representation.
 */
export function base32ToHex(base32Str: string): string {
  const buf = base32ToBuffer(base32Str);
  return buf.toString('hex');
}

export interface OtpAuthUriOptions {
  issuer: string;
  accountName: string;
  secretBase32: string;
  digits?: number;
  period?: number;
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
}

/**
 * Builds an RFC 6238 compliant otpauth://totp/ URI.
 */
export function buildOtpAuthUri(options: OtpAuthUriOptions): string {
  const issuer = options.issuer.trim();
  const account = options.accountName.trim();
  const secret = options.secretBase32.trim();
  const digits = options.digits ?? 6;
  const period = options.period ?? 30;
  const algorithm = options.algorithm ?? 'SHA1';

  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`;
  return `otpauth://totp/${label}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=${algorithm}&digits=${digits}&period=${period}`;
}

/**
 * Generates an SVG string representation of a QR code locally with zero external network requests.
 */
export async function generateQrCodeSvg(uri: string): Promise<string> {
  return QRCode.toString(uri, {
    type: 'svg',
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}
