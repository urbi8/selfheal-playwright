import type { SelfHealConfig } from './schema.js';

export const DEFAULT_CONFIG: SelfHealConfig = {
  llm: {
    provider: 'openai',
    model: undefined,
    apiKey: undefined,
    temperature: 0,
  },
  healing: {
    enabled: true,
    maxAttempts: 3,
    enableVisionFallback: true,
    maxHtmlSnippetLength: 50_000,
  },
  store: {
    path: '.selfheal/healing.db',
  },
  dashboard: {
    outputPath: 'reports/dashboard.html',
  },
};

export function getDefaultModel(provider: string): string {
  switch (provider) {
    case 'anthropic':
      return 'claude-sonnet-4-20250514';
    default:
      return 'gpt-4o';
  }
}
