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

export default function LayerControls({ layers, onToggle }) {
  return (
    <div className="lc-wrap">
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
  )
}
