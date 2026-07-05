import { useEffect, useRef } from 'react';

/**
 * Custom hook that provides keyboard shortcuts for the task manager.
 *
 * @param {Object} options
 * @param {Array} options.tasks - List of tasks currently displayed
 * @param {number} options.selectedIndex - Currently selected task index
 * @param {Function} options.setSelectedIndex - Setter for selected index
 * @param {Function} options.onNewTask - Callback to open new task form
 * @param {Function} options.onToggleStatus - Callback to toggle task status (receives task id)
 * @param {Function} options.onEdit - Callback to edit a task (receives task object)
 * @param {Function} options.onDelete - Callback to delete a task (receives task id)
 * @param {Function} options.onShowHelp - Callback to show help overlay
 * @param {Function} options.onShowCommandPalette - Callback to show command palette
 * @returns {{ selectedIndex: number }}
 */
export function useKeyboardShortcuts({
  tasks,
  selectedIndex,
  setSelectedIndex,
  onNewTask,
  onToggleStatus,
  onEdit,
  onDelete,
  onShowHelp,
  onShowCommandPalette,
}) {
  const lastDPressRef = useRef(0);

  useEffect(() => {
    function handleKeyDown(event) {
      // Skip shortcuts when an input, textarea, or select is focused
      const tagName = event.target.tagName.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        return;
      }

      // Also skip if the target is contentEditable
      if (event.target.isContentEditable) {
        return;
      }

      const key = event.key;

      // Ctrl+K or Cmd+K: show command palette
      if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === 'k') {
        event.preventDefault();
        onShowCommandPalette?.();
        return;
      }

      // Escape: clear selection
      if (key === 'Escape') {
        event.preventDefault();
        setSelectedIndex(-1);
        return;
      }

      // Don't process single-key shortcuts if modifier keys are held
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      switch (key) {
        case 'j': {
          // Move selection down, wrap at end
          event.preventDefault();
          if (tasks.length === 0) return;
          setSelectedIndex((prev) => {
            const next = prev + 1;
            return next >= tasks.length ? 0 : next;
          });
          break;
        }

        case 'k': {
          // Move selection up, wrap at start
          event.preventDefault();
          if (tasks.length === 0) return;
          setSelectedIndex((prev) => {
            const next = prev - 1;
            return next < 0 ? tasks.length - 1 : next;
          });
          break;
        }

        case 'n': {
          // Open new task form
          event.preventDefault();
          onNewTask?.();
          break;
        }

        case 'x': {
          // Toggle status of selected task
          event.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < tasks.length) {
            onToggleStatus?.(tasks[selectedIndex].id);
          }
          break;
        }

        case 'e': {
          // Edit selected task
          event.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < tasks.length) {
            onEdit?.(tasks[selectedIndex]);
          }
          break;
        }

        case 'd': {
          // Delete selected task (press d twice within 500ms)
          event.preventDefault();
          const now = Date.now();
          if (now - lastDPressRef.current < 500) {
            // Second press within 500ms - delete
            if (selectedIndex >= 0 && selectedIndex < tasks.length) {
              onDelete?.(tasks[selectedIndex].id);
            }
            lastDPressRef.current = 0;
          } else {
            // First press - record timestamp
            lastDPressRef.current = now;
          }
          break;
        }

        case '?': {
          // Show help overlay
          event.preventDefault();
          onShowHelp?.();
          break;
        }

        case '/': {
          // Focus search input
          event.preventDefault();
          const searchInput = document.querySelector('[aria-label="Search tasks"]');
          if (searchInput) searchInput.focus();
          break;
        }

        default:
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    tasks,
    selectedIndex,
    setSelectedIndex,
    onNewTask,
    onToggleStatus,
    onEdit,
    onDelete,
    onShowHelp,
    onShowCommandPalette,
  ]);

  return { selectedIndex };
}

export default useKeyboardShortcuts;
