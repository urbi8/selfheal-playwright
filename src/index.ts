// Public API
export { test, expect } from './fixture/self-healing-fixture.js';
export type { SelfHealFixtures } from './fixture/self-healing-fixture.js';

// Config
export { loadConfig } from './config/loader.js';
export { SelfHealConfigSchema } from './config/schema.js';
export type { SelfHealConfig, LLMConfig, HealingConfig } from './config/schema.js';

// Engine
export { Healer } from './engine/healer.js';
export type { HealingContext, HealingProposal, HealingResult } from './engine/types.js';

// Classifier
export { FailureClassifier } from './classifier/classifier.js';
export { FailureCategory } from './classifier/types.js';
export type { Classification } from './classifier/types.js';

// LLM Providers
export type { LLMProvider } from './llm/provider.js';
export { OpenAIProvider } from './llm/openai-provider.js';
export { AnthropicProvider } from './llm/anthropic-provider.js';
export { createLLMProvider } from './llm/factory.js';

// Store
export type { HealingStore } from './store/store.js';
export { createSQLiteStore } from './store/sqlite-store.js';

// Dashboard
export { generateDashboard } from './dashboard/generator.js';
