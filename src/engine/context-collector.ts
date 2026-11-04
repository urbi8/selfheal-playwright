import type { Page } from '@playwright/test';
import type { HealingContext } from './types.js';

export interface CollectorOptions {
  maxHtmlSnippetLength: number;
}

export async function collectHealingContext(
  page: Page,
  originalSelector: string,
  selectorType: string,
  errorMessage: string,
  options: CollectorOptions,
): Promise<HealingContext> {
  const [ariaSnapshot, htmlSnippet, screenshotBase64, pageTitle] = await Promise.all([
    collectAriaSnapshot(page),
    collectTrimmedHtml(page, options.maxHtmlSnippetLength),
    collectScreenshot(page),
    page.title(),
  ]);

  return {
    originalSelector,
    selectorType,
    ariaSnapshot,
    htmlSnippet,
    screenshotBase64,
    errorMessage,
    pageUrl: page.url(),
    pageTitle,
  };
}

async function collectAriaSnapshot(page: Page): Promise<string> {
  try {
    // Use Playwright's ariaSnapshot on the body locator
    const snapshot = await page.locator('body').ariaSnapshot();
    return snapshot || 'No accessibility tree available';
  } catch {
    return 'Failed to collect ARIA snapshot';
  }
}

async function collectTrimmedHtml(page: Page, maxLength: number): Promise<string> {
  try {
    // Get body innerHTML and strip script/style tags via evaluate with string return
    const html = await page.evaluate(`
      (() => {
        const clone = document.body.cloneNode(true);
        clone.querySelectorAll('script, style, link[rel="stylesheet"]').forEach(el => el.remove());
        return clone.innerHTML;
      })()
    `) as string;
    if (html.length > maxLength) {
      return html.substring(0, maxLength) + '\n<!-- truncated -->';
    }
    return html;
  } catch {
    return 'Failed to collect HTML';
  }
}

async function collectScreenshot(page: Page): Promise<string | undefined> {
  try {
    const buffer = await page.screenshot({ type: 'png', fullPage: false });
    return buffer.toString('base64');
  } catch {
    return undefined;
  }
}
