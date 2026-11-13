import {
  DEFAULT_STRATA_THEME,
  computeStructureLevel,
  generateGapQuestions,
  getProfile,
  getStructureLevelDetails,
} from "@living-portfolio/core";
import { adaptDataSource, type WebDataClient } from "../../lib/data-source.js";
import { escapeHtml } from "../../lib/html.js";
import { renderLayout } from "../../layouts/public-shell.js";
import { ALPHA_WARNING_TEXT } from "../../renderer.js";

export const ADMIN_API_CLIENT_SCRIPT = `
        async function apiClient(url, options) {
          var opts = options || {};
          var csrf = sessionStorage.getItem('lp_csrf_token') || '';
          var headers = Object.assign({
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrf
          }, opts.headers || {});
          return window.fetch(url, Object.assign({}, opts, { headers: headers }));
        }
        window.apiClient = apiClient;
`;

export interface AdminSettingsState {
  automatedAnsweringEnabled?: boolean;
  calibrationFrozen?: boolean;
  simulatedDegradationMode?: 'normal' | 'extractive' | 'disabled';
  tier1_floor?: number;
  tier2_floor?: number;
  facet_known_threshold?: number;
  theme?: typeof DEFAULT_STRATA_THEME;
  calibration?: {
    suggestion_thresholds?: boolean;
    routing_calibration?: boolean;
    topology_audit?: boolean;
    scoped_constraint_mining?: boolean;
  };
}

export async function renderAdminWorkspacePage(
  repo: WebDataClient,
  settingsOrOptions?: AdminSettingsState | { settingsState?: AdminSettingsState; legacyRecoveryUsed?: boolean }
): Promise<string> {
  repo = adaptDataSource(repo);
  const settingsState = (settingsOrOptions as any)?.settingsState ?? ((settingsOrOptions as any)?.automatedAnsweringEnabled !== undefined ? settingsOrOptions as AdminSettingsState : undefined);
  const legacyRecoveryUsed = Boolean((settingsOrOptions as any)?.legacyRecoveryUsed);
  const answeringEnabledInitial = settingsState?.automatedAnsweringEnabled ?? true;
  const entries = await repo.listEntries({ visibility: ['public', 'unlisted', 'private'] });
  const escalations = await repo.getEscalations();
  const scopedConstraints = await repo.getScopedConstraints();

  const entriesWithData = await Promise.all(
    entries.map(async (e) => {
      const full = await repo.getEntry(e.id, ['public', 'unlisted', 'private']);
      const revs = await repo.getRevisions(e.id);
      const facets = await repo.getFacetsForEntry(e.id);
      const currentRev = full?.currentRevision || null;
      const claims = currentRev ? await repo.getClaimsForRevision(currentRev.id) : [];
      const annotations = currentRev ? await repo.listAnnotationsForRevision(currentRev.id) : [];
      const level = currentRev
        ? computeStructureLevel({
            revision: currentRev,
            profile: getProfile(e.profile),
            facets,
            annotations,
            claims,
          })
        : 'L0';
      const gaps = currentRev
        ? generateGapQuestions({ revision: currentRev, facets, claims })
        : [];
      return {
        ...e,
        currentRevision: currentRev,
        revisions: revs,
        facets,
        claims,
        structureLevel: level,
        gapQuestions: gaps,
      };
    })
  );

  const firstEntry = entriesWithData[0];
  const firstRev = firstEntry?.currentRevision ?? null;
  const firstFacets = firstEntry?.facets ?? [];
  const firstLevel = firstEntry?.structureLevel ?? 'L0';
  const levelDetails = getStructureLevelDetails(firstLevel);
  const gapQuestions = firstEntry?.gapQuestions ?? [];

  const entriesListHtml = entriesWithData
    .map(
      (e) => `<li class="admin-entry-item" data-entry-id="${e.id}" style="padding:8px 0;border-bottom:1px solid var(--rule);display:flex;justify-content:space-between;align-items:center;gap:8px">
        <button type="button" class="admin-entry-select-btn" data-entry-id="${e.id}" style="background:none;border:none;padding:0;font-weight:600;text-align:left;cursor:pointer;color:var(--text);flex:1">
          ${escapeHtml(e.title)}
        </button>
        <span class="chip" data-status="${escapeHtml(e.visibility)}">${escapeHtml(e.visibility)}</span>
        ${e.visibility !== 'private' ? `<a href="/work/${escapeHtml(e.slug)}" target="_blank" style="font-size:12px;color:var(--text-muted);text-decoration:none" title="View live page">↗</a>` : ''}
      </li>`
    )
    .join('\n');

  const firstEntryRevisionsHtml = (firstEntry?.revisions || [])
    .map(
      (r, idx) => `<div style="padding:6px 0;border-bottom:1px solid var(--rule);display:flex;justify-content:space-between;align-items:center">
        <div>
          <strong>Revision ${idx + 1}</strong>
          <span style="color:var(--text-muted);font-size:12px">(${new Date(r.written_at).toLocaleDateString()})</span>
        </div>
        <div>
          <code style="font-size:11px">${escapeHtml((r.body_hash || '').slice(0, 10))}...</code>
          ${r.id === firstRev?.id ? '<span class="chip" style="margin-left:4px;font-size:11px">current</span>' : ''}
        </div>
      </div>`
    )
    .join('\n') || '<p style="color:var(--text-muted);margin:0">No revisions found.</p>';

  const facetsInspectorHtml = firstFacets
    .map(
      (f) => `<div style="margin-bottom:6px;display:flex;justify-content:space-between;align-items:center">
        <span class="chip ${f.status === 'suggested' ? 'chip-suggested' : ''}">
          ${escapeHtml(f.key)}: ${escapeHtml(String(f.value))} (${f.status === 'suggested' ? 'suggested' : 'confirmed'})
        </span>
      </div>`
    )
    .join('\n');

  const gapHtml =
    gapQuestions.length > 0
      ? gapQuestions.map((g) => `<li style="margin-bottom:4px">${escapeHtml(g.question)} <em>(unlocks higher tier)</em></li>`).join('\n')
      : '<li>All core context and outcome fields are present for this entry.</li>';

  const escalationsHtml =
    escalations.length > 0
      ? escalations
          .map((esc) => {
            const isPending = esc.status === 'pending';
            const dueLabel = esc.due_at ? `Due by ${new Date(esc.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '';
            const contactLabel = esc.visitor_contact ? `Notify: ${escapeHtml(esc.visitor_contact)}` : 'Receipt link delivery';
            return `
            <div class="escalation-card" id="esc-card-${esc.id}" style="border:1px solid var(--rule);padding:16px;margin-bottom:16px;background:var(--surface-page);border-radius:var(--radius-control)">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px">
                <div>
                  <strong style="font-size:15px">Visitor Question (${escapeHtml(esc.query_class)}):</strong>
                  <span class="chip" style="margin-left:6px">${escapeHtml(esc.status)}</span>
                  ${dueLabel ? `<span class="chip" style="margin-left:4px;font-size:11px;background:var(--surface-raised)">${escapeHtml(dueLabel)}</span>` : ''}
                </div>
                <div style="font-size:12px;color:var(--text-muted)">
                  ${escapeHtml(contactLabel)}
                </div>
              </div>
              <p style="margin:0 0 12px 0;font-size:14px;font-weight:500">${escapeHtml(esc.question)}</p>

              ${esc.facets && Object.keys(esc.facets).length > 0 ? `
              <div style="margin-bottom:10px;font-size:12px">
                <strong>Visitor Context Facets:</strong>
                <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">
                  ${Object.entries(esc.facets).map(([k, v]) => `<span class="chip" style="font-size:11px">${escapeHtml(k)}: ${escapeHtml(String(v))}</span>`).join('')}
                </div>
              </div>` : ''}

              <div style="margin-bottom:12px">
                <label for="draft-${esc.id}" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">
                  ${isPending ? 'Proposed draft reply:' : 'Final reply:'}
                </label>
                <textarea id="draft-${esc.id}" class="ask-input escalation-draft-textarea" style="width:100%;min-height:90px;font-size:13px;line-height:1.4" ${!isPending ? 'readonly' : ''}>${escapeHtml(esc.final || esc.draft || '')}</textarea>
              </div>

              ${isPending ? `
              <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                <button type="button" class="btn btn-approve-escalation" data-id="${esc.id}">Approve &amp; Deliver</button>
                <button type="button" class="btn btn-secondary btn-reject-escalation" data-id="${esc.id}">Reject</button>
                <span id="esc-status-${esc.id}" style="font-size:12px;color:var(--text-muted)"></span>
              </div>` : `
              <div style="font-size:12px;color:var(--text-muted)">
                ${esc.status === 'approved' ? `✓ Approved and delivered to receipt.` : `✕ Rejected: ${escapeHtml(esc.rejection_reason || 'Declined')}`}
              </div>`}
            </div>`;
          })
          .join('\n')
      : '<p style="color:var(--text-muted)">No pending escalations.</p>';

  const scopedConstraintsHtml =
    scopedConstraints.length > 0
      ? scopedConstraints
          .map((sc) => {
            const isConfirmed = sc.status === 'confirmed';
            const isDiscarded = sc.status === 'discarded';
            return `
            <div class="scoped-constraint-card" id="constraint-card-${sc.id}" style="font-size:13px;padding:10px 12px;border:1px solid var(--rule);border-radius:var(--radius-control);margin-bottom:8px;background:var(--surface-page)">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:6px">
                <div>
                  <strong>Scope:</strong> <code style="font-size:11px">${escapeHtml(JSON.stringify(sc.scope || {}))}</code>
                </div>
                <span class="chip chip-constraint-status" id="chip-status-${sc.id}">${escapeHtml(sc.status)}</span>
              </div>
              <p style="margin:0 0 8px 0;font-size:13px">Quote: <em>"${escapeHtml(sc.source_quote || '')}"</em></p>
              <div style="display:flex;gap:6px;align-items:center">
                ${!isConfirmed ? `<button type="button" class="btn btn-secondary btn-confirm-constraint" data-id="${sc.id}" style="padding:2px 8px;font-size:12px">Confirm</button>` : ''}
                ${!isDiscarded ? `<button type="button" class="btn btn-secondary btn-discard-constraint" data-id="${sc.id}" style="padding:2px 8px;font-size:12px">Discard</button>` : ''}
                <span id="constraint-msg-${sc.id}" style="font-size:11px;color:var(--text-muted)"></span>
              </div>
            </div>`;
          })
          .join('\n')
      : '<p style="color:var(--text-muted);font-size:13px">No active scoped constraints recorded.</p>';

  const content = `
    <div class="later-thinking-banner" data-banner="alpha-warning" role="note" style="margin-bottom:16px">
      <strong>${escapeHtml(ALPHA_WARNING_TEXT)}</strong>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:24px">
      <div>
        <h1 style="font-family:var(--font-reading);font-size:28px;margin:0">Admin Workspace</h1>
        <p style="color:var(--text-muted);margin:4px 0 0;font-size:14px">
          Entry-first authoring, machine-suggested structure inspector, routing kill-switch, self-calibration, and encrypted backups.
        </p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <span id="deploy-status-chip" class="chip" data-status="idle" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;padding:4px 8px" aria-live="polite">Deploy: Ready</span>
        <button type="button" class="btn btn-secondary" id="btn-publish-now" style="font-size:12px">Publish Now</button>
        <a href="/admin/import" class="btn btn-secondary" id="btn-import-triage" style="text-decoration:none;display:inline-flex;align-items:center">Import &amp; Triage</a>
        <a href="/admin/settings" class="btn btn-secondary" id="btn-admin-settings" style="text-decoration:none;display:inline-flex;align-items:center">Settings &amp; Calibration</a>
        <button type="button" class="btn btn-secondary" id="btn-killswitch" aria-pressed="${answeringEnabledInitial ? 'true' : 'false'}">${answeringEnabledInitial ? 'Pause Automated Answering' : 'Resume Automated Answering'}</button>
        <button type="button" class="btn btn-secondary" id="btn-backup-drill">Run Backup &amp; Restore Drill</button>
        <a href="/api/settings/export" target="_blank" class="btn btn-secondary" style="text-decoration:none;display:inline-flex;align-items:center">Export Markdown + Sidecar</a>
      </div>
    </div>

    <div id="admin-legacy-recovery-notice" class="admin-notice-banner" role="alert" style="display:${legacyRecoveryUsed ? 'block' : 'none'};padding:12px 16px;border:1px solid var(--accent);border-radius:var(--radius-control);background:var(--surface-raised);margin-bottom:16px;font-size:14px">
      You signed in with an older recovery code. Replace your recovery codes in Settings &gt; Account as soon as you can.
    </div>

    <div id="admin-offline-banner" class="later-thinking-banner" role="status" style="display:none;margin-bottom:16px;background:#fef3c7;border:1px solid #f59e0b;color:#92400e">
      You are currently offline. Changes are saved locally to your browser.
    </div>
    <div id="draft-restore-notice" class="as-of-banner" style="display:none;margin-bottom:16px;justify-content:space-between;align-items:center"></div>
    <div id="admin-undo-banner" role="region" aria-label="Undo action" style="display:none;margin-bottom:16px"></div>
    <div id="admin-status-banner" role="status" aria-live="polite" style="margin-bottom:16px"></div>

    <div id="admin-walkthrough-card" style="padding:12px 16px;border:1px solid var(--accent);border-radius:var(--radius-control);background:var(--surface-raised);margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
      <div>
        <strong>First-Run Authoring Walkthrough:</strong>
        <span style="font-size:13px;color:var(--text-muted);margin-left:6px">1. Paste write-up or choose Guided mode. 2. Use Inspector to accept suggested roles &amp; confirm facets. 3. Preview redactions and publish.</span>
      </div>
      <button type="button" class="btn btn-secondary" id="btn-dismiss-walkthrough" style="padding:2px 8px;font-size:12px">Dismiss</button>
    </div>

    <!-- Header Status Area (20261020-UI-06) -->
    <div class="admin-header-status" role="region" aria-label="System status">
      <div style="display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap">
        <strong>Status:</strong>
        <span class="chip" id="admin-status-build">Static rebuild: Idle</span>
        <span class="chip" id="admin-status-answering">${answeringEnabledInitial ? 'Answering: Active' : 'Answering: Paused'}</span>
      </div>
      <div style="display:flex;align-items:center;gap:var(--space-2)">
        <span class="chip" style="border-color:var(--role-outcome)">● Operational</span>
      </div>
    </div>

    <!-- Three-Pane Entry Workspace -->
    <div class="admin-shell">
      <!-- Pane 1: Entries & Filters -->
      <aside class="admin-pane" aria-label="Entries list and filters">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h2 style="font-size:16px;margin:0">Entries (${entries.length})</h2>
          <button type="button" class="btn btn-secondary" id="btn-new-entry" style="padding:2px 8px;font-size:12px">+ New Entry</button>
        </div>
        <ul id="admin-entries-list" style="list-style:none;padding:0;margin:0;font-size:14px">
          ${entriesListHtml}
        </ul>
      </aside>

      <!-- Pane 2: Editor (Rich Text / Markdown, Hindsight Question, Redaction Preview, Publish as is) -->
      <section class="admin-pane" aria-label="Entry editor">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <div style="display:flex;align-items:center;gap:8px">
            <h2 id="editor-mode-heading" style="font-size:18px;margin:0">New entry</h2>
            <span id="chip-current-state" class="chip" data-status="private" style="font-size:12px;padding:2px 8px;background:#f1f5f9;color:#475569">State: PRIVATE (Draft)</span>
          </div>
          <div style="display:flex;gap:6px">
            <button type="button" class="btn btn-secondary active" id="mode-btn-paste" style="font-size:12px;padding:2px 8px">Paste / Freeform</button>
            <button type="button" class="btn btn-secondary" id="mode-btn-guided" style="font-size:12px;padding:2px 8px">Guided Mode</button>
            <button type="button" class="btn btn-secondary" id="mode-btn-quick" style="font-size:12px;padding:2px 8px">Quick Log</button>
          </div>
        </div>

        <!-- Guided Mode Panel -->
        <div id="editor-guided-panel" style="display:none;margin-bottom:12px;border:1px solid var(--rule);border-radius:var(--radius-control);padding:12px;background:var(--surface-page)">
          <div style="font-size:13px;font-weight:600;margin-bottom:8px">Guided Mode — Per-Role Prompts</div>
          <div style="margin-bottom:8px">
            <label for="guided-problem" style="font-size:12px;font-weight:600;display:block;margin-bottom:2px">Problem (What challenge did you tackle?)</label>
            <input type="text" id="guided-problem" class="ask-input" style="width:100%;padding:4px 6px" placeholder="e.g. Distributed lock contention under peak traffic" />
          </div>
          <div style="margin-bottom:8px">
            <label for="guided-approach" style="font-size:12px;font-weight:600;display:block;margin-bottom:2px">Approach (What technical solution was implemented?)</label>
            <input type="text" id="guided-approach" class="ask-input" style="width:100%;padding:4px 6px" placeholder="e.g. Migrated from Redis Redlock to Postgres 15 advisory locks" />
          </div>
          <div style="margin-bottom:8px">
            <label for="guided-outcome" style="font-size:12px;font-weight:600;display:block;margin-bottom:2px">Outcome (Measurable result or milestone)</label>
            <input type="text" id="guided-outcome" class="ask-input" style="width:100%;padding:4px 6px" placeholder="e.g. Zero lock contention, P99 latency dropped by 42ms" />
          </div>
          <div style="margin-bottom:8px">
            <label for="guided-lesson" style="font-size:12px;font-weight:600;display:block;margin-bottom:2px">Lesson Learned (What worked, or what went wrong?)</label>
            <input type="text" id="guided-lesson" class="ask-input" style="width:100%;padding:4px 6px;margin-bottom:4px" placeholder="e.g. Connection pooling was critical to avoid exhausting connections" />
            <label style="font-size:12px;display:flex;align-items:center;gap:6px;cursor:pointer">
              <input type="checkbox" id="guided-nothing-wrong" /> Nothing went wrong (smooth execution)
            </label>
          </div>
          <button type="button" class="btn btn-secondary" id="btn-guided-compile" style="font-size:12px;padding:4px 8px">Compile into Body →</button>
        </div>

        <!-- Quick Log Panel -->
        <div id="editor-quick-panel" style="display:none;margin-bottom:12px;border:1px solid var(--rule);border-radius:var(--radius-control);padding:12px;background:var(--surface-page)">
          <div style="font-size:13px;font-weight:600;margin-bottom:4px">Quick Log — Fast Thought Capture (under 30s)</div>
          <textarea id="quick-log-text" rows="3" class="ask-input" style="width:100%;font-size:13px;margin-bottom:8px" placeholder="Capture notes, a milestone, or snippet..."></textarea>
          <button type="button" class="btn" id="btn-submit-quick-log" style="font-size:12px;padding:4px 10px">Save Quick Log Entry</button>
        </div>

        <form id="admin-entry-form">
          <input type="hidden" id="entry-id" value="" />
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div>
              <label for="entry-title" style="font-size:13px;font-weight:600;display:block">Title</label>
              <input id="entry-title" type="text" class="ask-input" style="width:100%;padding:6px" placeholder="e.g., Zero-Downtime Queue Cutover" required />
            </div>
            <div>
              <label for="entry-slug" style="font-size:13px;font-weight:600;display:block">Slug</label>
              <input id="entry-slug" type="text" class="ask-input" style="width:100%;padding:6px" placeholder="zero-downtime-queue-cutover" required />
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:12px">
            <div>
              <label for="entry-profile" style="font-size:13px;font-weight:600;display:block">Role profile</label>
              <select id="entry-profile" class="ask-input" style="width:100%;padding:6px">
                <option value="case-study">Case study (default)</option>
                <option value="decision-record">Decision record</option>
                <option value="design-project">Design project</option>
                <option value="research-note">Research note</option>
                <option value="how-to">How-to</option>
                <option value="freeform">Freeform (L0/L1 only)</option>
              </select>
            </div>
            <div>
              <label for="entry-visibility" style="font-size:13px;font-weight:600;display:block">Visibility</label>
              <select id="entry-visibility" class="ask-input" style="width:100%;padding:6px">
                <option value="private">Private (Draft)</option>
                <option value="unlisted">Unlisted</option>
                <option value="public">Public</option>
              </select>
            </div>
            <div>
              <label for="entry-date" style="font-size:13px;font-weight:600;display:block">When it happened</label>
              <input id="entry-date" type="date" class="ask-input" style="width:100%;padding:6px" value="" />
              <div id="entry-date-error" style="color:var(--red-700,#b42318);font-size:12px;display:none;margin-top:2px" role="alert"></div>
            </div>
            <div>
              <label for="entry-temporal-level" style="font-size:13px;font-weight:600;display:block">Temporal confidence</label>
              <select id="entry-temporal-level" class="ask-input" style="width:100%;padding:6px">
                <option value="exact">Exact (default)</option>
                <option value="range">Range</option>
                <option value="estimated">Estimated</option>
              </select>
              <div id="range-end-container" style="display:none;margin-top:6px">
                <label for="entry-date-range-end" style="font-size:12px;font-weight:600;display:block">Range end</label>
                <input id="entry-date-range-end" type="date" class="ask-input" style="width:100%;padding:4px 6px;font-size:12px" />
              </div>
            </div>
          </div>
          <div style="margin-bottom:12px">
            <label style="font-size:13px;display:flex;align-items:center;gap:6px;cursor:pointer">
              <input id="entry-hindsight" type="checkbox" />
              Are you writing about something that happened earlier?
            </label>
          </div>

          <div class="editor-workspace" style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <label for="entry-body" style="font-size:13px;font-weight:600;display:block">
                Body (Markdown + GFM — min 60vh editor workspace; only body and date required)
              </label>
              <div style="display:flex;gap:4px">
                <button type="button" class="btn btn-secondary" id="btn-toggle-editor-mode" style="padding:2px 8px;font-size:12px">Preview</button>
              </div>
            </div>
            <div class="editor-toolbar" role="toolbar" aria-label="Markdown formatting toolbar">
              <button type="button" data-action="h2" title="Insert H2 Heading">H2</button>
              <button type="button" data-action="h3" title="Insert H3 Heading">H3</button>
              <button type="button" data-action="bold" title="Insert Bold Text"><strong>B</strong></button>
              <button type="button" data-action="italic" title="Insert Italic Text"><em>I</em></button>
              <button type="button" data-action="list" title="Insert Bullet List">• List</button>
              <button type="button" data-action="code" title="Insert Code Block">&lt;/&gt;</button>
              <button type="button" data-action="quote" title="Insert Blockquote">“ Quote</button>
              <button type="button" data-action="link" title="Insert Link">🔗 Link</button>
            </div>
            <textarea id="entry-body" rows="12" class="ask-input editor-textarea" placeholder="Paste any existing write-up or write in Markdown / GFM..."></textarea>
            <div id="entry-body-preview" class="editor-preview reading-column" style="display:none;min-height:var(--editor-min-height, 60vh);padding:16px;background:var(--surface-raised);border:1px solid var(--rule);border-radius:0 0 var(--radius-control) var(--radius-control);overflow-y:auto"></div>
            <div class="editor-statusbar">
              <span id="editor-word-count">0 words (soft cap: 3,000)</span>
              <span id="editor-word-warning" style="display:none;color:var(--status-warn);font-weight:600">Entry exceeds 3,000 words. Consider breaking into a multi-part series for readability.</span>
            </div>
            <input type="hidden" id="entry-preview-token" name="redactionPreviewToken" value="" />
          </div>

          <div id="redaction-preview-box" style="margin-bottom:12px"></div>

          <div style="margin-bottom:12px;padding:10px 12px;border:1px solid var(--rule);border-radius:4px;background:var(--surface-sunken)">
            <label style="display:flex;align-items:flex-start;gap:8px;font-size:13px;cursor:pointer">
              <input type="checkbox" id="entry-nda-confirmed" name="nda_confirmed" value="true" style="margin-top:2px" />
              <span><strong>Confidentiality &amp; NDA Confirmation:</strong> I confirm this content is not subject to an active Non-Disclosure Agreement (NDA) or client confidentiality restrictions, or that all necessary client approvals and redactions have been completed.</span>
            </label>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center" id="editor-action-buttons">
              <button type="button" class="btn btn-secondary" id="btn-save-draft">Save draft</button>
              <button type="button" class="btn btn-primary" id="btn-open-publish-dialog">Publish…</button>
              <button type="button" class="btn btn-secondary" id="btn-unlist" style="display:none">Unlist</button>
              <button type="button" class="btn btn-secondary" id="btn-redaction-check">Check for private details</button>
              <button type="button" class="btn btn-secondary" id="btn-unpublish" style="display:none">Unpublish</button>
              <button type="button" class="btn btn-secondary" id="btn-delete-entry" style="display:none;color:var(--red-700,#b42318)">Delete</button>
              <span id="editor-status-line" role="status" aria-live="polite" tabindex="-1" style="font-size:13px;display:none;align-items:center;gap:6px;padding:4px 8px;border-radius:var(--radius-control);outline:none"></span>
            </div>
            <span style="font-size:13px;color:var(--text-muted)">Structure is optional. You can publish now and add more later.</span>
          </div>
        </form>

        <div id="editor-toast" role="status" aria-live="polite" style="position:fixed;bottom:24px;right:24px;z-index:9999;max-width:420px;display:none;padding:12px 16px;background:var(--surface-raised);border:1px solid var(--accent);border-radius:var(--radius-card, 8px);box-shadow:0 4px 16px rgba(0,0,0,0.18);font-size:14px"></div>

        <!-- Publish Pre-Flight Dialog (WP-14.3) -->
        <dialog id="publish-dialog" class="publish-dialog" role="dialog" aria-modal="true" aria-labelledby="publish-dialog-title" style="display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:520px;max-width:92vw;max-height:90vh;overflow-y:auto;background:var(--surface-overlay);border:1px solid var(--rule);border-radius:var(--radius-card, 8px);box-shadow:0 12px 32px rgba(0,0,0,0.25);z-index:10000;padding:24px;box-sizing:border-box">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--rule);padding-bottom:12px;margin-bottom:16px">
            <h2 id="publish-dialog-title" style="margin:0;font-size:18px">Publish Pre-Flight</h2>
            <button type="button" class="btn btn-secondary" id="btn-close-publish-dialog" style="padding:4px 8px">✕ Close</button>
          </div>

          <!-- Pre-flight step 1: Private details scan -->
          <div style="margin-bottom:16px;padding:12px;border:1px solid var(--rule);border-radius:6px;background:var(--surface-raised)">
            <div id="publish-step-heading-scan" data-dialog-step-heading="scan" style="font-size:13px;font-weight:600;margin-bottom:4px">1. Private-Detail Check</div>
            <div id="publish-scan-status" style="font-size:13px">Checking for private details...</div>
            <div id="publish-matches-detail" style="display:none;margin-top:8px">
              <button type="button" class="btn btn-secondary" id="btn-publish-open-drawer" style="font-size:12px;padding:2px 8px">View Detailed Findings →</button>
            </div>
          </div>

          <!-- Pre-flight step 2: NDA confirmation (conditional) -->
          <div id="publish-nda-section" style="display:none;margin-bottom:16px;padding:12px;border:1px solid var(--rule);border-radius:6px;background:var(--surface-raised)">
            <div id="publish-step-heading-nda" data-dialog-step-heading="nda" style="font-size:13px;font-weight:600;margin-bottom:4px">2. Confidentiality &amp; NDA Confirmation</div>
            <label style="font-size:13px;display:flex;align-items:flex-start;gap:8px;cursor:pointer">
              <input type="checkbox" id="publish-dialog-nda" style="margin-top:2px" />
              <span>I confirm that publishing this content does not violate any non-disclosure agreement (NDA) or confidentiality obligation.</span>
            </label>
          </div>

          <!-- Pre-flight step 3: Who can see it -->
          <div style="margin-bottom:16px;padding:12px;border:1px solid var(--rule);border-radius:6px;background:var(--surface-raised)">
            <div id="publish-step-heading-visibility" data-dialog-step-heading="visibility" style="font-size:13px;font-weight:600;margin-bottom:6px">2. Who Can See It</div>
            <div style="display:flex;gap:16px;font-size:13px">
              <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
                <input type="radio" name="publish-visibility-choice" value="public" checked /> Public (searchable, in index)
              </label>
              <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
                <input type="radio" name="publish-visibility-choice" value="unlisted" /> Unlisted (direct link only)
              </label>
            </div>
          </div>

          <!-- Pre-flight step 4: What happens next -->
          <div id="publish-what-happens-next" style="margin-bottom:16px;padding:12px;border:1px solid var(--rule);border-radius:6px;background:var(--surface-raised)">
            <div id="publish-step-heading-next" data-dialog-step-heading="next" style="font-size:13px;font-weight:600;margin-bottom:6px">3. What Happens Next</div>
            <ul style="font-size:12px;color:var(--text-muted);margin:0;padding-left:18px;line-height:1.6">
              <li>Static rebuild queued for public site</li>
              <li>Enrichment pipeline queued for structured facets</li>
              <li>RSS feed and sitemap updated</li>
              <li>Exact URL: <code id="publish-target-url" style="color:var(--text)">/work/...</code></li>
            </ul>
          </div>

          <div id="publish-dialog-alert" style="display:none;margin-bottom:12px;color:var(--red-700,#b42318);font-size:13px" role="alert"></div>

          <!-- Pre-flight step 5: Single primary action -->
          <div style="display:flex;justify-content:flex-end;gap:8px;border-top:1px solid var(--rule);padding-top:12px">
            <button type="button" class="btn btn-secondary" id="btn-cancel-publish">Cancel</button>
            <button type="button" class="btn btn-primary" id="btn-confirm-publish">Publish</button>
          </div>
        </dialog>
        <div id="publish-dialog-backdrop" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.4);z-index:9999"></div>

        <!-- UI Redaction Preview Drawer -->
        <aside id="redaction-preview-drawer" class="redaction-drawer" style="display:none;position:fixed;top:0;right:0;width:460px;max-width:92vw;height:100vh;background:var(--surface-overlay);box-shadow:-4px 0 24px rgba(0,0,0,0.18);border-left:1px solid var(--rule);z-index:9999;padding:24px;overflow-y:auto;box-sizing:border-box" role="dialog" aria-labelledby="redaction-drawer-title" aria-modal="true">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--rule);padding-bottom:12px;margin-bottom:16px">
            <h2 id="redaction-drawer-title" style="margin:0;font-size:18px">Redaction Review Drawer</h2>
            <button type="button" class="btn btn-secondary" id="btn-close-redaction-drawer" style="padding:4px 8px">✕ Close</button>
          </div>
          <p style="font-size:13px;color:var(--text-muted);margin:0 0 16px 0">
            Multi-pass entity scanner detected sensitive patterns. Review matches by pass or mask them automatically before public publishing.
          </p>

          <div style="margin-bottom:16px">
            <button type="button" class="btn btn-primary" id="btn-drawer-redact-all" style="width:100%;padding:10px">Redact All Findings</button>
          </div>

          <!-- Pass 1: Credentials & Secret Keys -->
          <div style="margin-bottom:16px;border:1px solid var(--rule);border-radius:6px;padding:12px;background:var(--surface-sunken)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <strong style="font-size:13px">Pass 1: Credentials &amp; Secrets</strong>
              <span id="drawer-count-pass1" class="chip" style="font-size:11px">0 found</span>
            </div>
            <div id="drawer-items-pass1" style="font-size:13px;color:var(--text-muted)">None detected.</div>
          </div>

          <!-- Pass 2: NDA & Confidentiality Markers -->
          <div style="margin-bottom:16px;border:1px solid var(--rule);border-radius:6px;padding:12px;background:var(--surface-sunken)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <strong style="font-size:13px">Pass 2: NDA &amp; Restrictions</strong>
              <span id="drawer-count-pass2" class="chip" style="font-size:11px">0 found</span>
            </div>
            <div id="drawer-items-pass2" style="font-size:13px;color:var(--text-muted)">None detected.</div>
          </div>

          <!-- Pass 3: Entities & Exclusions -->
          <div style="margin-bottom:16px;border:1px solid var(--rule);border-radius:6px;padding:12px;background:var(--surface-sunken)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <strong style="font-size:13px">Pass 3: Entities, Project Names &amp; Exclusions</strong>
              <span id="drawer-count-pass3" class="chip" style="font-size:11px">0 found</span>
            </div>
            <div id="drawer-items-pass3" style="font-size:13px;color:var(--text-muted)">None detected.</div>
          </div>

          <!-- Highlight Preview Pane -->
          <div style="margin-top:16px">
            <strong style="font-size:13px;display:block;margin-bottom:6px">Matched Entity Highlighting:</strong>
            <div id="drawer-highlight-preview" style="font-family:var(--font-code);font-size:12px;padding:12px;background:var(--surface-sunken);border:1px solid var(--rule);border-radius:4px;white-space:pre-wrap;max-height:220px;overflow-y:auto"></div>
          </div>
        </aside>
      </section>

      <!-- Pane 3: Structure Inspector & Answerability Preview -->
      <aside class="admin-pane" aria-label="Structure inspector and answerability preview">
        <h2 style="font-size:16px;margin:0 0 8px 0">Inspector: <span id="inspector-heading">${escapeHtml(firstEntry?.title || 'Sample')}</span></h2>

        <!-- Inspector Tabs -->
        <div class="inspector-tabs" role="tablist" aria-label="Inspector Panels">
          <button type="button" role="tab" id="tab-btn-structure" aria-controls="panel-structure" aria-selected="true" class="inspector-tab-btn active">Structure</button>
          <button type="button" role="tab" id="tab-btn-context" aria-controls="panel-context" aria-selected="false" class="inspector-tab-btn">Context</button>
          <button type="button" role="tab" id="tab-btn-evidence" aria-controls="panel-evidence" aria-selected="false" class="inspector-tab-btn">Evidence</button>
          <button type="button" role="tab" id="tab-btn-answerability" aria-controls="panel-answerability" aria-selected="false" class="inspector-tab-btn">Answerability</button>
          <button type="button" role="tab" id="tab-btn-history" aria-controls="panel-history" aria-selected="false" class="inspector-tab-btn">History</button>
        </div>

        <!-- Tab 1: Structure Panel -->
        <div class="inspector-tab-panel active" id="panel-structure" role="tabpanel" aria-labelledby="tab-btn-structure">
          <div style="font-size:13px;color:var(--text-muted)">Four-step structure map (never a percentage score):</div>
          <div class="level-steps" id="inspector-level-steps" role="list" aria-label="Structure level indicator">
            <div class="level-step" role="listitem" data-level="L0" data-active="${firstLevel === 'L0' || firstLevel === 'L1' || firstLevel === 'L2' || firstLevel === 'L3'}">Text</div>
            <div class="level-step" role="listitem" data-level="L1" data-active="${firstLevel === 'L1' || firstLevel === 'L2' || firstLevel === 'L3'}">Context</div>
            <div class="level-step" role="listitem" data-level="L2" data-active="${firstLevel === 'L2' || firstLevel === 'L3'}">Roles</div>
            <div class="level-step" role="listitem" data-level="L3" data-active="${firstLevel === 'L3'}">Claims</div>
          </div>
          <p style="font-size:13px;margin:4px 0 12px 0" id="inspector-unlocks"><strong>Unlocks:</strong> ${escapeHtml(levelDetails.unlocked.join(', '))}</p>

          <h3 style="font-size:14px;margin:12px 0 6px 0">Role Annotations &amp; Suggestions</h3>
          <div id="inspector-annotations-list" style="font-size:13px">
            <p style="color:var(--text-muted)">Select an entry to review machine-suggested roles.</p>
          </div>
          <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--rule)">
            <button type="button" class="btn btn-secondary" id="btn-trigger-enrichment" style="font-size:11px;padding:3px 8px">Run Background Enrichment</button>
            <div id="enrichment-status-container" style="display:none;margin-top:6px">
              <span class="chip" id="enrichment-status-chip" style="font-size:11px"></span>
            </div>
          </div>
        </div>

        <!-- Tab 2: Context Panel -->
        <div class="inspector-tab-panel" id="panel-context" role="tabpanel" aria-labelledby="tab-btn-context">
          <h3 style="font-size:14px;margin:0 0 6px 0">Context Facets (dashed = machine suggested)</h3>
          <div id="inspector-facets">
            ${facetsInspectorHtml}
          </div>

          <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--rule)">
            <h4 style="font-size:13px;margin:0 0 6px 0">Add Facet</h4>
            <div style="display:flex;gap:6px;flex-direction:column">
              <input type="text" id="new-facet-key" class="ask-input" style="padding:4px;font-size:12px" placeholder="Facet name (e.g. database, stack)" />
              <input type="text" id="new-facet-value" class="ask-input" style="padding:4px;font-size:12px" placeholder="Value (e.g. Postgres 15)" />
              <input type="text" id="new-facet-quote" class="ask-input" style="padding:4px;font-size:12px" placeholder="Source quote (optional)" />
              <button type="button" class="btn btn-secondary" id="btn-add-facet" style="font-size:12px;padding:3px 8px">Confirm &amp; Add Facet</button>
            </div>
          </div>
        </div>

        <!-- Tab 3: Evidence Panel -->
        <div class="inspector-tab-panel" id="panel-evidence" role="tabpanel" aria-labelledby="tab-btn-evidence">
          <h3 style="font-size:14px;margin:0 0 4px 0">Attached Evidence</h3>
          <p style="font-size:12px;color:var(--text-muted);margin:0 0 8px 0">
            Evidence verification confirms artifact authenticity but does not prove the narrative.
          </p>
          <div id="inspector-evidence-list" style="font-size:13px">
            <p style="color:var(--text-muted)">No evidence attached yet.</p>
          </div>

          <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--rule)">
            <h4 style="font-size:13px;margin:0 0 6px 0">Attach Evidence Item</h4>
            <div style="display:flex;gap:6px;flex-direction:column">
              <select id="new-evidence-kind" class="ask-input" style="padding:4px;font-size:12px">
                <option value="repo_commit">Git Commit</option>
                <option value="pull_request">Pull Request</option>
                <option value="document">Design Doc / Specification</option>
                <option value="url">External Link / URL</option>
              </select>
              <input type="text" id="new-evidence-url" class="ask-input" style="padding:4px;font-size:12px" placeholder="URL or commit SHA" />
              <input type="text" id="new-evidence-label" class="ask-input" style="padding:4px;font-size:12px" placeholder="Label / Description" />
              <button type="button" class="btn btn-secondary" id="btn-attach-evidence" style="font-size:12px;padding:3px 8px">Attach Evidence</button>
            </div>
          </div>
        </div>

        <!-- Tab 4: Answerability Panel -->
        <div class="inspector-tab-panel" id="panel-answerability" role="tabpanel" aria-labelledby="tab-btn-answerability">
          <h3 style="font-size:14px;margin:0 0 6px 0">Answerability &amp; Gap Questions</h3>
          <ul id="inspector-gap-questions" style="font-size:13px;padding-left:18px;margin:0">
            ${gapHtml}
          </ul>
        </div>

        <!-- Tab 5: History Panel -->
        <div class="inspector-tab-panel" id="panel-history" role="tabpanel" aria-labelledby="tab-btn-history">
          <h3 style="font-size:14px;margin:0 0 6px 0">Revision History</h3>
          <div id="inspector-revisions-list" style="font-size:13px">
            ${firstEntryRevisionsHtml}
          </div>
        </div>
      </aside>
    </div>

    <!-- Operational Panels: Inbox Escalations, Audit, Routing & Calibration -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:24px;margin-top:24px">
      <section class="admin-pane" aria-labelledby="inbox-heading">
        <h2 id="inbox-heading" style="font-size:18px;margin:0 0 12px 0">Inbox (${escalations.length})</h2>
        ${escalationsHtml}
      </section>

      <section class="admin-pane" aria-labelledby="audit-heading">
        <h2 id="audit-heading" style="font-size:18px;margin:0 0 12px 0">Conflicts to review</h2>

        <!-- Honest Topology Conflicts Card (20261020-UX-09) -->
        <div class="topology-conflicts-card" id="topology-conflicts-card" style="margin-bottom:16px;padding:12px;border:1px solid var(--rule);border-radius:var(--radius-control);background:var(--surface-page)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <h3 style="font-size:13px;margin:0">Topology Conflict Detection</h3>
            <span class="chip" style="font-size:11px" id="chip-topology-status">501 Not Implemented</span>
          </div>
          <p id="topology-status-msg" style="font-size:12px;color:var(--text-muted);margin:0">
            Automated claim topology conflict detector is not yet implemented (SIMULATED finding M6). No active conflicts detected.
          </p>
        </div>

        <h3 style="font-size:14px;margin:12px 0 6px 0">Suggested rules from your replies (${scopedConstraints.length})</h3>
        ${scopedConstraintsHtml}
      </section>
    </div>

    <script>
      (function() {
        const banner = document.getElementById('admin-status-banner');
        const undoBanner = document.getElementById('admin-undo-banner');
        const form = document.getElementById('admin-entry-form');
        const redactBtn = document.getElementById('btn-redaction-check');
        const redactBox = document.getElementById('redaction-preview-box');
        const killBtn = document.getElementById('btn-killswitch');
        const drillBtn = document.getElementById('btn-backup-drill');
        const saveDraftBtn = document.getElementById('btn-save-draft');
        const unpublishBtn = document.getElementById('btn-unpublish');
        const deleteBtn = document.getElementById('btn-delete-entry');
        const newEntryBtn = document.getElementById('btn-new-entry');
        const entryIdInput = document.getElementById('entry-id');
        const titleInput = document.getElementById('entry-title');
        const slugInput = document.getElementById('entry-slug');
        const modeHeading = document.getElementById('editor-mode-heading');
        const stateBadge = document.getElementById('chip-current-state');
        let answeringEnabled = ${answeringEnabledInitial ? 'true' : 'false'};
        let currentPreviewToken = '';
        let currentHasWarnings = false;
        let slugIsManual = false;
        let undoTimeout = null;

        ${ADMIN_API_CLIENT_SCRIPT}

        let toastTimeout = null;
        function showEditorFeedback(messageHtml, isError) {
          const statusLine = document.getElementById('editor-status-line');
          const toast = document.getElementById('editor-toast');
          const cleanHtml = messageHtml.startsWith('<div') ? messageHtml : ('<span>' + messageHtml + '</span>');
          if (statusLine) {
            statusLine.innerHTML = cleanHtml;
            statusLine.style.display = 'inline-flex';
            statusLine.style.outline = 'none';
            statusLine.focus();
          }
          if (toast) {
            toast.innerHTML = cleanHtml;
            toast.style.display = 'block';
            if (toastTimeout) clearTimeout(toastTimeout);
            toastTimeout = setTimeout(function() {
              toast.style.display = 'none';
            }, 6000);
          }
          if (banner) {
            banner.innerHTML = messageHtml.startsWith('<div')
              ? messageHtml
              : ('<div class="' + (isError ? 'later-thinking-banner' : 'as-of-banner') + '">' + messageHtml + '</div>');
          }
        }

        async function refreshEntriesList(selectedId) {
          try {
            const res = await apiClient('/api/entries?visibility=all');
            if (!res.ok) return;
            const data = await res.json();
            const entries = data.entries || [];
            const listEl = document.getElementById('admin-entries-list');
            if (listEl) {
              listEl.innerHTML = entries.map(function(e) {
                return '<li class="admin-entry-item" data-entry-id="' + escapeClientHtml(e.id) + '" style="padding:8px 0;border-bottom:1px solid var(--rule);display:flex;justify-content:space-between;align-items:center;gap:8px">' +
                  '<button type="button" class="admin-entry-select-btn" data-entry-id="' + escapeClientHtml(e.id) + '" style="background:none;border:none;padding:0;font-weight:600;text-align:left;cursor:pointer;color:var(--text);flex:1">' +
                    escapeClientHtml(e.title) +
                  '</button>' +
                  '<span class="chip" data-status="' + escapeClientHtml(e.visibility) + '">' + escapeClientHtml(e.visibility) + '</span>' +
                  (e.visibility !== 'private' ? '<a href="/work/' + escapeClientHtml(e.slug) + '" target="_blank" style="font-size:12px;color:var(--text-muted);text-decoration:none" title="View live page">↗</a>' : '') +
                '</li>';
              }).join('');

              listEl.querySelectorAll('.admin-entry-select-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                  const id = btn.getAttribute('data-entry-id');
                  if (id) selectEntry(id);
                });
              });
            }
            const countHeading = document.querySelector('aside[aria-label="Entries list and filters"] h2');
            if (countHeading) {
              countHeading.textContent = 'Entries (' + entries.length + ')';
            }
          } catch (_) {}
        }

        function renderAdminError(res) {
          if (!res) {
            return '<div class="later-thinking-banner" role="alert" data-error="network">Can&#39;t reach the server. Please check your connection and retry.</div>';
          }
          if (res.status === 401) {
            return '<div class="later-thinking-banner" role="alert" data-error="401">Your session has expired. You&#39;re signed out. <a href="/admin/login" style="margin-left:8px;font-weight:600">Sign in again →</a></div>';
          }
          if (res.status === 403) {
            return '<div class="later-thinking-banner" role="alert" data-error="403">Security check failed (CSRF token invalid or missing). Your session expired. Reload the page and sign in again.</div>';
          }
          if (res.status >= 500) {
            return '<div class="later-thinking-banner" role="alert" data-error="500">Server error (HTTP ' + res.status + '). Can&#39;t reach the server. Please retry your request.</div>';
          }
          return '<div class="later-thinking-banner" role="alert" data-error="' + res.status + '">Action failed. Check your input and retry.</div>';
        }

        function showUndoBanner(message, onUndo) {
          if (undoTimeout) clearTimeout(undoTimeout);
          const undoHtml = '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px">' +
            '<span>' + message + '</span>' +
            '<button type="button" class="btn btn-secondary" id="btn-undo-action" style="padding:2px 8px;font-size:12px;margin-left:8px">Undo (30s)</button>' +
          '</div>';
          showEditorFeedback(undoHtml, false);
          if (undoBanner) {
            undoBanner.style.display = 'block';
            undoBanner.innerHTML = '<div class="as-of-banner" style="display:flex;justify-content:space-between;align-items:center">' +
              '<span>' + message + '</span>' +
              '<button type="button" class="btn btn-secondary" id="btn-undo-action-banner" style="padding:2px 8px;font-size:12px;margin-left:8px">Undo (30s)</button>' +
              '</div>';
            const bBtn = document.getElementById('btn-undo-action-banner');
            if (bBtn) {
              bBtn.addEventListener('click', async function() {
                if (undoTimeout) clearTimeout(undoTimeout);
                undoBanner.style.display = 'none';
                await onUndo();
              });
            }
          }
          const undoBtn = document.getElementById('btn-undo-action');
          if (undoBtn) {
            undoBtn.addEventListener('click', async function() {
              if (undoTimeout) clearTimeout(undoTimeout);
              if (undoBanner) undoBanner.style.display = 'none';
              const statusLine = document.getElementById('editor-status-line');
              if (statusLine) statusLine.style.display = 'none';
              const toast = document.getElementById('editor-toast');
              if (toast) toast.style.display = 'none';
              await onUndo();
            });
          }
          undoTimeout = setTimeout(function() {
            if (undoBanner) undoBanner.style.display = 'none';
          }, 30000);
        }

        function slugify(text) {
          return (text || '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        }

        if (titleInput) {
          titleInput.addEventListener('input', function(e) {
            if ((!entryIdInput || !entryIdInput.value) && !slugIsManual && slugInput) {
              slugInput.value = slugify(e.target.value);
            }
          });
        }

        if (slugInput) {
          slugInput.addEventListener('input', function() {
            slugIsManual = true;
          });
        }

        async function selectEntry(id) {
          try {
            const statusLine = document.getElementById('editor-status-line');
            if (statusLine) { statusLine.style.display = 'none'; statusLine.innerHTML = ''; }
            const toast = document.getElementById('editor-toast');
            if (toast) { toast.style.display = 'none'; toast.innerHTML = ''; }
            const res = await apiClient('/api/entries/' + id);
            if (!res.ok) {
              const banner = document.getElementById('admin-status-banner');
              if (banner) banner.innerHTML = renderAdminError(res);
              return;
            }
            const data = await res.json();
            const entry = data.entry;
            const currentRev = data.currentRevision || data.revision;

            if (entryIdInput) entryIdInput.value = entry.id;
            if (titleInput) titleInput.value = entry.title || '';
            if (slugInput) slugInput.value = entry.slug || '';
            const profileSelect = document.getElementById('entry-profile');
            if (profileSelect) profileSelect.value = entry.profile || 'case-study';
            const visibilityInput = document.getElementById('entry-visibility');
            if (visibilityInput && entry.visibility) {
              visibilityInput.value = entry.visibility;
            }
            const dateInput = document.getElementById('entry-date');
            if (dateInput && currentRev?.valid_from) {
              dateInput.value = currentRev.valid_from.slice(0, 10);
            }
            const dateErr = document.getElementById('entry-date-error');
            if (dateErr) dateErr.style.display = 'none';
            const temporalSelect = document.getElementById('entry-temporal-level');
            const rangeEndContainer = document.getElementById('range-end-container');
            const rangeEndInput = document.getElementById('entry-date-range-end');
            if (temporalSelect) {
              temporalSelect.value = currentRev?.temporal_level || 'exact';
            }
            if (rangeEndContainer) {
              rangeEndContainer.style.display = currentRev?.temporal_level === 'range' ? 'block' : 'none';
            }
            if (rangeEndInput) {
              rangeEndInput.value = currentRev?.valid_from_range_end ? currentRev.valid_from_range_end.slice(0, 10) : '';
            }
            const hindsightCheck = document.getElementById('entry-hindsight');
            if (hindsightCheck) hindsightCheck.checked = !!currentRev?.is_hindsight;
            const bodyEl = document.getElementById('entry-body');
            if (bodyEl) {
              bodyEl.value = currentRev?.body_md || '';
              updateWordCount();
            }

            if (modeHeading) modeHeading.textContent = 'Edit Entry: ' + entry.title;
            if (stateBadge) stateBadge.textContent = 'State: ' + entry.visibility.toUpperCase();

            if (typeof window.setActiveEntryState === 'function') {
              window.setActiveEntryState({
                id: entry.id,
                visibility: entry.visibility,
                lastCommittedBody: (currentRev && currentRev.body_md) || '',
                previewToken: '',
                hasWarnings: false,
              });
            }
            if (typeof window.updateStateChip === 'function') {
              window.updateStateChip(entry.visibility);
            }
            if (typeof window.updateActionButtons === 'function') {
              window.updateActionButtons(entry.id, entry.visibility);
            }

            if (unpublishBtn) {
              unpublishBtn.style.display = entry.visibility === 'public' || entry.visibility === 'unlisted' ? 'inline-block' : 'none';
            }
            if (deleteBtn) {
              deleteBtn.style.display = 'inline-block';
            }

            // Update Inspector Revisions
            const revRes = await apiClient('/api/entries/' + entry.id + '/revisions');
            if (revRes.ok) {
              const revData = await revRes.json();
              const revListEl = document.getElementById('inspector-revisions-list');
              if (revListEl && Array.isArray(revData.revisions)) {
                revListEl.innerHTML = revData.revisions.map(function(r, idx) {
                  const dateStr = r.written_at ? new Date(r.written_at).toLocaleDateString() : 'N/A';
                  const hashSnippet = (r.body_hash || '').slice(0, 10);
                  const isCur = r.id === entry.current_revision_id;
                  return '<div style="padding:6px 0;border-bottom:1px solid var(--rule);display:flex;justify-content:space-between;align-items:center">' +
                    '<div><strong>Revision ' + (idx + 1) + '</strong> <span style="color:var(--text-muted);font-size:12px">(' + escapeClientHtml(dateStr) + ')</span></div>' +
                    '<div><code style="font-size:11px">' + escapeClientHtml(hashSnippet) + '...</code>' +
                    (isCur ? '<span class="chip" style="margin-left:4px;font-size:11px">current</span>' : '') +
                    '</div></div>';
                }).join('');
              }
            }

            // Update Inspector Title
            const inspHeading = document.getElementById('inspector-heading');
            if (inspHeading) inspHeading.textContent = 'Inspector: ' + entry.title;

            // Update Inspector Facets, Evidence, and Annotations
            await loadInspectorData(entry.id, currentRev ? currentRev.id : null);
          } catch (err) {}
        }

        async function loadInspectorData(entryId, revId) {
          // 1. Facets
          try {
            const facetsRes = await apiClient('/api/structure/entries/' + entryId + '/facets');
            if (facetsRes.ok) {
              const fData = await facetsRes.json();
              const container = document.getElementById('inspector-facets');
              if (container && Array.isArray(fData.facets)) {
                if (fData.facets.length === 0) {
                  container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;margin:0">No facets recorded yet.</p>';
                } else {
                  container.innerHTML = fData.facets.map(function(f) {
                    const isSugg = f.status === 'suggested';
                    return '<div style="margin-bottom:8px;padding:6px;border:1px ' + (isSugg ? 'dashed' : 'solid') + ' var(--rule);border-radius:4px;display:flex;justify-content:space-between;align-items:center;gap:6px">' +
                      '<div><span class="chip ' + (isSugg ? 'chip-suggested' : '') + '">' + escapeClientHtml(f.key) + ': ' + escapeClientHtml(String(f.value)) + '</span>' +
                      (f.source_quote ? '<div style="font-size:11px;color:var(--text-muted);margin-top:2px">"' + escapeClientHtml(f.source_quote) + '"</div>' : '') +
                      '</div>' +
                      (isSugg ? '<div style="display:flex;gap:4px">' +
                        '<button type="button" class="btn btn-secondary btn-confirm-facet" data-facet-id="' + f.id + '" style="padding:1px 6px;font-size:11px">Confirm</button>' +
                        '<button type="button" class="btn btn-secondary btn-reject-facet" data-facet-id="' + f.id + '" style="padding:1px 6px;font-size:11px">Reject</button>' +
                      '</div>' : '') +
                    '</div>';
                  }).join('');

                  container.querySelectorAll('.btn-confirm-facet').forEach(function(b) {
                    b.addEventListener('click', async function() {
                      const fid = b.getAttribute('data-facet-id');
                      await apiClient('/api/structure/facets/' + fid, {
                        method: 'PATCH',
                        body: JSON.stringify({ status: 'confirmed' })
                      });
                      loadInspectorData(entryId, revId);
                    });
                  });
                  container.querySelectorAll('.btn-reject-facet').forEach(function(b) {
                    b.addEventListener('click', async function() {
                      const fid = b.getAttribute('data-facet-id');
                      await apiClient('/api/structure/facets/' + fid, {
                        method: 'PATCH',
                        body: JSON.stringify({ status: 'rejected' })
                      });
                      loadInspectorData(entryId, revId);
                    });
                  });
                }
              }
            }
          } catch (err) {}

          // 2. Evidence
          try {
            const evRes = await apiClient('/api/structure/entries/' + entryId + '/evidence');
            if (evRes.ok) {
              const evData = await evRes.json();
              const container = document.getElementById('inspector-evidence-list');
              if (container && Array.isArray(evData.evidence)) {
                if (evData.evidence.length === 0) {
                  container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;margin:0">No evidence items attached yet.</p>';
                } else {
                  container.innerHTML = evData.evidence.map(function(ev) {
                    const isVer = !!ev.verified_at;
                    return '<div style="margin-bottom:6px;padding:6px;border:1px solid var(--rule);border-radius:4px">' +
                      '<div style="display:flex;justify-content:space-between;align-items:center">' +
                        '<strong>' + escapeClientHtml(ev.label || ev.kind) + '</strong>' +
                        (isVer ? '<span class="chip" style="border-color:var(--role-outcome);font-size:11px">✓ Verified</span>' : '<span class="chip" style="font-size:11px">Unverified</span>') +
                      '</div>' +
                      '<div style="font-size:12px;color:var(--text-muted);margin-top:2px"><a href="' + escapeClientHtml(ev.url) + '" target="_blank" rel="noopener">' + escapeClientHtml(ev.url) + '</a></div>' +
                    '</div>';
                  }).join('');
                }
              }
            }
          } catch (err) {}

          // 3. Spans & Annotations
          if (revId) {
            try {
              const spansRes = await apiClient('/api/structure/revisions/' + revId + '/spans');
              if (spansRes.ok) {
                const sData = await spansRes.json();
                const container = document.getElementById('inspector-annotations-list');
                if (container && Array.isArray(sData.spans)) {
                  const allAnnotations = [];
                  sData.spans.forEach(function(sp) {
                    if (Array.isArray(sp.annotations)) {
                      sp.annotations.forEach(function(ann) {
                        allAnnotations.push({ ...ann, spanText: sp.text });
                      });
                    }
                  });

                  if (allAnnotations.length === 0) {
                    container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;margin:0">No role annotations recorded. Suggestions appear after enrichment.</p>';
                  } else {
                    container.innerHTML = allAnnotations.map(function(ann) {
                      const isSugg = ann.status === 'suggested';
                      return '<div style="margin-bottom:8px;padding:6px;border:1px ' + (isSugg ? 'dashed' : 'solid') + ' var(--rule);border-radius:4px">' +
                        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
                          '<span class="chip ' + (isSugg ? 'chip-suggested' : '') + '">Role: ' + escapeClientHtml(ann.role) + ' (' + escapeClientHtml(ann.status) + ')</span>' +
                          (isSugg ? '<div style="display:flex;gap:4px">' +
                            '<button type="button" class="btn btn-secondary btn-accept-ann" data-ann-id="' + ann.id + '" style="padding:1px 6px;font-size:11px">Accept</button>' +
                            '<button type="button" class="btn btn-secondary btn-ignore-ann" data-ann-id="' + ann.id + '" style="padding:1px 6px;font-size:11px">Ignore</button>' +
                          '</div>' : '') +
                        '</div>' +
                        '<div style="font-size:12px;color:var(--text-muted)">"' + escapeClientHtml((ann.spanText || '').slice(0, 100)) + '..."</div>' +
                      '</div>';
                    }).join('');

                    container.querySelectorAll('.btn-accept-ann').forEach(function(b) {
                      b.addEventListener('click', async function() {
                        const aid = b.getAttribute('data-ann-id');
                        await apiClient('/api/structure/annotations/' + aid, {
                          method: 'PATCH',
                          body: JSON.stringify({ status: 'accepted' })
                        });
                        loadInspectorData(entryId, revId);
                      });
                    });
                    container.querySelectorAll('.btn-ignore-ann').forEach(function(b) {
                      b.addEventListener('click', async function() {
                        const aid = b.getAttribute('data-ann-id');
                        await apiClient('/api/structure/annotations/' + aid, {
                          method: 'PATCH',
                          body: JSON.stringify({ status: 'rejected' })
                        });
                        loadInspectorData(entryId, revId);
                      });
                    });
                  }
                }
              }
            } catch (err) {}
          }
        }

        // Tab switching
        document.querySelectorAll('.inspector-tab-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            document.querySelectorAll('.inspector-tab-btn').forEach(function(b) {
              b.classList.remove('active');
              b.setAttribute('aria-selected', 'false');
            });
            document.querySelectorAll('.inspector-tab-panel').forEach(function(p) {
              p.classList.remove('active');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            const targetId = btn.getAttribute('aria-controls');
            if (targetId) {
              const panel = document.getElementById(targetId);
              if (panel) panel.classList.add('active');
            }
          });
        });

        // Editor Mode switching
        const modeBtnPaste = document.getElementById('mode-btn-paste');
        const modeBtnGuided = document.getElementById('mode-btn-guided');
        const modeBtnQuick = document.getElementById('mode-btn-quick');
        const guidedPanel = document.getElementById('editor-guided-panel');
        const quickPanel = document.getElementById('editor-quick-panel');

        function setEditorMode(mode) {
          [modeBtnPaste, modeBtnGuided, modeBtnQuick].forEach(function(b) {
            if (b) b.classList.remove('active');
          });
          if (guidedPanel) guidedPanel.style.display = 'none';
          if (quickPanel) quickPanel.style.display = 'none';

          if (mode === 'guided') {
            if (modeBtnGuided) modeBtnGuided.classList.add('active');
            if (guidedPanel) guidedPanel.style.display = 'block';
          } else if (mode === 'quick') {
            if (modeBtnQuick) modeBtnQuick.classList.add('active');
            if (quickPanel) quickPanel.style.display = 'block';
          } else {
            if (modeBtnPaste) modeBtnPaste.classList.add('active');
          }
        }

        if (modeBtnPaste) modeBtnPaste.addEventListener('click', function() { setEditorMode('paste'); });
        if (modeBtnGuided) modeBtnGuided.addEventListener('click', function() { setEditorMode('guided'); });
        if (modeBtnQuick) modeBtnQuick.addEventListener('click', function() { setEditorMode('quick'); });

        const nothingWrongCheck = document.getElementById('guided-nothing-wrong');
        const guidedLessonInput = document.getElementById('guided-lesson');
        if (nothingWrongCheck && guidedLessonInput) {
          nothingWrongCheck.addEventListener('change', function() {
            if (nothingWrongCheck.checked) {
              guidedLessonInput.value = 'Smooth execution with no notable regressions.';
            }
          });
        }

        const guidedCompileBtn = document.getElementById('btn-guided-compile');
        if (guidedCompileBtn) {
          guidedCompileBtn.addEventListener('click', function() {
            const prob = document.getElementById('guided-problem')?.value.trim() || '';
            const app = document.getElementById('guided-approach')?.value.trim() || '';
            const out = document.getElementById('guided-outcome')?.value.trim() || '';
            const les = document.getElementById('guided-lesson')?.value.trim() || '';

            const parts = [];
            if (prob) parts.push('## Problem\\n\\n' + prob);
            if (app) parts.push('## Approach\\n\\n' + app);
            if (out) parts.push('## Outcome\\n\\n' + out);
            if (les) parts.push('## Lesson\\n\\n' + les);

            const compiled = parts.join('\\n\\n');
            const bodyEl = document.getElementById('entry-body');
            if (bodyEl && compiled) {
              bodyEl.value = compiled;
              setEditorMode('paste');
              banner.innerHTML = '<div class="as-of-banner">Compiled guided prompts into body.</div>';
            }
          });
        }

        const quickSubmitBtn = document.getElementById('btn-submit-quick-log');
        if (quickSubmitBtn) {
          quickSubmitBtn.addEventListener('click', async function() {
            const text = document.getElementById('quick-log-text')?.value.trim() || '';
            if (!text) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Please enter quick log text.</div>';
              return;
            }
            try {
              const res = await apiClient('/api/entries/quick-log', {
                method: 'POST',
                body: JSON.stringify({ text: text })
              });
              if (res.ok) {
                const data = await res.json();
                banner.innerHTML = '<div class="as-of-banner">Quick log saved as "' + escapeClientHtml(data.entry.title) + '" (private).</div>';
                document.getElementById('quick-log-text').value = '';
                setEditorMode('paste');
                const listEl = document.getElementById('admin-entries-list');
                if (listEl) {
                  const li = document.createElement('li');
                  li.className = 'admin-entry-item';
                  li.setAttribute('data-entry-id', data.entry.id);
                  li.style = 'padding:8px 0;border-bottom:1px solid var(--rule);display:flex;justify-content:space-between;align-items:center;gap:8px';
                  li.innerHTML = '<button type="button" class="admin-entry-select-btn" data-entry-id="' + data.entry.id + '" style="background:none;border:none;padding:0;font-weight:600;text-align:left;cursor:pointer;color:var(--text);flex:1">' +
                    escapeClientHtml(data.entry.title) + '</button>' +
                    '<span class="chip" data-status="private">private</span>';
                  listEl.prepend(li);
                  li.querySelector('.admin-entry-select-btn').addEventListener('click', function() {
                    selectEntry(data.entry.id);
                  });
                }
              } else {
                banner.innerHTML = renderAdminError(res);
              }
            } catch (err) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Network error saving quick log.</div>';
            }
          });
        }

        const legacyNotice = document.getElementById('admin-legacy-recovery-notice');
        if (sessionStorage.getItem('lp_legacy_recovery_used') === 'true' && legacyNotice) {
          legacyNotice.style.display = 'block';
        }

        const dismissWalkthroughBtn = document.getElementById('btn-dismiss-walkthrough');
        if (dismissWalkthroughBtn) {
          dismissWalkthroughBtn.addEventListener('click', function() {
            const card = document.getElementById('admin-walkthrough-card');
            if (card) card.style.display = 'none';
          });
        }

        const addFacetBtn = document.getElementById('btn-add-facet');
        if (addFacetBtn) {
          addFacetBtn.addEventListener('click', async function() {
            const entryId = entryIdInput?.value;
            if (!entryId) {
              banner.innerHTML = '<div class="later-thinking-banner">Please select an entry first.</div>';
              return;
            }
            const key = document.getElementById('new-facet-key')?.value.trim();
            const val = document.getElementById('new-facet-value')?.value.trim();
            const quote = document.getElementById('new-facet-quote')?.value.trim();
            if (!key || !val) {
              banner.innerHTML = '<div class="later-thinking-banner">Facet name and value are required.</div>';
              return;
            }
            const res = await apiClient('/api/structure/facets', {
              method: 'POST',
              body: JSON.stringify({
                entry_id: entryId,
                key: key,
                value: val,
                source_quote: quote || undefined,
                status: 'confirmed'
              })
            });
            if (res.ok) {
              document.getElementById('new-facet-key').value = '';
              document.getElementById('new-facet-value').value = '';
              document.getElementById('new-facet-quote').value = '';
              loadInspectorData(entryId, null);
            }
          });
        }

        const attachEvidenceBtn = document.getElementById('btn-attach-evidence');
        if (attachEvidenceBtn) {
          attachEvidenceBtn.addEventListener('click', async function() {
            const entryId = entryIdInput?.value;
            if (!entryId) {
              banner.innerHTML = '<div class="later-thinking-banner">Please select an entry first.</div>';
              return;
            }
            const kind = document.getElementById('new-evidence-kind')?.value;
            const url = document.getElementById('new-evidence-url')?.value.trim();
            const label = document.getElementById('new-evidence-label')?.value.trim();
            if (!url) {
              banner.innerHTML = '<div class="later-thinking-banner">Evidence URL or commit SHA is required.</div>';
              return;
            }
            const res = await apiClient('/api/structure/evidence', {
              method: 'POST',
              body: JSON.stringify({
                entry_id: entryId,
                kind: kind || 'url',
                url: url,
                label: label || undefined
              })
            });
            if (res.ok) {
              document.getElementById('new-evidence-url').value = '';
              document.getElementById('new-evidence-label').value = '';
              loadInspectorData(entryId, null);
            }
          });
        }

        // Bind clicks on entry list buttons
        document.querySelectorAll('.admin-entry-select-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            const id = btn.getAttribute('data-entry-id');
            if (id) selectEntry(id);
          });
        });

        if (newEntryBtn) {
          newEntryBtn.addEventListener('click', function() {
            if (entryIdInput) entryIdInput.value = '';
            if (form) form.reset();
            const visibilityInput = document.getElementById('entry-visibility');
            if (visibilityInput) visibilityInput.value = 'private';
            slugIsManual = false;
            currentPreviewToken = '';
            currentHasWarnings = false;
            if (unpublishBtn) unpublishBtn.style.display = 'none';
            if (deleteBtn) deleteBtn.style.display = 'none';
            const statusLine = document.getElementById('editor-status-line');
            if (statusLine) { statusLine.style.display = 'none'; statusLine.innerHTML = ''; }
            const toast = document.getElementById('editor-toast');
            if (toast) { toast.style.display = 'none'; toast.innerHTML = ''; }
            if (modeHeading) modeHeading.textContent = 'Author / Paste Entry (L0 Immediate Publish)';
            if (stateBadge) stateBadge.textContent = 'Mode: Paste / Guided / Freeform';
            const redactBoxEl = document.getElementById('redaction-preview-box');
            if (redactBoxEl) redactBoxEl.innerHTML = '';
            const inspHeading = document.getElementById('inspector-heading');
            if (inspHeading) inspHeading.textContent = 'Inspector: New Draft';
            const revListEl = document.getElementById('inspector-revisions-list');
            if (revListEl) revListEl.innerHTML = '<p style="color:var(--text-muted);margin:0">No revisions yet (new draft).</p>';
          });
        }

        // Entry lifecycle handlers (Save draft, Unpublish, Delete) migrated to client bundle:
        // apps/web/src/client/admin-entry.ts (WP-14.0)

        // Initialize killswitch state from server settings
        apiClient('/api/settings').then(function(res) {
          if (res.ok) return res.json();
        }).then(function(data) {
          if (data && data.runtime && killBtn) {
            answeringEnabled = data.runtime.automatedAnsweringEnabled;
            killBtn.setAttribute('aria-pressed', answeringEnabled ? 'true' : 'false');
            killBtn.textContent = answeringEnabled ? 'Pause Automated Answering' : 'Resume Automated Answering';
          }
        }).catch(function() {});

        function escapeClientHtml(str) {
          return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
        }

        function setupRedactionDrawer(warnings, fullText, multiPass) {
          const drawerEl = document.getElementById('redaction-preview-drawer');
          const openBtn = document.getElementById('btn-open-redaction-drawer');
          const closeBtn = document.getElementById('btn-close-redaction-drawer');
          const redactAllBtn = document.getElementById('btn-drawer-redact-all');
          const countP1 = document.getElementById('drawer-count-pass1');
          const countP2 = document.getElementById('drawer-count-pass2');
          const countP3 = document.getElementById('drawer-count-pass3');
          const itemsP1 = document.getElementById('drawer-items-pass1');
          const itemsP2 = document.getElementById('drawer-items-pass2');
          const itemsP3 = document.getElementById('drawer-items-pass3');
          const highlightEl = document.getElementById('drawer-highlight-preview');

          if (openBtn && drawerEl) {
            openBtn.onclick = function() {
              drawerEl.style.display = 'block';
            };
          }
          if (closeBtn && drawerEl) {
            closeBtn.onclick = function() {
              drawerEl.style.display = 'none';
            };
          }

          const pass1 = (multiPass && multiPass.pass1Secrets) || warnings.filter(function(w) { return w.type === 'secret'; });
          const pass2 = (multiPass && multiPass.pass2NdaMarkers) || warnings.filter(function(w) { return w.type === 'nda'; });
          const pass3 = (multiPass && multiPass.pass3Entities) || warnings.filter(function(w) { return w.type !== 'secret' && w.type !== 'nda'; });

          if (countP1) countP1.textContent = pass1.length + ' found';
          if (countP2) countP2.textContent = pass2.length + ' found';
          if (countP3) countP3.textContent = pass3.length + ' found';

          function renderGroupItems(group) {
            if (group.length === 0) return '<div style="color:var(--text-muted)">None detected.</div>';
            return group.map(function(item) {
              return '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--rule)">' +
                '<span><code>' + escapeClientHtml(item.match) + '</code> <small style="color:var(--text-muted)">(' + escapeClientHtml(item.type) + ')</small></span>' +
                '<button type="button" class="btn btn-secondary btn-redact-item" data-match="' + escapeClientHtml(item.match) + '" data-type="' + escapeClientHtml(item.type) + '" style="padding:1px 6px;font-size:11px">Redact</button>' +
                '</div>';
            }).join('');
          }

          if (itemsP1) itemsP1.innerHTML = renderGroupItems(pass1);
          if (itemsP2) itemsP2.innerHTML = renderGroupItems(pass2);
          if (itemsP3) itemsP3.innerHTML = renderGroupItems(pass3);

          // Highlight matches in preview pane
          if (highlightEl) {
            let highlighted = escapeClientHtml(fullText);
            warnings.forEach(function(w) {
              const escMatch = escapeClientHtml(w.match);
              if (escMatch) {
                highlighted = highlighted.split(escMatch).join('<mark style="background:#fedf89;padding:1px 4px;border-radius:2px">' + escMatch + '</mark>');
              }
            });
            highlightEl.innerHTML = highlighted;
          }

          // Individual item redact buttons
          const itemBtns = drawerEl ? drawerEl.querySelectorAll('.btn-redact-item') : [];
          itemBtns.forEach(function(btn) {
            btn.onclick = function() {
              const targetMatch = btn.getAttribute('data-match');
              const targetType = btn.getAttribute('data-type') || 'REDACTED';
              const bodyInput = document.getElementById('entry-body');
              if (bodyInput && targetMatch) {
                bodyInput.value = bodyInput.value.split(targetMatch).join('[REDACTED: ' + targetType.toUpperCase() + ']');
                runRedactionCheck();
              }
            };
          });

          // Redact All button
          if (redactAllBtn) {
            redactAllBtn.onclick = function() {
              const bodyInput = document.getElementById('entry-body');
              if (bodyInput) {
                let updated = bodyInput.value;
                const sorted = warnings.slice().sort(function(a, b) {
                  return (b.match || '').length - (a.match || '').length;
                });
                sorted.forEach(function(w) {
                  if (w.match) {
                    updated = updated.split(w.match).join('[REDACTED: ' + String(w.type).toUpperCase() + ']');
                  }
                });
                bodyInput.value = updated;
                if (drawerEl) drawerEl.style.display = 'none';
                runRedactionCheck();
              }
            };
          }
        }

        async function runRedactionCheck() {
          const textEl = document.getElementById('entry-body');
          const text = textEl ? textEl.value.trim() : '';
          const entryIdEl = document.getElementById('entry-id');
          const entryIdVal = entryIdEl && entryIdEl.value ? entryIdEl.value : undefined;
          const tokenInput = document.getElementById('entry-preview-token');
          // State 1: checking
          redactBox.innerHTML = '<div class="later-thinking-banner" data-state="checking" role="status">Checking for confidential data...</div>';
          try {
            const res = await apiClient('/api/entries/redaction-preview', {
              method: 'POST',
              body: JSON.stringify({ text: text, entryId: entryIdVal })
            });
            if (res.ok) {
              const data = await res.json();
              currentPreviewToken = data.redactionPreviewToken || '';
              currentHasWarnings = Array.isArray(data.warnings) && data.warnings.length > 0;
              if (tokenInput) tokenInput.value = currentPreviewToken;
              if (typeof window.setPreviewToken === 'function') {
                window.setPreviewToken(currentPreviewToken, currentHasWarnings);
              }

              const tokenBadgeHtml = currentPreviewToken
                ? '<div class="preview-token-badge" id="preview-token-badge" data-token="' + escapeClientHtml(currentPreviewToken) + '" style="font-size:12px;color:var(--text-muted);margin-top:6px">Signed preview token: <code>' + escapeClientHtml(currentPreviewToken.slice(0, 16)) + '...</code></div>'
                : '';

              if (Array.isArray(data.warnings) && data.warnings.length > 0) {
                // State 3: needs review (amber banner, never green)
                const warningList = data.warnings.map(function(w) {
                  return escapeClientHtml(w.type) + ' ("' + escapeClientHtml(w.match) + '")';
                }).join(', ');
                redactBox.innerHTML = '<div class="later-thinking-banner" data-state="needs-review" role="alert">' +
                  '<strong>Needs Review (' + data.warnings.length + ' findings):</strong> ' + warningList +
                  ' — Confirm none of this is under NDA before publishing.' +
                  ' <button type="button" class="btn btn-secondary" id="btn-open-redaction-drawer" style="margin-left:8px;padding:2px 8px;font-size:12px">Open Review Drawer →</button></div>' + tokenBadgeHtml;
                setupRedactionDrawer(data.warnings, text, data.multiPass);
              } else if (Array.isArray(data.warnings) && data.warnings.length === 0) {
                // State 2: clean (the ONLY state that can ever be green)
                redactBox.innerHTML = '<div class="chip" data-state="clean" style="border-color:var(--role-outcome)">✓ No confidential secrets or NDA markers detected.</div>' + tokenBadgeHtml;
                const drawerEl = document.getElementById('redaction-preview-drawer');
                if (drawerEl) drawerEl.style.display = 'none';
              } else {
                currentPreviewToken = '';
                if (tokenInput) tokenInput.value = '';
                // State 4: could not check
                redactBox.innerHTML = '<div class="later-thinking-banner" data-state="could-not-check" role="alert">' +
                  "Couldn't check for private details." +
                  ' <button type="button" class="btn btn-secondary" id="btn-redaction-retry" style="margin-left:8px;padding:2px 8px;font-size:12px">Retry</button></div>';
                const retryBtn = document.getElementById('btn-redaction-retry');
                if (retryBtn) retryBtn.addEventListener('click', runRedactionCheck);
              }
            } else {
              currentPreviewToken = '';
              if (tokenInput) tokenInput.value = '';
              // State 4: could not check (HTTP error)
              let advice = 'request failed (HTTP ' + res.status + '). Please check inputs and retry.';
              if (res.status === 401) {
                advice = 'Your session has expired. <a href="/admin/login" style="margin-left:8px;font-weight:600">Sign in again →</a>, then retry.';
              } else if (res.status === 403) {
                advice = 'Security check failed (CSRF token invalid or missing). Please refresh and retry.';
              } else if (res.status >= 500) {
                advice = 'Server error (HTTP ' + res.status + '). Please retry.';
              }
              redactBox.innerHTML = '<div class="later-thinking-banner" role="alert" data-error="' + res.status + '" data-state="could-not-check">' +
                "Couldn't check for private details: " + advice +
                ' <button type="button" class="btn btn-secondary" id="btn-redaction-retry" style="margin-left:8px;padding:2px 8px;font-size:12px">Retry</button></div>';
              const retryBtn = document.getElementById('btn-redaction-retry');
              if (retryBtn) retryBtn.addEventListener('click', runRedactionCheck);
            }
          } catch (err) {
            currentPreviewToken = '';
            if (tokenInput) tokenInput.value = '';
            // State 4: could not check (network/fetch error)
            redactBox.innerHTML = '<div class="later-thinking-banner" role="alert" data-state="could-not-check">' +
              "Couldn't check for private details: network error connecting to server." +
              ' <button type="button" class="btn btn-secondary" id="btn-redaction-retry" style="margin-left:8px;padding:2px 8px;font-size:12px">Retry</button></div>';
            const retryBtn = document.getElementById('btn-redaction-retry');
            if (retryBtn) retryBtn.addEventListener('click', runRedactionCheck);
          }
        }

        if (redactBtn) {
          redactBtn.addEventListener('click', runRedactionCheck);
        }

        function updateWordCount() {
          const bodyEl = document.getElementById('entry-body');
          const countEl = document.getElementById('editor-word-count');
          const warnEl = document.getElementById('editor-word-warning');
          if (!bodyEl || !countEl) return;
          const text = bodyEl.value || '';
          const words = text.trim() ? text.trim().split(/\\s+/).length : 0;
          countEl.textContent = words + ' words (soft cap: 3,000)';
          if (warnEl) {
            warnEl.style.display = words > 3000 ? 'block' : 'none';
          }
        }

        // Token invalidated after a body edit & word count update
        const bodyInputEl = document.getElementById('entry-body');
        if (bodyInputEl) {
          bodyInputEl.addEventListener('input', function() {
            updateWordCount();
            if (currentPreviewToken) {
              currentPreviewToken = '';
              const tokenInput = document.getElementById('entry-preview-token');
              if (tokenInput) tokenInput.value = '';
              const badge = document.getElementById('preview-token-badge');
              if (badge) badge.remove();
              redactBox.innerHTML = '<div class="later-thinking-banner" data-state="invalidated" role="status">Body edited since last check — preview token invalidated. Re-run "Check for private details" before publishing.</div>';
            }
          });
        }

        // Markdown Formatting Toolbar Actions (20261020-UI-01)
        const editorToolbar = document.querySelector('.editor-toolbar');
        if (editorToolbar) {
          editorToolbar.addEventListener('click', function(e) {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            const action = btn.getAttribute('data-action');
            const textarea = document.getElementById('entry-body');
            if (!textarea) return;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const sel = textarea.value.substring(start, end);
            const needsLeadingNewline = start > 0 && textarea.value[start - 1] !== '\\n';
            const prefix = needsLeadingNewline ? '\\n\\n' : '';
            let replacement = '';

            switch (action) {
              case 'h2':
                replacement = prefix + '## ' + (sel || 'Heading 2');
                break;
              case 'h3':
                replacement = prefix + '### ' + (sel || 'Heading 3');
                break;
              case 'bold':
                replacement = '**' + (sel || 'bold text') + '**';
                break;
              case 'italic':
                replacement = '*' + (sel || 'italic text') + '*';
                break;
              case 'list':
                replacement = prefix + '- ' + (sel || 'List item');
                break;
              case 'code':
                replacement = prefix + '\x60\x60\x60\\n' + (sel || '// code') + '\\n\x60\x60\x60';
                break;
              case 'quote':
                replacement = prefix + '> ' + (sel || 'Blockquote');
                break;
              case 'link':
                replacement = '[' + (sel || 'link text') + '](https://example.com)';
                break;
            }

            if (replacement) {
              textarea.setRangeText(replacement, start, end, 'end');
              textarea.focus();
              updateWordCount();
            }
          });
        }

        // Markdown Source / Preview Toggle (20261020-UI-01)
        const toggleEditorModeBtn = document.getElementById('btn-toggle-editor-mode');
        const previewPane = document.getElementById('entry-body-preview');
        if (toggleEditorModeBtn && previewPane && bodyInputEl) {
          toggleEditorModeBtn.addEventListener('click', function() {
            const isEditing = bodyInputEl.style.display !== 'none';
            if (isEditing) {
              bodyInputEl.style.display = 'none';
              previewPane.style.display = 'block';
              toggleEditorModeBtn.textContent = 'Edit source';
              const rawMd = bodyInputEl.value;
              previewPane.innerHTML = rawMd
                .split(/\\n\\s*\\n/)
                .map(function(block) {
                  const t = block.trim();
                  if (!t) return '';
                  if (t.startsWith('### ')) return '<h3>' + escapeClientHtml(t.slice(4)) + '</h3>';
                  if (t.startsWith('## ')) return '<h2>' + escapeClientHtml(t.slice(3)) + '</h2>';
                  if (t.startsWith('# ')) return '<h2>' + escapeClientHtml(t.slice(2)) + '</h2>';
                  if (t.startsWith('> ')) return '<blockquote class="reading-quote"><p>' + escapeClientHtml(t.slice(2)) + '</p></blockquote>';
                  if (t.startsWith('\x60\x60\x60')) return '<pre class="code-block"><code>' + escapeClientHtml(t.replace(/^\x60\x60\x60[a-z]*\\n?/, '').replace(/\x60\x60\x60$/, '')) + '</code></pre>';
                  return '<p>' + escapeClientHtml(t) + '</p>';
                })
                .join('\\n');
            } else {
              bodyInputEl.style.display = 'block';
              previewPane.style.display = 'none';
              toggleEditorModeBtn.textContent = 'Preview';
              bodyInputEl.focus();
            }
          });
        }

        if (killBtn) {
          killBtn.addEventListener('click', async function() {
            const nextState = !answeringEnabled;
            try {
              const res = await apiClient('/api/settings/routing', {
                method: 'PATCH',
                body: JSON.stringify({ automatedAnsweringEnabled: nextState })
              });
              if (res.ok) {
                answeringEnabled = nextState;
                killBtn.setAttribute('aria-pressed', answeringEnabled ? 'true' : 'false');
                killBtn.textContent = answeringEnabled ? 'Pause Automated Answering' : 'Resume Automated Answering';
                banner.innerHTML = '<div class="as-of-banner">Automated answering is now <strong>' + (answeringEnabled ? 'ENABLED' : 'PAUSED (Handoff only)') + '</strong>.</div>';
              } else {
                banner.innerHTML = renderAdminError(res);
              }
            } catch (err) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Network error connecting to server. Please retry.</div>';
            }
          });
        }

        if (drillBtn) {
          drillBtn.addEventListener('click', async function() {
            try {
              const res = await apiClient('/api/settings/backups/run-drill', { method: 'POST' });
              if (res.ok) {
                const data = await res.json();
                banner.innerHTML = '<div class="as-of-banner">Encrypted Backup (' + data.encryptedWith + ') &amp; Scratch Restore Drill: <strong>' + data.status.toUpperCase() + '</strong> (' + data.checks.entriesCount + ' entries verified).</div>';
              } else {
                banner.innerHTML = renderAdminError(res);
              }
            } catch (err) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Network error connecting to server. Please retry.</div>';
            }
          });
        }

        const deployChip = document.getElementById('deploy-status-chip');
        const publishNowBtn = document.getElementById('btn-publish-now');
        const triggerEnrichBtn = document.getElementById('btn-trigger-enrichment');
        const enrichStatusContainer = document.getElementById('enrichment-status-container');
        const enrichStatusChip = document.getElementById('enrichment-status-chip');

        async function fetchDeployStatus() {
          if (!deployChip) return;
          try {
            const res = await apiClient('/api/publish/status');
            if (res.ok) {
              const data = await res.json();
              deployChip.setAttribute('data-status', data.state || data.status);
              if (data.state === 'building') {
                deployChip.textContent = 'Deploy: Building...';
              } else if (data.state === 'queued') {
                deployChip.textContent = 'Deploy: Queued (next build in ' + data.minutesRemaining + 'm)';
              } else if (data.state === 'cap_reached') {
                deployChip.textContent = 'Deploy: Cap reached (' + data.buildsToday + '/' + data.maxBuildsPerDay + ' today)';
              } else if (data.state === 'live') {
                deployChip.textContent = 'Deploy: Live (' + data.buildsToday + '/' + data.maxBuildsPerDay + ' today)';
              } else {
                deployChip.textContent = 'Deploy: Ready (' + data.buildsToday + '/' + data.maxBuildsPerDay + ' today)';
              }
            }
          } catch (e) {}
        }
        fetchDeployStatus();

        if (publishNowBtn) {
          publishNowBtn.addEventListener('click', async function() {
            publishNowBtn.setAttribute('disabled', 'true');
            publishNowBtn.textContent = 'Building...';
            try {
              const res = await apiClient('/api/publish/now', { method: 'POST' });
              if (res.ok) {
                const data = await res.json();
                banner.innerHTML = '<div class="as-of-banner">Static site rebuild triggered successfully (build #' + data.buildsToday + ' today).</div>';
                await fetchDeployStatus();
              } else {
                banner.innerHTML = renderAdminError(res);
              }
            } catch (err) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Network error triggering static rebuild.</div>';
            } finally {
              publishNowBtn.removeAttribute('disabled');
              publishNowBtn.textContent = 'Publish Now';
            }
          });
        }

        if (triggerEnrichBtn) {
          triggerEnrichBtn.addEventListener('click', async function() {
            const entryId = entryIdInput ? entryIdInput.value : undefined;
            triggerEnrichBtn.setAttribute('disabled', 'true');
            triggerEnrichBtn.textContent = 'Queueing...';
            try {
              const res = await apiClient('/api/publish/enrich', {
                method: 'POST',
                body: JSON.stringify(entryId ? { entryId: entryId } : {})
              });
              if (res.ok) {
                if (enrichStatusContainer) enrichStatusContainer.style.display = 'block';
                if (enrichStatusChip) enrichStatusChip.textContent = entryId ? 'Enrichment: queued for entry' : 'Enrichment: queued for portfolio';
                banner.innerHTML = '<div class="as-of-banner">✓ Enrichment pipeline queued.</div>';
              } else {
                banner.innerHTML = renderAdminError(res);
              }
            } catch (err) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Network error queueing enrichment.</div>';
            } finally {
              triggerEnrichBtn.removeAttribute('disabled');
              triggerEnrichBtn.textContent = 'Run Background Enrichment';
            }
          });
        }

        // Escalation inbox interactive review & approval (Spec 6.2, UX-08)
        document.querySelectorAll('.btn-approve-escalation').forEach(function(btn) {
          btn.addEventListener('click', async function() {
            var id = btn.getAttribute('data-id');
            var textarea = document.getElementById('draft-' + id);
            var finalReply = textarea ? textarea.value : '';
            var statusEl = document.getElementById('esc-status-' + id);
            btn.setAttribute('disabled', 'true');
            if (statusEl) statusEl.textContent = 'Approving...';
            try {
              var res = await apiClient('/api/inbox/' + id + '/approve', {
                method: 'PATCH',
                body: JSON.stringify({ finalReply: finalReply })
              });
              if (res.ok) {
                if (statusEl) statusEl.textContent = '✓ Approved and delivered';
                btn.style.display = 'none';
                var rejectBtn = document.querySelector('.btn-reject-escalation[data-id="' + id + '"]');
                if (rejectBtn) rejectBtn.style.display = 'none';
                var badge = document.querySelector('#esc-card-' + id + ' .chip');
                if (badge) {
                  badge.textContent = 'approved';
                  badge.style.background = '#d1fae5';
                  badge.style.color = '#065f46';
                }
              } else {
                if (statusEl) statusEl.textContent = 'Error approving escalation.';
                btn.removeAttribute('disabled');
              }
            } catch (err) {
              if (statusEl) statusEl.textContent = 'Network error approving escalation.';
              btn.removeAttribute('disabled');
            }
          });
        });

        document.querySelectorAll('.btn-reject-escalation').forEach(function(btn) {
          btn.addEventListener('click', async function() {
            var id = btn.getAttribute('data-id');
            var reason = prompt('Optional reason for rejection (proposes technical constraint if constraint detected):', 'Out of current scope or technical constraint');
            if (reason === null) return;
            var statusEl = document.getElementById('esc-status-' + id);
            btn.setAttribute('disabled', 'true');
            if (statusEl) statusEl.textContent = 'Rejecting...';
            try {
              var res = await apiClient('/api/inbox/' + id + '/reject', {
                method: 'PATCH',
                body: JSON.stringify({ reason: reason })
              });
              if (res.ok) {
                if (statusEl) statusEl.textContent = '✕ Rejected';
                btn.style.display = 'none';
                var approveBtn = document.querySelector('.btn-approve-escalation[data-id="' + id + '"]');
                if (approveBtn) approveBtn.style.display = 'none';
                var badge = document.querySelector('#esc-card-' + id + ' .chip');
                if (badge) {
                  badge.textContent = 'rejected';
                  badge.style.background = '#fee2e2';
                  badge.style.color = '#991b1b';
                }
              } else {
                if (statusEl) statusEl.textContent = 'Error rejecting escalation.';
                btn.removeAttribute('disabled');
              }
            } catch (err) {
              if (statusEl) statusEl.textContent = 'Network error rejecting escalation.';
              btn.removeAttribute('disabled');
            }
          });
        });
        // Scoped constraints confirm & discard actions (Spec 11, UX-09)
        document.querySelectorAll('.btn-confirm-constraint').forEach(function(btn) {
          btn.addEventListener('click', async function() {
            var id = btn.getAttribute('data-id');
            var msgEl = document.getElementById('constraint-msg-' + id);
            var statusEl = document.getElementById('chip-status-' + id);
            btn.setAttribute('disabled', 'true');
            if (msgEl) msgEl.textContent = 'Confirming...';
            try {
              var res = await apiClient('/api/settings/constraints/' + id + '/confirm', { method: 'PATCH' });
              if (res.ok) {
                if (statusEl) {
                  statusEl.textContent = 'confirmed';
                  statusEl.style.background = '#d1fae5';
                  statusEl.style.color = '#065f46';
                }
                btn.style.display = 'none';
                if (msgEl) msgEl.textContent = '✓ Confirmed';
              } else {
                if (msgEl) msgEl.textContent = 'Error confirming constraint.';
                btn.removeAttribute('disabled');
              }
            } catch (err) {
              if (msgEl) msgEl.textContent = 'Network error.';
              btn.removeAttribute('disabled');
            }
          });
        });

        document.querySelectorAll('.btn-discard-constraint').forEach(function(btn) {
          btn.addEventListener('click', async function() {
            var id = btn.getAttribute('data-id');
            var msgEl = document.getElementById('constraint-msg-' + id);
            var statusEl = document.getElementById('chip-status-' + id);
            btn.setAttribute('disabled', 'true');
            if (msgEl) msgEl.textContent = 'Discarding...';
            try {
              var res = await apiClient('/api/settings/constraints/' + id + '/discard', { method: 'PATCH' });
              if (res.ok) {
                if (statusEl) {
                  statusEl.textContent = 'discarded';
                  statusEl.style.background = '#fee2e2';
                  statusEl.style.color = '#991b1b';
                }
                btn.style.display = 'none';
                if (msgEl) msgEl.textContent = '✕ Discarded';
              } else {
                if (msgEl) msgEl.textContent = 'Error discarding constraint.';
                btn.removeAttribute('disabled');
              }
            } catch (err) {
              if (msgEl) msgEl.textContent = 'Network error.';
              btn.removeAttribute('disabled');
            }
          });
        });
      })();
    </script>
  `;

  return renderLayout('Admin Workspace', '/admin', content, {
    clientScript: '/assets/client/admin-entry.js',
  });
}
