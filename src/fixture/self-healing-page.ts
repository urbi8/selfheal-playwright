import type { Page, Locator } from '@playwright/test';
import type { Healer } from '../engine/healer.js';
import { createSelfHealingLocator } from './self-healing-locator.js';

const LOCATOR_METHODS: Record<string, string> = {
  locator: 'css',
  getByRole: 'role',
  getByText: 'text',
  getByLabel: 'label',
  getByTestId: 'testid',
  getByPlaceholder: 'placeholder',
  getByAltText: 'alt',
  getByTitle: 'title',
};

export function createSelfHealingPage(page: Page, healer: Healer): Page {
  return new Proxy(page, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      if (typeof prop !== 'string' || !LOCATOR_METHODS[prop] || typeof value !== 'function') {
        return value;
      }

      const selectorType = LOCATOR_METHODS[prop];

      return (...args: unknown[]) => {
        const locator: Locator = (value as Function).apply(target, args);

        // Build a human-readable selector string for logging
        const selectorString = buildSelectorString(prop, args);

        return createSelfHealingLocator(locator, target, healer, selectorString, selectorType);
      };
    },
  });
}

function buildSelectorString(method: string, args: unknown[]): string {
  if (method === 'locator') {
    return String(args[0]);
  }

  const primary = args[0];
  const options = args[1] as Record<string, unknown> | undefined;

  let selector = String(primary);
  if (options && typeof options === 'object') {
    const optParts = Object.entries(options)
      .map(([k, v]) => `${k}="${v}"`)
      .join(', ');
    if (optParts) selector += ` {${optParts}}`;
  }

  return `${method}(${selector})`;
}
