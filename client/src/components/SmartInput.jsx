import { useState, useRef, useMemo, useCallback, useEffect } from 'react'

/**
 * Tarsi-inspired natural language parser.
 * Just type naturally — no special syntax needed.
 * 
 * Examples:
 * - "Buy groceries tomorrow" → title: "Buy groceries", due: tomorrow
 * - "Meeting with John high priority next monday" → title: "Meeting with John", priority: High, due: monday
 * - "Call dentist by friday" → title: "Call dentist", due: friday
 * - "Finish report urgent" → title: "Finish report", priority: Critical
 * - "Team standup every day" → title: "Team standup", recurrence: daily
 * - "Pay rent on the 1st monthly" → title: "Pay rent", recurrence: monthly
 * 
 * Also supports explicit syntax for power users:
 * - #tagname → match tag
 * - @categoryname → match category
 * - p1/p2/p3/p4 → priority shorthand
 */
export function parseNaturalInput(text, availableTags = [], availableCategories = []) {
  let remaining = text
  let dueDate = null
  let priority = null
  let matchedCategory = null
  let recurrence = null
  const matchedTags = []
  const unresolvedTags = []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const formatDate = (date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // --- Recurrence (before dates) ---
  const recurrencePatterns = [
    { regex: /\b(?:every\s*day|everyday|repeat\s*daily|daily)\b/i, value: 'daily' },
    { regex: /\b(?:every\s*weekday|on\s+weekdays|weekdays)\b/i, value: 'weekdays' },
    { regex: /\b(?:every\s*week|everyweek|repeat\s*weekly|weekly)\b/i, value: 'weekly' },
    { regex: /\b(?:every\s*month|everymonth|repeat\s*monthly|monthly)\b/i, value: 'monthly' },
    { regex: /\bevery\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i, value: 'weekly' },
    { regex: /\b(?:every\s*morning|every\s*night|every\s*evening|nightly)\b/i, value: 'daily' },
  ]

  for (const { regex, value } of recurrencePatterns) {
    const match = remaining.match(regex)
    if (match) {
      recurrence = value
      remaining = remaining.replace(match[0], '')
      break
    }
  }

  // --- Due Date Parsing (natural phrasing) ---
  // Supports: "by friday", "before monday", "due tomorrow", "on wednesday"

  // "in X days/weeks/months"
  const inMatch = remaining.match(/\bin\s+(\d+)\s+(days?|weeks?|months?)\b/i)
  if (inMatch) {
    const futureDate = new Date(today)
    const num = parseInt(inMatch[1], 10)
    const unit = inMatch[2].toLowerCase()
    if (unit.startsWith('day')) futureDate.setDate(futureDate.getDate() + num)
    else if (unit.startsWith('week')) futureDate.setDate(futureDate.getDate() + num * 7)
    else if (unit.startsWith('month')) futureDate.setMonth(futureDate.getMonth() + num)
    dueDate = formatDate(futureDate)
    remaining = remaining.replace(inMatch[0], '')
  }

  // "next week" / "next month"
  if (!dueDate) {
    const nw = remaining.match(/\bnext\s+week\b/i)
    if (nw) {
      const d = new Date(today)
      d.setDate(d.getDate() + (8 - d.getDay()))
      dueDate = formatDate(d)
      remaining = remaining.replace(nw[0], '')
    }
  }
  if (!dueDate) {
    const nm = remaining.match(/\bnext\s+month\b/i)
    if (nm) {
      dueDate = formatDate(new Date(today.getFullYear(), today.getMonth() + 1, 1))
      remaining = remaining.replace(nm[0], '')
    }
  }

  // "end of week" / "this weekend" / "eow"
  if (!dueDate) {
    const eow = remaining.match(/\b(?:end\s+of\s+(?:the\s+)?week|this\s+weekend|eow)\b/i)
    if (eow) {
      const fri = new Date(today)
      fri.setDate(fri.getDate() + (5 - fri.getDay() + 7) % 7 || 7)
      dueDate = formatDate(fri)
      remaining = remaining.replace(eow[0], '')
    }
  }

  // "tonight" / "today" / "now"
  if (!dueDate) {
    const t = remaining.match(/\b(?:today|tonight|now)\b/i)
    if (t) { dueDate = formatDate(today); remaining = remaining.replace(t[0], '') }
  }

  // "tomorrow" / "tmr" / "tmrw"
  if (!dueDate) {
    const t = remaining.match(/\b(?:tomorrow|tmrw?)\b/i)
    if (t) {
      const d = new Date(today); d.setDate(d.getDate() + 1)
      dueDate = formatDate(d)
      remaining = remaining.replace(t[0], '')
    }
  }

  // "day after tomorrow"
  if (!dueDate) {
    const dat = remaining.match(/\bday\s+after\s+tomorrow\b/i)
    if (dat) {
      const d = new Date(today); d.setDate(d.getDate() + 2)
      dueDate = formatDate(d)
      remaining = remaining.replace(dat[0], '')
    }
  }

  // "this/next [dayname]" or just "[dayname]"
  if (!dueDate) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const short = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
    const dayRegex = new RegExp(`\\b(?:(?:this|next)\\s+)?(${days.join('|')}|${short.join('|')})\\b`, 'i')
    const dm = remaining.match(dayRegex)
    if (dm) {
      const matchLower = dm[1].toLowerCase()
      let targetDay = days.indexOf(matchLower)
      if (targetDay === -1) targetDay = short.indexOf(matchLower)
      if (targetDay !== -1) {
        let diff = targetDay - today.getDay()
        if (diff <= 0) diff += 7
        const d = new Date(today); d.setDate(d.getDate() + diff)
        dueDate = formatDate(d)
        remaining = remaining.replace(dm[0], '')
      }
    }
  }

  // "jan 15", "feb 3", "march 20", "dec 1st"
  if (!dueDate) {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    const monthRegex = new RegExp(`\\b(${months.join('|')}\\w*)\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i')
    const mm = remaining.match(monthRegex)
    if (mm) {
      const monthIdx = months.indexOf(mm[1].toLowerCase().slice(0, 3))
      const day = parseInt(mm[2], 10)
      if (monthIdx !== -1 && day >= 1 && day <= 31) {
        let year = today.getFullYear()
        const candidate = new Date(year, monthIdx, day)
        if (candidate < today) candidate.setFullYear(year + 1)
        dueDate = formatDate(candidate)
        remaining = remaining.replace(mm[0], '')
      }
    }
  }

  // Clean up prepositions left hanging ("by", "before", "due", "on", "for") after date removal
  remaining = remaining.replace(/\b(?:by|before|due|on|for)\s*$/i, '')
  remaining = remaining.replace(/\b(?:by|before|due|on|for)\s+(?=\s|$)/i, '')

  // --- Priority (natural language — no special syntax needed) ---
  const priorityPatterns = [
    { regex: /\b(?:p1|asap|urgent|critical(?:\s+priority)?)\b/i, value: 'Critical' },
    { regex: /\b(?:p2|high\s+priority|important|high\s+prio)\b/i, value: 'High' },
    { regex: /\b(?:p3|medium\s+priority|normal\s+priority)\b/i, value: 'Medium' },
    { regex: /\b(?:p4|low\s+priority|not\s+urgent|whenever|low\s+prio)\b/i, value: 'Low' },
  ]

  for (const { regex, value } of priorityPatterns) {
    const match = remaining.match(regex)
    if (match) {
      priority = value
      remaining = remaining.replace(match[0], '')
      break
    }
  }

  // --- Tag Parsing (#tagname — power user syntax) ---
  const tagRegex = /#(\w+)/g
  let tagMatch
  while ((tagMatch = tagRegex.exec(remaining)) !== null) {
    const tagName = tagMatch[1]
    const found = availableTags.find(t => t.name.toLowerCase() === tagName.toLowerCase())
    if (found) matchedTags.push(found)
    else unresolvedTags.push(tagName)
  }
  remaining = remaining.replace(/#\w+/g, '')

  // --- Category Parsing (@categoryname — power user syntax) ---
  const categoryRegex = /@(\w+)/g
  let catMatch
  while ((catMatch = categoryRegex.exec(remaining)) !== null) {
    const catName = catMatch[1]
    const found = availableCategories.find(c => c.name.toLowerCase() === catName.toLowerCase())
    if (found && !matchedCategory) matchedCategory = found
  }
  remaining = remaining.replace(/@\w+/g, '')

  // --- Smart category detection (match category names naturally in text) ---
  if (!matchedCategory && availableCategories.length > 0) {
    for (const cat of availableCategories) {
      const catRegex = new RegExp(`\\b${cat.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      if (catRegex.test(remaining)) {
        matchedCategory = cat
        // Don't remove it from title — it's naturally part of the sentence
        break
      }
    }
  }

  // --- Smart tag detection (match tag names naturally in text) ---
  if (matchedTags.length === 0 && availableTags.length > 0) {
    for (const tag of availableTags) {
      const tagWordRegex = new RegExp(`\\b${tag.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      if (tagWordRegex.test(remaining)) {
        matchedTags.push(tag)
        // Don't remove — it's part of the natural sentence
      }
    }
  }

  // --- Clean up title ---
  const title = remaining.replace(/\s{2,}/g, ' ').trim()

  return {
    title,
    dueDate,
    priority: priority || 'Medium',
    matchedTags,
    unresolvedTags,
    matchedCategory,
    recurrence,
  }
}

// Visual styles
const priorityChipStyles = {
  Critical: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 border-red-100 dark:border-red-800/40',
  High: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300 border-orange-100 dark:border-orange-800/40',
  Medium: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 border-amber-100 dark:border-amber-800/40',
  Low: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 border-green-100 dark:border-green-800/40',
}

const recurrenceLabels = { daily: 'Daily', weekdays: 'Weekdays', weekly: 'Weekly', monthly: 'Monthly' }

export default function SmartInput({ onSubmit, tags = [], categories: availableCategories = [] }) {
  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [focused, setFocused] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [suggestionType, setSuggestionType] = useState(null)
  const inputRef = useRef(null)

  const parsed = useMemo(() => parseNaturalInput(input, tags, availableCategories), [input, tags, availableCategories])

  const hasContent = input.trim().length > 0
  const hasParsedElements = parsed.dueDate || parsed.priority !== 'Medium' || parsed.matchedTags.length > 0 || parsed.matchedCategory || parsed.recurrence

  // Auto-suggestions for # and @
  useEffect(() => {
    const hashMatch = input.match(/#(\w*)$/)
    const atMatch = input.match(/@(\w*)$/)
    if (hashMatch) {
      const q = hashMatch[1].toLowerCase()
      setSuggestions(tags.filter(t => t.name.toLowerCase().startsWith(q)).slice(0, 5))
      setSuggestionType('tag')
    } else if (atMatch) {
      const q = atMatch[1].toLowerCase()
      setSuggestions(availableCategories.filter(c => c.name.toLowerCase().startsWith(q)).slice(0, 5))
      setSuggestionType('category')
    } else {
      setSuggestions([])
      setSuggestionType(null)
    }
  }, [input, tags, availableCategories])

  const applySuggestion = (item) => {
    const prefix = suggestionType === 'tag' ? '#' : '@'
    const regex = suggestionType === 'tag' ? /#\w*$/ : /@\w*$/
    setInput(prev => prev.replace(regex, `${prefix}${item.name} `))
    setSuggestions([])
    inputRef.current?.focus()
  }

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault()
    if (!parsed.title) return
    setSubmitting(true)
    try {
      await onSubmit({
        title: parsed.title,
        due_date: parsed.dueDate || null,
        priority: parsed.priority,
        tag_ids: parsed.matchedTags.map(t => t.id),
        category_id: parsed.matchedCategory?.id || null,
        recurrence: parsed.recurrence || null,
      })
      setInput('')
    } catch { /* parent handles */ } finally { setSubmitting(false) }
  }, [parsed, onSubmit])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (suggestions.length > 0) { e.preventDefault(); applySuggestion(suggestions[0]); return }
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Tab' && suggestions.length > 0) { e.preventDefault(); applySuggestion(suggestions[0]) }
    if (e.key === 'Escape') { setSuggestions([]) }
  }

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-')
    const date = new Date(Number(y), Number(m) - 1, Number(d))
    const diffDays = Math.ceil((date - new Date(new Date().toDateString())) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === 2) return 'Day after tomorrow'
    if (diffDays > 2 && diffDays <= 6) return date.toLocaleDateString('en-US', { weekday: 'long' })
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        {/* Input container — Tarsi-inspired: clean, prominent, inviting */}
        <div className={`relative bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm border transition-all duration-200 ${focused ? 'shadow-md border-indigo-200 dark:border-indigo-700/50 ring-4 ring-indigo-50 dark:ring-indigo-900/20' : 'border-gray-100 dark:border-gray-700/50'}`}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => { setFocused(false); setSuggestions([]) }, 150)}
            placeholder="Just type what you need to do..."
            className="w-full px-5 py-4 pr-24 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-[15px] outline-none rounded-2xl"
            aria-label="Smart task input"
            disabled={submitting}
          />
          {/* Actions */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {hasContent && (
              <button type="button" onClick={() => { setInput(''); inputRef.current?.focus() }} className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 rounded-lg transition-colors" aria-label="Clear">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
            <button type="submit" disabled={!parsed.title || submitting} className="p-2.5 text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-90 shadow-sm" aria-label="Add task">
              {submitting ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              )}
            </button>
          </div>

          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-fade-in">
              {suggestions.map((item, idx) => (
                <button key={item.id} type="button" onMouseDown={(e) => { e.preventDefault(); applySuggestion(item) }} className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${idx === 0 ? 'bg-gray-50/50 dark:bg-gray-700/30' : ''}`}>
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-700 dark:text-gray-200">{item.name}</span>
                  {idx === 0 && <span className="ml-auto text-[10px] text-gray-400">Tab ↹</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hint — shown when focused and empty */}
        {focused && !hasContent && (
          <div className="mt-2.5 px-2 animate-fade-in">
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
              Just type naturally — <span className="text-gray-500 dark:text-gray-400">
              "Buy groceries <span className="text-blue-500">tomorrow</span>"
              </span> or <span className="text-gray-500 dark:text-gray-400">
              "Finish report <span className="text-blue-500">by friday</span> <span className="text-orange-500">important</span>"
              </span> or <span className="text-gray-500 dark:text-gray-400">
              "Team standup <span className="text-pink-500">every day</span>"
              </span>
            </p>
          </div>
        )}

        {/* Live preview — what Tarsi understood */}
        {hasContent && hasParsedElements && (
          <div className="mt-3 flex flex-wrap items-center gap-2 px-1 animate-fade-in">
            {/* Due date */}
            {parsed.dueDate && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 text-xs font-medium border border-blue-100 dark:border-blue-800/40">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {formatDisplayDate(parsed.dueDate)}
              </span>
            )}

            {/* Priority */}
            {parsed.priority !== 'Medium' && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${priorityChipStyles[parsed.priority]}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${parsed.priority === 'Critical' ? 'bg-red-500' : parsed.priority === 'High' ? 'bg-orange-500' : 'bg-green-500'}`} />
                {parsed.priority}
              </span>
            )}

            {/* Recurrence */}
            {parsed.recurrence && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-300 text-xs font-medium border border-pink-100 dark:border-pink-800/40">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                {recurrenceLabels[parsed.recurrence]}
              </span>
            )}

            {/* Category */}
            {parsed.matchedCategory && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 text-xs font-medium border border-gray-100 dark:border-gray-600/50">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: parsed.matchedCategory.color }} />
                {parsed.matchedCategory.name}
              </span>
            )}

            {/* Tags */}
            {parsed.matchedTags.map(tag => (
              <span key={tag.id} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-white shadow-sm" style={{ backgroundColor: tag.color || '#6366f1' }}>
                #{tag.name}
              </span>
            ))}

            {/* Unresolved tags */}
            {parsed.unresolvedTags.map(tagName => (
              <span key={tagName} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 text-xs border border-dashed border-gray-200 dark:border-gray-600">
                #{tagName}
              </span>
            ))}
          </div>
        )}
      </form>
    </div>
  )
}
