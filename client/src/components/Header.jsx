import { useTheme } from '../contexts/ThemeContext'

export default function Header({ onMenuToggle, onNewTask, onManageTags, focusMode, onToggleFocus, overdueCount }) {
  const { theme, toggleTheme } = useTheme()

  const getThemeIcon = () => {
    if (theme === 'light') {
      return (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    }
    if (theme === 'dark') {
      return (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )
    }
    return (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  }

  const getThemeLabel = () => {
    if (theme === 'light') return 'Switch to dark mode'
    if (theme === 'dark') return 'Switch to system mode'
    return 'Switch to light mode'
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
      <div className="flex items-center justify-between px-5 py-4 gap-3">
        {/* Left: Menu + Logo + Energy */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo: checkmark + Tasks */}
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Tasks
            </h1>
          </div>

        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Focus Mode Toggle - ghost style */}
          <button
            onClick={onToggleFocus}
            className={`relative inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-all ${
              focusMode
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            aria-label={focusMode ? 'Disable focus mode' : 'Enable focus mode'}
            title={focusMode ? 'Focus mode active – showing overdue tasks' : 'Focus mode – show overdue tasks'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="hidden sm:inline">Focus</span>
            {overdueCount > 0 && (
              <span className={`inline-flex items-center justify-center min-w-[18px] px-1 text-[10px] font-bold rounded-full ${
                focusMode
                  ? 'text-white bg-indigo-600 dark:bg-indigo-500'
                  : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50'
              }`}>
                {overdueCount}
              </span>
            )}
          </button>

          {/* Tags - ghost style */}
          <button
            onClick={onManageTags}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Tags
          </button>

          {/* Theme toggle - ghost style */}
          <button
            onClick={toggleTheme}
            className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
            aria-label={getThemeLabel()}
            title={getThemeLabel()}
          >
            {getThemeIcon()}
          </button>

          {/* Primary CTA: New Task */}
          <button
            onClick={onNewTask}
            className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:scale-[0.97] transition-all shadow-sm hover:shadow-md"
          >
            <span className="hidden sm:inline">+ New Task</span>
            <span className="sm:hidden text-lg leading-none">+</span>
          </button>
        </div>
      </div>
    </header>
  )
}
