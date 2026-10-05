// Synthesized sound design for Volcano Explorer — everything is generated with
// the Web Audio API, no audio files. Deliberately quiet: a low "void" drone
// that never fully goes away, a zoom whoosh that follows camera motion, and
// short metallic / electric UI blips.
//
// Browsers keep an AudioContext suspended until a user gesture, so the engine
// boots on the first pointer/key event and every effect is a silent no-op
// before that (and while muted).

const STORAGE_KEY = 'volcano-explorer:sound-muted'
const MASTER_LEVEL = 0.9
// Background void level (was 0.5) — kept barely above the threshold of hearing.
const AMBIENT_LEVEL = 0.14
// Zoom air: centre frequency at zoom 0, peak loudness (kept very low).
const ZOOM_AIR_HZ = 950
const ZOOM_PEAK = 0.02

let ctx = null
let master = null
let sfxBus = null
let whooshGain = null
let whooshFilter = null
let muted = readMuted()
let started = false
let suspendTimer = null
let zoomIdleTimer = null
let lastSfxAt = 0
const listeners = new Set()

function readMuted() {
  try { return localStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
}
function writeMuted(v) {
  try { localStorage.setItem(STORAGE_KEY, v ? '1' : '0') } catch { /* private mode etc. */ }
}

// ── store API (for the mute button) ────────────────────────────────────────
export function isMuted() { return muted }
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) }
function emit() { listeners.forEach(fn => fn()) }

// ── noise helper ───────────────────────────────────────────────────────────
function makeNoiseBuffer(c, seconds, brown) {
  const len = Math.floor(c.sampleRate * seconds)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1
    if (brown) { last = (last + 0.02 * white) / 1.02; d[i] = last * 3.5 } else d[i] = white
  }
  // fade the loop seam so it doesn't click
  const fade = Math.floor(c.sampleRate * 0.05)
  for (let i = 0; i < fade; i++) {
    const g = i / fade
    d[i] *= g
    d[len - 1 - i] *= g
  }
  return buf
}

// ── engine boot ────────────────────────────────────────────────────────────
function build() {
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return false
  ctx = new Ctx()

  master = ctx.createGain()
  master.gain.value = muted ? 0 : MASTER_LEVEL
  master.connect(ctx.destination)

  sfxBus = ctx.createGain()
  sfxBus.gain.value = 1
  sfxBus.connect(master)

  // Ambient void: slowly breathing brown noise + a faint detuned sub drone.
  const ambient = ctx.createGain()
  ambient.gain.value = 0
  ambient.connect(master)
  ambient.gain.setTargetAtTime(AMBIENT_LEVEL, ctx.currentTime, 4) // slow fade-in

  const noise = ctx.createBufferSource()
  noise.buffer = makeNoiseBuffer(ctx, 8, true)
  noise.loop = true
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 220
  lp.Q.value = 0.4
  const noiseGain = ctx.createGain()
  noiseGain.gain.value = 0.16
  noise.connect(lp); lp.connect(noiseGain); noiseGain.connect(ambient)

  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.045
  const lfoDepth = ctx.createGain()
  lfoDepth.gain.value = 70
  lfo.connect(lfoDepth); lfoDepth.connect(lp.frequency)

  // very thin, far-away "air" on top
  const air = ctx.createBufferSource()
  air.buffer = makeNoiseBuffer(ctx, 6, false)
  air.loop = true
  const hp = ctx.createBiquadFilter()
  hp.type = 'bandpass'
  hp.frequency.value = 3200
  hp.Q.value = 0.6
  const airGain = ctx.createGain()
  airGain.gain.value = 0.0035
  air.connect(hp); hp.connect(airGain); airGain.connect(ambient)

  ;[[55, 0.05], [55.35, 0.05], [110.4, 0.014]].forEach(([f, g]) => {
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = f
    const og = ctx.createGain()
    og.gain.value = g
    o.connect(og); og.connect(ambient)
    o.start()
  })

  // Zoom "air": soft high-passed noise that swells with camera speed — like
  // wind passing — with its colour drifting up when approaching and down when
  // pulling away. Kept in the high band so there's no low-end mud.
  const wNoise = ctx.createBufferSource()
  wNoise.buffer = makeNoiseBuffer(ctx, 4, false)
  wNoise.loop = true
  const wHp = ctx.createBiquadFilter()
  wHp.type = 'highpass'
  wHp.frequency.value = 400
  wHp.Q.value = 0.5
  whooshFilter = ctx.createBiquadFilter()
  whooshFilter.type = 'bandpass'
  whooshFilter.frequency.value = ZOOM_AIR_HZ
  whooshFilter.Q.value = 0.7
  whooshGain = ctx.createGain()
  whooshGain.gain.value = 0
  const wLp = ctx.createBiquadFilter() // roll off the hiss so it reads as breath, not static
  wLp.type = 'lowpass'
  wLp.frequency.value = 2200
  wLp.Q.value = 0.3
  wNoise.connect(wHp); wHp.connect(whooshFilter); whooshFilter.connect(wLp); wLp.connect(whooshGain); whooshGain.connect(master)
  wNoise.start()

  noise.start(); air.start(); lfo.start()
  return true
}

function applyMute() {
  if (!ctx || !master) return
  clearTimeout(suspendTimer)
  if (muted) {
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.12)
    // stop burning CPU on a drone nobody can hear
    suspendTimer = setTimeout(() => { if (muted && ctx.state === 'running') ctx.suspend().catch(() => {}) }, 700)
  } else {
    const go = () => {
      master.gain.cancelScheduledValues(ctx.currentTime)
      master.gain.setTargetAtTime(MASTER_LEVEL, ctx.currentTime, 0.2)
    }
    if (ctx.state === 'suspended') ctx.resume().then(go).catch(() => {}); else go()
  }
}

// Call once at app start; wires the first-gesture unlock + tab visibility.
export function initSound() {
  if (started || typeof window === 'undefined') return
  started = true

  const unlock = () => {
    if (!ctx && !build()) return
    if (ctx.state === 'suspended' && !muted) ctx.resume().catch(() => {})
    window.removeEventListener('pointerdown', unlock, true)
    window.removeEventListener('keydown', unlock, true)
    window.removeEventListener('touchstart', unlock, true)
  }
  window.addEventListener('pointerdown', unlock, true)
  window.addEventListener('keydown', unlock, true)
  window.addEventListener('touchstart', unlock, true)

  // Every <a href> in the app gets the link sounds — delegated so new links
  // (panels, popups, modals) are covered without touching each component.
  document.addEventListener('mouseover', (e) => {
    const a = e.target.closest?.('a[href]')
    if (a && !a.contains(e.relatedTarget)) sfx.linkHover()
  })
  document.addEventListener('click', (e) => {
    if (e.target.closest?.('a[href]')) sfx.linkClick()
  })

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return
    if (document.hidden) { if (ctx.state === 'running') ctx.suspend().catch(() => {}) }
    else if (!muted && ctx.state === 'suspended') ctx.resume().catch(() => {})
  })
}

export function setMuted(v) {
  muted = !!v
  writeMuted(muted)
  // a click on the mute button is itself a gesture — make sure we exist
  if (!ctx) build()
  applyMute()
  emit()
  if (!muted) setTimeout(() => sfx.on(), 80)
}
export function toggleMuted() { setMuted(!muted) }

// ── helpers for effects ────────────────────────────────────────────────────
function ready(minGapMs = 0) {
  if (muted || !ctx || ctx.state !== 'running') return false
  if (minGapMs) {
    const t = performance.now()
    if (t - lastSfxAt < minGapMs) return false
    lastSfxAt = t
  }
  return true
}

// one-shot enveloped oscillator
function blip({ type = 'sine', f0, f1, t = 0.1, peak = 0.05, attack = 0.005, at = 0, filter }) {
  const now = ctx.currentTime + at
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(f0, now)
  if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, now + t * 0.8)
  g.gain.setValueAtTime(0.0001, now)
  g.gain.linearRampToValueAtTime(peak, now + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, now + t)
  let out = o
  if (filter) {
    const bq = ctx.createBiquadFilter()
    bq.type = filter.type; bq.frequency.value = filter.f; bq.Q.value = filter.q ?? 1
    o.connect(bq); out = bq
  }
  out.connect(g); g.connect(sfxBus)
  o.start(now); o.stop(now + t + 0.03)
}

// short burst of band-passed noise (the "electric crackle")
function crackle({ f = 5000, q = 3, t = 0.04, peak = 0.03, at = 0 }) {
  const now = ctx.currentTime + at
  const src = ctx.createBufferSource()
  src.buffer = makeNoiseBuffer(ctx, 0.12, false)
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q
  const g = ctx.createGain()
  g.gain.setValueAtTime(peak, now)
  g.gain.exponentialRampToValueAtTime(0.0001, now + t)
  src.connect(bp); bp.connect(g); g.connect(sfxBus)
  src.start(now); src.stop(now + t + 0.02)
}

// inharmonic partials give a struck-metal timbre
const METAL = [1, 2.76, 5.4, 8.93]
function metalPing(base, t, peak, at = 0) {
  METAL.forEach((r, i) => {
    blip({ type: 'sine', f0: base * r, t: t / (1 + i * 0.7), peak: peak / (1 + i * 1.3), at, attack: 0.002 })
  })
}

// ── public effects ─────────────────────────────────────────────────────────
export const sfx = {
  // tectonic plate label hover: metallic ping + electric zap
  plateHover() {
    if (!ready(70)) return
    metalPing(1400, 0.14, 0.011)
    blip({ type: 'sawtooth', f0: 2600, f1: 1200, t: 0.04, peak: 0.004, filter: { type: 'highpass', f: 1800 } })
    crackle({ f: 6500, q: 4, t: 0.025, peak: 0.006 })
  },

  // volcano filter chips / hover on controls: tiny soft tick
  uiHover() {
    if (!ready(45)) return
    blip({ type: 'sine', f0: 1500, f1: 1750, t: 0.05, peak: 0.018 })
  },

  // inline links: a faint, glassy tick on hover and a soft rising pip on click
  linkHover() {
    if (!ready(60)) return
    blip({ type: 'sine', f0: 1900, f1: 2250, t: 0.05, peak: 0.011 })
    blip({ type: 'sine', f0: 3800, t: 0.035, peak: 0.003 })
  },
  linkClick() {
    if (!ready(60)) return
    blip({ type: 'sine', f0: 900, f1: 1500, t: 0.09, peak: 0.022 })
  },

  // generic press (recency buttons)
  uiClick() {
    if (!ready(30)) return
    blip({ type: 'triangle', f0: 620, f1: 420, t: 0.07, peak: 0.04 })
  },

  // chip toggle: rising for on, falling for off
  toggle(isOn) {
    if (!ready(30)) return
    if (isOn) {
      blip({ type: 'triangle', f0: 520, t: 0.09, peak: 0.04 })
      blip({ type: 'triangle', f0: 780, t: 0.11, peak: 0.04, at: 0.06 })
    } else {
      blip({ type: 'triangle', f0: 780, t: 0.09, peak: 0.035 })
      blip({ type: 'triangle', f0: 480, t: 0.12, peak: 0.035, at: 0.06 })
    }
  },

  // plates / ring of fire layer power-up / power-down: electric sweep
  layer(isOn) {
    if (!ready(30)) return
    if (isOn) {
      blip({ type: 'sawtooth', f0: 180, f1: 1400, t: 0.32, peak: 0.02, attack: 0.04, filter: { type: 'lowpass', f: 2600, q: 2 } })
      metalPing(900, 0.3, 0.025, 0.24)
      crackle({ f: 4800, q: 2, t: 0.1, peak: 0.02, at: 0.22 })
    } else {
      blip({ type: 'sawtooth', f0: 1100, f1: 120, t: 0.3, peak: 0.02, attack: 0.01, filter: { type: 'lowpass', f: 2200, q: 2 } })
      crackle({ f: 3000, q: 2, t: 0.06, peak: 0.012 })
    }
  },

  // country hover: soft, low, rounded
  countryHover() {
    if (!ready(110)) return
    blip({ type: 'sine', f0: 330, f1: 380, t: 0.14, peak: 0.028, attack: 0.012 })
    blip({ type: 'sine', f0: 660, t: 0.1, peak: 0.008, attack: 0.012 })
  },


  // ── compare volcanoes ──
  // enter / exit compare mode: two linked pings, rising on entry, falling on exit
  compareMode(isOn) {
    if (!ready(60)) return
    if (isOn) {
      metalPing(700, 0.2, 0.022)
      metalPing(1050, 0.26, 0.022, 0.09)
      crackle({ f: 5200, q: 3, t: 0.05, peak: 0.014, at: 0.09 })
    } else {
      metalPing(1050, 0.18, 0.02)
      metalPing(700, 0.24, 0.02, 0.08)
    }
  },

  // volcano locked into a slot — pitch climbs with each slot (1..3)
  compareAdd(slot = 1) {
    if (!ready(40)) return
    const base = 600 * Math.pow(1.26, Math.max(0, slot - 1)) // ~major third per slot
    metalPing(base, 0.2, 0.03)
    blip({ type: 'triangle', f0: base * 2, f1: base * 3, t: 0.05, peak: 0.012 })
  },

  compareRemove() {
    if (!ready(40)) return
    blip({ type: 'triangle', f0: 640, f1: 300, t: 0.12, peak: 0.035 })
    crackle({ f: 2500, q: 2, t: 0.04, peak: 0.01 })
  },

  // tried to add a 4th volcano — dull, short "no"
  compareFull() {
    if (!ready(120)) return
    blip({ type: 'square', f0: 180, f1: 140, t: 0.1, peak: 0.014, filter: { type: 'lowpass', f: 700 } })
  },

  // open / close the side-by-side comparison
  compareOpen() {
    if (!ready(60)) return
    blip({ type: 'sawtooth', f0: 220, f1: 1500, t: 0.3, peak: 0.016, attack: 0.05, filter: { type: 'lowpass', f: 2400, q: 2 } })
    metalPing(800, 0.28, 0.024, 0.2)
    metalPing(1200, 0.3, 0.02, 0.26)
  },
  compareClose() {
    if (!ready(60)) return
    blip({ type: 'sawtooth', f0: 1200, f1: 160, t: 0.26, peak: 0.016, filter: { type: 'lowpass', f: 2000, q: 2 } })
  },

  // played right after unmuting
  on() { if (!ready()) return; blip({ type: 'sine', f0: 600, f1: 900, t: 0.12, peak: 0.04 }) },
}

// Camera zoom: `velocity` is in zoom levels per second (+ in, - out) and drives
// the volume; `zoom` is the current level and tints the air — brighter when
// close, softer and darker when far.
export function zoomMotion(velocity, zoom) {
  if (!ctx || !whooshGain || muted || ctx.state !== 'running') return
  const now = ctx.currentTime
  // dead zone + gentle curve: small nudges stay silent, only real camera
  // moves (flights, big scrolls) breathe
  const speed = Math.max(0, Math.abs(velocity) - 0.15)
  const level = Math.pow(Math.min(1, speed / 2), 1.5) * ZOOM_PEAK
  whooshGain.gain.setTargetAtTime(level, now, 0.25)
  if (zoom !== undefined) {
    const f = ZOOM_AIR_HZ * Math.pow(2, Math.max(0, zoom) * 0.08)
    whooshFilter.frequency.setTargetAtTime(f, now, 0.15)
  }
  clearTimeout(zoomIdleTimer)
  zoomIdleTimer = setTimeout(() => {
    if (whooshGain) whooshGain.gain.setTargetAtTime(0, ctx.currentTime, 0.4)
  }, 200)
}
