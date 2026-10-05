import { useEffect, useRef } from 'react'
import { PLATE_META } from '../data/plateMeta'
import { sfx } from '../lib/sound'
import './PlateLabels.css'

// Sourced from PLATE_META (src/data/plateMeta.js) so the label position and
// the camera target used when the plate is selected (see Map.jsx) never
// drift apart.
const PLATES = Object.entries(PLATE_META).map(([name, m]) => ({ name, coords: m.coords }))

const toRad = d => d * Math.PI / 180

// Returns dot product of camera-facing direction and the plate point's unit vector.
// > 0 means the plate is on the visible hemisphere.
function facingDot(center, plateLon, plateLat) {
  const lat1 = toRad(center.lat), lon1 = toRad(center.lng)
  const lat2 = toRad(plateLat),   lon2 = toRad(plateLon)
  return (
    Math.sin(lat1) * Math.sin(lat2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
  )
}

export default function PlateLabels({ map, visible, onPlateClick, selectedPlateName, modalAnchor }) {
  const svgRef   = useRef(null)
  const groupRefs = useRef([])
  const connectorRef = useRef(null) // dashed line extended from the selected label to the open modal

  useEffect(() => {
    if (!map || !visible) return

    const update = () => {
      const svg = svgRef.current
      if (!svg) return

      const container = map.getContainer()
      const W = container.clientWidth
      const H = container.clientHeight
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`)

      const center    = map.getCenter()
      const projCenter = map.project(center)

      // Globe radius: distance to a point 90° of longitude away at equator
      const projEdge  = map.project([center.lng + 90, 0])
      const globeR    = Math.hypot(projEdge.x - projCenter.x, projEdge.y - projCenter.y)

      let selectedPoint = null

      PLATES.forEach((plate, i) => {
        const g = groupRefs.current[i]
        if (!g) return

        const dot = facingDot(center, plate.coords[0], plate.coords[1])
        // Hide plates that are behind the globe or very close to the edge
        if (dot < 0.18) { g.setAttribute('opacity', 0); return }

        const proj = map.project(plate.coords)

        // Anchor the modal connector on the plate's actual globe position,
        // not the offset tick below -- this still works when the selected
        // plate sits dead center under the camera (selecting one recenters
        // the globe on it), which is exactly when the ambient tick+label a
        // few lines down gets suppressed for being too close to center.
        if (plate.name === selectedPlateName) selectedPoint = { x: proj.x, y: proj.y }

        const dx   = proj.x - projCenter.x
        const dy   = proj.y - projCenter.y
        const dist = Math.hypot(dx, dy)
        if (dist < 4) { g.setAttribute('opacity', 0); return }

        const nx = dx / dist
        const ny = dy / dist

        // Fade out plates close to the horizon
        const opacity = Math.min(1, (dot - 0.18) / 0.25) * 0.7
        g.setAttribute('opacity', opacity)

        // Line: from globe surface outward
        const x1 = projCenter.x + nx * globeR * 0.94
        const y1 = projCenter.y + ny * globeR * 0.94
        const x2 = x1 + nx * 52
        const y2 = y1 + ny * 52

        const line = g.querySelector('.plate-tick-line')
        line.setAttribute('x1', x1)
        line.setAttribute('y1', y1)
        line.setAttribute('x2', x2)
        line.setAttribute('y2', y2)

        // Small dot at each end of the tick line -- one on the globe
        // surface, one out by the label -- so it reads as a proper pointer
        // rather than a line trailing off into nothing.
        const rootDot = g.querySelector('.plate-root-dot')
        rootDot.setAttribute('cx', x1)
        rootDot.setAttribute('cy', y1)

        const hitCircle = g.querySelector('.plate-hit-circle')
        hitCircle.setAttribute('cx', x2)
        hitCircle.setAttribute('cy', y2)

        const tipDot = g.querySelector('.plate-tip-dot')
        tipDot.setAttribute('cx', x2)
        tipDot.setAttribute('cy', y2)

        const text = g.querySelector('.plate-label-text')
        text.setAttribute('x', x2 + (nx >= 0 ? 7 : -7))
        text.setAttribute('y', y2 + ny * 2)
        text.setAttribute('text-anchor', nx >= 0 ? 'start' : 'end')
      })

      // Extend the selected label's dashed line the rest of the way to the
      // open modal -- hidden whenever there's no selection, no modal
      // position yet, or the selected plate has rotated out of view.
      const connector = connectorRef.current
      if (connector) {
        if (selectedPoint && modalAnchor) {
          connector.setAttribute('opacity', 1)
          connector.setAttribute('x1', selectedPoint.x)
          connector.setAttribute('y1', selectedPoint.y)
          connector.setAttribute('x2', modalAnchor.x)
          connector.setAttribute('y2', modalAnchor.y)
        } else {
          connector.setAttribute('opacity', 0)
        }
      }
    }

    map.on('render', update)
    update()
    return () => map.off('render', update)
  }, [map, visible, selectedPlateName, modalAnchor])

  if (!visible || !map) return null

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
        overflow: 'visible',
      }}
    >
      <line
        ref={connectorRef}
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1"
        strokeDasharray="3 2"
        opacity={0}
      />
      {PLATES.map((plate, i) => (
        <g
          key={plate.name}
          ref={el => { groupRefs.current[i] = el }}
          opacity={0}
          className="plate-label-group"
          onClick={(e) => onPlateClick?.(plate.name, { x: e.clientX, y: e.clientY })}
          onMouseEnter={sfx.plateHover}
          style={{ cursor: onPlateClick ? 'pointer' : undefined }}
        >
          <line
            className="plate-tick-line"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1"
            strokeDasharray="3 2"
          />
          <circle className="plate-root-dot" r="2" fill="rgba(255,255,255,0.5)" pointerEvents="none" />
          {/* Hit area behind the dot + label -- generous enough to tap on mobile,
              but the connector line above stays non-interactive so it never eats
              a map drag. */}
          <circle className="plate-hit-circle" r="14" fill="transparent" pointerEvents="auto" />
          <circle className="plate-tip-dot" r="2.5" fill="rgba(255,255,255,0.7)" pointerEvents="none" />
          <text
            className="plate-label-text"
            fill="rgba(255,255,255,0.75)"
            fontSize="9.5"
            fontFamily="'JetBrains Mono', ui-monospace, monospace"
            dominantBaseline="middle"
            letterSpacing="0.8"
            pointerEvents="auto"
            style={{ textTransform: 'uppercase' }}
          >
            {plate.name}
          </text>
        </g>
      ))}
    </svg>
  )
}
