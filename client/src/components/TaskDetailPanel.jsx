import { useState, useEffect, useRef } from 'react'

const PRIORITY_COLORS = {
  Low: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  Medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  High: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

function renderMarkdown(text) {
  if (!text) return null

  const lines = text.split('\n')
  const elements = []
  let inList = false
  let listItems = []

  const processInline = (line) => {
    // Bold: **text**
    line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic: *text*
    line = line.replace(/\*(.+?)\*/g, '<em>$1</em>')
    return line
  }

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
          {listItems.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: processInline(item) }} />
          ))}
        </ul>
      )
      listItems = []
    }
    inList = false
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true
      listItems.push(trimmed.slice(2))
    } else {
      if (inList) flushList()
      if (trimmed === '') {
        elements.push(<br key={`br-${i}`} />)
      } else {
        elements.push(
          <p
            key={`p-${i}`}
            className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: processInline(trimmed) }}
          />
        )
      }
    }
  })

  if (inList) flushList()
  return elements
}

export default function TaskDetailPanel({ task, onClose, onEdit, onToggleStatus, onDelete, onDuplicate, onToggleSubtask, onAddSubtask, onTogglePin, isPinned }) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const panelRef = useRef(null)

  // Slide-in animation
  useEffect(() => {
    if (task) {
      requestAnimationFrame(() => setIsVisible(true))
    } else {
      setIsVisible(false)
    }
  }, [task])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      if (onClose) onClose()
    }, 300)
  }

  const handleAddSubtask = (e) => {
    e.preventDefault()
    const title = newSubtaskTitle.trim()
    if (title && onAddSubtask) {
      onAddSubtask(task.id, title)
      setNewSubtaskTitle('')
    }
  }

  if (!task) return null

  const isCompleted = task.status === 'completed'
  const isOverdue = task.due_date && !isCompleted && new Date(task.due_date) < new Date()
  const subtasks = task.subtasks || []

  const formatDate = (dateStr) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 dark:bg-black/50 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[400px] bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-out ${isVisible ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-tight flex-1">
              {task.title}
            </h2>
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Pin button */}
              <button
                onClick={() => onTogglePin && onTogglePin(task.id)}
                className={`p-2 rounded-lg transition-colors ${
                  isPinned
                    ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-gray-800'
                    : 'text-gray-400 hover:text-amber-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                aria-label={isPinned ? 'Unpin task' : 'Pin task'}
              >
                {isPinned ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                )}
              </button>
              {/* Close button */}
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Close panel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Body - scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleStatus && onToggleStatus(task.id)}
              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                isCompleted
                  ? 'bg-emerald-400 border-emerald-400 text-white'
                  : 'border-gray-300 dark:border-gray-600 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:border-emerald-400'
              }`}
              aria-label={isCompleted ? 'Mark as pending' : 'Mark as completed'}
            >
              {isCompleted && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              )}
            </button>
            <span className={`text-sm font-medium ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {isCompleted ? 'Completed' : 'Pending'}
            </span>
          </div>

          {/* Priority badge */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Priority</label>
            <div className="mt-1.5">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Low}`}>
                {task.priority}
              </span>
            </div>
          </div>

          {/* Due date */}
          {task.due_date && (
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Due Date</label>
              <p className={`mt-1.5 text-sm font-medium ${isOverdue ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                {formatDate(task.due_date)}
                {isOverdue && <span className="ml-2 text-xs text-red-400">(overdue)</span>}
              </p>
            </div>
          )}

          {/* Category + Tags */}
          {(task.category || (task.tags && task.tags.length > 0)) && (
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Category & Tags</label>
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                {task.category && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: task.category.color }} />
                    {task.category.name}
                  </span>
                )}
                {task.tags && task.tags.map(tag => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white/90"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {task.description && (
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Description</label>
              <div className="mt-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-2">
                {renderMarkdown(task.description)}
              </div>
            </div>
          )}

          {/* Subtasks */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Subtasks {subtasks.length > 0 && `(${subtasks.filter(s => s.completed).length}/${subtasks.length})`}
            </label>
            <div className="mt-2 space-y-2">
              {subtasks.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">No subtasks yet</p>
              )}
              {subtasks.map(subtask => (
                <label
                  key={subtask.id}
                  className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={!!subtask.completed}
                    onChange={() => onToggleSubtask && onToggleSubtask(subtask.id)}
                    className="w-4 h-4 rounded-full border-gray-300 dark:border-gray-600 text-emerald-400 focus:ring-emerald-400 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className={`text-sm ${subtask.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                    {subtask.title}
                  </span>
                </label>
              ))}

              {/* Add subtask */}
              <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="text-gray-400 dark:text-gray-600">+</span>
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add subtask..."
                  className="flex-1 text-sm py-1.5 px-2 bg-transparent border-none outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600"
                />
                {newSubtaskTitle.trim() && (
                  <button
                    type="submit"
                    className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-md hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                  >
                    Add
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex-shrink-0 p-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <button
            onClick={() => onEdit && onEdit(task)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            Edit
          </button>
          <button
            onClick={() => onDuplicate && onDuplicate(task)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            Duplicate
          </button>
          <button
            onClick={() => onDelete && onDelete(task.id)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Delete
          </button>
        </div>
      </div>
    </>
  )
}
