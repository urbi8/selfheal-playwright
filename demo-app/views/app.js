// Client-side Todo App logic
(function () {
  const todoList = document.getElementById('todo-list');
  const newTodoInput = document.getElementById('new-todo-input');
  const addTodoBtn = document.getElementById('add-todo-btn');
  const emptyState = document.getElementById('empty-state');

  let todos = [];

  async function fetchTodos() {
    const res = await fetch('/api/todos');
    todos = await res.json();
    render();
  }

  async function addTodo() {
    const text = newTodoInput.value.trim();
    if (!text) return;

    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const todo = await res.json();
    todos.push(todo);
    newTodoInput.value = '';
    render();
  }

  async function toggleTodo(id) {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    const res = await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !todo.completed }),
    });
    const updated = await res.json();
    const idx = todos.findIndex((t) => t.id === id);
    if (idx !== -1) todos[idx] = updated;
    render();
  }

  async function deleteTodo(id) {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    todos = todos.filter((t) => t.id !== id);
    render();
  }

  function render() {
    todoList.innerHTML = '';
    emptyState.style.display = todos.length === 0 ? 'block' : 'none';

    todos.forEach((todo) => {
      const li = document.createElement('li');
      li.className = `todo-item${todo.completed ? ' completed' : ''}`;
      li.id = `todo-${todo.id}`;
      li.setAttribute('data-testid', `todo-item-${todo.id}`);
      li.setAttribute('aria-label', `Todo: ${todo.text}`);

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = todo.completed;
      checkbox.className = 'todo-checkbox';
      checkbox.setAttribute('data-testid', `todo-checkbox-${todo.id}`);
      checkbox.setAttribute('aria-label', `Mark "${todo.text}" as ${todo.completed ? 'incomplete' : 'complete'}`);
      checkbox.addEventListener('change', () => toggleTodo(todo.id));

      const span = document.createElement('span');
      span.className = 'todo-text';
      span.setAttribute('data-testid', `todo-text-${todo.id}`);
      span.textContent = todo.text;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.id = `delete-${todo.id}`;
      deleteBtn.setAttribute('data-testid', `delete-btn-${todo.id}`);
      deleteBtn.setAttribute('aria-label', `Delete "${todo.text}"`);
      deleteBtn.textContent = '×';
      deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(deleteBtn);
      todoList.appendChild(li);
    });
  }

  addTodoBtn.addEventListener('click', addTodo);
  newTodoInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTodo();
  });

  fetchTodos();
})();
