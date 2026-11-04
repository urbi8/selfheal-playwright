# selfheal-playwright

AI-powered self-healing for Playwright tests: repairs broken locators, triages failures, and measures its own accuracy.

## Architecture

When a Playwright test action fails because a locator can't find an element, the self-healing engine:

1. **Collects context** — ARIA snapshot, trimmed HTML, and a screenshot of the page
2. **Stage 1 (ARIA-only)** — Sends the ARIA tree to an LLM asking for fixed selectors (fast, cheap)
3. **Stage 2 (Vision fallback)** — If Stage 1 fails, sends HTML + screenshot for vision-based analysis
4. **Validates** — Tries each proposed selector on the live page, picks the first that resolves to exactly 1 visible element
5. **Records** — Stores the healing event in SQLite for dashboard reporting
6. **Classifies** — If healing fails entirely, classifies the failure as `flaky`, `app-bug`, or `test-bug`

### Key Design Decisions

- **`healPage` fixture** — Explicit opt-in via `test.extend()`, not overriding `page`
- **ES Proxy wrapping** — Zero overhead on happy path; LLM is only called when an action fails
- **Two-stage LLM** — Stage 1 uses ~200 tokens (ARIA only). Stage 2 adds vision only when needed
- **`node:sqlite`** — Uses Node.js built-in SQLite (Node 22+), no native compilation needed

## Quickstart

```bash
# Install dependencies
npm install

# Set your LLM API key
export OPENAI_API_KEY=sk-...
# or
export ANTHROPIC_API_KEY=sk-ant-...
export SELFHEAL_LLM_PROVIDER=anthropic

# Run the demo app
npm run demo

# Run tests (pass normally without healing)
npm test

# Activate breakage + run healing tests
npm run test:heal

# Generate dashboard
npm run dashboard
```

## Usage in Your Tests

```typescript
// Import from the selfheal fixture instead of @playwright/test
import { test, expect } from './src/fixture/self-healing-fixture.js';

test('my test', async ({ healPage }) => {
  await healPage.goto('/');
  // If this selector breaks, the framework will auto-heal it
  await healPage.locator('#my-button').click();
});
```

## Demo App

The bundled Express todo app at `demo-app/` includes toggleable "breakage modes":

| Scenario | Effect |
|---|---|
| `rename-ids` | Appends `-v2` to all element IDs |
| `rename-classes` | Replaces hyphens with underscores in CSS classes |
| `remove-testids` | Strips all `data-testid` attributes |
| `restructure-dom` | Wraps todo items in extra container divs |
| `change-text` | Changes button labels and placeholder text |
| `full-redesign` | Combines ID rename + testid removal + text changes |

Activate breakage via API:

```bash
curl -X POST http://localhost:3000/api/breakage/activate/rename-ids
curl -X POST http://localhost:3000/api/breakage/reset
```

## npm Scripts

| Script | Description |
|---|---|
| `npm run demo` | Start the demo Express todo app |
| `npm test` | Run base todo tests |
| `npm run test:heal` | Run healing tests (requires LLM API key) |
| `npm run test:all` | Run all tests |
| `npm run dashboard` | Generate HTML dashboard |
| `npm run dashboard:open` | Generate and open dashboard |
| `npm run build` | TypeScript compilation |

## Configuration

Set via environment variables or `selfheal.config.json`:

| Env Variable | Default | Description |
|---|---|---|
| `SELFHEAL_LLM_PROVIDER` | `openai` | `openai` or `anthropic` |
| `OPENAI_API_KEY` | — | OpenAI API key |
| `ANTHROPIC_API_KEY` | — | Anthropic API key |
| `SELFHEAL_LLM_MODEL` | auto | Model name (defaults per provider) |
| `SELFHEAL_HEALING_ENABLED` | `true` | Enable/disable healing |
| `SELFHEAL_HEALING_MAX_ATTEMPTS` | `3` | Max healing attempts |
| `SELFHEAL_HEALING_ENABLE_VISION` | `true` | Enable Stage 2 vision fallback |
| `SELFHEAL_STORE_PATH` | `.selfheal/healing.db` | SQLite database path |
| `SELFHEAL_DASHBOARD_OUTPUT` | `reports/dashboard.html` | Dashboard output path |
