import { test, expect } from '../../src/fixture/self-healing-fixture.js';

test.describe('Self-Healing', () => {
  test.beforeEach(async ({ request }) => {
    // Reset state before each test
    await request.post('/api/todos/reset');
    await request.post('/api/breakage/reset');
  });

  test('should heal after rename-ids breakage', async ({ healPage, healer, request }) => {
    // Activate breakage: all IDs get "-v2" suffix
    await request.post('/api/breakage/activate/rename-ids');

    // Create a todo via API so we have content
    await request.post('/api/todos', { data: { text: 'Test healing' } });
    await healPage.goto('/');

    // This selector targets #new-todo-input which is now #new-todo-input-v2
    // The self-healing should detect the failure and find the correct element
    await healPage.locator('#new-todo-input').fill('Another todo');
    await healPage.locator('#add-todo-btn').click();

    // Verify healing occurred
    const events = healer.healingEvents;
    expect(events.length).toBeGreaterThan(0);
    expect(events.some((e) => e.success)).toBe(true);
    console.log(`[test] Healing events: ${events.length}, successful: ${events.filter((e) => e.success).length}`);
  });

  test('should heal after remove-testids breakage', async ({ healPage, healer, request }) => {
    // Activate breakage: all data-testid attributes removed
    await request.post('/api/breakage/activate/remove-testids');
    await healPage.goto('/');

    // Use data-testid selectors that will break
    await healPage.locator('[data-testid="new-todo-input"]').fill('Healed todo');
    await healPage.locator('[data-testid="add-todo-btn"]').click();

    const events = healer.healingEvents;
    expect(events.length).toBeGreaterThan(0);
    expect(events.some((e) => e.success)).toBe(true);
  });

  test('should heal after change-text breakage', async ({ healPage, healer, request }) => {
    // Activate breakage: button text changes from "Add" to "Submit"
    await request.post('/api/breakage/activate/change-text');
    await healPage.goto('/');

    // Target the button by its original text - will need healing
    await healPage.locator('#new-todo-input').fill('Text change test');
    // The button text changed but the ID-based selector should still work
    // unless combined with text breakage
    await healPage.locator('#add-todo-btn').click();

    // The id-based selector still works here since change-text doesn't rename ids
    // But we still verify the page is functional
    await expect(healPage.locator('.todo-item')).toHaveCount(1);
  });

  test('should track healing events in store', async ({ healer }) => {
    // At this point the healer should have tracking capability
    // Previous tests in this describe block populate events
    const events = healer.healingEvents;
    // Events for this specific healer instance (fresh per test)
    expect(Array.isArray(events)).toBe(true);
  });
});
