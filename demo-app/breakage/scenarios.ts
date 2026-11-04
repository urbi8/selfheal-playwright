export interface BreakageScenario {
  id: string;
  name: string;
  description: string;
  /** Client-side JS that mutates the DOM to simulate breakage */
  mutationScript: string;
}

export const BREAKAGE_SCENARIOS: BreakageScenario[] = [
  {
    id: 'rename-ids',
    name: 'Rename IDs',
    description: 'Renames all element IDs by appending "-v2" suffix',
    mutationScript: `
      document.querySelectorAll('[id]').forEach(el => {
        el.id = el.id + '-v2';
      });
    `,
  },
  {
    id: 'rename-classes',
    name: 'Rename Classes',
    description: 'Renames CSS classes by replacing hyphens with underscores',
    mutationScript: `
      document.querySelectorAll('[class]').forEach(el => {
        const classes = [...el.classList];
        el.className = '';
        classes.forEach(c => el.classList.add(c.replace(/-/g, '_')));
      });
    `,
  },
  {
    id: 'remove-testids',
    name: 'Remove Test IDs',
    description: 'Strips all data-testid attributes',
    mutationScript: `
      document.querySelectorAll('[data-testid]').forEach(el => {
        el.removeAttribute('data-testid');
      });
    `,
  },
  {
    id: 'restructure-dom',
    name: 'Restructure DOM',
    description: 'Wraps todo items in extra container divs',
    mutationScript: `
      document.querySelectorAll('.todo-item').forEach(item => {
        const wrapper = document.createElement('div');
        wrapper.className = 'todo-item-wrapper';
        item.parentNode.insertBefore(wrapper, item);
        wrapper.appendChild(item);
      });
    `,
  },
  {
    id: 'change-text',
    name: 'Change Text',
    description: 'Changes button labels and placeholder text',
    mutationScript: `
      const addBtn = document.querySelector('#add-todo-btn');
      if (addBtn) addBtn.textContent = 'Submit';
      const input = document.querySelector('#new-todo-input');
      if (input) input.placeholder = 'Enter task...';
    `,
  },
  {
    id: 'full-redesign',
    name: 'Full Redesign',
    description: 'Renames IDs, removes test IDs, and changes text simultaneously',
    mutationScript: `
      document.querySelectorAll('[id]').forEach(el => {
        el.id = el.id + '-new';
      });
      document.querySelectorAll('[data-testid]').forEach(el => {
        el.removeAttribute('data-testid');
      });
      const addBtn = document.querySelector('[id$="-new"]');
      if (addBtn && addBtn.tagName === 'BUTTON') addBtn.textContent = 'Create';
    `,
  },
];
