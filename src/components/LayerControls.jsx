import './LayerControls.css'

const LAYERS = [
  {
    id: 'boundaries',
    label: 'Tectonic Plates',
    icon: '🌐',
    legend: [
      { color: '#ff6b35', label: 'Subduction' },
      { color: '#4da8da', label: 'Divergent' },
      { color: '#a0a0c0', label: 'Transform' },
    ],
  },
  {
    id: 'ringOfFire',
    label: 'Ring of Fire',
    icon: '🔥',
    legend: [
      { color: '#ff2200', label: 'Pacific Ring of Fire' },
    ],
  },
]

const VOLCANO_FILTERS = [
  { id: 'showActive',  label: 'Active',  icon: '🌋', color: '#ff4422' },
  { id: 'showDormant', label: 'Dormant', icon: '⛰️', color: '#ffaa22' },
]

const TYPE_FILTERS = [
  { id: 'typeStratovolcano', label: 'Stratovolcano' },
  { id: 'typeCaldera',       label: 'Caldera' },
  { id: 'typeShield',        label: 'Shield' },
  { id: 'typeSubmarine',     label: 'Submarine' },
]

export default function LayerControls({ layers, onToggle }) {
  return (
    <>
      {/* ── Volcano filters — bottom-left ── */}
      <div className="lc-wrap lc-wrap-left">
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
          <button
            className={`lc-recent-btn ${layers.recentEruption ? 'on' : ''}`}
            onClick={() => onToggle('recentEruption')}
          >
            <span className={`lc-recent-dot ${layers.recentEruption ? 'on' : ''}`} />
            Erupted recently
          </button>
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
      <div className="lc-wrap lc-wrap-right">
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
    </>
  )
}
