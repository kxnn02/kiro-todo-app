# Kiro Todo v2 — Project Guide

## Quick Start

```bash
npm run install:all    # Install all dependencies
npm run seed           # Seed sample data into the DB
npm run dev            # Start both server (port 3000) + client (port 5173)
```

Open http://localhost:5173

---

## Architecture

```
kiro-todo-v2/
├── client/                  # React 19 + Tailwind CSS 4 + Vite 8
│   └── src/
│       ├── api/client.js    # REST client (fetch wrapper)
│       ├── components/      # UI components
│       ├── contexts/        # ThemeContext (dark/light/system)
│       ├── hooks/           # useKeyboardShortcuts, useUndo
│       ├── App.jsx          # Root: state, data fetching, routing
│       └── index.css        # Tailwind + custom animations
├── server/                  # Express 4 + sql.js (SQLite in-memory)
│   └── src/
│       ├── db/database.js   # SQL.js init + schema
│       ├── db/seed.js       # Sample data seeder
│       ├── routes/          # /api/tasks, /api/categories, /api/tags
│       └── index.js         # Express app setup
└── package.json             # Root scripts (concurrently)
```

**Data flow:** Components → App.jsx (state) → api/client.js → Express API → sql.js (SQLite)

---

## Tech Stack & Conventions

| Layer | Tech | Notes |
|-------|------|-------|
| UI | React 19 | Functional components, hooks only |
| Styling | Tailwind CSS 4 | `@import "tailwindcss"` + `@custom-variant dark` |
| Build | Vite 8 | Proxy `/api` → localhost:3000 |
| Lint | oxlint | Config in `.oxlintrc.json` |
| Backend | Express 4 | JSON REST API, no auth |
| DB | sql.js | SQLite in-memory, file-persisted in `server/data/tasks.db` |

**Code style:**
- No TypeScript (plain JSX)
- No external state management (useState/useEffect only)
- Tailwind utility classes inline (no CSS modules)
- Dark mode via `.dark` class on `<html>` + `dark:` variants
- Component files: PascalCase (TaskCard.jsx)
- Hook files: camelCase (useUndo.jsx)

---

## Current Features (Implemented)

1. ✅ CRUD tasks with title, description, due date, priority, category, tags
2. ✅ Dark/light theme with system preference detection
3. ✅ Micro-animations (confetti on High/Critical completion, collapse/expand)
4. ✅ Keyboard shortcuts (j/k/n/x/e/dd/?/Ctrl+K)
5. ✅ Contextual empty states (fresh app / filtered out / all completed)
6. ✅ Command palette (Ctrl+K) with fuzzy search
7. ✅ Undo toast for delete and status toggle
8. ✅ Task energy system (Small/Medium/Large → 1/2/3 pts, 10pt daily budget)
9. ✅ Smart NLP input (parses dates, priority, tags, energy from text)
10. ✅ Categories with color coding
11. ✅ Tags with color coding
12. ✅ Filter + sort controls
13. ✅ Responsive sidebar with mobile overlay

---

## Suggested Improvements (Prioritized)

### High Impact — Do These Next

| # | Feature | Effort | Why |
|---|---------|--------|-----|
| 1 | **Search / Full-text filter** | Small | Users can't find tasks by title/description without scrolling |
| 2 | **Drag-and-drop reorder** | Medium | Manual ordering is essential for prioritization workflows |
| 3 | **Subtasks / Checklists** | Medium | Break large tasks into actionable steps |
| 4 | **Due date reminders (visual)** | Small | Tasks due today/tomorrow should be highlighted in a "Focus" view |
| 5 | **Recurring tasks** | Medium | "Every Monday" type tasks are extremely common |
| 6 | **Bulk actions** | Small | Select multiple → complete/delete/move to category |

### Medium Impact — Quality of Life

| # | Feature | Effort | Why |
|---|---------|--------|-----|
| 7 | **Persistent user preferences** | Small | Remember sidebar open state, last sort/filter, view mode |
| 8 | **Board/Kanban view** | Medium | Visual status columns (Pending → In Progress → Done) |
| 9 | **Task detail panel** | Small | Click to expand full description, activity log, attachments |
| 10 | **Relative time display** | Tiny | "2 hours ago" instead of "Jul 3, 2026" for created_at |
| 11 | **Onboarding tooltip tour** | Small | Help new users discover keyboard shortcuts and NLP input |
| 12 | **Export/Import (JSON/CSV)** | Small | Backup and portability |

### Low Priority — Nice to Have

| # | Feature | Effort | Why |
|---|---------|--------|-----|
| 13 | Multiple boards/projects | Large | Separate task lists per project |
| 14 | Collaboration (multi-user) | Large | Requires auth, WebSockets, conflict resolution |
| 15 | Mobile native (PWA) | Medium | Service worker, offline support, push notifications |
| 16 | AI task suggestions | Medium | Auto-prioritize, suggest due dates based on history |

---

## Known Technical Debt

1. **No TypeScript** — Types would catch prop mismatches and API contract drift
2. **No tests** — Add Vitest + Testing Library for component/integration tests
3. **No API validation** — Server accepts anything; add Zod/Joi schemas
4. **In-memory DB** — sql.js persists to disk but isn't crash-safe; consider better-sqlite3
5. **No auth** — Single-user only; add JWT/session if going multi-user
6. **Large bundle** — CommandPalette + SmartInput are big; consider code-splitting with React.lazy
7. **No error boundaries per section** — One ErrorBoundary wraps everything; granular boundaries needed

---

## API Reference

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | /api/tasks?status=&priority=&sort_by=&sort_order= | — | List tasks (with filters) |
| GET | /api/tasks/:id | — | Get single task |
| POST | /api/tasks | `{ title, description, due_date, priority, category_id, tag_ids, energy_size }` | Create task |
| PUT | /api/tasks/:id | same as POST | Update task |
| PATCH | /api/tasks/:id/status | — | Toggle completed/pending |
| DELETE | /api/tasks/:id | — | Delete task |
| GET | /api/categories | — | List categories |
| POST | /api/categories | `{ name, color }` | Create category |
| PUT | /api/categories/:id | `{ name, color }` | Update category |
| DELETE | /api/categories/:id | — | Delete category |
| GET | /api/tags | — | List tags |
| POST | /api/tags | `{ name, color }` | Create tag |
| PUT | /api/tags/:id | `{ name, color }` | Update tag |
| DELETE | /api/tags/:id | — | Delete tag |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `j` / `k` | Navigate tasks down/up |
| `n` | New task (opens form) |
| `x` | Toggle selected task status |
| `e` | Edit selected task |
| `d` `d` | Delete selected task (press twice) |
| `?` | Show shortcuts help |
| `Ctrl+K` | Open command palette |
| `Esc` | Deselect / close modals |

---

## File Ownership Quick Reference

When making changes, here's where things live:

- **Add a new task field?** → `TaskForm.jsx` + `TaskCard.jsx` + `server/routes/tasks.js` + DB schema
- **Change filters?** → `TaskList.jsx` (UI) + `App.jsx` (state) + `server/routes/tasks.js` (query)
- **Add a command?** → `CommandPalette.jsx` (commands array)
- **Add a keyboard shortcut?** → `hooks/useKeyboardShortcuts.js` + `KeyboardHelp.jsx`
- **Change theme colors?** → Just use Tailwind `dark:` variants; no separate theme file
- **Add an animation?** → `index.css` (keyframes) + component (class)
