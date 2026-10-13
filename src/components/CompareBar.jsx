import { useState, useRef, useEffect } from 'react'
import { sfx } from '../lib/sound'
import './CompareBar.css'
import StatusMarker from './StatusMarker'

const MAX = 3

export default function CompareBar({ compareList, volcanoes = [], onAdd, onRemove, onOpen, onCancel }) {
  const slots = Array.from({ length: MAX }, (_, i) => compareList[i] || null)
  const canCompare = compareList.length >= 2
  const [openSlot, setOpenSlot] = useState(null)   // index of the slot whose dropdown is open
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(-1)  // keyboard-highlighted option in the dropdown
  const wrapRef    = useRef(null)
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  const selectedIds = new Set(compareList.map(v => v.id))
  const filtered = volcanoes
    .filter(v => !selectedIds.has(v.id) && (
      v.name.toLowerCase().includes(query.toLowerCase()) ||
      v.country.toLowerCase().includes(query.toLowerCase())
    ))

  const openDropdown = (i) => {
    setOpenSlot(i)
    setQuery('')
    setHighlight(-1)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  // Put focus somewhere sensible once the dropdown closes, so a keyboard user
  // doesn't lose their place: back on the slot that opened it (Esc), or on the
  // next free slot / the Compare button (after adding a volcano).
  const focusSoon = (find) => setTimeout(() => find(wrapRef.current)?.focus(), 0)

  const pick = (v) => {
    onAdd(v)
    setOpenSlot(null)
    setQuery('')
    setHighlight(-1)
    focusSoon(root => root?.querySelector('.cb-slot.empty') || root?.querySelector('.cb-go'))
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(h + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter' && highlight >= 0 && filtered[highlight]) { e.preventDefault(); pick(filtered[highlight]) }
    else if (e.key === 'Escape') {
      e.preventDefault()
      const i = openSlot
      setOpenSlot(null)
      focusSoon(root => root?.querySelectorAll('.cb-slot-wrap')[i]?.querySelector('.cb-slot'))
    }
  }

  // Keep the highlighted option in view when arrowing through a long list.
  useEffect(() => {
    if (highlight >= 0) document.getElementById(`cb-option-${highlight}`)?.scrollIntoView({ block: 'nearest' })
  }, [highlight])

  // Close dropdown on outside click
  useEffect(() => {
    if (openSlot === null) return
    const handler = (e) => {
      if (!document.contains(e.target)) return
      if (!dropdownRef.current?.contains(e.target)) setOpenSlot(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openSlot])

  // Close compare mode on outside click
  useEffect(() => {
    const handler = (e) => {
      // Ignore clicks on nodes that React already removed from the DOM
      // (e.g. a volcano option that caused a re-render before this handler fires)
      if (!document.contains(e.target)) return
      // The dedicated "Exit compare mode" button (SearchBar's .compare-cta)
      // already toggles compare mode itself on click. Without this guard, this
      // mousedown-based outside-click check fires first and exits, then the
      // button's own click fires right after and toggles it back on -- so the
      // button visibly does nothing. Let the button be the only trigger.
      if (e.target.closest?.('.compare-cta')) return
      if (!wrapRef.current?.contains(e.target)) onCancel()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onCancel])

  return (
    <div className="cb-wrap" ref={wrapRef}>
      <div className="cb-title">
        {compareList.length === 0 && 'Select volcanoes to compare'}
        {compareList.length === 1 && 'Add at least one more'}
        {compareList.length >= 2 && `${compareList.length} volcanoes selected`}
      </div>

      <div className="cb-slots" ref={dropdownRef}>
        {slots.map((v, i) => (
          <div key={i} className="cb-slot-wrap">
            {v ? (
              <div className="cb-slot filled">
                <StatusMarker status={v.status} size={10} />
                <span className="cb-name">{v.name}</span>
                <button className="cb-remove" onMouseEnter={sfx.uiHover} onClick={() => onRemove(v.id)} title="Remove" aria-label={`Remove ${v.name}`}>✕</button>
              </div>
            ) : (
              <button
                className={`cb-slot empty ${openSlot === i ? 'open' : ''}`}
                onMouseEnter={sfx.uiHover}
                onClick={() => { sfx.uiClick(); if (openSlot === i) setOpenSlot(null); else openDropdown(i) }}
              >
                <span className="cb-plus">+</span>
                <span className="cb-placeholder">Add volcano</span>
              </button>
            )}

            {openSlot === i && (
              <div className="cb-dropdown">
                <input
                  ref={inputRef}
                  className="cb-search"
                  role="combobox"
                  aria-label="Search volcanoes by name or country"
                  aria-expanded={filtered.length > 0}
                  aria-controls="cb-listbox"
                  aria-autocomplete="list"
                  aria-activedescendant={highlight >= 0 ? `cb-option-${highlight}` : undefined}
                  placeholder="Search by name or country…"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setHighlight(-1) }}
                  onKeyDown={handleSearchKeyDown}
                  autoComplete="off"
                  spellCheck={false}
                />
                <ul className="cb-list" id="cb-listbox" role="listbox" aria-label="Volcanoes to add">
                  {filtered.length > 0 ? filtered.map((v, idx) => (
                    <li
                      key={v.id}
                      id={`cb-option-${idx}`}
                      role="option"
                      aria-selected={idx === highlight}
                      className={`cb-option ${idx === highlight ? 'highlighted' : ''}`}
                      onMouseEnter={sfx.uiHover}
                      onMouseDown={() => pick(v)}
                    >
                      <StatusMarker status={v.status} size={10} />
                      <span className="cb-opt-name">{v.name}</span>
                      <span className="cb-opt-country">{v.country}</span>
                    </li>
                  )) : (
                    <li className="cb-empty-msg" role="status">No volcanoes found</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        ))}

        <button
          className={`cb-go ${canCompare ? 'ready' : 'disabled'}`}
          onMouseEnter={canCompare ? sfx.uiHover : undefined}
          onClick={canCompare ? onOpen : undefined}
          title={canCompare ? 'View comparison' : 'Select at least 2 volcanoes'}
        >
          Compare →
        </button>
      </div>
    </div>
  )
}
