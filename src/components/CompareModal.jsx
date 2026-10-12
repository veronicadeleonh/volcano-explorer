import { useEffect, useState } from 'react'
import './CompareModal.css'
import { tokens } from '../styles/tokens'
import { statusColor } from '../lib/statusColor'
import { useModalFocus } from '../lib/useModalFocus'

async function fetchWikiImage(wikiUrl, fallbackUrl) {
  if (!wikiUrl) return fallbackUrl || null
  try {
    const title = wikiUrl.split('/wiki/').pop()
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error('not ok')
    const data = await res.json()
    return data?.originalimage?.source || data?.thumbnail?.source || fallbackUrl || null
  } catch {
    return fallbackUrl || null
  }
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
  const [images, setImages] = useState({})
  const dialogRef = useModalFocus()

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Fetch images for all volcanoes
  useEffect(() => {
    volcanoes.forEach(v => {
      fetchWikiImage(v.wikipedia, v.image).then(src => {
        if (src) setImages(prev => ({ ...prev, [v.id]: src }))
      })
    })
  }, [volcanoes])

  return (
    <div className="cm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="cm-modal" ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="cm-title">
        {/* Header */}
        <div className="cm-header">
          <span className="cm-title" id="cm-title">⚖ Volcano Comparison</span>
          <button className="cm-close" onClick={onClose} aria-label="Close comparison">✕</button>
        </div>

        {/* One real <table>: the first column holds row headers, the first row
            holds the volcano names (scope="col" / scope="row"), so a screen
            reader announces "Fuji, Status, Active" as you move between cells. */}
        <table className="cm-table" style={{ '--ncols': volcanoes.length }}>
          <caption className="sr-only">
            Comparison of {volcanoes.map(v => v.name).join(', ')}
          </caption>
          <thead>
            <tr>
              <td className="cm-corner"><span className="sr-only">Property</span></td>
              {volcanoes.map(v => (
                <th key={v.id} scope="col" className="cm-vol-header">
                  <div className="cm-vol-img-wrap">
                    {images[v.id]
                      ? <img src={images[v.id]} alt="" className="cm-vol-img" /> /* decorative: the name is right below */
                      : <div className="cm-vol-img-skeleton" />
                    }
                    <span className="cm-vol-dot" style={{ background: statusColor(v.status) }} aria-hidden="true" />
                  </div>
                  <div className="cm-vol-name">{v.name}</div>
                  <div className="cm-vol-sub">{v.country}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Elevation highlight bar */}
            <ElevationRow volcanoes={volcanoes} />

            {/* Standard rows */}
            {[
              { label: 'Region',        render: v => v.region },
              { label: 'Type',          render: v => v.type },
              { label: 'Status',        render: v => (
                <span style={{ color: statusColor(v.status), fontWeight: 600 }}>{v.status}</span>
              )},
              { label: 'Last eruption', render: v => v.last_eruption || '—' },
              { label: 'Eruptions',     render: v => v.eruptions?.length ? `${v.eruptions.length} recorded` : '—' },
              { label: 'Max VEI',       render: v => <VEIBar vei={maxVEI(v.eruptions)} /> },
            ].map(row => (
              <tr key={row.label} className="cm-row">
                <th scope="row" className="cm-row-label">{row.label}</th>
                {volcanoes.map(v => (
                  <td key={v.id} className="cm-cell">{row.render(v)}</td>
                ))}
              </tr>
            ))}

            {/* Links row */}
            <tr className="cm-row cm-links-row">
              <th scope="row" className="cm-row-label">Links</th>
              {volcanoes.map(v => (
                <td key={v.id} className="cm-link-cell">
                  {v.wikipedia && (
                    <a className="cm-link" href={v.wikipedia} target="_blank" rel="noreferrer" aria-label={`${v.name} on Wikipedia (opens in a new tab)`}>Wikipedia ↗</a>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ElevationRow({ volcanoes }) {
  const elevs = volcanoes.map(v => v.elevation)
  const maxElev = Math.max(...elevs.filter(e => e > 0), 1)

  return (
    <tr className="cm-row cm-elev-row">
      <th scope="row" className="cm-row-label">Elevation</th>
      {volcanoes.map(v => {
        const pct = v.elevation > 0 ? (v.elevation / maxElev) * 100 : 0
        const isHighest = v.elevation === maxElev && v.elevation > 0
        return (
          <td key={v.id} className="cm-cell">
            <div className="cm-elev-cell">
              <div className="cm-elev-text" style={{ color: isHighest ? tokens.color.highlight.peak : tokens.color.white['100'] }}>
                {v.elevation > 0 ? `${Number(v.elevation).toLocaleString()} m` : 'Submarine'}
                {isHighest && <><span className="cm-crown" aria-hidden="true"> 👑</span><span className="sr-only"> (highest)</span></>}
              </div>
              {v.elevation > 0 && (
                <div className="cm-elev-bar-wrap" aria-hidden="true">
                  <div className="cm-elev-bar" style={{ width: `${pct}%`, background: isHighest ? tokens.color.highlight.peak : tokens.color.sky['70'] }} />
                </div>
              )}
            </div>
          </td>
        )
      })}
    </tr>
  )
}
