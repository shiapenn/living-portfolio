import { describe, it, expect, afterEach } from 'vitest';
import { renderAdminImportPage } from './import.js';
import { IMPORT_SCRIPT } from './import-script.js';

const stubRepo = {} as any;

describe('WP-18.6 Import stepper polish canaries', () => {
  const origOpenAi = process.env.OPENAI_API_KEY;
  const origGemini = process.env.GEMINI_API_KEY;

  afterEach(() => {
    if (origOpenAi === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = origOpenAi;
    if (origGemini === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = origGemini;
  });

  it('[1-CONDITIONAL-PROVIDER-CARDS] hides paid cloud option when no external provider is configured and renders real Choice radio cards when configured', async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const htmlLocalOnly = await renderAdminImportPage(stubRepo);
    expect(htmlLocalOnly).not.toContain('id="plan-tier-paid"');
    expect(htmlLocalOnly).not.toContain('Fast Cloud Acceleration');
    expect(htmlLocalOnly).toContain('id="plan-local-summary"');

    process.env.OPENAI_API_KEY = 'sk-test-synthetic-provider-configured';
    const htmlWithProvider = await renderAdminImportPage(stubRepo);
    expect(htmlWithProvider).toContain('data-c="Choice"');
    expect(htmlWithProvider).toContain('type="radio"');
    expect(htmlWithProvider).toContain('name="import_plan_tier"');
    expect(htmlWithProvider).toContain('id="plan-tier-free"');
    expect(htmlWithProvider).toContain('id="plan-tier-paid"');
  });

  it('[2-REVIEW-COUNTER-AND-PER-ITEM-ACTIONS] renders review progress counter and per-item Include / Leave out / Change type / Set date controls', async () => {
    const html = await renderAdminImportPage(stubRepo);
    expect(html).toContain('id="import-review-counter"');
    expect(IMPORT_SCRIPT).toContain('data-item-action="include"');
    expect(IMPORT_SCRIPT).toContain('data-item-action="leave-out"');
    expect(IMPORT_SCRIPT).toContain('Leave out');
    expect(IMPORT_SCRIPT).toContain('reviewed');
  });

  it('[3-DONE-SCREEN-NEXT-STEPS] renders dedicated Done screen with 3 next steps and 1 return link to Today', async () => {
    const html = await renderAdminImportPage(stubRepo);
    expect(html).toContain('id="import-step-done"');
    expect(html).toContain('/admin/entries');
    expect(html).toContain('/admin/audit');
    expect(html).toContain('id="btn-import-another"');
    expect(html).toContain('Back to Today');
    expect(IMPORT_SCRIPT).toContain("setStep('done')");
  });
});
