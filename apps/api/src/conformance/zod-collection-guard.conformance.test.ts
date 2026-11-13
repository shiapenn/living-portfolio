import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';
import * as core from '@living-portfolio/core';
import * as config from '@living-portfolio/config';

const ROOT = resolve(import.meta.dirname, '../../../..');

/**
 * Recursively find all TypeScript source files under a directory,
 * ignoring dist and node_modules.
 */
function findSourceFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.turbo') {
      continue;
    }
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findSourceFiles(fullPath));
    } else if (entry.isFile() && (extname(entry.name) === '.ts' || extname(entry.name) === '.tsx')) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Recursively inspect a Zod schema definition AST to ensure
 * no ZodArray, ZodSet, or ZodTuple collections exist.
 */
function assertNoZodCollections(schema: any, path: string): void {
  if (!schema || typeof schema !== 'object') return;

  const def = schema._def;
  if (!def) return;

  const typeName = def.typeName || def.type;
  if (
    typeName === 'ZodArray' ||
    typeName === 'ZodSet' ||
    typeName === 'ZodTuple' ||
    typeName === 'array' ||
    typeName === 'set' ||
    typeName === 'tuple'
  ) {
    throw new Error(
      `Disallowed Zod collection '${typeName}' at ${path}. ` +
      `Unconstrained collections expose CVE-2023-54404 (GHSA-mrhx-c7xc-m3w5) prior to Zod >= 4.6.6 migration.`
    );
  }

  if (def.shape) {
    const shape = typeof def.shape === 'function' ? def.shape() : def.shape;
    for (const [key, childSchema] of Object.entries(shape)) {
      assertNoZodCollections(childSchema, `${path}.${key}`);
    }
  }

  if (def.innerType) {
    assertNoZodCollections(def.innerType, `${path}._inner`);
  }
  if (def.element) {
    assertNoZodCollections(def.element, `${path}._element`);
  }
  if (def.type && typeof def.type === 'object') {
    assertNoZodCollections(def.type, `${path}._type`);
  }
  if (def.valueType) {
    assertNoZodCollections(def.valueType, `${path}._value`);
  }
  if (def.schema) {
    assertNoZodCollections(def.schema, `${path}._schema`);
  }
  if (def.in) {
    assertNoZodCollections(def.in, `${path}._in`);
  }
  if (def.out) {
    assertNoZodCollections(def.out, `${path}._out`);
  }
}

describe('Zod Collection Guard Conformance Gate (CVE-2023-54404 / GHSA-mrhx-c7xc-m3w5, UX-53)', () => {
  it('1. source tree has zero z.array, z.set, or z.tuple schema definitions', () => {
    const targets = ['apps', 'packages'];
    const files: string[] = [];
    for (const t of targets) {
      files.push(...findSourceFiles(resolve(ROOT, t)));
    }

    const collectionCallRegex = /\bz\.(array|set|tuple)\s*\(/;
    const violations: { file: string; line: number; text: string }[] = [];

    for (const file of files) {
      // Don't test this guard test itself
      if (file.endsWith('zod-collection-guard.conformance.test.ts')) continue;

      const content = readFileSync(file, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (collectionCallRegex.test(line)) {
          violations.push({
            file: file.replace(ROOT + '/', ''),
            line: index + 1,
            text: line.trim(),
          });
        }
      });
    }

    expect(
      violations,
      `Disallowed Zod collection schema instantiation found (CVE-2023-54404 safeguard):\n` +
      violations.map((v) => `  ${v.file}:${v.line} -> ${v.text}`).join('\n')
    ).toEqual([]);
  });

  it('2. all exported schemas from @living-portfolio/core and @living-portfolio/config contain no ZodArray, ZodSet, or ZodTuple', () => {
    const allExports = { ...core, ...config };
    let validatedSchemas = 0;

    for (const [name, exp] of Object.entries(allExports)) {
      if (exp && typeof exp === 'object' && '_def' in exp) {
        assertNoZodCollections(exp, name);
        validatedSchemas++;
      }
    }

    // Ensure we actually checked schemas
    expect(validatedSchemas).toBeGreaterThan(10);
  });
});
