import { test as base, type Page } from '@playwright/test';
import { loadConfig } from '../config/loader.js';
import type { SelfHealConfig } from '../config/schema.js';
import { createLLMProvider } from '../llm/factory.js';
import type { LLMProvider } from '../llm/provider.js';
import { Healer } from '../engine/healer.js';
import { createSQLiteStore } from '../store/sqlite-store.js';
import type { HealingStore } from '../store/store.js';
import { createSelfHealingPage } from './self-healing-page.js';

export interface SelfHealFixtures {
  healPage: Page;
  healer: Healer;
  selfHealConfig: SelfHealConfig;
}

export interface SelfHealWorkerFixtures {
  _selfHealConfig: SelfHealConfig;
  _llmProvider: LLMProvider | null;
  _healingStore: HealingStore;
}

export const test = base.extend<SelfHealFixtures, SelfHealWorkerFixtures>({
  // Worker-scoped: shared across tests in one worker
  _selfHealConfig: [async ({}, use) => {
    const config = loadConfig();
    await use(config);
  }, { scope: 'worker' }],

  _llmProvider: [async ({ _selfHealConfig }, use) => {
    let provider: LLMProvider | null = null;
    try {
      provider = createLLMProvider(_selfHealConfig.llm);
    } catch (err) {
      console.warn(`[selfheal] LLM provider not available: ${err instanceof Error ? err.message : err}`);
      console.warn('[selfheal] Healing will be disabled. Set API key to enable.');
    }
    await use(provider);
  }, { scope: 'worker' }],

  _healingStore: [async ({ _selfHealConfig }, use) => {
    const store = createSQLiteStore(_selfHealConfig.store.path);
    await use(store);
    store.close();
  }, { scope: 'worker' }],

  // Test-scoped: fresh per test
  selfHealConfig: async ({ _selfHealConfig }, use) => {
    await use(_selfHealConfig);
  },

  healer: async ({ _llmProvider, _selfHealConfig, _healingStore }, use) => {
    if (_llmProvider) {
      const healer = new Healer(_llmProvider, _selfHealConfig.healing, _healingStore);
      await use(healer);
    } else {
      // Create a healer with healing disabled when no LLM provider is available
      const disabledConfig = { ..._selfHealConfig.healing, enabled: false };
      // Use a dummy provider that never gets called
      const dummyProvider: LLMProvider = {
        name: 'none',
        supportsVision: false,
        complete: async () => ({ content: '', usage: { inputTokens: 0, outputTokens: 0 } }),
      };
      const healer = new Healer(dummyProvider, disabledConfig, _healingStore);
      await use(healer);
    }
  },

  healPage: async ({ page, healer }, use) => {
    const healingPage = createSelfHealingPage(page, healer);
    await use(healingPage);
  },
});

export { expect } from '@playwright/test';
