import type { CompletionRequest, CompletionResponse, ModelProvider, ProviderLimits, DataPolicy } from '../types.js';

export class MockModelProvider implements ModelProvider {
  id: string;
  name: string;
  isLocal: boolean = true;
  options?: { completionText?: string; shouldFail?: boolean; [key: string]: any };

  constructor(
    id: string = 'mock',
    nameOrOptions: string | { completionText?: string; shouldFail?: boolean; [key: string]: any } = 'Mock Provider (Local/Test)'
  ) {
    this.id = id;
    if (typeof nameOrOptions === 'string') {
      this.name = nameOrOptions;
    } else {
      this.name = 'Mock Provider (Local/Test)';
      this.options = nameOrOptions;
    }
  }
  dataPolicy: DataPolicy = {
    trainsOnInputs: false,
    retentionDays: 0,
    humanReview: false,
    zeroRetentionOption: true,
  };

  limits(): ProviderLimits {
    return {
      rpm: 1000,
      tpm: 1000000,
      dailyRequests: 100000,
      dailyTokens: 10000000,
    };
  }

  async listModels(): Promise<string[]> {
    return ['mock-llama-3.3-70b', 'mock-embedding-v1', 'mock-whisper'];
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    if (this.options?.shouldFail) {
      throw new Error(`Mock provider ${this.id} simulated failure`);
    }
    if (this.options?.completionText) {
      return {
        text: this.options.completionText,
        usage: { promptTokens: 50, completionTokens: 20, totalTokens: 70 },
      };
    }
    const lastMessage = req.messages[req.messages.length - 1]?.content ?? '';
    let responseText = '';

    if (lastMessage.includes('entailment judge') || lastMessage.includes('verification entailment')) {
      responseText = JSON.stringify({
        status: 'entailed',
        confidence: 0.95,
        reason: 'Assertions are grounded in provided context chunks.',
      });
    } else if (lastMessage.includes('classify') || lastMessage.includes('Classify') || lastMessage.includes('visitor query classifier')) {
      const userQueryMatch = lastMessage.match(/User Query:\s*"([^"]+)"/i);
      const targetText = userQueryMatch ? userQueryMatch[1].toLowerCase() : lastMessage.toLowerCase();
      if (targetText.includes('who are you') || targetText.includes('about you') || targetText.includes('background') || targetText.includes('credentials') || targetText.includes('site architecture') || targetText.includes('what tech stack powers') || targetText.includes('contact')) {
        responseText = JSON.stringify({
          queryClass: 'about',
          confidence: 0.95,
          reason: 'Author or site inquiry answered from About page and settings.',
          isAmbiguous: false,
        });
      } else if (targetText.includes('should') || targetText.includes('recommend') || targetText.includes('how to') || targetText.includes('how should') || targetText.includes('tradeoff') || targetText.includes('patterns') || targetText.includes('strategies') || targetText.includes('advise')) {
        responseText = JSON.stringify({
          queryClass: 'advisory',
          confidence: 0.92,
          reason: 'Architecture advisory inquiry requiring applicability context.',
          isAmbiguous: false,
        });
      } else if (targetText.includes('did you') || targetText.includes('did the') || targetText.includes('how do we') || targetText.includes('how did') || targetText.includes('when was') || targetText.includes('where was') || targetText.includes('what database did you') || targetText.includes('outcome of') || targetText.includes('version of') || targetText.startsWith('what ') || targetText.startsWith('which ')) {
        responseText = JSON.stringify({
          queryClass: 'lookup',
          confidence: 0.94,
          reason: 'Factual lookup against recorded portfolio entries.',
          isAmbiguous: false,
        });
      } else {
        // §10.3 strict default to advisory for ambiguous cases
        responseText = JSON.stringify({
          queryClass: 'advisory',
          confidence: 0.75,
          reason: 'Ambiguous query defaulting to advisory per §10.3 strictness rule.',
          isAmbiguous: true,
        });
      }
    } else if (lastMessage.includes('Extract facets') || lastMessage.includes('Extract structured context facets')) {
      responseText = JSON.stringify({
        facets: [
          { key: 'stack', value: 'PostgreSQL, Node.js', confidence: 0.95, quote: 'We built with Postgres and Node' },
          { key: 'scale', value: '100k DAU', confidence: 0.92, quote: 'serving 100k daily active users' },
        ],
      });
    } else if (lastMessage.includes('Suggest roles') || lastMessage.includes('Given the role profile')) {
      responseText = JSON.stringify({
        roles: [
          { spanOrdinal: 0, role: 'goal', confidence: 0.94 },
          { spanOrdinal: 0, role: 'decision', confidence: 0.88 },
        ],
      });
    } else if (
      lastMessage.includes('extract claims') ||
      lastMessage.includes('Extract claims') ||
      lastMessage.includes('extract structural claims') ||
      lastMessage.includes('claims')
    ) {
      responseText = JSON.stringify({
        claims: [
          {
            text: 'Migrated 100k daily active users with zero downtime',
            kind: 'outcome',
            outcome_status: 'worked',
            scope: { database: 'PostgreSQL', stack: 'Node.js' },
            spanOrdinal: 0,
            confidence: 0.95,
          },
        ],
      });
    } else {
      responseText = `[SIMULATED] Mock model synthesis for query [cite:1]. Matches: test scenario query context. Not verified: cluster deployment.`;
    }

    return {
      text: responseText,
      usage: {
        promptTokens: 120,
        completionTokens: 60,
        totalTokens: 180,
      },
    };
  }

  async embed(texts: string[]): Promise<number[][]> {
    // Generate deterministic 384-dimension pseudo-embeddings for tests
    return texts.map((text) => {
      const vec: number[] = new Array(384).fill(0);
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        vec[i % 384] += (charCode / 255) * 0.1;
      }
      // Normalize vector
      const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
      return vec.map((v) => v / norm);
    });
  }

  async transcribe(_audioBuffer: Uint8Array): Promise<{ text: string; durationSec: number }> {
    return {
      text: 'This is a test transcription from the mock audio processor.',
      durationSec: 15,
    };
  }
}
