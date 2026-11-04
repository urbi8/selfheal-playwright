import express from 'express';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BreakageManager } from './breakage/breakage-manager.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const breakageManager = new BreakageManager();

app.use(express.json());

// Serve static files (CSS, JS) — index: false so our route handler serves index.html
app.use(express.static(join(__dirname, 'views'), { index: false }));

// In-memory todo store
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

let nextId = 1;
let todos: Todo[] = [];

// Serve HTML with breakage injection
app.get('/', (_req, res) => {
  let html = readFileSync(join(__dirname, 'views', 'index.html'), 'utf-8');
  const injection = breakageManager.getInjectionScript();
  html = html.replace('{{BREAKAGE_INJECTION}}', injection);
  res.type('html').send(html);
});

// Todo CRUD API
app.get('/api/todos', (_req, res) => {
  res.json(todos);
});

app.post('/api/todos', (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'text is required' });
    return;
  }
  const todo: Todo = { id: nextId++, text: text.trim(), completed: false };
  todos.push(todo);
  res.status(201).json(todo);
});

app.patch('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const todo = todos.find((t) => t.id === id);
  if (!todo) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  if (typeof req.body.completed === 'boolean') {
    todo.completed = req.body.completed;
  }
  if (typeof req.body.text === 'string') {
    todo.text = req.body.text.trim();
  }
  res.json(todo);
});

app.delete('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = todos.findIndex((t) => t.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  todos.splice(idx, 1);
  res.status(204).send();
});

// Reset todos (useful for tests)
app.post('/api/todos/reset', (_req, res) => {
  todos = [];
  nextId = 1;
  res.json({ ok: true });
});

// Breakage control API
app.get('/api/breakage', (_req, res) => {
  res.json(breakageManager.listAll());
});

app.post('/api/breakage/activate/:id', (req, res) => {
  const scenario = breakageManager.activate(req.params.id);
  if (!scenario) {
    res.status(404).json({ error: `Unknown scenario: ${req.params.id}` });
    return;
  }
  res.json({ activated: scenario.id, name: scenario.name });
});

app.post('/api/breakage/deactivate/:id', (req, res) => {
  const ok = breakageManager.deactivate(req.params.id);
  res.json({ deactivated: ok });
});

app.post('/api/breakage/reset', (_req, res) => {
  breakageManager.deactivateAll();
  res.json({ ok: true });
});

const PORT = parseInt(process.env.PORT ?? '3000', 10);
const server = app.listen(PORT, () => {
  console.log(`Demo todo app running at http://localhost:${PORT}`);
  console.log(`Breakage API: POST /api/breakage/activate/:id`);
});

export { app, server };
