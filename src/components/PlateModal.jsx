import { useEffect, useLayoutEffect, useState } from 'react'
import { PLATE_META, PLATE_CODE_NAMES, computePlateStats } from '../data/plateMeta'
import './PlateModal.css'
import { tokens } from '../styles/tokens'
import { useDrawerFocus } from '../lib/useDrawerFocus'
import BoundaryLine from './BoundaryLine'

const BOUNDARY_INFO = {
  subduction: { label: 'Convergent (subduction)', line: 'solid',  color: tokens.color.boundary.subduction },
  divergent:  { label: 'Divergent',               line: 'dashed', color: tokens.color.boundary.divergent },
  transform:  { label: 'Transform',               line: 'dotted', color: tokens.color.boundary.transform },
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
  // Focus moves in on open, Escape closes, focus returns on close.
  const modalRef = useDrawerFocus(onClose, { trap: false })

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
  }, [stats, onArrowPositioned, modalRef])

  if (!meta) return null

  const neighbors = stats
    ? [...stats.neighbors.entries()]
        .map(([code, types]) => ({ code, name: PLATE_CODE_NAMES[code] || code, types: [...types] }))
        .sort((a, b) => a.name.localeCompare(b.name))
    : []

  return (
    <div className={`pm-overlay pm-side-${side}`}>
      <div className="pm-modal" ref={modalRef} tabIndex={-1} role="dialog" aria-labelledby="pm-title">
        <div className="pm-modal-scroll">
          <div className="pm-header">
            <div className="pm-title-wrap">
              <span className="pm-title" id="pm-title">{plateName}</span>
              <span className="pm-code">{meta.code}</span>
            </div>
            <button className="pm-close" onClick={onClose} aria-label="Close">✕</button>
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
                {/* Grouped by boundary type, listing the neighbouring plates:
                    the type is the line style + its name, never colour alone. */}
                <dl className="pm-types">
                  {Object.entries(BOUNDARY_INFO).map(([key, info]) => {
                    const names = neighbors.filter(n => n.types.includes(key)).map(n => n.name)
                    if (!names.length) return null
                    return (
                      <div key={key} className="pm-type-row">
                        <dt className="pm-type-label">
                          <BoundaryLine color={info.color} line={info.line} />
                          {info.label}
                        </dt>
                        <dd className="pm-type-plates">{names.join(', ')}</dd>
                      </div>
                    )
                  })}
                </dl>
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
