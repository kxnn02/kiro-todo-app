import { useState, useCallback, useRef, useEffect } from 'react'
import Toast from '../components/Toast'

let toastIdCounter = 0

export default function useUndo() {
  const [toast, setToast] = useState(null)
  const timeoutRef = useRef(null)

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const dismissToast = useCallback(() => {
    setToast(null)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const showToast = useCallback(({ message, actionLabel, action, duration = 5000 }) => {
    // Clear any existing toast/timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const id = ++toastIdCounter

    setToast({
      id,
      message,
      actionLabel: actionLabel || null,
      action: action || null,
      visible: true,
    })

    // Safety timeout to clear stale state (fallback beyond the Toast's own auto-dismiss)
    timeoutRef.current = setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current))
    }, duration + 500)
  }, [])

  const handleDeleteWithUndo = useCallback((taskId, taskData, actualDeleteFn, restoreFn) => {
    // Perform the delete immediately
    actualDeleteFn(taskId)

    // Show toast with undo option
    showToast({
      message: 'Task deleted',
      actionLabel: 'Undo',
      action: () => {
        restoreFn(taskData)
      },
    })
  }, [showToast])

  const handleToggleWithUndo = useCallback((taskId, previousStatus, toggleFn, restoreFn) => {
    // Perform the toggle immediately
    toggleFn(taskId)

    // Determine the new status for the message
    const newStatus = previousStatus === 'completed' ? 'pending' : 'completed'

    // Show toast with undo option
    showToast({
      message: `Task marked as ${newStatus}`,
      actionLabel: 'Undo',
      action: () => {
        restoreFn(taskId, previousStatus)
      },
    })
  }, [showToast])

  // The renderable toast element to place in the app layout
  const toastElement = toast ? (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <Toast
        key={toast.id}
        message={toast.message}
        action={toast.action}
        actionLabel={toast.actionLabel}
        onDismiss={dismissToast}
      />
    </div>
  ) : null

  return {
    toast: toastElement,
    showToast,
    handleDeleteWithUndo,
    handleToggleWithUndo,
  }
}
