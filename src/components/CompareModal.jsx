import { useEffect } from 'react'
import './CompareModal.css'

function getColor(status = '') {
  if (status.includes('Active'))  return '#ff4422'
  if (status.includes('Dormant')) return '#ffaa22'
  return '#8888aa'
}

function maxVEI(eruptions = []) {
  if (!eruptions.length) return null
  return Math.max(...eruptions.map(e => e.vei ?? 0))
}

function VEIBar({ vei }) {
  if (vei === null) return <span className="cm-na">—</span>
  return (
    <div className="cm-vei-bar">
      {Array.from({ length: 8 }, (_, i) => (
        <span key={i} className={`cm-vei-seg ${i < vei ? 'on' : ''}`} />
      ))}
      <span className="cm-vei-num">VEI {vei}</span>
    </div>
  )
}

const ROWS = [
  { label: 'País',          key: 'country',      render: v => v.country },
  { label: 'Región',        key: 'region',       render: v => v.region },
  { label: 'Tipo',          key: 'type',         render: v => v.type },
  { label: 'Elevación',     key: 'elevation',    render: v => v.elevation > 0 ? `${Number(v.elevation).toLocaleString()} m` : 'Submarina' },
  { label: 'Estado',        key: 'status',       render: v => v.status },
  { label: 'Últ. erupción', key: 'last',         render: v => v.last_eruption || '—' },
  { label: 'Erupciones',    key: 'count',        render: v => v.eruptions?.length ? `${v.eruptions.length} registradas` : '—' },
  { label: 'VEI máx.',      key: 'vei',          render: (v, col) => col },   // special
]

export default function CompareModal({ volcanoes, onClose }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="cm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="cm-modal" style={{ '--ncols': volcanoes.length }}>
        {/* Header */}
        <div className="cm-header">
          <span className="cm-title">⚖ Volcano Comparison</span>
          <button className="cm-close" onClick={onClose}>✕</button>
        </div>

        {/* Volcano name columns */}
        <div className="cm-cols">
          <div className="cm-row-label-col" />
          {volcanoes.map(v => (
            <div key={v.id} className="cm-vol-header">
              <span className="cm-vol-dot" style={{ background: getColor(v.status) }} />
              <div>
                <div className="cm-vol-name">{v.name}</div>
                <div className="cm-vol-sub">{v.country}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Metric rows */}
        <div className="cm-table">
          {/* Elevation highlight bar */}
          <ElevationRow volcanoes={volcanoes} />

          {/* Standard rows */}
          {[
            { label: 'Region',        render: v => v.region },
            { label: 'Type',          render: v => v.type },
            { label: 'Status',        render: v => (
              <span style={{ color: getColor(v.status), fontWeight: 600 }}>{v.status}</span>
            )},
            { label: 'Last eruption', render: v => v.last_eruption || '—' },
            { label: 'Eruptions',     render: v => v.eruptions?.length ? `${v.eruptions.length} recorded` : '—' },
            { label: 'Max VEI',       render: v => <VEIBar vei={maxVEI(v.eruptions)} /> },
          ].map(row => (
            <div key={row.label} className="cm-row">
              <div className="cm-row-label">{row.label}</div>
              {volcanoes.map(v => (
                <div key={v.id} className="cm-cell">{row.render(v)}</div>
              ))}
            </div>
          ))}
        </div>

        {/* Links row */}
        <div className="cm-links-row">
          <div className="cm-row-label-col" />
          {volcanoes.map(v => (
            <div key={v.id} className="cm-link-cell">
              {v.wikipedia && (
                <a className="cm-link" href={v.wikipedia} target="_blank" rel="noreferrer">Wikipedia ↗</a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ElevationRow({ volcanoes }) {
  const elevs = volcanoes.map(v => v.elevation)
  const maxElev = Math.max(...elevs.filter(e => e > 0), 1)

  return (
    <div className="cm-row cm-elev-row">
      <div className="cm-row-label">Elevation</div>
      {volcanoes.map(v => {
        const pct = v.elevation > 0 ? (v.elevation / maxElev) * 100 : 0
        const isHighest = v.elevation === maxElev && v.elevation > 0
        return (
          <div key={v.id} className="cm-cell cm-elev-cell">
            <div className="cm-elev-text" style={{ color: isHighest ? '#ffd080' : '#fff' }}>
              {v.elevation > 0 ? `${Number(v.elevation).toLocaleString()} m` : 'Submarine'}
              {isHighest && <span className="cm-crown"> 👑</span>}
            </div>
            {v.elevation > 0 && (
              <div className="cm-elev-bar-wrap">
                <div className="cm-elev-bar" style={{ width: `${pct}%`, background: isHighest ? '#ffd080' : 'rgba(100,160,255,0.7)' }} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
