import { describe, it, expect } from 'vitest';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { InMemoryPortfolioRepository, seedDemoPortfolio } from '@living-portfolio/db';
import {
  MockModelProvider,
  OpenAICompatibleProvider,
  type ModelProvider,
  type CompletionRequest,
  type CompletionResponse,
} from '@living-portfolio/ai';
import { createApp } from '../app.js';

class FailingProvider implements ModelProvider {
  id: string;
  name: string;
  dataPolicy = {
    trainsOnInputs: false,
    retentionDays: 0,
    humanReview: false,
    zeroRetentionOption: true,
  };
  shouldThrow429: boolean;

  constructor(id: string, name: string, shouldThrow429 = false) {
    this.id = id;
    this.name = name;
    this.shouldThrow429 = shouldThrow429;
  }

  limits() {
    return { rpm: 60, tpm: 10000, dailyRequests: 1000, dailyTokens: 100000 };
  }

  async listModels() {
    return ['mock-fail'];
  }

  async complete(_req: CompletionRequest): Promise<CompletionResponse> {
    if (this.shouldThrow429) {
      const err: any = new Error('Rate limit exceeded (429)');
      err.status = 429;
      throw err;
    }
    throw new Error('Upstream provider connection refused (503)');
  }

  async embed(_texts: string[]) {
    return [[0.1, 0.2]];
  }
}

describe('AI Provider Registry & Extractive Degradation Ladder Conformance (Spec §10.8, §13.5, 20261021-AI-01)', () => {
  it('cascades from failing primary provider to secondary fallback provider along the degradation ladder', async () => {
    const repo = new InMemoryPortfolioRepository();
    await seedDemoPortfolio(repo);

    const failingPrimary = new FailingProvider('failing-primary', 'Failing Primary Cloud', false);
    const healthySecondary = new MockModelProvider();
    healthySecondary.id = 'healthy-secondary';
    healthySecondary.name = 'Secondary Fallback Provider';

    const testApp = createApp(repo, {
      providers: [failingPrimary, healthySecondary],
    });

    const res = await testApp.app.request('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What database did you migrate to?',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tier).toBe('tier1');
    expect(body.degradationStep).toBe('normal');
    expect(body.provider_disclosure).toContain('Secondary Fallback Provider');
    expect(body.aiDisclosure).toContain('Secondary Fallback Provider');
  });

  it('records 429 on budget governor and degrades to fallback provider or extractive excerpts', async () => {
    const repo = new InMemoryPortfolioRepository();
    await seedDemoPortfolio(repo);

    // Both providers throw errors, primary with 429
    const rateLimitedPrimary = new FailingProvider('rate-limited-1', 'Rate Limited Cloud', true);
    const errorSecondary = new FailingProvider('error-2', 'Down Upstream', false);

    const testApp = createApp(repo, {
      providers: [rateLimitedPrimary, errorSecondary],
    });

    const res = await testApp.app.request('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What database did you migrate to?',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    // Degrades gracefully to extractive mode without 500 error
    expect(body.tier).toBe('extractive');
    expect(body.degradationStep).toBe('extractive');
    expect(body.answer).toContain("Showing excerpts from the owner's records. Automated answers are paused for now.");
    expect(body.provider_disclosure).toBe("Showing excerpts from the owner's records. Automated answers are paused for now.");
    expect(body.aiDisclosure).toBe("Showing excerpts from the owner's records. Automated answers are paused for now.");
    expect(body.citations.length).toBeGreaterThan(0);
  });

  it('verifies that unconfigured provider mode gracefully serves extractive answers without errors', async () => {
    const repo = new InMemoryPortfolioRepository();
    await seedDemoPortfolio(repo);

    // createApp with providers = []
    const testApp = createApp(repo, { providers: [] });
    const res = await testApp.app.request('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What database did you migrate to?',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tier).toBe('extractive');
    expect(body.degradationStep).toBe('extractive');
    expect(body.provider_disclosure).toBe("Showing excerpts from the owner's records. Automated answers are paused for now.");
    expect(body.aiDisclosure).toBe("Showing excerpts from the owner's records. Automated answers are paused for now.");
    expect(body.answer).toContain("Showing excerpts from the owner's records. Automated answers are paused for now.");
    expect(body.citations.length).toBeGreaterThan(0);
  });

  it('connects to real local HTTP stub provider via OpenAICompatibleProvider adapter (20261021-AI-01)', async () => {
    const repo = new InMemoryPortfolioRepository();
    await seedDemoPortfolio(repo);

    let receivedAuth = '';

    const server = createServer((req, res) => {
      receivedAuth = req.headers['authorization'] || '';
      if (req.url === '/v1/chat/completions') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', () => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: 'Verified answer served by local HTTP stub provider endpoint.',
                  },
                },
              ],
              usage: { prompt_tokens: 12, completion_tokens: 24, total_tokens: 36 },
            })
          );
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    await new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(null)));
    const port = (server.address() as AddressInfo).port;
    const baseURL = `http://127.0.0.1:${port}/v1`;

    try {
      const stubProvider = new OpenAICompatibleProvider({
        id: 'local-stub-provider',
        name: 'Local HTTP Stub Model',
        apiKey: 'test-stub-api-key',
        baseURL,
      });

      const testApp = createApp(repo, {
        providers: [stubProvider],
      });

      const res = await testApp.app.request('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'What database did you migrate to?',
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tier).toBe('tier1');
      expect(body.degradationStep).toBe('normal');
      expect(body.answer).toBe('Verified answer served by local HTTP stub provider endpoint.');
      expect(body.provider_disclosure).toContain('Local HTTP Stub Model');
      expect(body.aiDisclosure).toContain('Local HTTP Stub Model');
      expect(receivedAuth).toBe('Bearer test-stub-api-key');
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
