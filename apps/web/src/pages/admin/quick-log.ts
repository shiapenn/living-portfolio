import { adaptDataSource, type WebDataClient } from '../../lib/data-source.js';
import { escapeHtml } from '../../lib/html.js';
import { renderAdminShell, renderPageTemplate } from '../../layouts/admin-shell.js';
import { renderActionBar, renderField } from '../../primitives/index.js';
import { renderPageNotice, renderStatusLine } from '../../components/index.js';
import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';

export async function renderAdminQuickLogPage(
  repo: WebDataClient,
  options: { nonce?: string; siteName?: string } = {}
): Promise<string> {
  repo = adaptDataSource(repo);
  const ventures = await repo.listVentures().catch(() => []);

  const ventureOptions = [
    { value: '', label: 'None' },
    ...ventures.map((v) => ({ value: v.id, label: v.name })),
  ];

  const formHtml = `
    <form id="quick-log-form" class="lp-stack lp-gap-group" novalidate>
      <div class="lp-stack lp-gap-related">
        ${renderField({
          id: 'ql-happened',
          name: 'happened',
          label: 'What happened',
          kind: 'textarea',
          rows: 3,
          required: true,
          placeholder: 'Shipped the migration, ran the load test, or resolved an incident...',
        })}
        ${renderField({
          id: 'ql-decided',
          name: 'decided',
          label: 'What was decided',
          kind: 'textarea',
          rows: 2,
          placeholder: 'Optional decision or trade-off made...',
        })}
        ${renderField({
          id: 'ql-learned',
          name: 'learned',
          label: 'What was learned',
          kind: 'textarea',
          rows: 2,
          placeholder: 'Optional lesson, metric, or follow-up...',
        })}
        ${renderField({
          id: 'ql-venture',
          name: 'venture_id',
          label: 'Venture',
          kind: 'select',
          options: ventureOptions,
        })}
      </div>

      <div class="lp-stack lp-gap-related">
        ${renderActionBar({
          level: 'page',
          primary: { id: 'btn-ql-save', label: 'Save', variant: 'primary', type: 'submit' },
        })}

        ${renderStatusLine({ id: 'ql-status', message: '', className: 'lp-is-hidden' })}
        ${renderPageNotice({ id: 'ql-error', tone: 'danger', message: '', role: 'none', hidden: true })}
      </div>
    </form>

    <script${options.nonce ? ` nonce="${escapeHtml(options.nonce)}"` : ''}>
      (function() {
        ${ADMIN_API_CLIENT_SCRIPT}
        const form = document.getElementById('quick-log-form');
        const happenedEl = document.getElementById('ql-happened');
        const decidedEl = document.getElementById('ql-decided');
        const learnedEl = document.getElementById('ql-learned');
        const ventureEl = document.getElementById('ql-venture');
        const saveBtn = document.getElementById('btn-ql-save');
        const statusEl = document.getElementById('ql-status');
        const errorEl = document.getElementById('ql-error');

        function showError(msg) {
          if (!errorEl) return;
          const body = errorEl.querySelector('.lp-notice-body') || errorEl;
          body.textContent = msg || '';
          if (msg) {
            errorEl.setAttribute('role', 'alert');
            errorEl.removeAttribute('hidden');
            errorEl.classList.remove('lp-is-hidden');
          } else {
            errorEl.removeAttribute('role');
            errorEl.setAttribute('hidden', '');
            errorEl.classList.add('lp-is-hidden');
          }
        }

        function showStatus(text) {
          if (!statusEl) return;
          statusEl.textContent = text || '';
          if (text) {
            statusEl.removeAttribute('hidden');
            statusEl.classList.remove('lp-is-hidden');
          } else {
            statusEl.setAttribute('hidden', '');
            statusEl.classList.add('lp-is-hidden');
          }
        }

        if (form) {
          form.addEventListener('submit', async function(e) {
            e.preventDefault();
            showError('');
            showStatus('');
            const happened = happenedEl ? happenedEl.value.trim() : '';
            const decided = decidedEl ? decidedEl.value.trim() : '';
            const learned = learnedEl ? learnedEl.value.trim() : '';
            const ventureId = ventureEl && ventureEl.value ? ventureEl.value : null;

            if (!happened) {
              if (happenedEl) {
                happenedEl.setAttribute('aria-invalid', 'true');
                happenedEl.focus();
              }
              showError('Enter what happened before saving.');
              return;
            }
            if (happenedEl) happenedEl.removeAttribute('aria-invalid');

            const parts = ['## What happened\\n\\n' + happened];
            if (decided) parts.push('## What was decided\\n\\n' + decided);
            if (learned) parts.push('## What was learned\\n\\n' + learned);
            const bodyMd = parts.join('\\n\\n');
            const firstLine = happened.split('\\n')[0].trim().slice(0, 72);
            const title = firstLine || 'Quick log';
            const slugBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'quick-log';
            const slug = slugBase + '-' + Date.now().toString(36).slice(-5);

            if (saveBtn) {
              saveBtn.setAttribute('aria-busy', 'true');
              saveBtn.setAttribute('disabled', '');
            }
            try {
              const res = await apiClient('/api/entries', {
                method: 'POST',
                body: JSON.stringify({
                  title: title,
                  slug: slug,
                  profile: 'work-log',
                  visibility: 'private',
                  venture_id: ventureId,
                  body_md: bodyMd,
                }),
              });
              if (res.ok) {
                if (happenedEl) happenedEl.value = '';
                if (decidedEl) decidedEl.value = '';
                if (learnedEl) learnedEl.value = '';
                showStatus('Saved private draft: ' + title);
              } else {
                const data = await res.json().catch(function() { return {}; });
                showError(data.error || ('Save failed (HTTP ' + res.status + ').'));
              }
            } catch {
              showError('Network error saving quick log.');
            } finally {
              if (saveBtn) {
                saveBtn.removeAttribute('aria-busy');
                saveBtn.removeAttribute('disabled');
              }
            }
          });
        }
      })();
    </script>
  `;

  const content = renderPageTemplate({
    title: 'Quick Log',
    description: 'Capture what happened, what was decided, and what was learned as a private draft.',
    archetype: 'form',
    bodyHtml: formHtml,
  });

  return renderAdminShell('Quick Log', '/admin/quick-log', content, {
    nonce: options.nonce,
    siteName: options.siteName,
  });
}
