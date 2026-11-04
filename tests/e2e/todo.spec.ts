import { test, expect } from '../../src/fixture/self-healing-fixture.js';

test.describe('Todo App', () => {
  test.beforeEach(async ({ healPage, request }) => {
    // Reset state before each test
    await request.post('/api/todos/reset');
    await request.post('/api/breakage/reset');
    await healPage.goto('/');
  });

  test('should display the todo app', async ({ healPage }) => {
    await expect(healPage.locator('#app-title')).toHaveText('Todo App');
    await expect(healPage.locator('#new-todo-input')).toBeVisible();
    await expect(healPage.locator('#add-todo-btn')).toBeVisible();
  });

  test('should add a new todo', async ({ healPage }) => {
    await healPage.locator('#new-todo-input').fill('Buy groceries');
    await healPage.locator('#add-todo-btn').click();

    const todoItem = healPage.locator('.todo-item');
    await expect(todoItem).toHaveCount(1);
    await expect(todoItem.locator('.todo-text')).toHaveText('Buy groceries');
  });

  test('should complete a todo', async ({ healPage, request }) => {
    // Create a todo via API
    await request.post('/api/todos', { data: { text: 'Walk the dog' } });
    await healPage.goto('/');

    // Toggle completion
    const checkbox = healPage.locator('.todo-checkbox').first();
    await checkbox.check();

    await expect(healPage.locator('.todo-item').first()).toHaveClass(/completed/);
  });

  test('should delete a todo', async ({ healPage, request }) => {
    // Create a todo via API
    await request.post('/api/todos', { data: { text: 'Clean house' } });
    await healPage.goto('/');

    await expect(healPage.locator('.todo-item')).toHaveCount(1);

    // Delete it
    await healPage.locator('.delete-btn').first().click();

    await expect(healPage.locator('.todo-item')).toHaveCount(0);
  });

  test('should add multiple todos', async ({ healPage }) => {
    const items = ['First task', 'Second task', 'Third task'];

    for (let i = 0; i < items.length; i++) {
      await healPage.locator('#new-todo-input').fill(items[i]);
      await healPage.locator('#add-todo-btn').click();
      await expect(healPage.locator('.todo-item')).toHaveCount(i + 1);
    }
  });
});
