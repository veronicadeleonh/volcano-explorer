import { useState } from 'react'
import './WelcomeModal.css'

export default function WelcomeModal() {
  const [open, setOpen] = useState(true)

  if (!open) return null

  return (
    <div className="wm-overlay">
      <div className="wm-card">
        <div className="wm-icon">🌋</div>

        <h2>Volcano Explorer</h2>

        <p className="wm-sub">
          An interactive 3D globe of the world's volcanoes — explore eruption history,
          geological layers, and compare volcanoes side by side.
        </p>

        <div className="wm-steps">
          {[
            { icon: '🌍', text: 'Rotate and zoom the globe — active volcanoes pulse in red, dormant ones appear as colored dots' },
            { icon: '🔍', text: 'Search by name, country or region to fly to any volcano instantly' },
            { icon: '📋', text: 'Click a volcano to open its detail panel — eruption history, VEI charts and geological data' },
            { icon: '⚖️', text: 'Use Compare mode to select up to 3 volcanoes and see them side by side' },
          ].map(({ icon, text }) => (
            <div key={icon} className="wm-step">
              <span className="wm-step-icon">{icon}</span>
              <span className="wm-step-text">{text}</span>
            </div>
          ))}
        </div>

        <button className="wm-btn" onClick={() => setOpen(false)}>
          Start exploring
        </button>
      </div>
    </div>
  )
}
