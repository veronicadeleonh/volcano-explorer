import { useState, useRef, useEffect } from 'react'
import './SearchBar.css'

const STATUS_EMOJI = { Active: '🔴', Dormant: '🟡', Extinct: '⚫' }

function statusEmoji(s) {
  for (const k of Object.keys(STATUS_EMOJI)) {
    if (s && s.includes(k)) return STATUS_EMOJI[k]
  }
  return '🔴'
}

export default function SearchBar({ volcanoes, onSelect, selected, compareMode, onToggleCompare }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const results = query.length >= 1
    ? volcanoes.filter(v =>
        v.name.toLowerCase().includes(query.toLowerCase()) ||
        v.country.toLowerCase().includes(query.toLowerCase()) ||
        v.region.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : []

  useEffect(() => {
    if (selected) {
      setQuery(selected.name)
      setOpen(false)
    }
  }, [selected])

  // Clear query when entering compare mode
  useEffect(() => {
    if (compareMode) {
      setQuery('')
      setOpen(false)
    }
  }, [compareMode])

  const handleChange = (e) => {
    setQuery(e.target.value)
    setOpen(true)
    setHighlight(-1)
    if (!e.target.value) onSelect(null)
  }

  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(h + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)) }
    if (e.key === 'Enter' && highlight >= 0) { pick(results[highlight]) }
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() }
  }

  const pick = (v) => {
    onSelect(v)
    if (!compareMode) setQuery(v.name)
    else setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    setQuery('')
    onSelect(null)
    setOpen(false)
    inputRef.current?.focus()
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!inputRef.current?.closest('.search-wrap')?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="search-wrap">
      <div className={`search-box ${open && results.length > 0 ? 'open' : ''} ${compareMode ? 'compare-active' : ''}`}>
        <span className="search-icon">{compareMode ? '⚖️' : '🔍'}</span>
        <input
          ref={inputRef}
          className="search-input"
          type="text"
          placeholder={compareMode ? 'Search volcano to compare...' : 'Search volcano, country or region...'}
          value={query}
          onChange={handleChange}
          onFocus={() => query && setOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button className="search-clear" onClick={handleClear} title="Clear">✕</button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="search-results" ref={listRef}>
          {results.map((v, i) => (
            <li
              key={v.id}
              className={`search-item ${i === highlight ? 'highlighted' : ''}`}
              onMouseDown={() => pick(v)}
              onMouseEnter={() => setHighlight(i)}
            >
              <span className="si-emoji">{statusEmoji(v.status)}</span>
              <span className="si-name">{v.name}</span>
              <span className="si-meta">{v.country} · {v.elevation > 0 ? `${v.elevation.toLocaleString()} m` : 'Submarine'}</span>
              {compareMode && <span className="si-add">+ Add</span>}
            </li>
          ))}
        </ul>
      )}

      {open && query.length > 1 && results.length === 0 && (
        <div className="search-empty">No volcano found with that name.</div>
      )}

      <button
        className={`compare-cta ${compareMode ? 'on' : ''}`}
        onClick={onToggleCompare}
      >
        <span className="compare-cta-icon">⚖</span>
        {compareMode ? 'Exit compare mode' : 'Compare volcanoes'}
      </button>
    </div>
  )
}
