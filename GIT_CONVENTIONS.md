# Git Conventions

Standards for branching, commits, pull requests, and release workflow for this project.

---

## Branch Strategy

We use a **trunk-based** model with `main` as the single source of truth.

| Branch type | Pattern | Example |
|-------------|---------|---------|
| Feature | `feat/<short-description>` | `feat/task-search` |
| Bug fix | `fix/<short-description>` | `fix/date-picker-crash` |
| Refactor | `refactor/<short-description>` | `refactor/extract-api-client` |
| Docs | `docs/<short-description>` | `docs/add-setup-guide` |
| Chore | `chore/<short-description>` | `chore/upgrade-vite` |

Rules:
- Always branch from `main`.
- Keep branches short-lived (ideally < 2 days).
- Delete the branch after merging.
- Never push directly to `main` — use a pull request.

---

## Commit Messages

Follow the **Conventional Commits** format:

```
<type>: <description>

[optional body]
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | New feature or user-facing behavior |
| `fix` | Bug fix |
| `refactor` | Code restructure with no behavior change |
| `style` | Formatting, whitespace, missing semicolons |
| `docs` | Documentation only |
| `chore` | Build config, dependencies, tooling |
| `test` | Adding or updating tests |

### Rules

- Use **imperative mood** in the description: "Add search filter", not "Added search filter".
- Keep the subject line under **72 characters**.
- Do NOT end the subject with a period.
- Separate subject from body with a blank line (if body is needed).
- The body should explain **why**, not what (the diff shows the what).

### Examples

```
feat: add keyboard shortcut for task deletion

Pressing 'D' on a focused task now deletes it after confirmation.
Registered in useKeyboardShortcuts and KeyboardHelp.
```

```
fix: prevent crash when date field is empty
```

```
chore: bump concurrently to v9.1.0
```

---

## Pull Requests

### Before Opening a PR

1. Rebase on latest `main` — no merge commits in the PR.
2. Run the linter: `cd client && npx oxlint` (must be 0 errors).
3. Run the build: `cd client && npx vite build` (must succeed).
4. Test manually — verify the feature/fix works end-to-end.

### PR Title

Use the same format as commit messages:

```
feat: add full-text search to task list
```

### PR Description Template

```markdown
## What

Brief description of what this PR does.

## Why

Context or issue link explaining the motivation.

## How to Test

Steps to verify the change works:
1. Start the dev server (`npm run dev`)
2. ...

## Screenshots (if UI change)

Before / After screenshots or a short GIF.
```

### Merging

- Use **Squash and Merge** to keep `main` history clean.
- The squashed commit message should follow commit conventions.
- Delete the remote branch after merging.

---

## Workflow Summary

```
main ─────────────────────────────────────────────────►
      \                          /
       feat/task-search ────────► (squash merge via PR)
```

1. Pull latest `main`.
2. Create a branch: `git checkout -b feat/my-feature`.
3. Make small, focused commits as you work.
4. Push and open a PR when ready.
5. Address feedback, rebase if needed.
6. Squash merge into `main`.
7. Delete the branch.

---

## Dos and Don'ts

| ✅ Do | ❌ Don't |
|-------|----------|
| Write atomic commits (one logical change per commit) | Mix unrelated changes in one commit |
| Rebase feature branches on `main` | Merge `main` into your feature branch |
| Keep PRs small and focused | Open "mega PRs" with 20+ files |
| Write meaningful commit messages | Use "fix stuff" or "wip" as final messages |
| Delete branches after merge | Leave stale branches around |
| Use draft PRs for work-in-progress | Push half-done code to `main` |

---

## Git Configuration (Recommended)

```bash
# Rebase by default when pulling
git config pull.rebase true

# Prune deleted remote branches on fetch
git config fetch.prune true

# Default branch name
git config init.defaultBranch main
```
