import { useState, useRef, useCallback, useEffect } from 'react'
import Confetti from './Confetti'

const PRIORITY_COLORS = {
  Low: 'bg-gray-300 dark:bg-gray-600',
  Medium: 'bg-blue-400 dark:bg-blue-500',
  High: 'bg-amber-400 dark:bg-amber-500',
  Critical: 'bg-red-400 dark:bg-red-500',
}

export default function TaskCard({ task, onToggleStatus, onEdit, onDelete, onDuplicate, isNew, isSelected, onToggleSubtask, onAddSubtask, selected, onSelect, isPinned, onTogglePin, onOpenDetail, onInlineEdit, onQuickDate }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isCollapsing, setIsCollapsing] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [subtasksExpanded, setSubtasksExpanded] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const cardRef = useRef(null)
  const titleInputRef = useRef(null)
  const datePickerRef = useRef(null)
  const isCompleted = task.status === 'completed'
  const isOverdue = task.due_date && !isCompleted && new Date(task.due_date) < new Date()

  // Sync editTitle with task.title when task changes
  useEffect(() => {
    setEditTitle(task.title)
  }, [task.title])

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  // Close date picker on outside click
  useEffect(() => {
    if (!showDatePicker) return
    const handleClickOutside = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setShowDatePicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDatePicker])

  const handleDelete = () => {
    if (confirmDelete) {
      setIsCollapsing(true)
      setTimeout(() => {
        onDelete(task.id)
      }, 280)
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  const handleToggle = () => {
    if (!isCompleted && (task.priority === 'High' || task.priority === 'Critical')) {
      setShowConfetti(true)
    }
    onToggleStatus(task.id)
  }

  const handleAddSubtask = (e) => {
    e.preventDefault()
    const title = newSubtaskTitle.trim()
    if (title && onAddSubtask) {
      onAddSubtask(task.id, title)
      setNewSubtaskTitle('')
    }
  }

  const handleConfettiComplete = useCallback(() => setShowConfetti(false), [])

  const handleTitleClick = (e) => {
    e.stopPropagation()
    if (onOpenDetail) onOpenDetail(task)
  }

  const handleTitleDoubleClick = (e) => {
    e.stopPropagation()
    setIsEditingTitle(true)
  }

  const handleTitleSave = () => {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== task.title && onInlineEdit) {
      onInlineEdit(task.id, trimmed)
    } else {
      setEditTitle(task.title)
    }
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      setEditTitle(task.title)
      setIsEditingTitle(false)
    }
  }

  const handleQuickDate = (dateString) => {
    if (onQuickDate) onQuickDate(task.id, dateString)
    setShowDatePicker(false)
  }

  const getQuickDateValue = (preset) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (preset === 'today') {
      return today.toISOString().split('T')[0]
    } else if (preset === 'tomorrow') {
      const d = new Date(today)
      d.setDate(d.getDate() + 1)
      return d.toISOString().split('T')[0]
    } else if (preset === 'nextweek') {
      const d = new Date(today)
      d.setDate(d.getDate() + (7 - d.getDay() + 1))
      return d.toISOString().split('T')[0]
    }
    return null
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays > 1 && diffDays <= 6) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const subtaskCount = task.subtask_count || 0
  const subtaskCompleted = task.subtask_completed || 0
  const subtasks = task.subtasks || []

  return (
    <div
      ref={cardRef}
      data-task-card
      className={`transition-all duration-280 ease-out ${isCollapsing ? 'max-h-0 opacity-0 scale-[0.97] mb-0 overflow-hidden' : 'max-h-[600px] opacity-100 scale-100'} ${isNew ? 'animate-card-expand' : ''}`}
    >
      <div className={`
        group relative rounded-2xl p-5 transition-all duration-150
        bg-white dark:bg-gray-800
        border border-gray-100 dark:border-transparent
        shadow-sm dark:shadow-md dark:shadow-black/10
        ${isSelected ? 'ring-2 ring-amber-400/60 dark:ring-amber-400/40 shadow-md shadow-amber-50 dark:shadow-amber-900/10' : 'hover:shadow-md hover:shadow-gray-100 dark:hover:shadow-black/20'}
        ${isCompleted ? 'opacity-50' : ''}
        ${isOverdue ? 'border-l-[3px] border-l-red-300 dark:border-l-red-400' : ''}
        ${selected ? 'ring-2 ring-amber-400 dark:ring-amber-400 bg-amber-50/30 dark:bg-amber-900/10' : ''}
      `}>
        {showConfetti && (
          <Confetti active={showConfetti} onComplete={handleConfettiComplete} />
        )}
        <div className="flex items-start gap-3.5">
          {/* Selection checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (onSelect) onSelect()
            }}
            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
              selected
                ? 'bg-amber-500 border-amber-500 text-white opacity-100'
                : 'border-gray-200 dark:border-gray-600 opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:border-amber-300 dark:hover:border-amber-500'
            }`}
            aria-label={selected ? 'Deselect task' : 'Select task'}
          >
            {selected && (
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            )}
          </button>

          {/* Completion checkbox */}
          <button
            onClick={handleToggle}
            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
              isCompleted
                ? 'bg-emerald-400 border-emerald-400 text-white'
                : 'border-gray-300 dark:border-gray-500 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:border-emerald-400 dark:hover:bg-emerald-900/20'
            }`}
            aria-label={isCompleted ? 'Mark as pending' : 'Mark as completed'}
          >
            {isCompleted && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Priority dot */}
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLORS[task.priority]}`} title={task.priority} />

              {/* Pin icon next to title */}
              {isPinned && (
                <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}

              {/* Title: click to open detail, double-click for inline edit */}
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  className="text-base font-medium leading-snug text-gray-800 dark:text-gray-100 bg-amber-50 dark:bg-gray-700 border border-amber-300 dark:border-amber-500 rounded-lg px-2 py-0.5 outline-none flex-1 min-w-0"
                />
              ) : (
                <h3
                  onClick={handleTitleClick}
                  onDoubleClick={handleTitleDoubleClick}
                  className={`text-base font-medium leading-snug cursor-pointer hover:text-amber-700 dark:hover:text-amber-300 transition-colors ${isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-100'}`}
                >
                  {task.title}
                </h3>
              )}
            </div>

            {task.description && (
              <p className={`mt-1.5 text-sm leading-relaxed ${isCompleted ? 'text-gray-300 dark:text-gray-600 line-through' : 'text-gray-500 dark:text-gray-400'} line-clamp-2`}>
                {task.description}
              </p>
            )}

            {/* Metadata row */}
            {(task.due_date || task.category || (task.tags && task.tags.length > 0) || subtaskCount > 0) && (
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                {task.due_date && (
                  <div className="relative" ref={datePickerRef}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDatePicker(!showDatePicker)
                      }}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-1.5 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isOverdue ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {formatDate(task.due_date)}
                    </button>

                    {/* Quick date picker popover */}
                    {showDatePicker && (
                      <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-2 flex flex-col gap-1 min-w-[130px] animate-fade-in">
                        <button
                          onClick={() => handleQuickDate(getQuickDateValue('today'))}
                          className="text-left text-xs px-3 py-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                        >
                          📅 Today
                        </button>
                        <button
                          onClick={() => handleQuickDate(getQuickDateValue('tomorrow'))}
                          className="text-left text-xs px-3 py-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                        >
                          🌅 Tomorrow
                        </button>
                        <button
                          onClick={() => handleQuickDate(getQuickDateValue('nextweek'))}
                          className="text-left text-xs px-3 py-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                        >
                          📆 Next Week
                        </button>
                        <button
                          onClick={() => handleQuickDate(null)}
                          className="text-left text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                        >
                          ✕ None
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {task.category && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: task.category.color }} />
                    {task.category.name}
                  </span>
                )}
                {task.tags && task.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {task.tags.map(tag => (
                      <span key={tag.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium text-white/90" style={{ backgroundColor: tag.color }}>
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
                {/* Subtask progress indicator */}
                {subtaskCount > 0 && (
                  <span className="inline-flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                    <span className="text-xs font-medium">✓ {subtaskCompleted}/{subtaskCount}</span>
                    <span className="inline-block w-14 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <span
                        className="block h-full bg-emerald-400 dark:bg-emerald-400 rounded-full transition-all duration-300"
                        style={{ width: `${(subtaskCompleted / subtaskCount) * 100}%` }}
                      />
                    </span>
                  </span>
                )}
              </div>
            )}

            {/* Subtask expand toggle */}
            {(subtaskCount > 0 || subtasks.length > 0) && (
              <div className="mt-3">
                <button
                  onClick={() => setSubtasksExpanded(!subtasksExpanded)}
                  className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors font-medium"
                >
                  <span className={`inline-block transition-transform duration-150 ${subtasksExpanded ? 'rotate-90' : ''}`}>▸</span>
                  {' '}subtasks
                </button>

                {/* Expanded subtask list */}
                {subtasksExpanded && (
                  <div className="mt-2.5 ml-1 space-y-1.5 animate-fade-in">
                    {subtasks.map(subtask => (
                      <label
                        key={subtask.id}
                        className="flex items-center gap-2.5 py-1 cursor-pointer group/subtask"
                      >
                        <input
                          type="checkbox"
                          checked={!!subtask.completed}
                          onChange={() => onToggleSubtask && onToggleSubtask(subtask.id)}
                          className="w-3.5 h-3.5 rounded-full border-gray-300 dark:border-gray-600 text-emerald-400 focus:ring-emerald-400 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className={`text-sm ${subtask.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}>
                          {subtask.title}
                        </span>
                      </label>
                    ))}

                    {/* Add subtask inline input */}
                    <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-2">
                      <span className="text-gray-300 dark:text-gray-600 text-sm">+</span>
                      <input
                        type="text"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        placeholder="Add subtask..."
                        className="flex-1 text-sm py-1 px-2 bg-transparent border-b border-gray-100 dark:border-gray-700 focus:border-amber-300 dark:focus:border-amber-500 outline-none text-gray-700 dark:text-gray-300 placeholder-gray-300 dark:placeholder-gray-600 transition-colors"
                      />
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions — hidden until hover */}
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
            {/* Pin/Star button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (onTogglePin) onTogglePin(task.id)
              }}
              className={`p-2 rounded-lg transition-colors ${
                isPinned
                  ? 'text-amber-500 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-gray-700'
                  : 'text-gray-300 dark:text-gray-600 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-gray-700'
              }`}
              aria-label={isPinned ? 'Unpin task' : 'Pin task'}
              title={isPinned ? 'Unpin' : 'Pin'}
            >
              {isPinned ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => onDuplicate && onDuplicate(task)}
              className="p-2 text-gray-300 dark:text-gray-600 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-gray-700 transition-colors"
              aria-label="Duplicate task"
              title="Duplicate"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </button>
            <button
              onClick={() => onEdit(task)}
              className="p-2 text-gray-300 dark:text-gray-600 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-gray-700 transition-colors"
              aria-label="Edit task"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button
              onClick={handleDelete}
              className={`p-2 rounded-lg transition-all ${confirmDelete ? 'text-white bg-red-500 hover:bg-red-600 scale-110' : 'text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700'}`}
              aria-label={confirmDelete ? 'Confirm delete' : 'Delete task'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
