import type { Locator, Page } from '@playwright/test';
import type { Healer } from '../engine/healer.js';

const HEALABLE_ACTIONS = new Set([
  'click',
  'dblclick',
  'fill',
  'check',
  'uncheck',
  'selectOption',
  'hover',
  'focus',
  'press',
  'type',
  'setInputFiles',
  'tap',
  'scrollIntoViewIfNeeded',
  'waitFor',
  'isVisible',
  'isEnabled',
  'isChecked',
  'inputValue',
  'textContent',
  'innerText',
  'innerHTML',
  'getAttribute',
  'count',
]);

export function createSelfHealingLocator(
  locator: Locator,
  page: Page,
  healer: Healer,
  originalSelector: string,
  selectorType: string,
): Locator {
  return new Proxy(locator, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      if (typeof prop !== 'string' || !HEALABLE_ACTIONS.has(prop) || typeof value !== 'function') {
        return value;
      }

      return async (...args: unknown[]) => {
        try {
          // Happy path: run action directly
          return await (value as Function).apply(target, args);
        } catch (error: unknown) {
          // Only heal on timeout errors (element not found)
          if (!isTimeoutError(error)) {
            throw error;
          }

          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(`[selfheal] Action "${prop}" failed on "${originalSelector}": ${errorMessage.split('\n')[0]}`);

          const result = await healer.heal(page, originalSelector, selectorType, errorMessage);

          if (result.success && result.healedSelector && result.healedSelectorType) {
            // Resolve the healed locator and retry the action
            const healedLocator = resolveHealedLocator(page, result.healedSelector, result.healedSelectorType);
            return await (healedLocator as any)[prop](...args);
          }

          // Healing failed, rethrow original error
          throw error;
        }
      };
    },
  });
}

function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    error.name === 'TimeoutError' ||
    msg.includes('timeout') ||
    msg.includes('waiting for locator') ||
    msg.includes('locator resolved to') ||
    msg.includes('no element matches')
  );
}

function resolveHealedLocator(page: Page, selector: string, selectorType: string): Locator {
  switch (selectorType) {
    case 'role': {
      const roleMatch = selector.match(/^(\w+)(?:\[name=["'](.+?)["']\])?$/);
      if (!roleMatch) return page.getByRole(selector as any);
      const [, role, name] = roleMatch;
      return name ? page.getByRole(role as any, { name }) : page.getByRole(role as any);
    }
    case 'text':
      return page.getByText(selector);
    case 'label':
      return page.getByLabel(selector);
    case 'testid':
      return page.getByTestId(selector);
    case 'placeholder':
      return page.getByPlaceholder(selector);
    case 'css':
      return page.locator(selector);
    case 'xpath':
      return page.locator(`xpath=${selector}`);
    default:
      return page.locator(selector);
  }
}
