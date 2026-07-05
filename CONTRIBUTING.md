# Development Workflow

## Running Locally

```bash
npm run dev          # Starts server + client concurrently
```

If you need separate terminals:
```bash
# Terminal 1
cd server && npm run dev     # API on :3000 (auto-restarts on file change)

# Terminal 2
cd client && npm run dev     # UI on :5173 (HMR, proxies /api to :3000)
```

## Building for Production

```bash
cd client && npx vite build  # Output in client/dist/
```

## Linting

```bash
cd client && npx oxlint      # Fast Rust-based linter
```

Acceptable warnings (non-blocking):
- `only-export-components` — hooks co-exported with components (HMR limitation, harmless)

## Adding a New Feature (Checklist)

1. [ ] Add DB column if needed (`server/src/db/database.js` schema)
2. [ ] Update API route (`server/src/routes/tasks.js`)
3. [ ] Update API client (`client/src/api/client.js`)
4. [ ] Update form (`TaskForm.jsx`) if user-facing input
5. [ ] Update display (`TaskCard.jsx` or `TaskList.jsx`)
6. [ ] Add to command palette if it's an action (`CommandPalette.jsx`)
7. [ ] Add keyboard shortcut if appropriate (`useKeyboardShortcuts.js` + `KeyboardHelp.jsx`)
8. [ ] Add dark mode variants (`dark:` classes)
9. [ ] Run `npx oxlint` — must be 0 errors
10. [ ] Run `npx vite build` — must succeed

## Component Patterns

**State management:** All app state lives in `App.jsx`. Components receive data + callbacks via props. No Redux/Zustand/Context for data (only ThemeContext for theme).

**Styling:** Inline Tailwind classes only. No CSS modules, no styled-components. Use `dark:` variants for dark mode.

**Animations:** Define `@keyframes` in `index.css`, apply via `.animate-*` utility classes or inline Tailwind transition classes.

**Forms:** Controlled inputs with local state in the form component. Submit handler calls parent callback (which calls API).

**Error handling:** API errors caught in `App.jsx` and shown via the error banner. Form-level errors shown inline.

## Git Conventions

- Branch from `main` for features: `feat/search-filter`
- Commit messages: imperative mood, concise (`Add full-text search to task list`)
- Keep PRs focused (one feature or fix per PR)
