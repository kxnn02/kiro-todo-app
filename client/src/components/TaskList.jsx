import { useState, useEffect, useRef, useMemo } from 'react'
import TaskCard from './TaskCard'
import OnboardingOverlay from './OnboardingOverlay'

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Newest' },
  { value: 'due_date', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'title', label: 'Title' },
]

function FreshAppIllustration() {
  return (
    <svg className="mx-auto h-20 w-20 text-amber-300 dark:text-amber-400/60" fill="none" stroke="currentColor" viewBox="0 0 64 64">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M32 8l4 12h12l-10 7 4 12-10-7-10 7 4-12-10-7h12z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M32 44v12M28 52h8" />
      <circle cx="18" cy="14" r="2" strokeWidth={1.2} />
      <circle cx="48" cy="20" r="1.5" strokeWidth={1.2} />
      <circle cx="12" cy="32" r="1" strokeWidth={1.2} />
    </svg>
  )
}

function FilteredOutIllustration() {
  return (
    <svg className="mx-auto h-20 w-20 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 64 64">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M8 12h48l-16 18v14l-8 4V30L8 12z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M44 44l8 8M44 52l8-8" />
    </svg>
  )
}

function AllCompletedIllustration() {
  return (
    <svg className="mx-auto h-20 w-20 text-emerald-300 dark:text-emerald-400/60" fill="none" stroke="currentColor" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="20" strokeWidth={1.2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 32l7 7 13-13" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M20 8l2 4M44 8l-2 4M12 20l4 2M52 20l-4 2M16 52l2-3M48 52l-2-3" />
    </svg>
  )
}

function getEmptyStateType(filters) {
  const hasActiveFilters = filters.status || filters.priority || filters.category_id || filters.tag_id || filters.search
  if (hasActiveFilters) {
    if (filters.status === 'pending') return 'all_completed'
    return 'filtered_out'
  }
  return 'fresh_app'
}

function EmptyState({ type }) {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('kiro-todo-onboarding-dismissed')
  })

  if (type === 'fresh_app') {
    if (showOnboarding) {
      return <OnboardingOverlay visible={true} onDismiss={() => {
        localStorage.setItem('kiro-todo-onboarding-dismissed', 'true')
        setShowOnboarding(false)
      }} />
    }
    return (
      <div className="text-center py-24 animate-fade-in">
        <FreshAppIllustration />
        <h3 className="mt-6 text-lg font-medium text-gray-700 dark:text-gray-200">Your task list is a blank canvas ✨</h3>
        <p className="mt-2 text-sm text-gray-400 dark:text-gray-500 max-w-xs mx-auto leading-relaxed">
          Add your first task above and let's get things rolling.
        </p>
      </div>
    )
  }
  if (type === 'filtered_out') {
    return (
      <div className="text-center py-24 animate-fade-in">
        <FilteredOutIllustration />
        <h3 className="mt-6 text-lg font-medium text-gray-700 dark:text-gray-200">Nothing here with those filters 🔍</h3>
        <p className="mt-2 text-sm text-gray-400 dark:text-gray-500 leading-relaxed">Try loosening things up or clearing your filters.</p>
      </div>
    )
  }
  return (
    <div className="text-center py-24 animate-fade-in">
      <AllCompletedIllustration />
      <h3 className="mt-6 text-lg font-medium text-gray-700 dark:text-gray-200">All clear! Nothing pending 🎉</h3>
      <p className="mt-2 text-sm text-gray-400 dark:text-gray-500 leading-relaxed">You crushed it. Go enjoy a coffee or add more tasks.</p>
    </div>
  )
}

// Section header for grouped view
function SectionHeader({ label, count, color, collapsed, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 py-2 px-1 group"
    >
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">({count})</span>
      <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700/50 ml-2" />
      <svg className={`w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-transform ${collapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
}

export default function TaskList({
  tasks, loading, filters, categories, tags,
  onFilterChange, onToggleStatus, onEdit, onDelete, onDuplicate,
  selectedIndex, newTaskId, selectedTaskIds, onToggleSelect, onSelectAll,
  onToggleSubtask, onAddSubtask, pinnedIds, onTogglePin, onOpenDetail, onInlineEdit, onQuickDate
}) {
  const listRef = useRef(null)
  const [searchInput, setSearchInput] = useState(filters.search || '')
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('taskViewMode') || 'grouped')
  const [collapsedSections, setCollapsedSections] = useState({ completed: true })

  // Persist view mode
  useEffect(() => { localStorage.setItem('taskViewMode', viewMode) }, [viewMode])

  useEffect(() => { setSearchInput(filters.search || '') }, [filters.search])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (filters.search || '')) {
        onFilterChange({ ...filters, search: searchInput })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput]) // eslint-disable-line

  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const cards = listRef.current.querySelectorAll('[data-task-card]')
      if (cards[selectedIndex]) {
        cards[selectedIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [selectedIndex])

  const updateFilter = (key, value) => { onFilterChange({ ...filters, [key]: value }) }
  const hasActiveFilters = filters.status || filters.priority || filters.category_id || filters.tag_id || filters.search

  // Group tasks by time context
  const groupedTasks = useMemo(() => {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const endOfWeek = new Date(now)
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()))
    const endOfWeekStr = endOfWeek.toISOString().split('T')[0]

    const groups = {
      overdue: [],
      today: [],
      upcoming: [],
      later: [],
      noDate: [],
      completed: [],
    }

    for (const task of tasks) {
      if (task.status === 'completed') {
        groups.completed.push(task)
      } else if (!task.due_date) {
        groups.noDate.push(task)
      } else if (task.due_date < todayStr) {
        groups.overdue.push(task)
      } else if (task.due_date === todayStr) {
        groups.today.push(task)
      } else if (task.due_date <= endOfWeekStr) {
        groups.upcoming.push(task)
      } else {
        groups.later.push(task)
      }
    }
    return groups
  }, [tasks])

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-3">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-amber-100 dark:border-gray-700 border-t-amber-500 dark:border-t-amber-400" />
        <p className="text-sm text-gray-400 dark:text-gray-500">Fetching your tasks...</p>
      </div>
    )
  }

  const pendingCount = tasks.filter(t => t.status === 'pending').length

  const renderTaskCard = (task, index) => (
    <div
      key={task.id}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', String(task.id))
        e.currentTarget.style.opacity = '0.4'
      }}
      onDragEnd={(e) => { e.currentTarget.style.opacity = '1' }}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        e.currentTarget.style.borderTop = '2px solid #f59e0b'
      }}
      onDragLeave={(e) => { e.currentTarget.style.borderTop = '' }}
      onDrop={(e) => {
        e.preventDefault()
        e.currentTarget.style.borderTop = ''
        const draggedId = Number(e.dataTransfer.getData('text/plain'))
        if (draggedId && draggedId !== task.id) {
          fetch(`/api/tasks/${draggedId}/reorder`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ position: task.position || index })
          }).then(() => onFilterChange({ ...filters }))
        }
      }}
    >
      <TaskCard
        task={task}
        onToggleStatus={onToggleStatus}
        onEdit={onEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        isNew={task.id === newTaskId}
        isSelected={index === selectedIndex}
        selected={selectedTaskIds?.has(task.id)}
        onSelect={() => onToggleSelect?.(task.id)}
        onToggleSubtask={onToggleSubtask}
        onAddSubtask={onAddSubtask}
        isPinned={pinnedIds?.has(task.id)}
        onTogglePin={onTogglePin}
        onOpenDetail={onOpenDetail}
        onInlineEdit={onInlineEdit}
        onQuickDate={onQuickDate}
      />
    </div>
  )

  const renderGroupedView = () => {
    const sections = [
      { key: 'overdue', label: 'Overdue', color: 'bg-red-500', tasks: groupedTasks.overdue },
      { key: 'today', label: 'Today', color: 'bg-amber-500', tasks: groupedTasks.today },
      { key: 'upcoming', label: 'This Week', color: 'bg-blue-500', tasks: groupedTasks.upcoming },
      { key: 'later', label: 'Later', color: 'bg-gray-400', tasks: groupedTasks.later },
      { key: 'noDate', label: 'No Date', color: 'bg-gray-300 dark:bg-gray-600', tasks: groupedTasks.noDate },
      { key: 'completed', label: 'Completed', color: 'bg-emerald-500', tasks: groupedTasks.completed },
    ]

    let globalIndex = 0

    return (
      <div ref={listRef} className="space-y-1">
        {sections.map(section => {
          if (section.tasks.length === 0) return null
          const isCollapsed = collapsedSections[section.key]
          const startIndex = globalIndex
          if (!isCollapsed) globalIndex += section.tasks.length
          else globalIndex += 0

          return (
            <div key={section.key} className="mb-4">
              <SectionHeader
                label={section.label}
                count={section.tasks.length}
                color={section.color}
                collapsed={isCollapsed}
                onToggle={() => toggleSection(section.key)}
              />
              {!isCollapsed && (
                <div className="space-y-2 mt-1 animate-fade-in">
                  {section.tasks.map((task, idx) => renderTaskCard(task, startIndex + idx))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderFlatView = () => {
    return (
      <div ref={listRef} className="space-y-2.5">
        {tasks.map((task, index) => renderTaskCard(task, index))}
      </div>
    )
  }

  return (
    <div>
      {/* Search input */}
      <div className="mb-5 relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search tasks..."
          className="w-full pl-11 pr-11 py-3 text-sm bg-amber-50/50 dark:bg-gray-800/60 border border-amber-100 dark:border-gray-700 rounded-full text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-300/50 focus:border-amber-200 dark:focus:ring-amber-500/30 dark:focus:border-gray-600 outline-none transition-all"
          aria-label="Search tasks"
        />
        {searchInput && (
          <button
            onClick={() => { setSearchInput(''); onFilterChange({ ...filters, search: '' }) }}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter bar + View toggle */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <select value={filters.status} onChange={e => updateFilter('status', e.target.value)} className="px-3 py-1.5 text-xs font-medium border border-gray-150 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-amber-300/50 outline-none transition-all cursor-pointer hover:border-amber-200 dark:hover:border-gray-600" aria-label="Filter by status">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>

          <select value={filters.priority} onChange={e => updateFilter('priority', e.target.value)} className="px-3 py-1.5 text-xs font-medium border border-gray-150 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-amber-300/50 outline-none transition-all cursor-pointer hover:border-amber-200 dark:hover:border-gray-600" aria-label="Filter by priority">
            <option value="">All Priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <select value={filters.tag_id} onChange={e => updateFilter('tag_id', e.target.value)} className="px-3 py-1.5 text-xs font-medium border border-gray-150 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-amber-300/50 outline-none transition-all cursor-pointer hover:border-amber-200 dark:hover:border-gray-600" aria-label="Filter by tag">
            <option value="">All Tags</option>
            {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>

          {categories && categories.length > 0 && (
            <select value={filters.category_id} onChange={e => updateFilter('category_id', e.target.value)} className="px-3 py-1.5 text-xs font-medium border border-gray-150 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-amber-300/50 outline-none transition-all cursor-pointer hover:border-amber-200 dark:hover:border-gray-600" aria-label="Filter by category">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}

          {hasActiveFilters && (
            <button onClick={() => { setSearchInput(''); onFilterChange({ ...filters, status: '', priority: '', category_id: '', tag_id: '', search: '' }) }} className="px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors font-medium">
              Clear all
            </button>
          )}
        </div>

        <div className="flex-1" />

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full p-0.5">
          <button
            onClick={() => setViewMode('grouped')}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${viewMode === 'grouped' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            aria-label="Grouped view"
            title="Group by time"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            aria-label="List view"
            title="Flat list"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>

        {viewMode === 'list' && (
          <div className="flex items-center gap-1">
            <select value={filters.sort_by} onChange={e => updateFilter('sort_by', e.target.value)} className="px-3 py-1.5 text-xs font-medium border border-gray-150 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-amber-300/50 outline-none transition-all cursor-pointer" aria-label="Sort by">
              {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <button onClick={() => updateFilter('sort_order', filters.sort_order === 'asc' ? 'desc' : 'asc')} className="p-1.5 rounded-full hover:bg-amber-50 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 transition-colors" aria-label="Toggle sort order">
              {filters.sort_order === 'asc' ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Task content */}
      {tasks.length === 0 ? (
        <EmptyState type={getEmptyStateType(filters)} />
      ) : (
        <>
          {/* Summary bar */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {pendingCount === 0 ? 'All clear! 🎉' : pendingCount === 1 ? '1 task to go' : `${pendingCount} tasks to go`}
              {groupedTasks.overdue.length > 0 && (
                <span className="ml-2 text-red-500 dark:text-red-400 font-medium">· {groupedTasks.overdue.length} overdue</span>
              )}
            </p>
            {selectedTaskIds && selectedTaskIds.size > 0 && onSelectAll && (
              <button onClick={onSelectAll} className="text-xs text-gray-400 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                {selectedTaskIds.size === tasks.length ? 'Deselect all' : `Select all (${tasks.length})`}
              </button>
            )}
          </div>

          {/* Render based on view mode */}
          {viewMode === 'grouped' ? renderGroupedView() : renderFlatView()}
        </>
      )}
    </div>
  )
}
