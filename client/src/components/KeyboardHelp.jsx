import { useEffect, useRef } from 'react';

const shortcuts = [
  { keys: ['j'], description: 'Move selection down' },
  { keys: ['k'], description: 'Move selection up' },
  { keys: ['n'], description: 'New task' },
  { keys: ['x'], description: 'Toggle task status' },
  { keys: ['e'], description: 'Edit selected task' },
  { keys: ['d', 'd'], description: 'Delete selected task' },
  { keys: ['?'], description: 'Show this help' },
  { keys: ['Ctrl', 'K'], description: 'Open command palette' },
  { keys: ['Esc'], description: 'Deselect task' },
];

/**
 * KeyboardHelp - A modal overlay displaying available keyboard shortcuts.
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is visible
 * @param {Function} props.onClose - Callback to close the modal
 */
export function KeyboardHelp({ open, onClose }) {
  const dialogRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose?.();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  // Focus trap - focus the dialog when it opens
  useEffect(() => {
    if (open && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-help-title"
        tabIndex={-1}
        className="relative z-10 w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-gray-800 dark:text-gray-100 outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2
            id="keyboard-help-title"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="Close keyboard shortcuts help"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Shortcuts table */}
        <div className="px-6 py-4">
          <table className="w-full" role="table" aria-label="Keyboard shortcuts list">
            <thead className="sr-only">
              <tr>
                <th>Shortcut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {shortcuts.map((shortcut, index) => (
                <tr
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0 dark:border-gray-700"
                >
                  <td className="text-sm text-gray-600 dark:text-gray-300">
                    {shortcut.description}
                  </td>
                  <td className="flex gap-1">
                    {shortcut.keys.map((key, keyIndex) => (
                      <span key={keyIndex}>
                        <kbd className="inline-flex items-center justify-center min-w-[1.75rem] rounded border border-gray-300 bg-gray-50 px-2 py-1 text-xs font-mono font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
                          {key}
                        </kbd>
                        {keyIndex < shortcut.keys.length - 1 && (
                          <span className="mx-0.5 text-gray-400 dark:text-gray-500">
                            +
                          </span>
                        )}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Shortcuts are disabled when typing in input fields
          </p>
        </div>
      </div>
    </div>
  );
}

export default KeyboardHelp;
