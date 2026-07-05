import { useState, useEffect, useCallback, useMemo } from 'react'
import { categoriesApi, tagsApi, tasksApi, subtasksApi } from './api/client'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import TaskList from './components/TaskList'
import TaskForm from './components/TaskForm'
import TagManager from './components/TagManager'
import ErrorBoundary from './components/ErrorBoundary'
import CommandPalette from './components/CommandPalette'
import KeyboardHelp from './components/KeyboardHelp'
import SmartInput from './components/SmartInput'
import BulkActionBar from './components/BulkActionBar'
import TaskDetailPanel from './components/TaskDetailPanel'
import useUndo from './hooks/useUndo.jsx'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

function App() {
  // Data state
  const [tasks, setTasks] = useState([])
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [showTagManager, setShowTagManager] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [newTaskId, setNewTaskId] = useState(null)

  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category_id: '',
    tag_id: '',
    sort_by: 'created_at',
    sort_order: 'desc',
    search: '',
  })

  // Focus mode state
  const [focusMode, setFocusMode] = useState(false)

  // Detail panel state (#2)
  const [detailTask, setDetailTask] = useState(null)

  // Pinned tasks state - client-side via localStorage (#7)
  const [pinnedIds, setPinnedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('pinnedTasks') || '[]')) } catch { return new Set() }
  })

  // Undo system
  const { toast, showToast, handleDeleteWithUndo, handleToggleWithUndo } = useUndo()

  // Bulk selection state
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set())

  // Sorted tasks - completed to bottom, pinned to top (#12)
  const sortedTasks = useMemo(() => {
    const pinned = tasks.filter(t => pinnedIds.has(t.id) && t.status !== 'completed')
    const pending = tasks.filter(t => !pinnedIds.has(t.id) && t.status !== 'completed')
    const completed = tasks.filter(t => t.status === 'completed')
    return [...pinned, ...pending, ...completed]
  }, [tasks, pinnedIds])

  // Calculate overdue count (uses original tasks)
  const overdueCount = useMemo(() => {
    return tasks.filter(t =>
      t.status === 'pending' && t.due_date && new Date(t.due_date) < new Date(new Date().toDateString())
    ).length
  }, [tasks])

  // Pin/star toggle handler (#7)
  const handleTogglePin = (id) => {
    setPinnedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem('pinnedTasks', JSON.stringify([...next]))
      return next
    })
  }

  // Detail panel handlers (#2)
  const handleOpenDetail = (task) => setDetailTask(task)
  const handleCloseDetail = () => setDetailTask(null)

  // Inline title edit handler (#11)
  const handleInlineEditTitle = async (id, newTitle) => {
    if (!newTitle.trim()) return
    try {
      const task = tasks.find(t => t.id === id)
      if (task) {
        await tasksApi.update(id, { title: newTitle.trim(), description: task.description, due_date: task.due_date, priority: task.priority, category_id: task.category_id, tag_ids: task.tags?.map(t => t.id) || [] })
        await fetchTasks()
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleQuickDate = async (id, dateString) => {
    try {
      const task = tasks.find(t => t.id === id)
      if (task) {
        await tasksApi.update(id, { title: task.title, description: task.description, due_date: dateString, priority: task.priority, category_id: task.category_id, tag_ids: task.tags?.map(t => t.id) || [] })
        await fetchTasks()
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleToggleSelect = (taskId) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedTaskIds.size === tasks.length) {
      setSelectedTaskIds(new Set())
    } else {
      setSelectedTaskIds(new Set(tasks.map(t => t.id)))
    }
  }

  const handleBulkComplete = async () => {
    try {
      await tasksApi.batchAction('complete', [...selectedTaskIds])
      setSelectedTaskIds(new Set())
      await fetchTasks()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedTaskIds.size} task${selectedTaskIds.size > 1 ? 's' : ''}? This cannot be undone.`)) return
    try {
      await tasksApi.batchAction('delete', [...selectedTaskIds])
      setSelectedTaskIds(new Set())
      await fetchTasks()
    } catch (err) {
      setError(err.message)
    }
  }

  // Subtask handlers
  const handleToggleSubtask = async (subtaskId) => {
    try {
      const subtask = tasks.flatMap(t => t.subtasks || []).find(s => s.id === subtaskId)
      if (subtask) {
        await subtasksApi.toggle(subtaskId, !!subtask.completed)
        await fetchTasks()
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleAddSubtask = async (taskId, title) => {
    try {
      await subtasksApi.create(taskId, { title })
      await fetchTasks()
    } catch (err) {
      setError(err.message)
    }
  }

  // Clear bulk selection when filters or focus mode change
  useEffect(() => {
    setSelectedTaskIds(new Set())
  }, [filters, focusMode])

  // Task duplication
  const handleDuplicateTask = async (task) => {
    try {
      await tasksApi.create({
        title: task.title + ' (copy)',
        description: task.description || '',
        due_date: task.due_date || null,
        priority: task.priority || 'Medium',
        category_id: task.category_id || null,
        tag_ids: task.tags?.map(t => t.id) || [],
        energy_size: task.energy_size || 'Medium',
      })
      await fetchTasks()
      showToast({ message: 'Task duplicated', duration: 2000 })
    } catch (err) {
      setError(err.message)
    }
  }

  // Fetch functions
  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoriesApi.getAll()
      setCategories(data)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  const fetchTags = useCallback(async () => {
    try {
      const data = await tagsApi.getAll()
      setTags(data)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  const fetchTasks = useCallback(async () => {
    try {
      const params = { ...filters }

      // In focus mode, force pending status and add due_before with today's date
      if (focusMode) {
        params.status = 'pending'
        const today = new Date()
        const yyyy = today.getFullYear()
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const dd = String(today.getDate()).padStart(2, '0')
        params.due_before = `${yyyy}-${mm}-${dd}`
      }

      const data = await tasksApi.getAll(params)
      setTasks(data)
    } catch (err) {
      setError(err.message)
    }
  }, [filters, focusMode])

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      await Promise.all([fetchCategories(), fetchTags(), fetchTasks()])
      setLoading(false)
    }
    loadAll()
  }, [fetchCategories, fetchTags, fetchTasks])

  // Clear newTaskId after animation
  useEffect(() => {
    if (newTaskId) {
      const timer = setTimeout(() => setNewTaskId(null), 400)
      return () => clearTimeout(timer)
    }
  }, [newTaskId])

  // Task actions
  const handleCreateTask = async (taskData) => {
    const created = await tasksApi.create(taskData)
    await fetchTasks()
    setShowTaskForm(false)
    if (created?.id) setNewTaskId(created.id)
  }

  const handleSmartCreate = async (taskData) => {
    try {
      const created = await tasksApi.create(taskData)
      await fetchTasks()
      if (created?.id) setNewTaskId(created.id)
      showToast({ message: 'Task created ✓', duration: 2000 })
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUpdateTask = async (id, taskData) => {
    await tasksApi.update(id, taskData)
    await fetchTasks()
    setEditingTask(null)
    setShowTaskForm(false)
  }

  const handleToggleStatus = async (id) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    handleToggleWithUndo(
      id,
      task.status,
      async (taskId) => {
        try {
          await tasksApi.toggleStatus(taskId)
          await fetchTasks()
        } catch (err) {
          setError(err.message)
        }
      },
      async (taskId) => {
        try {
          await tasksApi.toggleStatus(taskId)
          await fetchTasks()
        } catch (err) {
          setError(err.message)
        }
      }
    )
  }

  const handleDeleteTask = async (id) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    handleDeleteWithUndo(
      id,
      task,
      async (taskId) => {
        try {
          await tasksApi.delete(taskId)
          await fetchTasks()
        } catch (err) {
          setError(err.message)
        }
      },
      async (taskData) => {
        try {
          await tasksApi.create({
            title: taskData.title,
            description: taskData.description || '',
            due_date: taskData.due_date || null,
            priority: taskData.priority || 'Medium',
            category_id: taskData.category_id || null,
            tag_ids: taskData.tags?.map(t => t.id) || [],
            energy_size: taskData.energy_size || 'Medium',
          })
          await fetchTasks()
        } catch (err) {
          setError(err.message)
        }
      }
    )
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setShowTaskForm(true)
  }

  // Category actions
  const handleCreateCategory = async (data) => {
    await categoriesApi.create(data)
    await fetchCategories()
  }

  const handleUpdateCategory = async (id, data) => {
    await categoriesApi.update(id, data)
    await fetchCategories()
    await fetchTasks()
  }

  const handleDeleteCategory = async (id) => {
    try {
      await categoriesApi.delete(id)
      await fetchCategories()
      if (filters.category_id === String(id)) {
        setFilters(f => ({ ...f, category_id: '' }))
      } else {
        await fetchTasks()
      }
    } catch (err) {
      setError(err.message)
    }
  }

  // Keyboard shortcuts (uses sortedTasks)
  useKeyboardShortcuts({
    tasks: sortedTasks,
    selectedIndex,
    setSelectedIndex,
    onNewTask: () => { setEditingTask(null); setShowTaskForm(true) },
    onToggleStatus: handleToggleStatus,
    onEdit: handleEditTask,
    onDelete: handleDeleteTask,
    onShowHelp: () => setShowKeyboardHelp(true),
    onShowCommandPalette: () => setShowCommandPalette(true),
  })

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onNewTask={() => { setEditingTask(null); setShowTaskForm(true) }}
          onManageTags={() => setShowTagManager(true)}
          focusMode={focusMode}
          onToggleFocus={() => setFocusMode(f => !f)}
          overdueCount={overdueCount}
        />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            categories={categories}
            filters={filters}
            onFilterChange={setFilters}
            onCreateCategory={handleCreateCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            onManageTags={() => setShowTagManager(true)}
            tasks={tasks}
          />

          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 font-bold"
                  aria-label="Dismiss error"
                >
                  ×
                </button>
              </div>
            )}

            {/* Overdue banner (#4) */}
            {overdueCount > 0 && !focusMode && (
              <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-red-500">⚠️</span>
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">
                    You have {overdueCount} overdue task{overdueCount > 1 ? 's' : ''}
                  </span>
                </div>
                <button onClick={() => setFocusMode(true)} className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 px-2.5 py-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                  Show them →
                </button>
              </div>
            )}

            {/* Smart natural language input */}
            <div className="mb-4">
              <SmartInput
                onSubmit={handleSmartCreate}
                tags={tags}
                categories={categories}
              />
            </div>

            <TaskList
              tasks={sortedTasks}
              loading={loading}
              filters={filters}
              categories={categories}
              tags={tags}
              onFilterChange={setFilters}
              onToggleStatus={handleToggleStatus}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onDuplicate={handleDuplicateTask}
              selectedIndex={selectedIndex}
              newTaskId={newTaskId}
              selectedTaskIds={selectedTaskIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onToggleSubtask={handleToggleSubtask}
              onAddSubtask={handleAddSubtask}
              pinnedIds={pinnedIds}
              onTogglePin={handleTogglePin}
              onOpenDetail={handleOpenDetail}
              onInlineEdit={handleInlineEditTitle}
              onQuickDate={handleQuickDate}
            />
          </main>
        </div>

        {/* Task Detail Panel (#2) */}
        {detailTask && (
          <TaskDetailPanel
            task={detailTask}
            onClose={handleCloseDetail}
            onEdit={handleEditTask}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDeleteTask}
            onDuplicate={handleDuplicateTask}
            onToggleSubtask={handleToggleSubtask}
            onAddSubtask={handleAddSubtask}
            onTogglePin={handleTogglePin}
            isPinned={pinnedIds.has(detailTask.id)}
          />
        )}

        {/* Task Form Modal */}
        {showTaskForm && (
          <TaskForm
            task={editingTask}
            categories={categories}
            tags={tags}
            onSubmit={editingTask
              ? (data) => handleUpdateTask(editingTask.id, data)
              : handleCreateTask}
            onClose={() => { setShowTaskForm(false); setEditingTask(null) }}
          />
        )}

        {/* Tag Manager Modal */}
        {showTagManager && (
          <TagManager
            tags={tags}
            onClose={() => setShowTagManager(false)}
            onRefresh={fetchTags}
          />
        )}

        {/* Command Palette */}
        {showCommandPalette && (
          <CommandPalette
            open={showCommandPalette}
            onClose={() => setShowCommandPalette(false)}
            tasks={tasks}
            categories={categories}
            tags={tags}
            onNewTask={() => { setEditingTask(null); setShowTaskForm(true) }}
            onToggleStatus={handleToggleStatus}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onDuplicate={handleDuplicateTask}
            onFilterChange={setFilters}
            onManageTags={() => setShowTagManager(true)}
            onToggleFocus={() => setFocusMode(f => !f)}
            onSelectAll={handleSelectAll}
            onClearSelection={() => setSelectedTaskIds(new Set())}
            focusMode={focusMode}
          />
        )}

        {/* Keyboard Help Overlay */}
        <KeyboardHelp
          open={showKeyboardHelp}
          onClose={() => setShowKeyboardHelp(false)}
        />

        {/* Bulk Action Bar */}
        <BulkActionBar
          selectedCount={selectedTaskIds.size}
          onComplete={handleBulkComplete}
          onDelete={handleBulkDelete}
          onClearSelection={() => setSelectedTaskIds(new Set())}
        />

        {/* Undo Toast */}
        {toast}
      </div>
    </ErrorBoundary>
  )
}

export default App
