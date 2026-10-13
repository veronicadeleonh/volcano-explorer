import './KeyboardHint.css'

// Visible counterpart of the globe canvas' aria-label, for sighted keyboard
// users. Map.jsx shows it while the canvas has keyboard focus. Decorative:
// screen readers already get the same text from the canvas aria-label.
export default function KeyboardHint({ visible = false }) {
  return (
    <div className={`map-kbd-hint${visible ? ' is-visible' : ''}`} aria-hidden="true">
      Arrow keys rotate the globe · + and − zoom
    </div>
  )
}
