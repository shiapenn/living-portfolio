import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe('Ask Flow, Provider Disclosure & Extractive Degradation E2E (Spec §10.8, §13.5, 20261021-AI-01)', () => {
  test('1. Ask page displays query input and example question buttons', async ({ page }) => {
    await page.goto('/ask');
    await expect(page.locator('h1')).toContainText('Ask about my work');
    await expect(page.locator('#ask-q')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('.example-q').first()).toBeVisible();
  });

  test('2. Live unconfigured Ask degrades to extractive mode with disclosure and citations', async ({ page }) => {
    // Ensure automated answering is enabled and seed demo entries via authenticated session
    await ensureAdminLoggedIn(page);
    await page.evaluate(async () => {
      const csrf = sessionStorage.getItem('lp_csrf_token');
      await fetch('/api/settings/routing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf || '' },
        body: JSON.stringify({ automatedAnsweringEnabled: true, simulatedDegradationMode: 'normal' }),
      });
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf || '' },
      });
      if (!res.ok) throw new Error('Failed to seed demo portfolio: ' + res.status);
    });

    // Navigate to public /ask page
    await page.goto('/ask');
    await page.fill('#ask-q', 'What did you use to replace Redis distributed locks?');
    await page.click('button[type="submit"]');

    // Wait for response to render in #ask-live-region
    const results = page.locator('#ask-live-region');
    await expect(results.locator('.chip')).toBeVisible({ timeout: 10000 });

    // Verify extractive tier chip displays the Spec's fixed sentence
    await expect(results.locator('.chip')).toContainText(
      "Showing excerpts from the owner's records. Automated answers are paused for now."
    );

    // Verify answer contains excerpts from the records
    await expect(results.locator('.reading-column')).toContainText(
      "Showing excerpts from the owner's records. Automated answers are paused for now."
    );

    // Verify provider disclosure line is rendered
    const disclosure = results.locator('.provider-disclosure');
    await expect(disclosure).toBeVisible();
    await expect(disclosure).toContainText(
      "Showing excerpts from the owner's records. Automated answers are paused for now."
    );

    // Verify citations list is present
    await expect(results.locator('ul li').first()).toBeVisible();
  });

  test('3. Synthesized answer displays provider disclosure line in the UI (Spec §13.5)', async ({ page }) => {
    // Intercept /api/ask to simulate a synthesized Tier 1 response with provider disclosure
    await page.route('**/api/ask', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tier: 'tier1',
          queryClass: 'lookup',
          answer: 'We migrated our primary transactional database to PostgreSQL 16 with pgvector.',
          citations: [
            {
              citationId: 1,
              slug: 'migrating-to-postgres',
              title: 'Migrating to Postgres',
              text: 'We migrated to Postgres with zero downtime.',
            },
          ],
          verificationPassed: true,
          degradationStep: 'normal',
          basis: 'Based on 1 entries from the owner\'s records.',
          provider_disclosure: 'Automated answer synthesized with Groq Cloud (llama-3.3-70b-versatile) from owner records.',
          aiDisclosure: 'Automated answer synthesized with Groq Cloud (llama-3.3-70b-versatile) from owner records.',
        }),
      });
    });

    await page.goto('/ask');
    await page.fill('#ask-q', 'What database did you migrate to?');
    await page.click('button[type="submit"]');

    const results = page.locator('#ask-live-region');
    await expect(results.locator('.chip')).toBeVisible({ timeout: 10000 });

    // Verify Tier 1 status chip
    await expect(results.locator('.chip')).toContainText("Automated answer from the owner's records");

    // Verify reading column answer text
    await expect(results.locator('.reading-column')).toContainText(
      'We migrated our primary transactional database to PostgreSQL 16 with pgvector.'
    );

    // Verify provider disclosure line specifically names the provider
    const disclosure = results.locator('.provider-disclosure');
    await expect(disclosure).toBeVisible();
    await expect(disclosure).toContainText('Groq Cloud (llama-3.3-70b-versatile)');

    // Verify cited passage link
    await expect(results.locator('li strong')).toContainText('[1]');
    await expect(results.locator('li a')).toHaveAttribute('href', '/work/migrating-to-postgres');
  });
});
