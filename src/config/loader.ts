import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { SelfHealConfigSchema, type SelfHealConfig } from './schema.js';
import { getDefaultModel } from './defaults.js';

function loadFromEnv(): Record<string, unknown> {
  const env: Record<string, unknown> = {};
  const llm: Record<string, unknown> = {};
  const healing: Record<string, unknown> = {};
  const store: Record<string, unknown> = {};
  const dashboard: Record<string, unknown> = {};

  if (process.env.SELFHEAL_LLM_PROVIDER) llm.provider = process.env.SELFHEAL_LLM_PROVIDER;
  if (process.env.SELFHEAL_LLM_MODEL) llm.model = process.env.SELFHEAL_LLM_MODEL;
  if (process.env.OPENAI_API_KEY && !process.env.SELFHEAL_LLM_PROVIDER) {
    llm.apiKey = process.env.OPENAI_API_KEY;
  }
  if (process.env.SELFHEAL_LLM_PROVIDER === 'openai' && process.env.OPENAI_API_KEY) {
    llm.apiKey = process.env.OPENAI_API_KEY;
  }
  if (process.env.SELFHEAL_LLM_PROVIDER === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    llm.apiKey = process.env.ANTHROPIC_API_KEY;
  }

  if (process.env.SELFHEAL_HEALING_ENABLED) healing.enabled = process.env.SELFHEAL_HEALING_ENABLED === 'true';
  if (process.env.SELFHEAL_HEALING_MAX_ATTEMPTS) healing.maxAttempts = parseInt(process.env.SELFHEAL_HEALING_MAX_ATTEMPTS, 10);
  if (process.env.SELFHEAL_HEALING_ENABLE_VISION) healing.enableVisionFallback = process.env.SELFHEAL_HEALING_ENABLE_VISION === 'true';

  if (process.env.SELFHEAL_STORE_PATH) store.path = process.env.SELFHEAL_STORE_PATH;
  if (process.env.SELFHEAL_DASHBOARD_OUTPUT) dashboard.outputPath = process.env.SELFHEAL_DASHBOARD_OUTPUT;

  if (Object.keys(llm).length) env.llm = llm;
  if (Object.keys(healing).length) env.healing = healing;
  if (Object.keys(store).length) env.store = store;
  if (Object.keys(dashboard).length) env.dashboard = dashboard;

  return env;
}

function loadFromFile(configPath?: string): Record<string, unknown> {
  const paths = configPath
    ? [configPath]
    : ['selfheal.config.json', 'selfheal.config.ts'];

  for (const p of paths) {
    const resolved = resolve(p);
    if (existsSync(resolved) && resolved.endsWith('.json')) {
      try {
        return JSON.parse(readFileSync(resolved, 'utf-8'));
      } catch {
        // Ignore parse errors
      }
    }
  }
  return {};
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      typeof target[key] === 'object' &&
      target[key] !== null
    ) {
      result[key] = deepMerge(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>,
      );
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}

export function loadConfig(configPath?: string): SelfHealConfig {
  const fileConfig = loadFromFile(configPath);
  const envConfig = loadFromEnv();
  const merged = deepMerge(fileConfig, envConfig);
  const config = SelfHealConfigSchema.parse(merged);

  // Apply default model if not explicitly set
  if (!config.llm.model) {
    config.llm.model = getDefaultModel(config.llm.provider);
  }

  // Auto-detect API key if not set
  if (!config.llm.apiKey) {
    if (config.llm.provider === 'openai') {
      config.llm.apiKey = process.env.OPENAI_API_KEY;
    } else if (config.llm.provider === 'anthropic') {
      config.llm.apiKey = process.env.ANTHROPIC_API_KEY;
    }
  }

  return config;
}
