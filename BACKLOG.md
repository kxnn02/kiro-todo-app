# Backlog — Next Up

Prioritized list of what to build next. Pick from the top.

## Sprint 1: Core UX Gaps

### 1. Full-text search
- Add search input above filter bar (or integrate into SmartInput)
- Server: add `search` query param to GET /api/tasks (LIKE on title + description)
- Client: debounced search input, highlight matches in results

### 2. "Focus" view (Today / This Week)
- New filter preset: show tasks due today or overdue
- Header quick-toggle: "Focus" button that sets status=pending + due_date <= today
- Badge showing count of overdue tasks

### 3. Drag-and-drop reorder
- Add `position` column to tasks table
- Implement drag handle on TaskCard (use @dnd-kit/core — lightweight, accessible)
- PATCH /api/tasks/:id/reorder endpoint
- Optimistic UI update on drop

### 4. Subtasks / Checklists
- Add `subtasks` table (parent_task_id, title, completed, position)
- Show checklist progress bar on TaskCard (e.g., "3/5")
- Inline add/toggle subtasks in task detail or expanded card
- API: POST /api/tasks/:id/subtasks, PATCH /api/subtasks/:id

### 5. Bulk actions
- Checkbox mode: hold Shift or click checkbox column
- Floating action bar: "X selected — Complete | Delete | Move to..."
- Server: batch endpoints (PATCH /api/tasks/batch)

---

## Sprint 2: Polish & Reliability

### 6. Add Vitest + Testing Library
- Unit tests for `parseNaturalInput` (easy win, pure function)
- Component tests for TaskCard, SmartInput, CommandPalette
- Integration test for create → display → delete flow

### 7. TypeScript migration
- Start with `tsconfig.json` + rename one file at a time
- Add API response types
- Gradually type all components

### 8. Recurring tasks
- New field: `recurrence` (daily, weekly, specific days)
- On completion, auto-create next occurrence
- Show recurrence icon on TaskCard

### 9. PWA / Offline support
- Add service worker via vite-plugin-pwa
- Cache API responses for offline viewing
- Queue mutations for sync when back online

---

## Ideas Parking Lot (Not Yet Prioritized)
- Calendar view (month grid with task dots)
- Time tracking per task
- Markdown in descriptions
- File attachments
- Activity log / audit trail
- Pomodoro timer integration
- Weekly email digest
- Natural language date input in the date picker field itself
