import { useState } from 'react'
import './LayerControls.css'

const LAYERS = [
  {
    id: 'boundaries',
    label: 'Tectonic Plates',
    icon: '🌐',
    legend: [
      { color: '#b56cf0', label: 'Subduction' },
      { color: '#4da8da', label: 'Divergent' },
      { color: '#a0a0c0', label: 'Transform' },
    ],
  },
  {
    id: 'ringOfFire',
    label: 'Ring of Fire',
    icon: '🔥',
    legend: [
      { color: '#ff6a35', label: 'Pacific Ring of Fire' },
    ],
  },
]

const VOLCANO_FILTERS = [
  { id: 'showActive',  label: 'Active',  icon: '🌋', color: '#ff4422' },
  { id: 'showDormant', label: 'Dormant', icon: '⛰️', color: '#ffaa22' },
]

const RECENCY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: '6m',  label: '6M' },
  { id: '1y',  label: '1Y' },
]

const TYPE_FILTERS = [
  { id: 'typeStratovolcano', label: 'Stratovolcano' },
  { id: 'typeCaldera',       label: 'Caldera' },
  { id: 'typeShield',        label: 'Shield' },
  { id: 'typeSubmarine',     label: 'Submarine' },
]

export default function LayerControls({ layers, onToggle, onSetRecency }) {
  // Mobile-only: each group collapses behind its own toggle button instead of
  // permanently eating map space — volcano filters and geological layers are
  // independent concerns, so they get independent buttons/panels, and opening
  // one closes the other rather than letting them overlap. Irrelevant on
  // desktop — the CSS below only acts on this state inside the mobile media
  // query.
  const [volcanoesOpen, setVolcanoesOpen] = useState(false)
  const [geoOpen, setGeoOpen] = useState(false)

  const toggleVolcanoes = () => { setVolcanoesOpen(o => !o); setGeoOpen(false) }
  const toggleGeo = () => { setGeoOpen(o => !o); setVolcanoesOpen(false) }

  return (
    // On desktop this div is a transparent, unpositioned pass-through — the two
    // .lc-wrap panels keep positioning themselves against .app like before. On
    // mobile the two toggle buttons pin to the bottom corners, each revealing
    // its own panel above itself (see the @media block in LayerControls.css).
    <div className="lc-root">
      <button
        className={`lc-mobile-toggle lc-mobile-toggle-left ${volcanoesOpen ? 'open' : ''}`}
        onClick={toggleVolcanoes}
      >
        {volcanoesOpen ? '✕ Close' : '🌋 Volcanoes'}
      </button>
      <button
        className={`lc-mobile-toggle lc-mobile-toggle-right ${geoOpen ? 'open' : ''}`}
        onClick={toggleGeo}
      >
        {geoOpen ? '✕ Close' : '🌐 Layers'}
      </button>

      {/* ── Volcano filters — bottom-left ── */}
      <div className={`lc-wrap lc-wrap-left ${volcanoesOpen ? 'lc-mobile-open' : ''}`}>
        <div className="lc-item lc-group">
          <div className="lc-group-label">Volcanoes</div>
          <div className="lc-chips">
            {VOLCANO_FILTERS.map(f => {
              const on = layers[f.id]
              return (
                <button
                  key={f.id}
                  className={`lc-chip ${on ? 'on' : ''}`}
                  style={on ? { '--chip-color': f.color } : {}}
                  onClick={() => onToggle(f.id)}
                >
                  <span>{f.icon}</span>
                  {f.label}
                </button>
              )
            })}
          </div>
          <div className="lc-segment">
            {RECENCY_FILTERS.map(f => (
              <button
                key={f.id}
                className={`lc-seg-btn ${layers.recencyFilter === f.id ? 'on' : ''}`}
                onClick={() => onSetRecency(f.id)}
                title={f.id === 'all' ? 'Show all volcanoes' : `Active in the last ${f.label === '6M' ? '6 months' : 'year'}`}
              >
                {f.label}
              </button>
            ))}
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
                  style={on ? { '--chip-color': '#a0a0d0' } : {}}
                  onClick={() => onToggle(f.id)}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Geological layers — bottom-right ── */}
      <div className={`lc-wrap lc-wrap-right ${geoOpen ? 'lc-mobile-open' : ''}`}>
        {LAYERS.map(layer => {
          const active = layers[layer.id]
          return (
            <div key={layer.id} className={`lc-item ${active ? 'active' : ''}`}>
              <button
                className="lc-btn"
                onClick={() => onToggle(layer.id)}
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
                      <span className="lc-legend-dot" style={{ background: l.color }} />
                      {l.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
