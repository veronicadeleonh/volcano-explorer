import { useEffect, useRef, useState } from 'react'
import './FeedbackDialog.css'
import { useDrawerFocus } from '../lib/useDrawerFocus'
import { sfx } from '../lib/sound'
import { track } from '../lib/analytics'
import VolcanoIsland from './illustrations/VolcanoIsland'
import './illustrations/illustrations.css'

// Feedback, one question per step. Posts to /api/feedback (api/feedback.js),
// which stores the answer, anonymously, in a private Notion database. The
// option values below must match the lists the API accepts and the Notion
// columns. `demo` (used by /styleguide) fakes the send instead of posting.

const CONTACT_EMAIL = 'hi@veronicadeleonh.de'

const MAX_OTHER = 200
const OTHER = 'Something else'
const LIKED = [
  'The 3D globe', 'How it looks', 'Moving between volcanoes', 'Comparing volcanoes', 'Eruption data',
]
const WANTS = [
  'More data or volcanoes', 'Search and finding things', 'Understanding what I see', 'Phone experience', 'Speed',
]
const FEATURES = [
  { value: 'Keyboard', label: 'Keyboard navigation' },
  { value: 'Zoom or reflow', label: 'Zoom or larger text' },
  { value: 'Screen reader', label: 'Screen reader' },
  { value: 'Reduced motion', label: 'Reduced motion' },
]
const HELPFUL = [
  { value: 'Yes', label: 'Yes, they helped' },
  { value: 'Somewhat', label: 'Somewhat' },
  { value: 'No', label: 'Not really' },
]
const RATING_HINT = { 1: ', not great', 5: ', loved it' }

// Step 0 is the cover (no question number); steps 1 to 4 are the questions.
const QUESTIONS = 4
const LAST = QUESTIONS

const toggle = (list, value) => (list.includes(value) ? list.filter((x) => x !== value) : [...list, value])

function Choice({ type = 'checkbox', name, checked, onChange, children }) {
  return (
    <label className={`fb-choice${checked ? ' is-on' : ''}`}>
      <input type={type} name={name} checked={checked} onChange={onChange} />
      <span>{children}</span>
    </label>
  )
}

// Checkbox rows plus a "Something else" row that opens a short text field.
function OptionList({ options, selected, onToggle, other, onOther, otherLabel }) {
  const otherOn = selected.includes(OTHER)
  return (
    <>
      {options.map((o) => (
        <Choice key={o} checked={selected.includes(o)} onChange={() => onToggle(o)}>{o}</Choice>
      ))}
      <Choice checked={otherOn} onChange={() => onToggle(OTHER)}>{OTHER}</Choice>
      {otherOn && (
        <input
          type="text"
          className="fb-other"
          aria-label={otherLabel}
          placeholder={otherLabel}
          maxLength={MAX_OTHER}
          value={other}
          onChange={(e) => onOther(e.target.value)}
        />
      )}
    </>
  )
}

export default function FeedbackDialog({ onClose, demo = false }) {
  const dialogRef = useDrawerFocus(onClose)
  const headingRef = useRef(null)
  const firstRatingRef = useRef(null)
  const thanksRef = useRef(null)
  const moved = useRef(false)

  const [step, setStep] = useState(0)
  const [rating, setRating] = useState(null)
  const [liked, setLiked] = useState([])
  const [wants, setWants] = useState([])
  const [features, setFeatures] = useState([])
  const [noneUsed, setNoneUsed] = useState(false)
  const [helpful, setHelpful] = useState(null)
  const [likedOther, setLikedOther] = useState('')
  const [wantsOther, setWantsOther] = useState('')
  const [website, setWebsite] = useState('') // honeypot: real people never fill it
  const [ratingError, setRatingError] = useState(false)
  const [status, setStatus] = useState('idle') // idle | sending | sent | error

  // After a step change, focus moves to the new question so screen readers
  // announce it; after sending, to the thank-you heading.
  useEffect(() => {
    if (moved.current) { moved.current = false; headingRef.current?.focus() }
  }, [step])
  useEffect(() => {
    if (status === 'sent') thanksRef.current?.focus()
  }, [status])

  const goTo = (n) => { moved.current = true; setStep(n) }

  const toggleFeature = (value) => { setNoneUsed(false); setFeatures((f) => toggle(f, value)) }
  const toggleNone = () => {
    if (noneUsed) { setNoneUsed(false); return }
    setNoneUsed(true); setFeatures([]); setHelpful(null)
  }

  async function send() {
    sfx.uiClick()
    setStatus('sending')
    try {
      if (demo) {
        await new Promise((r) => setTimeout(r, 600))
        setStatus('sent')
        return
      }
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          liked,
          likedOther,
          wants,
          wantsOther,
          features,
          helpful: noneUsed ? 'Did not use them' : features.length ? helpful : null,
          viewport: window.innerWidth,
          website,
        }),
      })
      if (res.ok) track('feedback_sent')
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  function onSubmit(e) {
    e.preventDefault()
    if (status === 'sending') return
    if (step === 1 && !rating) {
      setRatingError(true)
      firstRatingRef.current?.focus()
      return
    }
    sfx.uiClick()
    if (step === 0 && !demo) track('feedback_started')
    if (step < LAST) goTo(step + 1)
    else send()
  }

  const close = () => { sfx.uiClick(); onClose() }
  const sending = status === 'sending'
  const n = step
  const last = step === LAST

  // ── Thank-you screen ────────────────────────────────────────────────
  if (status === 'sent') {
    return (
      <div className="fb-overlay">
        <div className="fb-card" ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="fb-title">
          <div className="fb-done">
            <h2 id="fb-title" ref={thanksRef} tabIndex={-1}>Thank you!</h2>
            <p className="fb-note">
              That really helps me decide what to improve next. If you'd like to chat or get a reply, you can write to me
              at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
            <button type="button" className="fb-btn fb-btn-primary" onClick={close}>Close</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fb-overlay">
      <div className="fb-card" ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="fb-title" aria-describedby={step === 0 ? 'fb-intro' : undefined}>
        <form className="fb-form" onSubmit={onSubmit} noValidate>
          <div className="fb-scroll">
            <p className="fb-kicker" id="fb-title">Share your feedback</p>
            {step > 0 && (
              <div className="fb-bar" aria-hidden="true">
                {Array.from({ length: QUESTIONS }, (_, i) => <span key={i} className={i < step ? 'is-done' : ''} />)}
              </div>
            )}

            {/* Cover: the warm intro on its own, so it is not lost above question 1. */}
            {step === 0 && (
              <div className="fb-cover">
                <div className="ill-frame" aria-hidden="true"><VolcanoIsland /></div>
                <h2 id="fb-q" className="fb-cover-title" ref={headingRef} tabIndex={-1}>Hi!</h2>
                <p className="fb-note" id="fb-intro">
                  Volcano Explorer is a personal project I built out of curiosity about volcanoes. I'd love to know what
                  you think and how I can make it better.
                </p>
                <p className="fb-note">It takes about 30 seconds, and it's anonymous.</p>
              </div>
            )}

            {step === 1 && (
              <fieldset className="fb-field" aria-labelledby="fb-q" aria-describedby={ratingError ? 'fb-rating-hint fb-rating-err' : 'fb-rating-hint'}>
                <h2 id="fb-q" className="fb-q" ref={headingRef} tabIndex={-1}>
                  <span className="fb-step-n">Question {n} of {QUESTIONS}</span>
                  <span className="sr-only">. </span>How would you rate your experience?
                </h2>
                <div className="fb-rating">
                  {[1, 2, 3, 4, 5].map((v, i) => (
                    <span key={v} className="fb-rating-opt">
                      <input
                        type="radio"
                        id={`fb-rating-${v}`}
                        name="rating"
                        value={v}
                        checked={rating === v}
                        onChange={() => { setRating(v); setRatingError(false) }}
                        ref={i === 0 ? firstRatingRef : undefined}
                      />
                      <label htmlFor={`fb-rating-${v}`}>
                        <span aria-hidden="true">{v}</span>
                        <span className="sr-only">{v} out of 5{RATING_HINT[v] ?? ''}</span>
                      </label>
                    </span>
                  ))}
                </div>
                <p className="fb-hint" id="fb-rating-hint">1 = not great, 5 = loved it</p>
                {ratingError && <p className="fb-error" id="fb-rating-err" role="alert">Please choose a rating from 1 to 5.</p>}
              </fieldset>
            )}

            {step === 2 && (
              <fieldset className="fb-field" aria-labelledby="fb-q" aria-describedby="fb-hint">
                <h2 id="fb-q" className="fb-q" ref={headingRef} tabIndex={-1}>
                  <span className="fb-step-n">Question {n} of {QUESTIONS}</span>
                  <span className="sr-only">. </span>What do you enjoy most?
                </h2>
                <p className="fb-hint" id="fb-hint">Pick any that apply, or skip it.</p>
                <OptionList
                  options={LIKED}
                  selected={liked}
                  onToggle={(o) => setLiked((l) => toggle(l, o))}
                  other={likedOther}
                  onOther={setLikedOther}
                  otherLabel="What else do you enjoy?"
                />
              </fieldset>
            )}

            {step === 3 && (
              <fieldset className="fb-field" aria-labelledby="fb-q" aria-describedby="fb-hint">
                <h2 id="fb-q" className="fb-q" ref={headingRef} tabIndex={-1}>
                  <span className="fb-step-n">Question {n} of {QUESTIONS}</span>
                  <span className="sr-only">. </span>What should I improve first?
                </h2>
                <p className="fb-hint" id="fb-hint">Pick any that apply, or tell me in Something else. That includes anything that was hard to use.</p>
                <OptionList
                  options={WANTS}
                  selected={wants}
                  onToggle={(o) => setWants((l) => toggle(l, o))}
                  other={wantsOther}
                  onOther={setWantsOther}
                  otherLabel="What should I improve?"
                />
              </fieldset>
            )}

            {step === 4 && (
              <>
                <fieldset className="fb-field" aria-labelledby="fb-q" aria-describedby="fb-hint">
                  <h2 id="fb-q" className="fb-q" ref={headingRef} tabIndex={-1}>
                    <span className="fb-step-n">Question {n} of {QUESTIONS}</span>
                    <span className="sr-only">. </span>Did you use any accessibility features?
                  </h2>
                  <p className="fb-hint" id="fb-hint">Optional. Pick any that apply.</p>
                  {FEATURES.map((f) => (
                    <Choice key={f.value} checked={features.includes(f.value)} onChange={() => toggleFeature(f.value)}>{f.label}</Choice>
                  ))}
                  <Choice checked={noneUsed} onChange={toggleNone}>I didn't use any</Choice>
                </fieldset>
                {/* Appears once a feature is picked; the live region announces it. */}
                <div aria-live="polite">
                  {features.length > 0 && (
                    <fieldset className="fb-field" aria-labelledby="fb-helpful-q">
                      <p id="fb-helpful-q" className="fb-sub">Did they help?</p>
                      {HELPFUL.map((h) => (
                        <Choice key={h.value} type="radio" name="helpful" checked={helpful === h.value} onChange={() => setHelpful(h.value)}>{h.label}</Choice>
                      ))}
                    </fieldset>
                  )}
                </div>
                <p className="fb-privacy">Answers are anonymous: I don't collect your name or email, only your screen width.</p>
                {status === 'error' && (
                  <p className="fb-error fb-error-box" role="alert">
                    Something went wrong and your feedback wasn't sent. Your answers are still here, please try again.
                  </p>
                )}
              </>
            )}

            {/* Honeypot: hidden from people and screen readers, bots tend to fill it. */}
            <div className="fb-hp" aria-hidden="true">
              <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
            </div>
          </div>

          <div className="fb-actions">
            {step === 0
              ? <button type="button" className="fb-btn" onClick={close}>Cancel</button>
              : <button type="button" className="fb-btn" onClick={() => { sfx.uiClick(); goTo(step - 1) }}>Back</button>}
            <button type="submit" className="fb-btn fb-btn-primary" aria-disabled={sending}>
              {last ? (sending ? 'Sending…' : 'Send feedback') : step === 0 ? 'Start' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
