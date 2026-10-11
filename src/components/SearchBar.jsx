import { useState, useRef, useEffect } from 'react'
import { sfx } from '../lib/sound'
import { COUNTRY_ISO } from '../data/countryIso'
import './SearchBar.css'

const STATUS_EMOJI = { Active: '🔴', Dormant: '🟡', Extinct: '⚫' }

function statusEmoji(s) {
  for (const k of Object.keys(STATUS_EMOJI)) {
    if (s && s.includes(k)) return STATUS_EMOJI[k]
  }
  return '🔴'
}

export default function SearchBar({ volcanoes, onSelect, onSelectCountry, selected, compareMode, onToggleCompare }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const q = query.toLowerCase()
  const volcanoResults = query.length >= 1
    ? volcanoes.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.country.toLowerCase().includes(q) ||
        v.region.toLowerCase().includes(q)
      ).slice(0, 8)
    : []

  // Countries whose name matches come first, so a keyboard user can open the
  // country panel (map users click the country polygon). Not offered in
  // compare mode, where country selection is disabled.
  const countryResults = query.length >= 1 && !compareMode
    ? [...new Set(volcanoes.map(v => v.country))]
        .filter(name => COUNTRY_ISO[name] && name.toLowerCase().includes(q))
        .slice(0, 3)
        .map(name => ({
          kind: 'country',
          id: `country-${name}`,
          name,
          iso: COUNTRY_ISO[name],
          volcanoes: volcanoes.filter(v => v.country === name),
        }))
    : []

  const results = [...countryResults, ...volcanoResults]

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
    if (e.key === 'Enter' && highlight >= 0) { pick(results[highlight], { keepFocus: true }) }
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() }
  }

  const pick = (v, { keepFocus = false } = {}) => {
    if (v.kind === 'country') onSelectCountry?.({ name: v.name, iso: v.iso, volcanoes: v.volcanoes })
    else onSelect(v)
    if (!compareMode) setQuery(v.name)
    else setQuery('')
    setOpen(false)
    if (!keepFocus) inputRef.current?.blur() // keyboard picks keep focus so it can move to the panel
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
          role="combobox"
          aria-label={compareMode ? 'Search a volcano to compare' : 'Search volcanoes, countries or places'}
          aria-expanded={open && results.length > 0}
          aria-controls="search-listbox"
          aria-autocomplete="list"
          aria-activedescendant={open && highlight >= 0 ? `search-option-${highlight}` : undefined}
          placeholder={compareMode ? 'Search volcano to compare...' : 'Search volcano, country or place...'}
          value={query}
          onChange={handleChange}
          onFocus={() => query && setOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button type="button" className="search-clear" onClick={handleClear} title="Clear" aria-label="Clear search">✕</button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="search-results" ref={listRef} id="search-listbox" role="listbox" aria-label="Search results">
          {results.map((v, i) => (
            <li
              key={v.id}
              id={`search-option-${i}`}
              role="option"
              aria-selected={i === highlight}
              className={`search-item ${i === highlight ? 'highlighted' : ''}`}
              onMouseDown={() => pick(v)}
              onMouseEnter={() => { sfx.uiHover(); setHighlight(i) }}
            >
              {v.kind === 'country' ? (
                <>
                  <span className="si-emoji" aria-hidden="true">🌍</span>
                  <span className="si-name">{v.name}</span>
                  <span className="si-meta">Country · {v.volcanoes.length} {v.volcanoes.length === 1 ? 'volcano' : 'volcanoes'}</span>
                </>
              ) : (
                <>
                  <span className="si-emoji" aria-hidden="true">{statusEmoji(v.status)}</span>
                  <span className="si-name">{v.name}</span>
                  <span className="si-meta">{v.country} · {v.elevation > 0 ? `${v.elevation.toLocaleString()} m` : 'Submarine'}</span>
                  {compareMode && <span className="si-add">+ Add</span>}
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Announces the result count to screen readers as the user types. */}
      <div className="sr-only" role="status" aria-live="polite">
        {open && query.length >= 1
          ? (results.length ? `${results.length} ${results.length === 1 ? 'result' : 'results'} available, use up and down arrows` : 'No results')
          : ''}
      </div>

      {open && query.length > 1 && results.length === 0 && (
        <div className="search-empty">No volcano found with that name.</div>
      )}

      <button
        className={`compare-cta ${compareMode ? 'on' : ''}`}
        onMouseEnter={sfx.uiHover}
        onClick={onToggleCompare}
      >
        <span className="compare-cta-icon">⚖</span>
        {compareMode ? 'Exit compare mode' : 'Compare volcanoes'}
      </button>
    </div>
  )
}
