import { useState, useRef, useEffect } from 'react'
import './CompareBar.css'

const MAX = 3

function getColor(status = '') {
  if (status.includes('Active'))  return '#ff4422'
  if (status.includes('Dormant')) return '#ffaa22'
  return '#8888aa'
}

export default function CompareBar({ compareList, volcanoes = [], onAdd, onRemove, onOpen, onCancel }) {
  const slots = Array.from({ length: MAX }, (_, i) => compareList[i] || null)
  const canCompare = compareList.length >= 2
  const [openSlot, setOpenSlot] = useState(null)   // index of the slot whose dropdown is open
  const [query, setQuery] = useState('')
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
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const pick = (v) => {
    onAdd(v)
    setOpenSlot(null)
    setQuery('')
  }

  // Close on outside click
  useEffect(() => {
    if (openSlot === null) return
    const handler = (e) => {
      if (!dropdownRef.current?.contains(e.target)) setOpenSlot(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openSlot])

  return (
    <div className="cb-wrap">
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
                <span className="cb-dot" style={{ background: getColor(v.status) }} />
                <span className="cb-name">{v.name}</span>
                <button className="cb-remove" onClick={() => onRemove(v.id)} title="Remove">✕</button>
              </div>
            ) : (
              <button
                className={`cb-slot empty ${openSlot === i ? 'open' : ''}`}
                onClick={() => openSlot === i ? setOpenSlot(null) : openDropdown(i)}
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
                  placeholder="Search by name or country…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                <ul className="cb-list">
                  {filtered.length > 0 ? filtered.map(v => (
                    <li key={v.id} className="cb-option" onMouseDown={() => pick(v)}>
                      <span className="cb-opt-dot" style={{ background: getColor(v.status) }} />
                      <span className="cb-opt-name">{v.name}</span>
                      <span className="cb-opt-country">{v.country}</span>
                    </li>
                  )) : (
                    <li className="cb-empty-msg">No volcanoes found</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        ))}

        <button
          className={`cb-go ${canCompare ? 'ready' : 'disabled'}`}
          onClick={canCompare ? onOpen : undefined}
          title={canCompare ? 'View comparison' : 'Select at least 2 volcanoes'}
        >
          Compare →
        </button>
      </div>
    </div>
  )
}
