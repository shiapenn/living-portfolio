import { describe, it, expect } from 'vitest';
import {
  renderButton,
  renderIconButton,
  renderChip,
  renderBadge,
  renderStatusDot,
  renderSwitch,
  renderField,
} from './index.js';

describe('WP-15.2 Shared Primitives', () => {
  it('renders Button with variants, sizes, disabled, loading, and type', () => {
    const primary = renderButton({ label: 'Save draft', variant: 'primary', id: 'btn-save' });
    expect(primary).toContain('class="lp-btn lp-btn-primary lp-btn-md"');
    expect(primary).toContain('type="button"');
    expect(primary).toContain('id="btn-save"');
    expect(primary).toContain('Save draft');

    const danger = renderButton({ label: 'Delete', variant: 'danger', size: 'sm', type: 'submit', disabled: true });
    expect(danger).toContain('lp-btn-danger');
    expect(danger).toContain('lp-btn-sm');
    expect(danger).toContain('type="submit"');
    expect(danger).toContain('disabled');

    const loading = renderButton({ label: 'Publishing', variant: 'secondary', loading: true });
    expect(loading).toContain('aria-busy="true"');
    expect(loading).toContain('disabled');
  });

  it('renders IconButton with required aria-label and quiet/secondary variants', () => {
    const btn = renderIconButton({
      ariaLabel: 'Close dialog',
      icon: '×',
      id: 'btn-close',
      variant: 'quiet',
    });
    expect(btn).toContain('<button');
    expect(btn).toContain('class="lp-icon-btn lp-btn-quiet"');
    expect(btn).toContain('aria-label="Close dialog"');
    expect(btn).toContain('type="button"');
  });

  it('renders Chip as button when interactive, or span when static, with suggested vs confirmed styles', () => {
    const confirmedStatic = renderChip({ label: 'Architecture', state: 'confirmed' });
    expect(confirmedStatic).toContain('<span');
    expect(confirmedStatic).toContain('lp-chip');
    expect(confirmedStatic).not.toContain('lp-chip-suggested');

    const suggestedBtn = renderChip({ label: 'Distributed Systems', state: 'suggested', interactive: true, id: 'chip-1' });
    expect(suggestedBtn).toContain('<button');
    expect(suggestedBtn).toContain('lp-chip-suggested');
    expect(suggestedBtn).toContain('type="button"');
  });

  it('renders Badge and StatusDot with accessible text and non-interactive semantics', () => {
    const badge = renderBadge({ label: 'Unlisted', tone: 'warn' });
    expect(badge).toContain('<span');
    expect(badge).toContain('lp-badge-warn');
    expect(badge).toContain('Unlisted');

    const dot = renderStatusDot({ label: 'Connected', tone: 'ok' });
    expect(dot).toContain('lp-status-dot-ok');
    expect(dot).toContain('Connected');
  });

  it('renders Switch with role="switch" and aria-checked', () => {
    const sw = renderSwitch({ id: 'sw-auto', label: 'Automatic answers', checked: true });
    expect(sw).toContain('role="switch"');
    expect(sw).toContain('aria-checked="true"');
    expect(sw).toContain('Automatic answers');
  });

  it('renders Field for input, textarea, select, checkbox, radio with label, help, and error linkage', () => {
    const input = renderField({
      kind: 'input',
      id: 'field-title',
      name: 'title',
      label: 'Title',
      value: 'My Entry',
      help: 'Short clear title.',
      error: 'Title is required.',
      required: true,
    });
    expect(input).toContain('<label class="lp-field-label" for="field-title"');
    expect(input).toContain('aria-invalid="true"');
    expect(input).toContain('aria-describedby="field-title-help field-title-error"');
    expect(input).toContain('role="alert"');
    expect(input).toContain('Title is required.');

    const select = renderField({
      kind: 'select',
      id: 'field-vis',
      name: 'visibility',
      label: 'Visibility',
      value: 'unlisted',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'unlisted', label: 'Unlisted' },
        { value: 'public', label: 'Public' },
      ],
    });
    expect(select).toContain('<select');
    expect(select).toContain('<option value="unlisted" selected>Unlisted</option>');

    const textarea = renderField({ kind: 'textarea', id: 'field-body', name: 'body', label: 'Body', rows: 6 });
    expect(textarea).toContain('<textarea');
    expect(textarea).toContain('rows="6"');

    const checkbox = renderField({ kind: 'checkbox', id: 'field-nda', name: 'nda', label: 'Confirm NDA', checked: true });
    expect(checkbox).toContain('type="checkbox"');
    expect(checkbox).toContain('checked');

    const radio = renderField({ kind: 'radio', id: 'field-mode', name: 'mode', label: 'Decision', value: 'decision' });
    expect(radio).toContain('type="radio"');
  });
});
