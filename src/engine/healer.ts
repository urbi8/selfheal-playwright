import type { Page } from '@playwright/test';
import type { LLMProvider } from '../llm/provider.js';
import type { HealingConfig } from '../config/schema.js';
import type { HealingStore } from '../store/store.js';
import type { HealingContext, HealingProposal, HealingResult } from './types.js';
import { collectHealingContext } from './context-collector.js';
import { buildAriaOnlyPrompt, buildFullContextPrompt } from './prompt-builder.js';
import { validateProposals } from './locator-validator.js';

export class Healer {
  private llmProvider: LLMProvider;
  private config: HealingConfig;
  private store: HealingStore | null;
  private _healingEvents: HealingResult[] = [];

  constructor(llmProvider: LLMProvider, config: HealingConfig, store: HealingStore | null = null) {
    this.llmProvider = llmProvider;
    this.config = config;
    this.store = store;
  }

  get healingEvents(): ReadonlyArray<HealingResult> {
    return this._healingEvents;
  }

  async heal(
    page: Page,
    originalSelector: string,
    selectorType: string,
    errorMessage: string,
  ): Promise<HealingResult> {
    const startTime = Date.now();

    if (!this.config.enabled) {
      return this.noHealResult(originalSelector, startTime);
    }

    const context = await collectHealingContext(page, originalSelector, selectorType, errorMessage, {
      maxHtmlSnippetLength: this.config.maxHtmlSnippetLength,
    });

    let totalTokens = 0;

    // Stage 1: ARIA-only prompt (fast, cheap)
    console.warn(`[selfheal] Attempting ARIA-based healing for: ${originalSelector}`);
    const ariaMessages = buildAriaOnlyPrompt(context);
    const ariaResponse = await this.llmProvider.complete(ariaMessages, true);
    totalTokens += ariaResponse.usage.inputTokens + ariaResponse.usage.outputTokens;

    const ariaProposals = this.parseProposals(ariaResponse.content);
    if (ariaProposals.length > 0) {
      const validated = await validateProposals(page, ariaProposals);
      if (validated) {
        const result: HealingResult = {
          success: true,
          originalSelector,
          healedSelector: validated.selector,
          healedSelectorType: validated.selectorType,
          proposals: ariaProposals,
          stage: 'aria',
          duration: Date.now() - startTime,
          llmModel: this.llmProvider.name,
          llmTokensUsed: totalTokens,
        };
        console.warn(`[selfheal] Healed via ARIA: "${originalSelector}" → "${validated.selector}" (${validated.selectorType})`);
        this.recordResult(result, context);
        return result;
      }
    }

    // Stage 2: Full context + vision (if enabled)
    if (this.config.enableVisionFallback && this.llmProvider.supportsVision) {
      console.warn(`[selfheal] ARIA healing failed, trying full context + vision...`);
      const fullMessages = buildFullContextPrompt(context);
      const fullResponse = await this.llmProvider.complete(fullMessages, true);
      totalTokens += fullResponse.usage.inputTokens + fullResponse.usage.outputTokens;

      const fullProposals = this.parseProposals(fullResponse.content);
      if (fullProposals.length > 0) {
        const validated = await validateProposals(page, fullProposals);
        if (validated) {
          const result: HealingResult = {
            success: true,
            originalSelector,
            healedSelector: validated.selector,
            healedSelectorType: validated.selectorType,
            proposals: fullProposals,
            stage: 'vision',
            duration: Date.now() - startTime,
            llmModel: this.llmProvider.name,
            llmTokensUsed: totalTokens,
          };
          console.warn(`[selfheal] Healed via vision: "${originalSelector}" → "${validated.selector}" (${validated.selectorType})`);
          this.recordResult(result, context);
          return result;
        }
      }
    }

    // Healing failed
    const result: HealingResult = {
      success: false,
      originalSelector,
      proposals: [],
      stage: 'none',
      duration: Date.now() - startTime,
      llmModel: this.llmProvider.name,
      llmTokensUsed: totalTokens,
    };
    console.warn(`[selfheal] Failed to heal: "${originalSelector}"`);
    this.recordResult(result, context);
    return result;
  }

  private parseProposals(content: string): HealingProposal[] {
    try {
      // Try to extract JSON from the response (handle markdown fences)
      let jsonStr = content.trim();
      const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) {
        jsonStr = fenceMatch[1].trim();
      }

      const parsed = JSON.parse(jsonStr);
      if (parsed.proposals && Array.isArray(parsed.proposals)) {
        return parsed.proposals
          .filter((p: any) => p.selector && p.selectorType)
          .map((p: any) => ({
            selector: String(p.selector),
            selectorType: p.selectorType,
            confidence: typeof p.confidence === 'number' ? p.confidence : 0.5,
            reasoning: String(p.reasoning ?? ''),
          }));
      }
      return [];
    } catch {
      return [];
    }
  }

  private recordResult(result: HealingResult, context: HealingContext): void {
    this._healingEvents.push(result);
    if (this.store) {
      try {
        this.store.recordHealingEvent({
          timestamp: new Date().toISOString(),
          originalSelector: result.originalSelector,
          originalSelectorType: context.selectorType,
          healedSelector: result.healedSelector ?? null,
          healedSelectorType: result.healedSelectorType ?? null,
          success: result.success,
          stage: result.stage,
          duration: result.duration,
          llmModel: result.llmModel ?? null,
          llmTokensUsed: result.llmTokensUsed ?? null,
          pageUrl: context.pageUrl,
          pageTitle: context.pageTitle,
          errorMessage: context.errorMessage,
          testFile: context.testInfo?.file ?? null,
          testTitle: context.testInfo?.title ?? null,
        });
      } catch (err) {
        console.warn('[selfheal] Failed to record healing event:', err);
      }
    }
  }

  private noHealResult(originalSelector: string, startTime: number): HealingResult {
    return {
      success: false,
      originalSelector,
      proposals: [],
      stage: 'none',
      duration: Date.now() - startTime,
    };
  }
}
