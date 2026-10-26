import type { CompletionRequest, CompletionResponse, ModelProvider, ProviderLimits, DataPolicy } from '../types.js';

export interface OpenAICompatibleConfig {
  id?: string;
  name?: string;
  isLocal?: boolean;
  apiKey: string;
  baseURL?: string; // e.g. https://api.groq.com/openai/v1 or https://api.openai.com/v1 or local Ollama /v1 endpoint
  dataPolicy?: Partial<DataPolicy>;
  limits?: Partial<ProviderLimits>;
}

export class OpenAICompatibleProvider implements ModelProvider {
  id: string;
  name: string;
  isLocal: boolean;
  private apiKey: string;
  private baseURL: string;
  dataPolicy: DataPolicy;
  private userLimits: ProviderLimits;

  constructor(config: OpenAICompatibleConfig) {
    this.id = config.id ?? 'openai-compatible';
    this.name = config.name ?? 'OpenAI-Compatible Provider';
    this.isLocal = config.isLocal ?? false;
    this.apiKey = config.apiKey;
    let rawBaseURL = config.baseURL ?? 'https://api.openai.com/v1';
    while (rawBaseURL.endsWith('/')) {
      rawBaseURL = rawBaseURL.slice(0, -1);
    }
    this.baseURL = rawBaseURL;
    this.dataPolicy = {
      trainsOnInputs: config.dataPolicy?.trainsOnInputs ?? false,
      retentionDays: config.dataPolicy?.retentionDays ?? 30,
      humanReview: config.dataPolicy?.humanReview ?? false,
      zeroRetentionOption: config.dataPolicy?.zeroRetentionOption ?? true,
    };
    this.userLimits = {
      rpm: config.limits?.rpm ?? 60,
      tpm: config.limits?.tpm ?? 40000,
      dailyRequests: config.limits?.dailyRequests ?? 1000,
      dailyTokens: config.limits?.dailyTokens ?? 100000,
    };
  }

  limits(): ProviderLimits {
    return this.userLimits;
  }

  async listModels(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseURL}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (!res.ok) return [];
      const json = (await res.json()) as { data?: { id: string }[] };
      return json.data?.map((m) => m.id) ?? [];
    } catch {
      return [];
    }
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    const res = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: req.model,
        messages: req.messages,
        temperature: req.temperature ?? 0.2,
        max_tokens: req.maxTokens ?? 1024,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${err}`);
    }

    const data = (await res.json()) as any;
    const text = data.choices?.[0]?.message?.content ?? '';
    const usage = data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined;

    return { text, usage };
  }

  async embed(texts: string[]): Promise<number[][]> {
    const res = await fetch(`${this.baseURL}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: texts,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI Embeddings error (${res.status}): ${err}`);
    }

    const data = (await res.json()) as any;
    return data.data.map((item: any) => item.embedding);
  }
}
