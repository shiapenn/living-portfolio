/**
 * Typed schema for owner-facing contextual help topics (D-HELP).
 * Every topic explains what it is, when to use it, how it works, its impact,
 * and optional choices with bestFor and tradeOff guidance.
 */

export interface HelpOption {
  value: string;
  label: string;
  bestFor: string;
  tradeOff: string;
}

export interface HelpTopic {
  id: string;
  title: string;
  what: string;
  when: string;
  how: string;
  impact: string;
  options?: readonly HelpOption[];
}

export type HelpCatalogue = Record<string, HelpTopic>;
