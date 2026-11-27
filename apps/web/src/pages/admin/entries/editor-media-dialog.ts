import { loadConfig } from '@living-portfolio/config';
import { escapeHtml } from '../../../lib/html.js';
import { renderActionBar, renderChoiceGroup, renderField } from '../../../primitives/index.js';
import { renderDialog, renderPageNotice } from '../../../components/index.js';

/**
 * Unified Overlay dialog for inserting and editing images and videos (WP-18.4).
 * System mode: zero new data-c components (Field[file], Field[text], Choice, ActionBar[dialog], Notice, StatusLine, Text).
 * No drop zone inside the dialog; no poster or .vtt fields (captions deferred to WP-20.3).
 */
export function renderEditorMediaDialog(): string {
  const cfg = loadConfig();
  const embedHosts = cfg.MEDIA_EMBED_ALLOWED_HOSTS || 'youtube-nocookie.com,player.vimeo.com';

  const bodyHtml = `<div class="lp-stack lp-gap-related" data-media-dialog-form="true" data-embed-hosts="${escapeHtml(embedHosts)}">
  <div id="ref-media-video-mode-wrap" class="lp-is-hidden">
    ${renderChoiceGroup({
      id: 'ref-media-video-mode',
      name: 'ref-media-video-mode',
      legend: 'Video source',
      mode: 'single',
      variant: 'button',
      options: [
        { id: 'ref-media-mode-upload', value: 'upload', label: 'Upload', checked: true },
        { id: 'ref-media-mode-embed', value: 'embed', label: 'Embed URL' },
      ],
    })}
  </div>
  <div id="ref-media-file-wrap">
    ${renderField({
      kind: 'file',
      id: 'ref-media-file',
      name: 'mediaFile',
      label: 'File',
      accept: 'image/png,image/jpeg,image/webp,image/gif',
      buttonLabel: 'Choose file',
    })}
  </div>
  <div id="ref-media-embed-wrap" class="lp-is-hidden">
    ${renderField({
      kind: 'input',
      inputType: 'url',
      id: 'ref-media-embed-url',
      name: 'embedUrl',
      label: 'Embed URL',
      placeholder: 'https://www.youtube-nocookie.com/embed/…',
    })}
  </div>
  <div id="ref-media-alt-wrap">
    ${renderField({
      kind: 'input',
      id: 'ref-media-alt',
      name: 'altText',
      label: 'Alt text',
      placeholder: 'Describe what the image shows',
      required: true,
    })}
  </div>
  <div id="ref-media-decorative-wrap">
    ${renderChoiceGroup({
      id: 'ref-media-decorative-choice',
      name: 'ref-media-decorative',
      mode: 'multiple',
      variant: 'button',
      options: [
        { id: 'ref-media-decorative', value: 'decorative', label: 'Decorative image' },
      ],
    })}
  </div>
  <div id="ref-media-description-wrap" class="lp-is-hidden">
    ${renderField({
      kind: 'input',
      id: 'ref-media-description',
      name: 'videoDescription',
      label: 'Description',
      placeholder: 'Describe what happens in this video',
      required: true,
    })}
  </div>
  ${renderField({
    kind: 'input',
    id: 'ref-media-caption',
    name: 'mediaCaption',
    label: 'Caption',
    placeholder: 'Optional caption',
  })}
</div>`;

  const footerHtml = `<div class="lp-action-bar-group">
  <p id="ref-media-consequence" data-c="Text" data-variant="caption" data-purpose="consequence" class="lp-caption lp-is-hidden">Visitors must click to load this video.</p>
  ${renderActionBar({
    level: 'dialog',
    id: 'ref-media-action-bar',
    primary: { id: 'ref-media-submit', label: 'Insert', variant: 'primary' },
    textAction: { id: 'ref-media-cancel', label: 'Cancel', variant: 'text', dataAttrs: { 'lp-dialog-close': 'true' } },
    dangerTextAction: { id: 'ref-media-remove', label: 'Remove', variant: 'text-danger', className: 'lp-is-hidden' },
  })}
</div>
<div id="ref-media-status" class="lp-status-line lp-status-line-info lp-is-hidden" data-empty="true" hidden></div>
${renderPageNotice({
  id: 'ref-media-error-notice',
  tone: 'danger',
  role: 'none',
  message: '',
  hidden: true,
})}`;

  return renderDialog({
    id: 'ref-media-dialog',
    title: 'Insert image',
    bodyHtml,
    footerHtml,
  });
}
