import { test, expect } from '@playwright/test';
import { ensureAdminLoggedIn } from './helpers.js';

test.describe.serial('WP-11.1: Debounced Static Rebuild UI & Ask Flow Repair (20261020-UX-05 & 20261020-UX-10)', () => {
  test('1. Admin workspace displays deploy status chip and operates manual rebuild trigger (20261020-UX-05)', async ({
    page,
  }) => {
    await ensureAdminLoggedIn(page);
    await page.goto('/admin');

    // 1. Verify deploy status chip in header actions
    const deployChip = page.locator('#deploy-status-chip');
    await expect(deployChip).toBeVisible();
    await expect(deployChip).toContainText(/Deploy: (Ready|Queued|Building)/i);

    // 2. Verify Publish Now button is present and clickable
    const publishNowBtn = page.locator('#btn-publish-now');
    await expect(publishNowBtn).toBeVisible();
    await expect(publishNowBtn).toBeEnabled();

    // 3. Click Publish Now button and verify success toast / banner
    await publishNowBtn.click();
    const banner = page.locator('#admin-status-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/Static site rebuild triggered successfully/i);

    // 4. Publish an entry and verify enrichment pipeline queueing
    await page.fill('#entry-title', 'Distributed Queue Architecture');
    await page.fill('#entry-slug', 'distributed-queue-architecture');
    await page.fill('#entry-date', '2026-01-01');
    await page.fill('#entry-body', 'We built a distributed queue with Raft consensus and SQLite.');
    await page.click('#btn-redaction-check');
    await expect(page.locator('#redaction-preview-box')).toBeVisible();
    await page.check('#entry-nda-confirmed');
    await page.click('#btn-publish-entry');

    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/Published "Distributed Queue Architecture"/i);
    await expect(banner).toContainText(/Enrichment pipeline queued/i);

    // 5. Navigate to Structure tab and trigger manual enrichment
    const structureTabBtn = page.locator('#tab-btn-structure');
    if (await structureTabBtn.isVisible()) {
      await structureTabBtn.click();
      const triggerEnrichBtn = page.locator('#btn-trigger-enrichment');
      await expect(triggerEnrichBtn).toBeVisible();
      await triggerEnrichBtn.click();

      const enrichStatusChip = page.locator('#enrichment-status-chip');
      await expect(enrichStatusChip).toBeVisible();
      await expect(enrichStatusChip).toContainText(/Enrichment: queued/i);
    }
  });

  test('2. Public Ask page renders dynamic question examples and entry scope notice (20261020-UX-10)', async ({
    page,
  }) => {
    // 1. Check dynamic question examples on general Ask page
    await page.goto('/ask');
    const exampleBtns = page.locator('.example-q');
    const count = await exampleBtns.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Clicking an example populates the query input
    const firstExample = exampleBtns.first();
    const exampleText = (await firstExample.innerText()).trim();
    await firstExample.click();

    const queryInput = page.locator('#ask-q');
    await expect(queryInput).toHaveValue(exampleText);

    // 2. Check entry-scoped query notice
    await page.goto('/ask?entry=sample-spec-entry');
    const scopeChip = page.locator('#ask-scope-chip');
    await expect(scopeChip).toBeVisible();
    await expect(scopeChip).toContainText(/sample-spec-entry/);

    // Clicking clear scope button removes the scope chip
    const clearBtn = page.locator('#btn-clear-scope');
    await clearBtn.click();
    await expect(page.locator('#scope-chip-container')).not.toBeVisible();
  });

  test('3. Ask submission enforces double-submit lockout (20261020-UX-10)', async ({ page }) => {
    await page.goto('/ask');

    // Intercept /api/ask with a delayed response to observe lockout state
    let routeResolved = false;
    await page.route('**/api/ask', async (route) => {
      // Delay response by 300ms so we can inspect the locked state
      await new Promise((r) => setTimeout(r, 300));
      routeResolved = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tier: 'tier2',
          queryClass: 'lookup',
          answer: 'Delayed response for testing lockout mechanics.',
          citations: [],
          verificationPassed: true,
          degradationStep: 'extractive',
        }),
      });
    });

    const queryInput = page.locator('#ask-q');
    const submitBtn = page.locator('#btn-ask-submit');

    await queryInput.fill('What is the distributed storage architecture?');

    // Submit and assert lockout attributes while inflight
    const responsePromise = page.waitForResponse('**/api/ask');
    await submitBtn.click();
    await expect(submitBtn).toBeDisabled();
    await expect(submitBtn).toHaveAttribute('aria-busy', 'true');
    await expect(queryInput).toBeDisabled();

    // Wait for resolution
    await responsePromise;
    expect(routeResolved).toBe(true);

    // Controls re-enabled after response
    await expect(submitBtn).toBeEnabled();
    await expect(submitBtn).not.toHaveAttribute('aria-busy', 'true');
    await expect(queryInput).toBeEnabled();
  });

  test('4. Ask flow renders interactive dynamic facet clarification on needs_context state (20261020-UX-10)', async ({
    page,
  }) => {
    let askedPayload: any = null;
    await page.route('**/api/ask', async (route) => {
      const postData = route.request().postDataJSON();
      askedPayload = postData;

      if (!postData.context_asked) {
        // First request returns needs_context with dynamic facet prompts
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            tier: 'needs_context',
            queryClass: 'advisory',
            missingFacets: ['scale', 'database'],
            answer: 'To advise accurately on this question, please provide the following details:',
          }),
        });
      } else {
        // Second request with context returns answered tier
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            tier: 'tier1',
            queryClass: 'advisory',
            answer: 'With PostgreSQL and partitioned consumers, an event-driven architecture is optimal.',
            citations: [],
            verificationPassed: true,
            degradationStep: 'normal',
          }),
        });
      }
    });

    await page.goto('/ask');
    const queryInput = page.locator('#ask-q');
    const submitBtn = page.locator('#btn-ask-submit');

    await queryInput.fill('Should I adopt microservices or modular monolith?');
    await submitBtn.click();

    // Verify clarification panel is rendered
    const contextCard = page.locator('#needs-context-card');
    await expect(contextCard).toBeVisible();
    await expect(contextCard).toContainText('Additional context required');

    // Verify both "Submit with Context" and "Skip" buttons exist
    const submitWithContextBtn = page.locator('#btn-submit-with-context');
    const skipBtn = page.locator('#btn-skip-context');
    await expect(submitWithContextBtn).toBeVisible();
    await expect(skipBtn).toBeVisible();

    // Skip returns answer with context_asked: true
    await skipBtn.click();

    // Verify payload included context_asked
    await expect(page.locator('#ask-live-region')).toContainText('event-driven architecture');
    expect(askedPayload.context_asked).toBe(true);
  });

  test('5. Ask flow handles rate limit 429 and server error responses gracefully (20261020-UX-10)', async ({
    page,
  }) => {
    // 1. Rate limited response (429)
    await page.route('**/api/ask', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          tier: 'rate_limited',
          error: 'Rate limit exceeded: maximum 20 questions per hour.',
          retryAfter: 300,
        }),
      });
    });

    await page.goto('/ask');
    await page.locator('#ask-q').fill('Testing rate limit handling');
    await page.locator('#btn-ask-submit').click();

    const liveRegion = page.locator('#ask-live-region');
    await expect(liveRegion).toBeVisible();
    await expect(liveRegion).toContainText(/Question limit reached/i);
    await expect(liveRegion).toContainText(/5 minutes/i);

    // 2. Non-JSON 502/503 server error response
    await page.unroute('**/api/ask');
    await page.route('**/api/ask', async (route) => {
      await route.fulfill({
        status: 502,
        contentType: 'text/html',
        body: '<html><body>502 Bad Gateway</body></html>',
      });
    });

    await page.locator('#ask-q').fill('Testing server 502 handling');
    await page.locator('#btn-ask-submit').click();

    await expect(liveRegion).toContainText(/502/);
  });
});
