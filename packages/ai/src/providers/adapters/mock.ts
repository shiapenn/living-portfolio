import type { CompletionRequest, CompletionResponse, ModelProvider, ProviderLimits, DataPolicy } from '../types.js';

export class MockModelProvider implements ModelProvider {
  id = 'mock';
  name = 'Mock Provider (Local/Test)';
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
    const lastMessage = req.messages[req.messages.length - 1]?.content ?? '';
    let responseText = '';

    if (lastMessage.includes('Classify')) {
      if (lastMessage.includes('how') || lastMessage.includes('should') || lastMessage.includes('recommend')) {
        responseText = '{"class": "advisory"}';
      } else if (lastMessage.includes('who') || lastMessage.includes('about')) {
        responseText = '{"class": "about"}';
      } else {
        responseText = '{"class": "lookup"}';
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
