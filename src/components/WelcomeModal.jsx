import { useEffect, useState, useSyncExternalStore } from 'react'
import './WelcomeModal.css'
import EruptingVolcano from './illustrations/EruptingVolcano'
import './illustrations/illustrations.css'
import { useDrawerFocus } from '../lib/useDrawerFocus'
import { isMuted, subscribe, toggleMuted, holdSound, releaseSound } from '../lib/sound'
import { hasSeenWelcome, markWelcomeSeen } from '../lib/welcomeSeen'

// Shown automatically on the first visit only (see lib/welcomeSeen.js); the help
// button on the map reopens it. Controlled when `open` is passed (App does this),
// otherwise it manages itself. `remember={false}` (used by the /styleguide page)
// always shows it and never stores anything.
export default function WelcomeModal({ open: openProp, onClose, remember = true }) {
  const [openState, setOpenState] = useState(() => !remember || !hasSeenWelcome())
  const open = openProp !== undefined ? openProp : openState
  if (!open) return null
  return (
    <WelcomeDialog
      onClose={() => {
        if (remember) markWelcomeSeen()
        setOpenState(false)
        onClose?.()
      }}
    />
  )
}

// Separate component so the focus handling (trap, Escape, restore) only
// exists while the dialog is on screen.
function WelcomeDialog({ onClose }) {
  const dialogRef = useDrawerFocus(onClose)
  const muted = useSyncExternalStore(subscribe, isMuted)

  // No audio until the person has had the chance to turn it off (WCAG 1.4.2).
  useEffect(() => {
    holdSound()
    return releaseSound
  }, [])

  return (
    <div className="wm-overlay">
      <div className="wm-card" ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="wm-title">
        {/* Scrolls internally if content is taller than the modal -- the
        "Start exploring" button below lives outside this wrapper so it's
        always visible, never pushed off-screen. */}
        <div className="wm-scroll">
          <div className="ill-frame" aria-hidden="true"><EruptingVolcano /></div>

          <h2 id="wm-title">Volcano Explorer</h2>

          <p className="wm-sub">
            An interactive 3D globe of the world's volcanoes. Search by volcano or country,
            click to explore eruption history and geology, or compare up to three side by side.
            Red pulsing dots erupted in the last year.
          </p>

          <div className="wm-sound">
            <button
              type="button"
              className="wm-sound-btn"
              role="switch"
              aria-checked={!muted}
              aria-labelledby="wm-sound-label"
              aria-describedby="wm-sound-hint"
              onClick={toggleMuted}
            >
              <span className="wm-sound-label" id="wm-sound-label">Ambient sound</span>
              <span className="wm-sound-track" aria-hidden="true" />
            </button>
            <p className="wm-sound-hint" id="wm-sound-hint">
              Quiet background drone and interface sounds. You can change it any time with the speaker button.
            </p>
          </div>
        </div>

        <button className="wm-btn" onClick={onClose}>
          Start exploring
        </button>
      </div>
    </div>
  )
}
