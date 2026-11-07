import type { ModelProvider } from './types.js';
import { OpenAICompatibleProvider } from './adapters/openai.js';

export interface ProviderRegistryConfig {
  PRESET?: 'free-cloud' | 'hobbyist-vps' | 'local-only' | 'hobbyist-docker' | 'private-local' | 'reliable-low-cost' | string;
  GROQ_API_KEY?: string;
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
}

export function createGroqProvider(apiKey: string): ModelProvider {
  return new OpenAICompatibleProvider({
    id: 'groq',
    name: 'Groq Cloud',
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
    dataPolicy: {
      trainsOnInputs: false,
      retentionDays: 30,
      humanReview: false,
      zeroRetentionOption: true,
    },
    limits: {
      rpm: 30,
      tpm: 14400,
      dailyRequests: 14400,
      dailyTokens: 500000,
    },
  });
}

export function createGeminiProvider(apiKey: string): ModelProvider {
  return new OpenAICompatibleProvider({
    id: 'gemini',
    name: 'Google Gemini',
    apiKey,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    dataPolicy: {
      trainsOnInputs: false,
      retentionDays: 0,
      humanReview: false,
      zeroRetentionOption: true,
    },
    limits: {
      rpm: 15,
      tpm: 32000,
      dailyRequests: 1500,
      dailyTokens: 1000000,
    },
  });
}

export function createOpenAIProvider(apiKey: string): ModelProvider {
  return new OpenAICompatibleProvider({
    id: 'openai',
    name: 'OpenAI',
    apiKey,
    baseURL: 'https://api.openai.com/v1',
    dataPolicy: {
      trainsOnInputs: false,
      retentionDays: 30,
      humanReview: false,
      zeroRetentionOption: true,
    },
    limits: {
      rpm: 60,
      tpm: 40000,
      dailyRequests: 1000,
      dailyTokens: 100000,
    },
  });
}

/**
 * Resolves configured model providers strictly from configuration schemas (Spec §10.8, §13.5).
 * Free-cloud preset orders: Groq -> Gemini -> OpenAI.
 * Hobbyist-vps preset orders: OpenAI -> Groq -> Gemini.
 * Local-only preset returns no external cloud providers.
 * If no provider keys are configured, returns an empty array to trigger the extractive degradation ladder.
 */
export function resolveConfiguredProviders(config: ProviderRegistryConfig): ModelProvider[] {
  const providers: ModelProvider[] = [];
  const preset = config.PRESET || 'free-cloud';

  if (preset === 'local-only' || preset === 'private-local') {
    return providers;
  }

  if (preset === 'free-cloud') {
    if (config.GROQ_API_KEY && config.GROQ_API_KEY.trim()) {
      providers.push(createGroqProvider(config.GROQ_API_KEY.trim()));
    }
    if (config.GEMINI_API_KEY && config.GEMINI_API_KEY.trim()) {
      providers.push(createGeminiProvider(config.GEMINI_API_KEY.trim()));
    }
    if (config.OPENAI_API_KEY && config.OPENAI_API_KEY.trim()) {
      providers.push(createOpenAIProvider(config.OPENAI_API_KEY.trim()));
    }
  } else if (preset === 'hobbyist-vps') {
    if (config.OPENAI_API_KEY && config.OPENAI_API_KEY.trim()) {
      providers.push(createOpenAIProvider(config.OPENAI_API_KEY.trim()));
    }
    if (config.GROQ_API_KEY && config.GROQ_API_KEY.trim()) {
      providers.push(createGroqProvider(config.GROQ_API_KEY.trim()));
    }
    if (config.GEMINI_API_KEY && config.GEMINI_API_KEY.trim()) {
      providers.push(createGeminiProvider(config.GEMINI_API_KEY.trim()));
    }
  }

  return providers;
}

/**
 * Formats standard provider disclosure lines in compliance with Spec §10.8 and §13.5.
 */
export function formatProviderDisclosure(provider: ModelProvider | null, model?: string): string {
  if (!provider) {
    return "Showing excerpts from the owner's records. Automated answers are paused for now.";
  }
  if (model && model !== 'default') {
    return `Automated answer synthesized with ${provider.name} (${model}) from owner records.`;
  }
  return `Automated answer synthesized with ${provider.name} from owner records.`;
}
