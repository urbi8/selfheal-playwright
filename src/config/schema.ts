import { z } from 'zod';

export const LLMConfigSchema = z.object({
  provider: z.enum(['openai', 'anthropic']).default('openai'),
  model: z.string().optional(),
  apiKey: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0),
});

export const HealingConfigSchema = z.object({
  enabled: z.boolean().default(true),
  maxAttempts: z.number().int().min(1).max(10).default(3),
  enableVisionFallback: z.boolean().default(true),
  maxHtmlSnippetLength: z.number().int().default(50000),
});

export const StoreConfigSchema = z.object({
  path: z.string().default('.selfheal/healing.db'),
});

export const DashboardConfigSchema = z.object({
  outputPath: z.string().default('reports/dashboard.html'),
});

export const SelfHealConfigSchema = z.object({
  llm: LLMConfigSchema.default({}),
  healing: HealingConfigSchema.default({}),
  store: StoreConfigSchema.default({}),
  dashboard: DashboardConfigSchema.default({}),
});

export type LLMConfig = z.infer<typeof LLMConfigSchema>;
export type HealingConfig = z.infer<typeof HealingConfigSchema>;
export type StoreConfig = z.infer<typeof StoreConfigSchema>;
export type DashboardConfig = z.infer<typeof DashboardConfigSchema>;
export type SelfHealConfig = z.infer<typeof SelfHealConfigSchema>;
