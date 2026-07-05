# Kiro Todo

A full-stack task management app built with React and Express. Designed for keyboard-first productivity with natural language input, a command palette, recurring tasks, subtasks, and focus mode.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-sql.js-003B57?logo=sqlite&logoColor=white)

---

## Features

### Task Management
- Create, edit, delete, and duplicate tasks
- Priority levels: Low, Medium, High, Critical
- Due dates with overdue indicators
- Categories and multi-tag assignment
- Subtasks with progress tracking
- Recurring tasks (daily, weekdays, weekly, monthly)
- Drag-to-reorder and bulk actions (batch complete/delete)
- Pinned tasks (persisted locally)

### Smart Input
Type tasks naturally — dates, priority, tags, and recurrence are parsed automatically:

```
Buy groceries tomorrow #errands
Finish report by friday important @work
Submit invoice every monday p1
```

### Command Palette (`Ctrl+K`)
Fuzzy-search commands to filter tasks, change views, create/edit/delete tasks, and toggle focus mode — all without touching the mouse.

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `j` / `k` | Navigate tasks down / up |
| `n` | New task |
| `x` | Toggle selected task status |
| `e` | Edit selected task |
| `dd` | Delete selected task |
| `/` | Focus search |
| `?` | Show shortcuts help |
| `Ctrl+K` | Command palette |
| `Esc` | Close / clear selection |

### Focus Mode
One-click toggle to show only today's pending and overdue tasks. An overdue badge in the header keeps you aware.

### Dark Mode
Three-way toggle: Light → Dark → System. Follows OS preference in system mode.

### Micro-Animations
- Confetti burst on completing high-priority tasks
- Smooth expand/collapse on create and delete
- Toast notifications with undo support

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS 4, Vite 8 |
| Backend | Express 4, Node.js |
| Database | sql.js (SQLite compiled to WASM) |
| Linter | oxlint |
| Dev Runner | concurrently |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repo
git clone https://github.com/kxnn02/kiro-todo-app.git
cd kiro-todo-app

# Install all dependencies (root, server, client)
npm run install:all
```

### Running

```bash
# Start both server + client
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3000

### Seed Sample Data

```bash
npm run seed
```

### Build for Production

```bash
cd client && npx vite build
```

Output goes to `client/dist/`.

---

## Project Structure

```
├── package.json                 # Root scripts (concurrently)
├── GIT_CONVENTIONS.md           # Branching & commit standards
├── CONTRIBUTING.md              # Dev workflow & feature checklist
├── GUIDE.md                     # Architecture deep-dive
├── BACKLOG.md                   # Sprint planning & ideas
├── client/                      # React + Tailwind + Vite
│   └── src/
│       ├── api/client.js        # Fetch-based REST client
│       ├── App.jsx              # Root state & orchestration
│       ├── components/          # UI components
│       ├── contexts/            # ThemeContext
│       └── hooks/               # useKeyboardShortcuts, useUndo
└── server/                      # Express + sql.js
    └── src/
        ├── index.js             # App entry, middleware, shutdown
        ├── db/database.js       # Schema, migrations, helpers
        ├── db/seed.js           # Sample data
        └── routes/              # tasks, categories, tags, subtasks
```

---

## API Reference

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (supports `status`, `priority`, `category_id`, `tag_id`, `search`, `sort_by`, `sort_order`) |
| GET | `/api/tasks/:id` | Get task with category, tags, and subtasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| PATCH | `/api/tasks/:id/status` | Toggle pending ↔ completed |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/batch` | Bulk complete/delete/move |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List all |
| POST | `/api/categories` | Create (unique name enforced) |
| PUT | `/api/categories/:id` | Update |
| DELETE | `/api/categories/:id` | Delete (tasks unlinked) |

### Tags

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tags` | List all |
| POST | `/api/tags` | Create |
| PUT | `/api/tags/:id` | Update |
| DELETE | `/api/tags/:id` | Delete (cascade) |

### Subtasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks/:id/subtasks` | Create subtask |
| PATCH | `/api/subtasks/:id` | Toggle or rename |
| DELETE | `/api/subtasks/:id` | Delete |

---

## Architecture

- **State management**: All app state in `App.jsx` — no Redux/Zustand. Components receive data + callbacks via props.
- **Styling**: Tailwind utility classes only. Dark mode via `dark:` variants.
- **Database**: sql.js runs SQLite in-memory with file persistence (`server/data/tasks.db`). Auto-saves on every write.
- **No auth**: Single-user app. No login required.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the development workflow and [GIT_CONVENTIONS.md](./GIT_CONVENTIONS.md) for branching and commit standards.

---

## License

This project is for personal/educational use.
