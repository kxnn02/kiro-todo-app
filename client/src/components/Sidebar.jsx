import { useState } from 'react'

const PRESET_COLORS = ['#6b7280', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']

export default function Sidebar({
  open, onClose, categories, filters, onFilterChange,
  onCreateCategory, onUpdateCategory, onDeleteCategory, onManageTags, tasks
}) {
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6b7280')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [formError, setFormError] = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError('')
    try {
      await onCreateCategory({ name: newName, color: newColor })
      setNewName('')
      setNewColor('#6b7280')
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleUpdate = async (id) => {
    setFormError('')
    try {
      await onUpdateCategory(id, { name: editName, color: editColor })
      setEditingId(null)
    } catch (err) {
      setFormError(err.message)
    }
  }

  const startEdit = (cat) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color)
    setFormError('')
  }

  const selectCategory = (categoryId) => {
    const val = filters.category_id === String(categoryId) ? '' : String(categoryId)
    onFilterChange({ ...filters, category_id: val })
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 overflow-y-auto top-[49px] md:top-0 ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-4">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Categories</h2>

          <button
            onClick={() => onFilterChange({ ...filters, category_id: '' })}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${filters.category_id === '' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            All Categories
          </button>

          <div className="space-y-1 mb-4">
            {categories.map(cat => (
              <div key={cat.id} className="group">
                {editingId === cat.id ? (
                  <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" aria-label="Category name" />
                    <div className="flex gap-1">
                      {PRESET_COLORS.map(c => (
                        <button key={c} type="button" onClick={() => setEditColor(c)} className={`w-5 h-5 rounded-full border-2 ${editColor === c ? 'border-gray-800 dark:border-white' : 'border-transparent'}`} style={{ backgroundColor: c }} aria-label={`Color ${c}`} />
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleUpdate(cat.id)} className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700">Save</button>
                      <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <button onClick={() => selectCategory(cat.id)} className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${filters.category_id === String(cat.id) ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="truncate">{cat.name}</span>
                      {tasks && (
                        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                          {tasks.filter(t => t.category_id === cat.id).length}
                        </span>
                      )}
                    </button>
                    <div className="hidden group-hover:flex items-center gap-0.5 pr-1">
                      <button onClick={() => startEdit(cat)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded" aria-label={`Edit ${cat.name}`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => { if (window.confirm('Delete this category?')) onDeleteCategory(cat.id) }} className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded" aria-label={`Delete ${cat.name}`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleCreate} className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Add Category</h3>
            {formError && <p className="text-xs text-red-600 dark:text-red-400">{formError}</p>}
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Category name" className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" aria-label="New category name" />
            <div className="flex gap-1">
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setNewColor(c)} className={`w-5 h-5 rounded-full border-2 ${newColor === c ? 'border-gray-800 dark:border-white' : 'border-transparent'}`} style={{ backgroundColor: c }} aria-label={`Color ${c}`} />
              ))}
            </div>
            <button type="submit" disabled={!newName.trim()} className="w-full px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Add</button>
          </form>

          {/* Tags access for mobile */}
          {onManageTags && (
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => { onManageTags(); onClose(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                Manage Tags
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
