import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

function collectTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...collectTsFiles(full));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      out.push(full);
    }
  }
  return out;
}

function getImports(src: string): string[] {
  const specs: string[] = [];
  const re = /(?:import|export)\s+[^'"]*?\s+from\s+['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    specs.push(m[1]);
  }
  return specs;
}

describe('D-FINAL #2 & #6 Layer Import-Direction & Stack Gap Guards', () => {
  const webSrc = resolve(process.cwd(), 'src');

  it('tokens/ never imports primitives/, patterns/, pages/, or layouts/', () => {
    const files = collectTsFiles(join(webSrc, 'tokens'));
    for (const file of files) {
      const imports = getImports(readFileSync(file, 'utf8'));
      for (const imp of imports) {
        expect(imp, file).not.toMatch(/\/(primitives|patterns|pages|layouts)(\/|$)/);
      }
    }
  });

  it('primitives/ never imports patterns/, pages/, or layouts/', () => {
    const files = collectTsFiles(join(webSrc, 'primitives')).filter(
      (f) => !f.endsWith('/gallery.ts')
    );
    for (const file of files) {
      const imports = getImports(readFileSync(file, 'utf8'));
      for (const imp of imports) {
        expect(imp, file).not.toMatch(/\/(patterns|pages|layouts)(\/|$)/);
      }
    }
  });

  it('patterns/ never imports pages/ or layouts/', () => {
    const files = collectTsFiles(join(webSrc, 'patterns'));
    for (const file of files) {
      const imports = getImports(readFileSync(file, 'utf8'));
      for (const imp of imports) {
        expect(imp, file).not.toMatch(/\/(pages|layouts)(\/|$)/);
      }
    }
  });

  it('patterns/ and pages/ never pass numeric gap to renderStack()', () => {
    const dirs = [join(webSrc, 'patterns'), join(webSrc, 'pages')];
    for (const dir of dirs) {
      for (const file of collectTsFiles(dir)) {
        const src = readFileSync(file, 'utf8');
        expect(src, file).not.toMatch(/renderStack\s*\(\s*\{[^}]*gap\s*:\s*\d+/);
      }
    }
  });
});
