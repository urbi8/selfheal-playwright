import type { LLMProvider } from '../llm/provider.js';
import type { HealingContext } from '../engine/types.js';
import type { HealingStore } from '../store/store.js';
import { FailureCategory, type Classification } from './types.js';
import { buildClassificationPrompt } from './prompt-builder.js';

export class FailureClassifier {
  private llmProvider: LLMProvider;
  private store: HealingStore | null;

  constructor(llmProvider: LLMProvider, store: HealingStore | null = null) {
    this.llmProvider = llmProvider;
    this.store = store;
  }

  async classify(context: HealingContext): Promise<Classification> {
    // Try heuristic pre-checks first
    const heuristic = this.heuristicClassify(context);
    if (heuristic) {
      this.recordClassification(heuristic, context);
      return heuristic;
    }

    // Fall back to LLM classification
    const messages = buildClassificationPrompt(context);
    const response = await this.llmProvider.complete(messages, true);

    try {
      let jsonStr = response.content.trim();
      const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) jsonStr = fenceMatch[1].trim();

      const parsed = JSON.parse(jsonStr);
      const classification: Classification = {
        category: this.parseCategory(parsed.category),
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        reasoning: String(parsed.reasoning ?? ''),
        suggestedAction: String(parsed.suggestedAction ?? ''),
      };

      this.recordClassification(classification, context);
      return classification;
    } catch {
      const fallback: Classification = {
        category: FailureCategory.TestBug,
        confidence: 0.3,
        reasoning: 'Failed to parse LLM classification response',
        suggestedAction: 'Manually inspect the test and page',
      };
      this.recordClassification(fallback, context);
      return fallback;
    }
  }

  private heuristicClassify(context: HealingContext): Classification | null {
    // Check for error pages (app-bug)
    const errorPageSignals = ['500', 'Internal Server Error', 'Error', 'Something went wrong'];
    if (errorPageSignals.some((sig) => context.pageTitle.includes(sig))) {
      return {
        category: FailureCategory.AppBug,
        confidence: 0.9,
        reasoning: `Page title "${context.pageTitle}" suggests an application error`,
        suggestedAction: 'Check application logs and fix the server error',
      };
    }

    // Check if element exists in ARIA tree (test-bug: selector wrong, element is there)
    if (context.ariaSnapshot.length > 50 && context.ariaSnapshot !== 'No accessibility tree available') {
      const selectorHints = extractSelectorHints(context.originalSelector);
      for (const hint of selectorHints) {
        if (context.ariaSnapshot.toLowerCase().includes(hint.toLowerCase())) {
          return {
            category: FailureCategory.TestBug,
            confidence: 0.8,
            reasoning: `Element text/role "${hint}" found in ARIA tree but selector "${context.originalSelector}" failed. The selector likely needs updating.`,
            suggestedAction: `Update the selector "${context.originalSelector}" to match the current page structure`,
          };
        }
      }
    }

    // No strong heuristic signal, let LLM decide
    return null;
  }

  private parseCategory(value: string): FailureCategory {
    switch (value) {
      case 'flaky':
        return FailureCategory.Flaky;
      case 'app-bug':
        return FailureCategory.AppBug;
      case 'test-bug':
        return FailureCategory.TestBug;
      default:
        return FailureCategory.TestBug;
    }
  }

  private recordClassification(classification: Classification, context: HealingContext): void {
    if (this.store) {
      try {
        this.store.recordClassification({
          timestamp: new Date().toISOString(),
          originalSelector: context.originalSelector,
          category: classification.category,
          confidence: classification.confidence,
          reasoning: classification.reasoning,
          suggestedAction: classification.suggestedAction,
          pageUrl: context.pageUrl,
          testFile: context.testInfo?.file ?? null,
          testTitle: context.testInfo?.title ?? null,
        });
      } catch (err) {
        console.warn('[selfheal] Failed to record classification:', err);
      }
    }
  }
}

function extractSelectorHints(selector: string): string[] {
  const hints: string[] = [];

  // Extract text from common selector patterns
  const textMatch = selector.match(/['"]([^'"]+)['"]/);
  if (textMatch) hints.push(textMatch[1]);

  // Extract ID-like identifiers
  const idMatch = selector.match(/#([\w-]+)/);
  if (idMatch) hints.push(idMatch[1]);

  return hints;
}
