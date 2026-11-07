import { describe, it, expect } from 'vitest';
import { randomBytes } from 'node:crypto';
import {
  hexToBase32,
  base32ToHex,
  bufferToBase32,
  base32ToBuffer,
  buildOtpAuthUri,
  generateQrCodeSvg,
} from './totp.js';

describe('WP-13.1 TOTP & Authenticator Enrolment Unit Suite', () => {
  describe('Base32 RFC 4648 Encoding & Round Trip', () => {
    it('correctly encodes known test vectors', () => {
      // RFC 4648 standard test vectors (without padding for TOTP secret conventions)
      expect(bufferToBase32(Buffer.from(''))).toBe('');
      expect(bufferToBase32(Buffer.from('f'))).toBe('MY');
      expect(bufferToBase32(Buffer.from('fo'))).toBe('MZXQ');
      expect(bufferToBase32(Buffer.from('foo'))).toBe('MZXW6');
      expect(bufferToBase32(Buffer.from('foob'))).toBe('MZXW6YQ');
      expect(bufferToBase32(Buffer.from('fooba'))).toBe('MZXW6YTB');
      expect(bufferToBase32(Buffer.from('foobar'))).toBe('MZXW6YTBOI');
    });

    it('round-trips 20-byte random hex secrets through base32', () => {
      for (let i = 0; i < 10; i++) {
        const hex = randomBytes(20).toString('hex');
        const b32 = hexToBase32(hex);
        // 20 bytes (160 bits) in base32 is exactly 32 characters
        expect(b32).toHaveLength(32);
        expect(b32).toMatch(/^[A-Z2-7]{32}$/);
        const restoredHex = base32ToHex(b32);
        expect(restoredHex.toLowerCase()).toBe(hex.toLowerCase());
      }
    });

    it('handles padding and whitespace permissively when decoding base32', () => {
      const hex = '3132333435363738393031323334353637383930';
      const b32 = hexToBase32(hex);
      const withSpaces = b32.slice(0, 4) + ' ' + b32.slice(4, 8) + ' ' + b32.slice(8);
      expect(base32ToHex(withSpaces).toLowerCase()).toBe(hex.toLowerCase());
    });
  });

  describe('OTPAuth URI Builder', () => {
    it('builds canonical otpauth URI with issuer, account, and secret', () => {
      const uri = buildOtpAuthUri({
        issuer: 'Living Portfolio Test',
        accountName: 'owner@example.org',
        secretBase32: 'JBSWY3DPEHPK3PXP',
      });

      expect(uri).toBe(
        'otpauth://totp/Living%20Portfolio%20Test:owner%40example.org?secret=JBSWY3DPEHPK3PXP&issuer=Living%20Portfolio%20Test&algorithm=SHA1&digits=6&period=30'
      );
    });
  });

  describe('Local QR Code SVG Generation', () => {
    it('renders QR code as self-contained SVG without external dependencies', async () => {
      const uri = 'otpauth://totp/Test:owner?secret=JBSWY3DPEHPK3PXP&issuer=Test';
      const svg = await generateQrCodeSvg(uri);

      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('viewBox');
      // No external network references (other than standard SVG namespace)
      const withoutXmlNs = svg.replace('xmlns="http://www.w3.org/2000/svg"', '');
      expect(withoutXmlNs).not.toContain('http://');
      expect(withoutXmlNs).not.toContain('https://');
    });
  });
});
