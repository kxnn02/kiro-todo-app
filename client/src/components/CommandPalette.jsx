import { useState, useEffect, useRef, useMemo, useCallback } from 'react'

/**
 * Fuzzy search: split query into chars, check if all chars appear in order
 * in the target string (case-insensitive). Returns match indices or null.
 */
function fuzzyMatch(query, target) {
  if (!query) return { match: true, indices: [] }
  const lowerTarget = target.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const indices = []
  let queryIdx = 0

  for (let i = 0; i < lowerTarget.length && queryIdx < lowerQuery.length; i++) {
    if (lowerTarget[i] === lowerQuery[queryIdx]) {
      indices.push(i)
      queryIdx++
    }
  }

  if (queryIdx === lowerQuery.length) {
    return { match: true, indices }
  }
  return null
}

/**
 * Renders text with matching characters highlighted.
 */
function HighlightedText({ text, indices }) {
  if (!indices || indices.length === 0) {
    return <span>{text}</span>
  }

  const indexSet = new Set(indices)
  const parts = []
  let current = ''
  let isHighlighted = false

  for (let i = 0; i < text.length; i++) {
    const charHighlighted = indexSet.has(i)
    if (charHighlighted !== isHighlighted) {
      if (current) {
        parts.push(
          isHighlighted
            ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-700 text-inherit rounded-sm px-0.5">{current}</mark>
            : <span key={i}>{current}</span>
        )
      }
      current = text[i]
      isHighlighted = charHighlighted
    } else {
      current += text[i]
    }
  }
  if (current) {
    parts.push(
      isHighlighted
        ? <mark key="last" className="bg-yellow-200 dark:bg-yellow-700 text-inherit rounded-sm px-0.5">{current}</mark>
        : <span key="last">{current}</span>
    )
  }

  return <>{parts}</>
}

/**
 * Icon components for different command types.
 */
function CommandIcon({ type }) {
  const iconClass = "w-4 h-4 flex-shrink-0"

  switch (type) {
    case 'new':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )
    case 'toggle':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'edit':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    case 'delete':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )
    case 'filter':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      )
    case 'clear':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    case 'tags':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
        </svg>
      )
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
  }
}

export default function CommandPalette({
  open,
  onClose,
  tasks = [],
  categories = [],
  tags: _tags = [],
  onNewTask,
  onToggleStatus,
  onEdit,
  onDelete,
  onDuplicate,
  onFilterChange,
  onManageTags,
  onToggleFocus,
  onSelectAll,
  onClearSelection,
  focusMode,
}) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Build all available commands
  const allCommands = useMemo(() => {
    const commands = []

    // Static commands
    commands.push({
      id: 'new-task',
      name: 'New Task',
      type: 'new',
      action: () => onNewTask?.(),
    })

    commands.push({
      id: 'manage-tags',
      name: 'Manage Tags',
      type: 'tags',
      action: () => onManageTags?.(),
    })

    commands.push({
      id: 'toggle-focus',
      name: focusMode ? 'Disable Focus Mode' : 'Enable Focus Mode',
      type: 'filter',
      action: () => onToggleFocus?.(),
    })

    commands.push({
      id: 'select-all',
      name: 'Select All Tasks',
      type: 'toggle',
      action: () => onSelectAll?.(),
    })

    commands.push({
      id: 'clear-selection',
      name: 'Clear All Selections',
      type: 'clear',
      action: () => onClearSelection?.(),
    })

    // Filter by priority
    const priorities = ['Critical', 'High', 'Medium', 'Low']
    for (const priority of priorities) {
      commands.push({
        id: `filter-priority-${priority.toLowerCase()}`,
        name: `Filter by Priority: ${priority}`,
        type: 'filter',
        action: () => onFilterChange?.({ priority: priority.toLowerCase() }),
      })
    }

    // Filter by status
    commands.push({
      id: 'filter-status-pending',
      name: 'Filter by Status: Pending',
      type: 'filter',
      action: () => onFilterChange?.({ status: 'pending' }),
    })
    commands.push({
      id: 'filter-status-completed',
      name: 'Filter by Status: Completed',
      type: 'filter',
      action: () => onFilterChange?.({ status: 'completed' }),
    })

    // Clear filters
    commands.push({
      id: 'clear-filters',
      name: 'Clear All Filters',
      type: 'clear',
      action: () => onFilterChange?.({ priority: '', status: '', category: '', search: '' }),
    })

    // Filter by category
    for (const category of categories) {
      commands.push({
        id: `filter-category-${category.id}`,
        name: `Filter by Category: ${category.name}`,
        type: 'filter',
        action: () => onFilterChange?.({ category: category.id }),
      })
    }

    // Task-specific commands
    for (const task of tasks) {
      commands.push({
        id: `toggle-${task.id}`,
        name: `Toggle Status: ${task.title}`,
        type: 'toggle',
        action: () => onToggleStatus?.(task.id),
      })
      commands.push({
        id: `edit-${task.id}`,
        name: `Edit: ${task.title}`,
        type: 'edit',
        action: () => onEdit?.(task),
      })
      commands.push({
        id: `delete-${task.id}`,
        name: `Delete: ${task.title}`,
        type: 'delete',
        action: () => onDelete?.(task.id),
      })
      commands.push({
        id: `duplicate-${task.id}`,
        name: `Duplicate: ${task.title}`,
        type: 'new',
        action: () => onDuplicate?.(task),
      })
    }

    return commands
  }, [tasks, categories, onNewTask, onToggleStatus, onEdit, onDelete, onDuplicate, onFilterChange, onManageTags, onToggleFocus, onSelectAll, onClearSelection, focusMode])

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      // Show top 8 commands when no query
      return allCommands.slice(0, 8).map((cmd) => ({ ...cmd, indices: [] }))
    }

    const results = []
    for (const cmd of allCommands) {
      const result = fuzzyMatch(query, cmd.name)
      if (result) {
        results.push({ ...cmd, indices: result.indices })
      }
    }
    return results
  }, [query, allCommands])

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      // Auto-focus input
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }, [open])

  // Clamp selected index when results change
  useEffect(() => {
    if (selectedIndex >= filteredCommands.length) {
      setSelectedIndex(Math.max(0, filteredCommands.length - 1))
    }
  }, [filteredCommands.length, selectedIndex])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex]
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  const executeCommand = useCallback((cmd) => {
    onClose?.()
    // Small delay to allow close animation
    setTimeout(() => {
      cmd.action()
    }, 50)
  }, [onClose])

  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose?.()
        break
      default:
        break
    }
  }, [filteredCommands, selectedIndex, executeCommand, onClose])

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose?.()
    }
  }, [onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 dark:bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="w-full max-w-lg mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          {/* Search icon */}
          <svg
            className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm outline-none"
            aria-label="Command search"
            aria-activedescendant={
              filteredCommands[selectedIndex]
                ? `cmd-${filteredCommands[selectedIndex].id}`
                : undefined
            }
            role="combobox"
            aria-expanded="true"
            aria-controls="command-list"
            aria-autocomplete="list"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <ul
          id="command-list"
          ref={listRef}
          role="listbox"
          className="max-h-80 overflow-y-auto py-2"
        >
          {filteredCommands.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No commands found
            </li>
          ) : (
            filteredCommands.slice(0, 10).map((cmd, index) => (
              <li
                key={cmd.id}
                id={`cmd-${cmd.id}`}
                role="option"
                aria-selected={index === selectedIndex}
                onClick={() => executeCommand(cmd)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                  index === selectedIndex
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <span
                  className={`${
                    index === selectedIndex
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  <CommandIcon type={cmd.type} />
                </span>
                <span className="flex-1 truncate">
                  <HighlightedText text={cmd.name} indices={cmd.indices} />
                </span>
                {index === selectedIndex && (
                  <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                    ↵
                  </kbd>
                )}
              </li>
            ))
          )}
        </ul>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">↑</kbd>
              <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">↵</kbd>
              select
            </span>
          </div>
          <span>{filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}
