import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PLATE_META, PLATE_CODE_NAMES, computePlateStats } from '../data/plateMeta'
import './PlateModal.css'

const BOUNDARY_INFO = {
  divergent:  { label: 'divergent',              color: '#4da8da' },
  transform:  { label: 'transform',              color: '#a0a0c0' },
  subduction: { label: 'convergent (subduction)', color: '#b56cf0' },
}

// Same plate_boundaries.json already driving the geo-transform /
// geo-divergent / geo-subduction map layers -- cached module-wide so
// reopening the modal doesn't refetch.
let boundariesCache = null
async function loadBoundaries() {
  if (boundariesCache) return boundariesCache
  const res = await fetch('/data/plate_boundaries.json')
  boundariesCache = await res.json()
  return boundariesCache
}

function formatArea(km2) {
  return `${(km2 / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })} million km²`
}

function formatVelocity([min, max]) {
  return min === max ? `≈ ${min} cm/yr` : `≈ ${min}–${max} cm/yr`
}

export default function PlateModal({ plateName, side = 'right', onArrowPositioned, onClose }) {
  const meta = PLATE_META[plateName]
  const [stats, setStats] = useState(null)
  const modalRef = useRef(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Boundary composition + neighbors, computed client-side from the
  // boundaries dataset -- no extra network request beyond the one fetch.
  useEffect(() => {
    if (!meta) return
    let cancelled = false
    loadBoundaries().then(data => {
      if (!cancelled) setStats(computePlateStats(meta.code, data))
    })
    return () => { cancelled = true }
  }, [meta])

  // The card is always vertically centered (see .pm-modal CSS) -- this
  // just measures where its title ended up, so the map-side connector
  // line (drawn by PlateLabels) can extend all the way to it. Re-measures
  // once the neighbor list loads and the card grows/shrinks.
  useLayoutEffect(() => {
    const el = modalRef.current
    if (!el) return
    const HEADER_OFFSET = 28 // px from the card's top edge to the title's vertical center
    const rect = el.getBoundingClientRect()
    onArrowPositioned?.({ x: rect.left, y: rect.top + HEADER_OFFSET })
  }, [stats, onArrowPositioned])

  if (!meta) return null

  const neighbors = stats
    ? [...stats.neighbors.entries()]
        .map(([code, types]) => ({ code, name: PLATE_CODE_NAMES[code] || code, types: [...types] }))
        .sort((a, b) => a.name.localeCompare(b.name))
    : []

  return (
    <div className={`pm-overlay pm-side-${side}`}>
      <div className="pm-modal" ref={modalRef}>
        <div className="pm-modal-scroll">
          <div className="pm-header">
            <div className="pm-title-wrap">
              <span className="pm-title">{plateName}</span>
              <span className="pm-code">{meta.code}</span>
            </div>
            <button className="pm-close" onClick={onClose}>✕</button>
          </div>

          <div className="pm-stats">
            <div className="pm-stat">
              <span className="pm-stat-label">Type</span>
              <span className={`pm-badge pm-badge-${meta.type}`}>
                {meta.type === 'major' ? 'Major' : 'Minor'}
              </span>
            </div>
            <div className="pm-stat">
              <span className="pm-stat-label">Crust</span>
              <span className="pm-stat-value">{meta.crust}</span>
            </div>
            <div className="pm-stat">
              <span className="pm-stat-label">Area</span>
              <span className="pm-stat-value">{formatArea(meta.areaKm2)}</span>
            </div>
            <div className="pm-stat">
              <span className="pm-stat-label">Velocity</span>
              <span className="pm-stat-value">
                {formatVelocity(meta.velocity)} toward the {meta.direction}
              </span>
            </div>
          </div>

          <div className="pm-section pm-section-feature">
            <span className="pm-section-title">Notable</span>
            <p className="pm-feature">{meta.feature}</p>
          </div>

          <div className="pm-section">
            <span className="pm-section-title">Boundaries</span>

            {!stats ? (
              <div className="pm-loading">loading…</div>
            ) : (
              <>
                <div className="pm-boundary-legend">
                  {Object.entries(BOUNDARY_INFO).map(([key, info]) => (
                    stats.counts[key] > 0 && (
                      <span key={key} className="pm-legend-item">
                        <span className="pm-dot" style={{ background: info.color }} />
                        {stats.counts[key]} {info.label}
                      </span>
                    )
                  ))}
                </div>

                {neighbors.length > 0 && (
                  <div className="pm-neighbors">
                    <span className="pm-section-subtitle">Borders</span>
                    <div className="pm-neighbor-list">
                      {neighbors.map(n => (
                        <span key={n.code} className="pm-neighbor">
                          {n.types.map(t => (
                            <span
                              key={t}
                              className="pm-dot pm-dot-sm"
                              style={{ background: BOUNDARY_INFO[t]?.color }}
                            />
                          ))}
                          {n.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="pm-footnote">
            Area, crust & notable: Wikipedia · Velocity: approximate published ranges · Boundaries: PB2002 (Bird, 2003)
          </div>
        </div>
      </div>
    </div>
  )
}
