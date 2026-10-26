import type { DataClass } from '@living-portfolio/core';

export interface DataPolicy {
  trainsOnInputs: boolean;
  retentionDays: number;
  humanReview: boolean;
  zeroRetentionOption: boolean;
}

export interface ProviderLimits {
  rpm: number;
  tpm: number;
  dailyRequests?: number;
  dailyTokens?: number;
  audioSecPerHour?: number;
}

export interface CompletionRequest {
  model: string;
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface CompletionResponse {
  text: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export interface ModelProvider {
  id: string;
  name: string;
  isLocal?: boolean;
  dataPolicy: DataPolicy;
  limits(): ProviderLimits;
  listModels(): Promise<string[]>;
  complete(req: CompletionRequest): Promise<CompletionResponse>;
  embed(texts: string[]): Promise<number[][]>;
  transcribe?(audioBuffer: Uint8Array): Promise<{ text: string; durationSec: number }>;
  vision?(imageBuffer: Uint8Array, prompt: string): Promise<string>;
}

export function isPolicyAllowedForDataClass(
  policy: DataPolicy,
  dataClass: DataClass,
  isLocal?: boolean
): boolean {
  switch (dataClass) {
    case 'public':
      return true; // Any provider allowed for public content
    case 'unpublished':
    case 'private':
      // Do not allow providers that train on inputs or allow human review without zero-retention
      return !policy.trainsOnInputs && (!policy.humanReview || policy.zeroRetentionOption);
    case 'sensitive':
      // Local only (§13.5, §15: "Local only, or skip enrichment")
      return (
        (isLocal === true || (isLocal !== false && policy.retentionDays === 0)) &&
        !policy.trainsOnInputs &&
        !policy.humanReview
      );
  }
}
