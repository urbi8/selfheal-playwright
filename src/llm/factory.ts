import type { LLMConfig } from '../config/schema.js';
import type { LLMProvider } from './provider.js';
import { OpenAIProvider } from './openai-provider.js';
import { AnthropicProvider } from './anthropic-provider.js';

export function createLLMProvider(config: LLMConfig): LLMProvider {
  const apiKey = config.apiKey;
  if (!apiKey) {
    throw new Error(
      `No API key configured for provider "${config.provider}". ` +
      `Set ${config.provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'} environment variable.`,
    );
  }

  const model = config.model ?? (config.provider === 'anthropic' ? 'claude-sonnet-4-20250514' : 'gpt-4o');

  switch (config.provider) {
    case 'openai':
      return new OpenAIProvider(apiKey, model, config.temperature);
    case 'anthropic':
      return new AnthropicProvider(apiKey, model, config.temperature);
    default:
      throw new Error(`Unknown LLM provider: ${config.provider}`);
  }
}
