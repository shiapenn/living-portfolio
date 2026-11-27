import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateRawSync } from 'node:zlib';
import { createApp } from '../app.js';
import { InMemoryPortfolioRepository, createDatabaseBackup, runRestoreDrill } from '@living-portfolio/db';
import { LocalVolumeMediaStorageAdapter } from '../media/storage.js';
import { loadConfig } from '@living-portfolio/config';

const TINY_PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex'
);

/** Minimal pure-TS ZIP builder (stored/deflated) for synthetic DOCX/ZIP test fixtures. */
function buildSyntheticZip(entries: Array<{ name: string; data: Buffer; compress?: boolean }>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const e of entries) {
    const nameBuf = Buffer.from(e.name, 'utf8');
    const method = e.compress ? 8 : 0;
    const body = e.compress ? deflateRawSync(e.data) : e.data;
    const crc = 0;

    const lfh = Buffer.alloc(30 + nameBuf.length);
    lfh.writeUInt32LE(0x04034b50, 0);
    lfh.writeUInt16LE(20, 4);
    lfh.writeUInt16LE(0, 6);
    lfh.writeUInt16LE(method, 8);
    lfh.writeUInt32LE(crc, 14);
    lfh.writeUInt32LE(body.length, 18);
    lfh.writeUInt32LE(e.data.length, 22);
    lfh.writeUInt16LE(nameBuf.length, 26);
    lfh.writeUInt16LE(0, 28);
    nameBuf.copy(lfh, 30);
    localParts.push(lfh, body);

    const cdh = Buffer.alloc(46 + nameBuf.length);
    cdh.writeUInt32LE(0x02014b50, 0);
    cdh.writeUInt16LE(20, 4);
    cdh.writeUInt16LE(20, 6);
    cdh.writeUInt16LE(0, 8);
    cdh.writeUInt16LE(method, 10);
    cdh.writeUInt32LE(crc, 16);
    cdh.writeUInt32LE(body.length, 20);
    cdh.writeUInt32LE(e.data.length, 24);
    cdh.writeUInt16LE(nameBuf.length, 28);
    cdh.writeUInt32LE(offset, 42);
    nameBuf.copy(cdh, 46);
    centralParts.push(cdh);

    offset += lfh.length + body.length;
  }

  const centralBuf = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, centralBuf, eocd]);
}

function buildSyntheticPdf(text: string): Buffer {
  const safe = text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const stream = `BT /F1 12 Tf 72 720 Td (${safe}) Tj ET`;
  return Buffer.from(
    `%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n2 0 obj << /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n%%EOF\n`,
    'utf8'
  );
}

describe('WP-18.7 Real file import & backup/export media inclusion canaries', () => {
  const tempDirs: string[] = [];
  const makeTemp = () => {
    const d = mkdtempSync(join(tmpdir(), 'lp-wp18-7-'));
    tempDirs.push(d);
    return d;
  };

  afterEach(() => {
    while (tempDirs.length) {
      rmSync(tempDirs.pop()!, { recursive: true, force: true });
    }
  });

  async function setupAdminApp(mediaDir: string) {
    const repo = new InMemoryPortfolioRepository();
    const storage = new LocalVolumeMediaStorageAdapter(mediaDir);
    const { app, auth } = createApp(repo, { mediaStorage: storage, config: loadConfig({ MEDIA_LOCAL_DIR: mediaDir }) });
    const session = auth.createSession('owner');
    const cookie = `lp_session=${session.id}`;
    const headers = { Cookie: cookie, 'X-CSRF-Token': session.csrfToken };
    return { app, repo, storage, headers };
  }

  it('[1-IMPORT-FILES-MD-TXT-HTML] parses .md, .txt, and .html without external fetches', async () => {
    const { app, headers } = await setupAdminApp(makeTemp());
    const form = new FormData();
    form.append('files', new File(['# Synthetic MD\n\nBody paragraph.'], 'note.md', { type: 'text/markdown' }));
    form.append('files', new File(['Plain Note Title\n\nSecond line text.'], 'plain.txt', { type: 'text/plain' }));
    form.append(
      'files',
      new File(
        ['<html><body><h1>HTML Title</h1><p>Hello world</p><img src="https://tracker.invalid/px.png" alt="ExtPic" /></body></html>'],
        'page.html',
        { type: 'text/html' }
      )
    );

    const res = await app.request('/api/import/files', { method: 'POST', headers, body: form });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.documents).toHaveLength(3);
    expect(json.errors).toEqual([]);
    expect(json.documents[0].title).toBe('Synthetic MD');
    expect(json.documents[2].body_md).toContain('HTML Title');
    expect(json.documents[2].body_md).not.toContain('<img');
  });

  it('[2-IMPORT-FILES-DOCX-EMBEDDED-IMAGE] extracts text and uploads embedded image from .docx via Media API', async () => {
    const { app, headers } = await setupAdminApp(makeTemp());
    const docx = buildSyntheticZip([
      {
        name: 'word/document.xml',
        data: Buffer.from(
          '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Synthetic Docx Heading</w:t></w:r></w:p><w:p><w:r><w:t>Paragraph from docx.</w:t></w:r></w:p></w:body></w:document>',
          'utf8'
        ),
        compress: true,
      },
      { name: 'word/media/diagram.png', data: TINY_PNG, compress: false },
    ]);

    const form = new FormData();
    form.append('files', new File([new Uint8Array(docx)], 'spec.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
    const res = await app.request('/api/import/files', { method: 'POST', headers, body: form });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.documents).toHaveLength(1);
    expect(json.documents[0].body_md).toContain('Synthetic Docx Heading');
    expect(json.documents[0].body_md).toMatch(/\/api\/media\/[0-9a-f-]{36}/);
    expect(json.uploadedMedia.length).toBe(1);
  });

  it('[3-IMPORT-FILES-PDF-AND-ZIP] parses .pdf and .zip (with nested md + image)', async () => {
    const { app, headers } = await setupAdminApp(makeTemp());
    const pdf = buildSyntheticPdf('Synthetic PDF Report Content');
    const zip = buildSyntheticZip([
      { name: 'bundle/post.md', data: Buffer.from('# Bundled Post\n\n![Pic](pic.png)\n', 'utf8'), compress: true },
      { name: 'bundle/pic.png', data: TINY_PNG, compress: false },
    ]);

    const form = new FormData();
    form.append('files', new File([new Uint8Array(pdf)], 'report.pdf', { type: 'application/pdf' }));
    form.append('files', new File([new Uint8Array(zip)], 'archive.zip', { type: 'application/zip' }));
    const res = await app.request('/api/import/files', { method: 'POST', headers, body: form });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.errors).toEqual([]);
    expect(json.documents.length).toBe(2);
    expect(json.documents.some((d: any) => d.body_md.includes('Synthetic PDF Report Content'))).toBe(true);
    expect(json.documents.some((d: any) => /\/api\/media\/[0-9a-f-]{36}/.test(d.body_md))).toBe(true);
  });

  it('[4-IMPORT-FILES-PER-FILE-ERROR] reports per-file errors without failing valid files in the batch', async () => {
    const { app, headers } = await setupAdminApp(makeTemp());
    const form = new FormData();
    form.append('files', new File(['# Good Entry\n\nValid body.'], 'good.md', { type: 'text/markdown' }));
    form.append('files', new File([new Uint8Array(Buffer.from('NOT_A_PDF_BYTES'))], 'broken.pdf', { type: 'application/pdf' }));
    const res = await app.request('/api/import/files', { method: 'POST', headers, body: form });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.documents).toHaveLength(1);
    expect(json.errors).toHaveLength(1);
    expect(json.errors[0].filename).toBe('broken.pdf');
  });

  it('[5-BACKUP-RESTORE-MEDIA-INCLUSION] backup + restore drill restores media_assets, references, and binaries serving 200', async () => {
    const srcMediaDir = makeTemp();
    const backupDir = makeTemp();
    const restoredMediaDir = makeTemp();

    const { app, repo, headers } = await setupAdminApp(srcMediaDir);

    // Upload image via Media API and reference it from a published public entry
    const uploadForm = new FormData();
    uploadForm.append('file', new File([new Uint8Array(TINY_PNG)], 'hero.png', { type: 'image/png' }));
    const upRes = await app.request('/api/media', { method: 'POST', headers, body: uploadForm });
    expect(upRes.status).toBe(201);
    const asset = await upRes.json();

    const bodyMd = `![Hero](/api/media/${asset.id})`;
    await repo.createEntry(
      { slug: 'backup-media-test', title: 'Backup Media Test', profile: 'case-study', view: 'article', visibility: 'public' },
      { body_md: bodyMd }
    );

    // Backup with mediaDir
    const backup = await createDatabaseBackup({
      repo,
      destinationDir: backupDir,
      mediaDir: srcMediaDir,
    });

    // Restore into a completely fresh repo + fresh media directory
    const freshRepo = new InMemoryPortfolioRepository();
    const drill = await runRestoreDrill({
      backupFile: backup.backupFile,
      scratchRepo: freshRepo,
      restoreMediaDir: restoredMediaDir,
    });
    expect(drill.ok).toBe(true);

    // Boot a brand-new app against freshRepo + restoredMediaDir and verify anonymous GET /api/media/:id === 200
    const restoredApp = createApp(freshRepo, {
      mediaStorage: new LocalVolumeMediaStorageAdapter(restoredMediaDir),
      config: loadConfig({ MEDIA_LOCAL_DIR: restoredMediaDir }),
    }).app;
    const getRes = await restoredApp.request(`/api/media/${asset.id}`);
    expect(getRes.status).toBe(200);
    const restoredBytes = Buffer.from(await getRes.arrayBuffer());
    expect(restoredBytes.length).toBeGreaterThan(0);
    expect(restoredBytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  });
});
