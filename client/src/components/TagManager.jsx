import { useState } from 'react'
import { tagsApi } from '../api/client'

const PRESET_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#6b7280']

export default function TagManager({ tags, onClose, onRefresh }) {
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#3b82f6')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [error, setError] = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await tagsApi.create({ name: newName, color: newColor })
      setNewName('')
      setNewColor('#3b82f6')
      await onRefresh()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUpdate = async (id) => {
    setError('')
    try {
      await tagsApi.update(id, { name: editName, color: editColor })
      setEditingId(null)
      await onRefresh()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this tag? It will be removed from all tasks.')) {
      try {
        await tagsApi.delete(id)
        await onRefresh()
      } catch (err) {
        setError(err.message)
      }
    }
  }

  const startEdit = (tag) => {
    setEditingId(tag.id)
    setEditName(tag.name)
    setEditColor(tag.color)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Tags</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg">{error}</p>}

          <div className="space-y-2">
            {tags.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No tags yet. Create one below.</p>}
            {tags.map(tag => (
              <div key={tag.id} className="flex items-center gap-2">
                {editingId === tag.id ? (
                  <div className="flex-1 space-y-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" aria-label="Tag name" />
                    <div className="flex gap-1">
                      {PRESET_COLORS.map(c => (
                        <button key={c} type="button" onClick={() => setEditColor(c)} className={`w-5 h-5 rounded-full border-2 ${editColor === c ? 'border-gray-800 dark:border-white' : 'border-transparent'}`} style={{ backgroundColor: c }} aria-label={`Color ${c}`} />
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleUpdate(tag.id)} className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700">Save</button>
                      <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: tag.color }}>{tag.name}</span>
                    <div className="flex-1" />
                    <button onClick={() => startEdit(tag)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded" aria-label={`Edit ${tag.name}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={() => handleDelete(tag.id)} className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded" aria-label={`Delete ${tag.name}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleCreate} className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Add New Tag</h3>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Tag name" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none" aria-label="New tag name" />
            <div className="flex gap-1">
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setNewColor(c)} className={`w-6 h-6 rounded-full border-2 ${newColor === c ? 'border-gray-800 dark:border-white' : 'border-transparent'}`} style={{ backgroundColor: c }} aria-label={`Color ${c}`} />
              ))}
            </div>
            <button type="submit" disabled={!newName.trim()} className="w-full px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Add Tag</button>
          </form>
        </div>
      </div>
    </div>
  )
}
