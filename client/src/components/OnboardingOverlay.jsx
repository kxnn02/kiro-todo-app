import { useState, useEffect } from 'react'

const STORAGE_KEY = 'kiro-todo-onboarding-dismissed'

export default function OnboardingOverlay({ visible, onDismiss }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      const dismissed = localStorage.getItem(STORAGE_KEY)
      if (!dismissed) {
        setShow(true)
      }
    } else {
      setShow(false)
    }
  }, [visible])

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setShow(false)
    if (onDismiss) onDismiss()
  }

  if (!show) return null

  return (
    <div className="w-full max-w-lg mx-auto animate-fade-in">
      <div className="relative rounded-3xl bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-800 border border-amber-100/60 dark:border-gray-700 shadow-xl shadow-amber-100/20 dark:shadow-black/20 p-8">
        {/* Decorative sparkle */}
        <div className="absolute top-4 right-4 text-2xl animate-pulse">✨</div>

        {/* Welcome header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Welcome to your tasks! 🎯
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Start typing naturally — we'll figure out the rest.
          </p>
        </div>

        {/* NLP Input tips */}
        <div className="mb-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-xs">💬</span>
              Type naturally
            </h3>
            <div className="ml-8 p-3 rounded-xl bg-white/70 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
              <code className="text-sm text-amber-700 dark:text-amber-300 font-mono">
                Buy groceries tomorrow p2 #shopping @work
              </code>
            </div>
          </div>

          <div className="ml-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">📅 Date keywords</p>
              <ul className="space-y-1">
                <li className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-mono text-amber-600 dark:text-amber-400">today</span>, <span className="font-mono text-amber-600 dark:text-amber-400">tomorrow</span>
                </li>
                <li className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-mono text-amber-600 dark:text-amber-400">friday</span>, <span className="font-mono text-amber-600 dark:text-amber-400">next week</span>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">🔥 Priority</p>
              <ul className="space-y-1">
                <li className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-mono text-red-500">p1</span> critical · <span className="font-mono text-amber-500">p2</span> high
                </li>
                <li className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-mono text-blue-500">p3</span> medium · <span className="font-mono text-gray-500">p4</span> low
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">🏷️ Tags</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-mono text-amber-600 dark:text-amber-400">#tagname</span>
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">📁 Category</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-mono text-amber-600 dark:text-amber-400">@categoryname</span>
              </p>
            </div>
          </div>
        </div>

        {/* Keyboard shortcuts */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-xs">⌨️</span>
            Keyboard shortcuts
          </h3>
          <div className="ml-8 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
              <kbd className="font-mono font-bold text-gray-800 dark:text-gray-200">N</kbd>
              <span>new task</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
              <kbd className="font-mono font-bold text-gray-800 dark:text-gray-200">/</kbd>
              <span>search</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
              <kbd className="font-mono font-bold text-gray-800 dark:text-gray-200">Ctrl+K</kbd>
              <span>commands</span>
            </span>
          </div>
        </div>

        {/* Dismiss button */}
        <div className="flex justify-center">
          <button
            onClick={handleDismiss}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium text-sm shadow-lg shadow-amber-200/50 dark:shadow-amber-900/30 hover:shadow-xl hover:shadow-amber-200/60 dark:hover:shadow-amber-900/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Got it! Let's go 🚀
          </button>
        </div>
      </div>
    </div>
  )
}
