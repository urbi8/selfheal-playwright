import type { LLMMessage } from '../llm/types.js';
import type { HealingContext } from '../engine/types.js';

const CLASSIFICATION_SYSTEM = `You are a test failure classifier. Given a Playwright test failure that could not be automatically healed, classify it into one of these categories:

1. "flaky" - The test is intermittent. The element likely exists but timing, animation, or race conditions caused the failure. Suggested action: add waits, retry logic, or stabilize the test.

2. "app-bug" - The application has a genuine bug. The expected element is missing because of an application error (error pages, missing data, broken rendering). Suggested action: file a bug report for the application.

3. "test-bug" - The test itself has an issue. The selector targets an element that was intentionally changed, removed, or the test assumptions are wrong. Suggested action: update the test to match current UI.

Output ONLY valid JSON:
{
  "category": "flaky|app-bug|test-bug",
  "confidence": 0.0-1.0,
  "reasoning": "explanation",
  "suggestedAction": "specific action to take"
}`;

export function buildClassificationPrompt(context: HealingContext): LLMMessage[] {
  const userContent = `A Playwright test failed and could NOT be healed automatically. Classify this failure.

Failed selector: ${context.originalSelector}
Selector type: ${context.selectorType}
Error message: ${context.errorMessage}
Page URL: ${context.pageUrl}
Page title: ${context.pageTitle}

Accessibility tree:
${context.ariaSnapshot}

HTML snippet:
${context.htmlSnippet.substring(0, 5000)}

Classify this failure. Output JSON only.`;

  return [
    { role: 'system', content: CLASSIFICATION_SYSTEM },
    { role: 'user', content: userContent },
  ];
}
