import { describe, it, expect } from 'vitest';
import { loadConfig } from '@living-portfolio/config';
import { renderMarkdown } from '../markdown.js';
import { markdownToTiptapDoc, normalizeMarkdown, tiptapDocToMarkdown } from './markdown-bridge.js';
import { renderReferenceEditorPage } from '../pages/admin/entries/editor.js';

const MEDIA_ID = '11111111-1111-4111-8111-111111111111';
const VIDEO_ID = '22222222-2222-4222-8222-222222222222';

describe('WP-18.4 Editor Media & Public Rendering Behavioural Conformance', () => {
  it('[1-PRIVACY-EXTERNAL-IMAGE] renders non-/api/media/:id Markdown images as plain link text with zero <img> tags', () => {
    const md = [
      'External pixel: ![Remote Diagram](https://tracker.example.org/beacon.png)',
      'Relative path: ![Local Static](/assets/logo.png)',
      `Versioned path: ![Wrong Prefix](/api/v1/media/${MEDIA_ID})`,
    ].join('\n\n');

    const html = renderMarkdown(md);
    expect(html).not.toContain('<img');
    expect(html).toContain('<a href="https://tracker.example.org/beacon.png"');
    expect(html).toContain('Remote Diagram</a>');
    expect(html).toContain(`<a href="/api/v1/media/${MEDIA_ID}">Wrong Prefix</a>`);
  });

  it('[2-PUBLIC-IMAGE-DIMENSIONS] renders /api/media/:id images inside .pub-media with stored width/height, lazy loading, decorative empty alt, and figcaption', () => {
    const standardMd = `![Distributed queue topology](/api/media/${MEDIA_ID} "Queue fan-out across 3 regions")`;
    const html = renderMarkdown(standardMd, {
      mediaDimensions: { [MEDIA_ID]: { width: 1280, height: 720 } },
    } as any);

    expect(html).toContain('class="pub-media"');
    expect(html).toContain(`src="/api/media/${MEDIA_ID}"`);
    expect(html).toContain('alt="Distributed queue topology"');
    expect(html).toContain('width="1280"');
    expect(html).toContain('height="720"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('<figcaption class="pub-media-caption">Queue fan-out across 3 regions</figcaption>');

    const decorativeMd = `![](/api/media/${MEDIA_ID} "Section ornament")`;
    const decHtml = renderMarkdown(decorativeMd, {
      mediaDimensions: { [MEDIA_ID]: { width: 640, height: 120 } },
    } as any);
    expect(decHtml).toContain('alt=""');
    expect(decHtml).toContain('width="640"');
    expect(decHtml).toContain('height="120"');
    expect(decHtml).toContain('<figcaption class="pub-media-caption">Section ornament</figcaption>');
  });

  it('[3-PUBLIC-UPLOADED-VIDEO] renders uploaded :::video directive with controls, preload=metadata, aria-label, caption, and disallows raw HTML', () => {
    const md = [
      `:::video{src="/api/media/${VIDEO_ID}" description="Failover drill screen recording" caption="Zero-loss leader election"}`,
      ':::',
      '',
      '<video src="https://evil.example/auto.mp4" autoplay></video>',
      '<iframe src="https://evil.example/frame"></iframe>',
    ].join('\n');

    const html = renderMarkdown(md);
    expect(html).toContain('class="pub-media"');
    expect(html).toContain(`<video src="/api/media/${VIDEO_ID}" controls preload="metadata" aria-label="Failover drill screen recording"></video>`);
    expect(html).toContain('<figcaption class="pub-media-caption">Zero-loss leader election</figcaption>');
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('autoplay></video>');
  });

  it('[4-PUBLIC-EMBED-GATE-AND-ALLOWLIST] renders static .pub-embed-gate with zero iframe/img/script before click and rejects non-allowlisted hosts', () => {
    const allowedMd = [
      ':::video{embed="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" description="Systems architecture talk" caption="Recorded at QCon"}',
      ':::',
    ].join('\n');

    const allowedHtml = renderMarkdown(allowedMd, {
      embedAllowedHosts: ['youtube-nocookie.com', 'player.vimeo.com'],
    } as any);
    expect(allowedHtml).toContain('class="pub-embed-gate"');
    expect(allowedHtml).toContain('data-embed-state="unloaded"');
    expect(allowedHtml).toContain('data-embed-src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"');
    expect(allowedHtml).not.toContain('<iframe');
    expect(allowedHtml).not.toContain('<img');
    expect(allowedHtml).not.toContain('<script');
    expect(allowedHtml).toContain('<figcaption class="pub-media-caption">Recorded at QCon</figcaption>');

    const disallowedMd = [
      ':::video{embed="https://www.youtube.com/embed/dQw4w9WgXcQ" description="Tracking host"}',
      ':::',
    ].join('\n');
    const disallowedHtml = renderMarkdown(disallowedMd, {
      embedAllowedHosts: ['youtube-nocookie.com', 'player.vimeo.com'],
    } as any);
    expect(disallowedHtml).not.toContain('pub-embed-gate');
    expect(disallowedHtml).not.toContain('<iframe');
    expect(disallowedHtml).toContain('<a href="https://www.youtube.com/embed/dQw4w9WgXcQ"');
  });

  it('[5-EDITOR-ROUNDTRIP-MEDIA] parses and losslessly round-trips standard image, decorative image, uploaded video, and embed video nodes', () => {
    const fixtures = [
      `![Architecture diagram](/api/media/${MEDIA_ID})`,
      `![Architecture diagram](/api/media/${MEDIA_ID} "Figure 1: Write path")`,
      `![](/api/media/${MEDIA_ID} "Decorative divider")`,
      `:::video{src="/api/media/${VIDEO_ID}" description="Failover walkthrough" caption="2-minute demo"}\n:::`,
      ':::video{embed="https://player.vimeo.com/video/123456" description="Conference keynote"}\n:::',
    ];

    const imgDoc = markdownToTiptapDoc(fixtures[2]);
    expect(imgDoc.content?.[0]?.type).toBe('mediaImage');
    expect(imgDoc.content?.[0]?.attrs?.decorative).toBe(true);

    const vidDoc = markdownToTiptapDoc(fixtures[3]);
    expect(vidDoc.content?.[0]?.type).toBe('mediaVideo');
    expect(vidDoc.content?.[0]?.attrs?.src).toBe(`/api/media/${VIDEO_ID}`);

    for (const md of fixtures) {
      const doc = markdownToTiptapDoc(md);
      expect(tiptapDocToMarkdown(doc)).toBe(normalizeMarkdown(md));
    }
  });

  it('[6-EDITOR-MEDIA-DIALOG-SYSTEM-MODE] renders unified Overlay media dialog with Field[file], Choice controls, no poster/vtt/dropzone, S2 consequence, and Primary->Cancel->Remove ActionBar', () => {
    const html = renderReferenceEditorPage({
      entries: [
        {
          id: 'entry-1',
          slug: 'entry-1',
          title: 'Media test',
          body: '',
          visibility: 'draft',
          date: '2026-11-27',
          temporalConfidence: 'exact',
          profile: 'case-study',
        },
      ],
      selectedId: 'entry-1',
    });

    expect(html).toContain('id="ref-media-dialog"');
    expect(html).toContain('data-variant="file"');
    expect(html).toContain('Decorative image');
    expect(html).toContain('Visitors must click to load this video.');
    expect(html).not.toContain('poster');
    expect(html).not.toContain('.vtt');
    expect(html).toContain('id="ref-fmt-image"');
    expect(html).toContain('id="ref-fmt-video"');

    const dlgStart = html.indexOf('id="ref-media-dialog"');
    const dlgHtml = html.slice(dlgStart);
    expect(dlgHtml).not.toContain('lp-dropzone');
    const insertIdx = dlgHtml.indexOf('id="ref-media-submit"');
    const cancelIdx = dlgHtml.indexOf('id="ref-media-cancel"');
    const removeIdx = dlgHtml.indexOf('id="ref-media-remove"');
    expect(insertIdx).toBeGreaterThan(0);
    expect(insertIdx).toBeLessThan(cancelIdx);
    expect(cancelIdx).toBeLessThan(removeIdx);
  });

  it('[7-CSP-FRAME-SRC-CONFIG] configures default provider allowlist youtube-nocookie.com and player.vimeo.com in config', () => {
    const cfg = loadConfig({} as any);
    expect((cfg as any).MEDIA_EMBED_ALLOWED_HOSTS).toBe('youtube-nocookie.com,player.vimeo.com');
  });
});
