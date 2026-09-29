import { useEffect, useRef } from 'react'

const PLATES = [
  { name: 'Pacific Plate',        coords: [-155,   5] },
  { name: 'North American Plate', coords: [-100,  48] },
  { name: 'South American Plate', coords: [ -55, -18] },
  { name: 'Eurasian Plate',       coords: [  55,  52] },
  { name: 'African Plate',        coords: [  22,   8] },
  { name: 'Australian Plate',     coords: [ 125, -28] },
  { name: 'Antarctic Plate',      coords: [   0, -78] },
  { name: 'Nazca Plate',          coords: [ -95, -22] },
  { name: 'Caribbean Plate',      coords: [ -75,  15] },
  { name: 'Cocos Plate',          coords: [ -88,  10] },
  { name: 'Philippine Plate',     coords: [ 133,  20] },
  { name: 'Arabian Plate',        coords: [  47,  24] },
  { name: 'Indian Plate',         coords: [  78,  22] },
  { name: 'Juan de Fuca Plate',   coords: [-130,  47] },
  { name: 'Scotia Plate',         coords: [ -40, -57] },
]

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

export default function PlateLabels({ map, visible }) {
  const svgRef   = useRef(null)
  const groupRefs = useRef([])

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

      PLATES.forEach((plate, i) => {
        const g = groupRefs.current[i]
        if (!g) return

        const dot = facingDot(center, plate.coords[0], plate.coords[1])
        // Hide plates that are behind the globe or very close to the edge
        if (dot < 0.18) { g.setAttribute('opacity', 0); return }

        const proj = map.project(plate.coords)
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

        const line = g.querySelector('line')
        line.setAttribute('x1', x1)
        line.setAttribute('y1', y1)
        line.setAttribute('x2', x2)
        line.setAttribute('y2', y2)

        const circle = g.querySelector('circle')
        circle.setAttribute('cx', x2)
        circle.setAttribute('cy', y2)

        const text = g.querySelector('text')
        text.setAttribute('x', x2 + (nx >= 0 ? 7 : -7))
        text.setAttribute('y', y2 + ny * 2)
        text.setAttribute('text-anchor', nx >= 0 ? 'start' : 'end')
      })
    }

    map.on('render', update)
    update()
    return () => map.off('render', update)
  }, [map, visible])

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
      {PLATES.map((plate, i) => (
        <g key={plate.name} ref={el => { groupRefs.current[i] = el }} opacity={0}>
          <line
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1"
            strokeDasharray="3 2"
          />
          <circle r="2.5" fill="rgba(255,255,255,0.7)" />
          <text
            fill="rgba(255,255,255,0.75)"
            fontSize="9.5"
            fontFamily="'JetBrains Mono', ui-monospace, monospace"
            dominantBaseline="middle"
            letterSpacing="0.8"
            style={{ textTransform: 'uppercase' }}
          >
            {plate.name}
          </text>
        </g>
      ))}
    </svg>
  )
}
