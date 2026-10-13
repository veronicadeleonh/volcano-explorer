// Line swatch drawn like the boundary on the map (solid / dashed / dotted /
// glow), so the type is readable without colour (WCAG 1.4.1). Keep in sync
// with the geo-* layers in Map.jsx. Decorative: the type is always written.
export default function BoundaryLine({ color, line }) {
  const dash = { dashed: '5 3.5', dotted: '0.1 4.4' }[line]
  return (
    <svg className="boundary-line" width="24" height="8" viewBox="0 0 24 8" aria-hidden="true">
      {line === 'glow' && <line x1="2" y1="4" x2="22" y2="4" stroke={color} strokeWidth="7" strokeOpacity="0.25" strokeLinecap="round" />}
      <line x1="2" y1="4" x2="22" y2="4" stroke={color} strokeWidth={line === 'dashed' ? 2 : 2.5} strokeLinecap="round" strokeDasharray={dash} />
    </svg>
  )
}
