import { useEffect, useRef, useState, useCallback } from 'react'

export default function Toast({ message, action, actionLabel, onDismiss, duration = 5000 }) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const timerRef = useRef(null)
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  const dismiss = useCallback(() => {
    setExiting(true)
    setTimeout(() => {
      onDismissRef.current?.()
    }, 250)
  }, [])

  const startTimer = useCallback(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(dismiss, duration)
  }, [duration, dismiss])

  // Animate in on mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  // Auto-dismiss timer
  useEffect(() => {
    startTimer()
    return () => clearTimeout(timerRef.current)
  }, [startTimer])

  const handleAction = () => {
    clearTimeout(timerRef.current)
    action?.()
    dismiss()
  }

  return (
    <div
      className={`
        pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl
        bg-gray-900 dark:bg-gray-100 shadow-xl ring-1 ring-white/10 dark:ring-black/5
        transition-all duration-250 ease-out
        ${visible && !exiting
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-3 opacity-0 scale-95'
        }
      `}
      role="alert"
      aria-live="assertive"
      onMouseEnter={() => clearTimeout(timerRef.current)}
      onMouseLeave={startTimer}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <p className="flex-1 text-sm font-medium text-white dark:text-gray-900">
          {message}
        </p>

        {action && actionLabel && (
          <button
            onClick={handleAction}
            className="flex-shrink-0 rounded-lg px-3 py-1 text-sm font-semibold text-indigo-300 dark:text-indigo-600 hover:bg-white/10 dark:hover:bg-gray-200 transition-colors"
          >
            {actionLabel}
          </button>
        )}

        <button
          onClick={dismiss}
          className="flex-shrink-0 rounded-md p-1 text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-900 transition-colors"
          aria-label="Dismiss"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
