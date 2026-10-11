// Reads the design tokens for the styleguide: tokens.json (names, aliases,
// descriptions) + tokens.js (resolved values). Nothing is duplicated here, so
// the page can't drift from the real system.
import source from '../../tokens/tokens.json'
import { tokens } from '../styles/tokens'

const resolvedAt = (path) => path.split('.').reduce((n, k) => n?.[k], tokens)

export const flat = []
;(function walk(node, path, inherited) {
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$')) continue
    const p = [...path, k]
    if (v && typeof v === 'object' && '$value' in v) {
      const full = p.join('.')
      const alias = typeof v.$value === 'string' && /^\{.+\}$/.test(v.$value) ? v.$value.slice(1, -1) : null
      flat.push({
        path: full,
        key: k,
        cssVar: '--' + full.replaceAll('.', '-'),
        type: v.$type,
        description: v.$description ?? null,
        alias,
        resolved: String(resolvedAt(full)),
      })
    } else if (v && typeof v === 'object') {
      walk(v, p, v.$description ?? inherited)
    }
  }
})(source, [], null)

export const groupNote = (path) => path.split('.').reduce((n, k) => n?.[k], source)?.$description ?? null
export const under = (prefix) => flat.filter((t) => t.path.startsWith(prefix + '.'))
export const byNumber = (a, b) => a.key.localeCompare(b.key, 'en', { numeric: true })

// ── contrast against the app's dark panel ───────────────────────────────
const PANEL = [10, 10, 22]
function parse(v) {
  if (v.startsWith('#')) {
    const h = v.slice(1)
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1]
  }
  const n = v.match(/[\d.]+/g).map(Number)
  return [n[0], n[1], n[2], n[3] ?? 1]
}
const lin = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 }
const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])
export function contrastOnPanel(value, bgValue) {
  const [r, g, b, a] = parse(value)
  const bg = bgValue ? parse(bgValue).slice(0, 3) : PANEL
  const fg = [r * a + bg[0] * (1 - a), g * a + bg[1] * (1 - a), b * a + bg[2] * (1 - a)]
  const [hi, lo] = [lum(fg), lum(bg)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
