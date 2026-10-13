import { statusColor } from '../lib/statusColor'
import './StatusMarker.css'

// Status symbol shared with the map: filled dot = active, ring = dormant /
// extinct. Colour is never the only cue (WCAG 1.4.1). Decorative: the status
// is always written out next to it.
export default function StatusMarker({ status, shape, color, size = 12 }) {
  const s = shape ?? (status?.includes('Active') ? 'filled' : 'ring')
  const c = color ?? statusColor(status)
  return (
    <span
      className={`status-marker status-marker-${s}`}
      style={{ '--marker-color': c, '--marker-size': `${size}px` }}
      aria-hidden="true"
    />
  )
}
