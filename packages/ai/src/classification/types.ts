export type QueryClass = 'lookup' | 'advisory' | 'about';

export interface QueryClassificationResult {
  queryClass: QueryClass;
  confidence: number;
  reason: string;
  source: 'provider' | 'rule_fallback';
  isAmbiguous?: boolean;
}

export interface ClassificationOptions {
  model?: string;
  timeoutMs?: number;
}
