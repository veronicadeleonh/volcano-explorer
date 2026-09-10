import { useRef, useState } from 'react'
import './WelcomeModal.css'

const STEPS = [
  { icon: '🌍', text: 'The globe rotates on its own — volcanoes active in the last year pulse in red, others show as solid or dormant dots' },
  { icon: '🔍', text: 'Search by name, country or region to fly to any volcano instantly' },
  { icon: '📋', text: 'Click a volcano to open its detail panel — eruption history, VEI charts and geological data' },
  { icon: '⚖️', text: 'Use Compare mode to select up to 3 volcanoes and see them side by side' },
  { icon: '🗺️', text: 'Hover a country to highlight it, click to see every volcano it has' },
]

export default function WelcomeModal() {
  const [open, setOpen] = useState(true)
  const [activeStep, setActiveStep] = useState(0)
  const stepsRef = useRef(null)

  if (!open) return null

  const scrollToStep = (i) => {
    const el = stepsRef.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
    setActiveStep(i)
  }

  const handleStepsScroll = () => {
    const el = stepsRef.current
    if (!el || !el.clientWidth) return
    setActiveStep(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <div className="wm-overlay">
      <div className="wm-card">
        {/* Scrolls internally if content is taller than the modal -- the
        "Start exploring" button below lives outside this wrapper so it's
        always visible, never pushed off-screen. */}
        <div className="wm-scroll">
          <div className="wm-volcano" aria-hidden="true">
            <div className="wm-volcano-glow" />
            {/* Icon: Material Symbols "volcano" (Google, Apache License 2.0) */}
            <svg className="wm-volcano-svg" viewBox="0 -960 960 960">
              <path
                className="wm-volcano-cone"
                d="m80-80 160-360h120l80-200h280L880-80H80Zm92-60h628L675-580H480l-80 200H279L172-140Zm371-640v-140h60v140h-60Zm181 76-42-42 99-99 43 42-100 99Zm-302 0-99-99 42-43 99 100-42 42Zm378 564H172h628Z"
              />
            </svg>
            <div className="wm-volcano-crater">
              <span className="wm-ember wm-ember-1" />
              <span className="wm-ember wm-ember-2" />
              <span className="wm-ember wm-ember-3" />
              <span className="wm-ember wm-ember-4" />
            </div>
          </div>

          <h2>Volcano Explorer</h2>

          <p className="wm-sub">
            An interactive 3D globe of the world's volcanoes — explore eruption history,
            geological layers, and compare volcanoes side by side.
          </p>

          <div className="wm-steps" ref={stepsRef} onScroll={handleStepsScroll}>
            {STEPS.map(({ icon, text }) => (
              <div key={icon} className="wm-step">
                <span className="wm-step-icon">{icon}</span>
                <span className="wm-step-text">{text}</span>
              </div>
            ))}
          </div>

          <div className="wm-dots">
            {STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`wm-dot ${i === activeStep ? 'active' : ''}`}
                onClick={() => scrollToStep(i)}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <button className="wm-btn" onClick={() => setOpen(false)}>
          Start exploring
        </button>
      </div>
    </div>
  )
}
