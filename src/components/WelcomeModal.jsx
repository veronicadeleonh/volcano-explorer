import { useEffect, useState, useSyncExternalStore } from 'react'
import './WelcomeModal.css'
import { useDrawerFocus } from '../lib/useDrawerFocus'
import { isMuted, subscribe, toggleMuted, holdSound, releaseSound } from '../lib/sound'

// Shown on the first visit only. Dismissing it is remembered per browser; if
// storage isn't available (private window, blocked site data) it simply shows
// every time, which is the safe fallback.
const SEEN_KEY = 'volcano-explorer:welcome-seen'
const hasSeenWelcome = () => { try { return localStorage.getItem(SEEN_KEY) === '1' } catch { return false } }
const markWelcomeSeen = () => { try { localStorage.setItem(SEEN_KEY, '1') } catch { /* ignore */ } }

// `remember={false}` (used by the /styleguide page) always shows it and never stores anything.
export default function WelcomeModal({ remember = true }) {
  const [open, setOpen] = useState(() => !remember || !hasSeenWelcome())
  if (!open) return null
  return <WelcomeDialog onClose={() => { if (remember) markWelcomeSeen(); setOpen(false) }} />
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
          <div className="wm-volcano" aria-hidden="true">
            <div className="wm-volcano-glow" />
            {/* Icon: Material Symbols "volcano" (Google, Apache License 2.0) */}
            <svg className="wm-volcano-svg" viewBox="0 -960 960 960" aria-hidden="true" focusable="false">
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
