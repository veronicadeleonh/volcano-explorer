import { useState } from 'react'
import StatusMarker from './StatusMarker'
import BoundaryLine from './BoundaryLine'
import { sfx } from '../lib/sound'
import './LayerControls.css'
import { tokens } from '../styles/tokens'
import { PLATE_META } from '../data/plateMeta'

const LAYERS = [
  {
    id: 'boundaries',
    label: 'Tectonic Plates',
    icon: '🌐',
    legend: [
      { color: tokens.color.boundary.subduction, label: 'Subduction', line: 'solid' },
      { color: tokens.color.boundary.divergent, label: 'Divergent', line: 'dashed' },
      { color: tokens.color.boundary.transform, label: 'Transform', line: 'dotted' },
    ],
  },
  {
    id: 'ringOfFire',
    label: 'Ring of Fire',
    icon: '🔥',
    legend: [
      { color: tokens.color.boundary['ring-of-fire'], label: 'Pacific Ring of Fire', line: 'glow' },
    ],
  },
]

// Plates with a label on the globe, alphabetical, for the keyboard-friendly list.
const PLATE_NAMES = Object.keys(PLATE_META).sort((a, b) => a.localeCompare(b))

const VOLCANO_FILTERS = [
  { id: 'showActive',  label: 'Active',  marker: 'filled', color: tokens.color.status.active },
  { id: 'showDormant', label: 'Dormant', marker: 'ring',   color: tokens.color.status.dormant },
]

const RECENCY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: '6m',  label: '6 months' },
  { id: '1y',  label: '1 year' },
]

const TYPE_FILTERS = [
  { id: 'typeStratovolcano', label: 'Stratovolcano' },
  { id: 'typeCaldera',       label: 'Caldera' },
  { id: 'typeShield',        label: 'Shield' },
  { id: 'typeSubmarine',     label: 'Submarine' },
]

// DOM order = keyboard Tab order (WCAG 2.4.3), so the controls are two separate
// components that App.jsx places around the search bar and the map:
// filters → search → compare → map → geological layers. Both render inside their
// own .lc-root; on desktop it is a transparent pass-through, on mobile it is a
// zero-height fixed strip that pins the toggle buttons to the bottom corners (see
// the @media blocks in LayerControls.css). Which mobile panel is open is lifted to
// App so opening one closes the other.

export function VolcanoFilters({ layers, onToggle, onSetRecency, open, onToggleOpen }) {
  return (
    <div className="lc-root">
      <button
        className={`lc-mobile-toggle lc-mobile-toggle-left ${open ? 'open' : ''}`}
        onClick={onToggleOpen}
      >
        {open ? '✕ Close' : '🌋 Volcanoes'}
      </button>

      {/* ── Volcano filters — bottom-left ── */}
      <div className={`lc-wrap lc-wrap-left ${open ? 'lc-mobile-open' : ''}`}>
        <div className="lc-item lc-group">
          <div className="lc-group-label">Volcanoes</div>
          <div className="lc-chips">
            {VOLCANO_FILTERS.map(f => {
              const on = layers[f.id]
              return (
                <button
                  key={f.id}
                  className={`lc-chip ${on ? 'on' : ''}`}
                  aria-pressed={on}
                  style={on ? { '--chip-color': f.color } : {}}
                  onMouseEnter={sfx.uiHover}
                  onClick={() => { sfx.toggle(!on); onToggle(f.id) }}
                >
                  <StatusMarker shape={f.marker} color={f.color} />
                  {f.label}
                </button>
              )
            })}
          </div>
          <div className={`lc-segment${!layers.showActive ? ' lc-segment-disabled' : ''}`}>
            <div className="lc-seg-label">Last eruption</div>
            <div className="lc-seg-btns">
              {RECENCY_FILTERS.map(f => (
                <button
                  key={f.id}
                  className={`lc-seg-btn ${layers.recencyFilter === f.id ? 'on' : ''}`}
                  aria-pressed={layers.recencyFilter === f.id}
                  onMouseEnter={sfx.uiHover}
                  onClick={() => { sfx.uiClick(); onSetRecency(f.id) }}
                  disabled={!layers.showActive}
                  title={f.id === 'all' ? 'Show all volcanoes' : `Active in the last ${f.label === '6M' ? '6 months' : 'year'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lc-item lc-group">
          <div className="lc-group-label">Volcano Type</div>
          <div className="lc-chips lc-chips-wrap">
            {TYPE_FILTERS.map(f => {
              const on = layers[f.id]
              return (
                <button
                  key={f.id}
                  className={`lc-chip lc-chip-type ${on ? 'on' : ''}`}
                  aria-pressed={on}
                  style={on ? { '--chip-color': '#a0a0d0' } : {}}
                  onMouseEnter={sfx.uiHover}
                  onClick={() => { sfx.toggle(!on); onToggle(f.id) }}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export function GeoLayers({ layers, onToggle, onPlateClick, selectedPlateName, open, onToggleOpen }) {
  const [platesListOpen, setPlatesListOpen] = useState(false)

  return (
    <div className="lc-root">
      <button
        className={`lc-mobile-toggle lc-mobile-toggle-right ${open ? 'open' : ''}`}
        onClick={onToggleOpen}
      >
        {open ? '✕ Close' : '🌐 Layers'}
      </button>

      {/* ── Geological layers — bottom-right ── */}
      <div className={`lc-wrap lc-wrap-right ${open ? 'lc-mobile-open' : ''}`}>
        {LAYERS.map(layer => {
          const active = layers[layer.id]
          return (
            <div key={layer.id} className={`lc-item ${active ? 'active' : ''}`}>
              <button
                className="lc-btn"
                role="switch"
                aria-checked={active}
                onMouseEnter={sfx.uiHover}
                onClick={() => { sfx.layer(!active); onToggle(layer.id) }}
                title={active ? `Hide ${layer.label}` : `Show ${layer.label}`}
              >
                <span className="lc-icon">{layer.icon}</span>
                <span className="lc-label">{layer.label}</span>
                <span className={`lc-toggle ${active ? 'on' : ''}`} />
              </button>
              {active && (
                <div className="lc-legend">
                  {layer.legend.map(l => (
                    <span key={l.label} className="lc-legend-item">
                      <BoundaryLine color={l.color} line={l.line} />
                      {l.label}
                    </span>
                  ))}
                </div>
              )}
              {/* Keyboard (and mouse) way to pick a plate: the on-globe labels
                  move with the rotation and fade out behind the globe. */}
              {active && layer.id === 'boundaries' && (
                <div className="lc-plates">
                  <button
                    type="button"
                    className="lc-plates-toggle"
                    aria-expanded={platesListOpen}
                    aria-controls="lc-plates-list"
                    onMouseEnter={sfx.uiHover}
                    onClick={() => { sfx.uiClick(); setPlatesListOpen(o => !o) }}
                  >
                    <span>Browse plates</span>
                    <span aria-hidden="true">{platesListOpen ? '▴' : '▾'}</span>
                  </button>
                  {platesListOpen && (
                    <div id="lc-plates-list" className="lc-chips lc-chips-wrap lc-plates-list" role="group" aria-label="Tectonic plates">
                      {PLATE_NAMES.map(name => {
                        const on = name === selectedPlateName
                        return (
                          <button
                            type="button"
                            key={name}
                            className={`lc-chip lc-chip-type ${on ? 'on' : ''}`}
                            style={on ? { '--chip-color': '#a0a0d0' } : {}}
                            aria-pressed={on}
                            onMouseEnter={sfx.uiHover}
                            onClick={() => { sfx.uiClick(); onPlateClick?.(name) }}
                          >
                            {name}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
