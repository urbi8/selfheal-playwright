// Example selfheal configuration
// This file is not loaded directly (only JSON config is auto-loaded),
// but shows the available options. Set values via environment variables
// or create a selfheal.config.json file.

export default {
  llm: {
    provider: 'openai',       // 'openai' | 'anthropic'
    // model: 'gpt-4o',       // defaults per provider
    // apiKey: '...',          // prefer env vars: OPENAI_API_KEY / ANTHROPIC_API_KEY
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
