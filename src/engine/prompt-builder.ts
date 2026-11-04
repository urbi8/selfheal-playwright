import type { LLMMessage } from '../llm/types.js';
import type { HealingContext } from './types.js';

const SYSTEM_PROMPT = `You are a Playwright test selector repair expert. A UI test failed because a locator could not find an element on the page. Your job is to analyze the page and propose fixed selectors.

Rules:
- Prefer accessible selectors: getByRole, getByLabel, getByText, getByPlaceholder, getByTestId
- CSS selectors and XPath are acceptable fallbacks
- Each proposal must include a selectorType, selector string, confidence (0-1), and reasoning
- Output ONLY valid JSON, no markdown fences, no explanation outside JSON

Output format:
{
  "proposals": [
    {
      "selector": "the selector string",
      "selectorType": "role|text|label|testid|placeholder|css|xpath",
      "confidence": 0.95,
      "reasoning": "brief explanation"
    }
  ]
}`;

export function buildAriaOnlyPrompt(context: HealingContext): LLMMessage[] {
  const userContent = `The following Playwright selector failed to find an element:

Original selector: ${context.originalSelector}
Selector type: ${context.selectorType}
Error: ${context.errorMessage}
Page URL: ${context.pageUrl}
Page title: ${context.pageTitle}

Here is the accessibility tree (ARIA snapshot) of the current page:
${context.ariaSnapshot}

Analyze the ARIA tree and propose up to 3 fixed selectors that would find the intended element. Output JSON only.`;

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userContent },
  ];
}

export function buildFullContextPrompt(context: HealingContext): LLMMessage[] {
  const textParts = `The following Playwright selector failed to find an element:

Original selector: ${context.originalSelector}
Selector type: ${context.selectorType}
Error: ${context.errorMessage}
Page URL: ${context.pageUrl}
Page title: ${context.pageTitle}

Here is the accessibility tree:
${context.ariaSnapshot}

Here is the trimmed HTML of the page body:
${context.htmlSnippet}

${context.screenshotBase64 ? 'A screenshot of the page is also attached. Use it to visually identify the intended element.' : ''}

Analyze all available context and propose up to 3 fixed selectors. Output JSON only.`;

  if (context.screenshotBase64) {
    return [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: textParts },
          { type: 'image', base64: context.screenshotBase64, mediaType: 'image/png' },
        ],
      },
    ];
  }

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: textParts },
  ];
}
