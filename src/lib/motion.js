// Motion preferences + camera helpers.

// True when the OS asks for less motion (WCAG 2.3.3 / good practice for 2.2.2).
// Read at call time so changing the setting while the app is open takes effect.
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Bounding box [[west, south], [east, north]] around a set of volcanoes.
// Longitudes are unwrapped around their circular mean so countries that
// straddle the antimeridian (Russia, USA, Fiji, New Zealand...) get a
// compact box instead of one spanning the whole world.
export function boundsForVolcanoes(volcanoes) {
  if (!volcanoes?.length) return null
  const rad = Math.PI / 180
  const meanLng = Math.atan2(
    volcanoes.reduce((s, v) => s + Math.sin(v.lon * rad), 0),
    volcanoes.reduce((s, v) => s + Math.cos(v.lon * rad), 0),
  ) / rad
  const lngs = volcanoes.map(v => {
    let d = v.lon - meanLng
    if (d > 180) d -= 360
    if (d < -180) d += 360
    return meanLng + d
  })
  const lats = volcanoes.map(v => v.lat)
  return [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]]
}
