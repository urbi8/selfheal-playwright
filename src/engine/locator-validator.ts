import type { Page, Locator } from '@playwright/test';
import type { HealingProposal } from './types.js';

export interface ValidatedProposal extends HealingProposal {
  locator: Locator;
}

export async function validateProposals(
  page: Page,
  proposals: HealingProposal[],
): Promise<ValidatedProposal | null> {
  for (const proposal of proposals) {
    try {
      const locator = resolveLocator(page, proposal);
      if (!locator) continue;

      const count = await locator.count();
      if (count !== 1) continue;

      const isVisible = await locator.isVisible().catch(() => false);
      if (!isVisible) continue;

      return { ...proposal, locator };
    } catch {
      // Selector syntax error or other issue, skip
      continue;
    }
  }
  return null;
}

function resolveLocator(page: Page, proposal: HealingProposal): Locator | null {
  switch (proposal.selectorType) {
    case 'role': {
      // Parse role selector: "button" or "button[name=\"Add\"]"
      const roleMatch = proposal.selector.match(/^(\w+)(?:\[name=["'](.+?)["']\])?$/);
      if (!roleMatch) return page.getByRole(proposal.selector as any);
      const [, role, name] = roleMatch;
      return name
        ? page.getByRole(role as any, { name })
        : page.getByRole(role as any);
    }
    case 'text':
      return page.getByText(proposal.selector);
    case 'label':
      return page.getByLabel(proposal.selector);
    case 'testid':
      return page.getByTestId(proposal.selector);
    case 'placeholder':
      return page.getByPlaceholder(proposal.selector);
    case 'css':
      return page.locator(proposal.selector);
    case 'xpath':
      return page.locator(`xpath=${proposal.selector}`);
    default:
      return page.locator(proposal.selector);
  }
}
