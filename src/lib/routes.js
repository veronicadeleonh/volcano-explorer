// Deep links. Every panel the app can show has its own URL:
//   /                              nothing open
//   /volcano/krakatau              volcano panel
//   /country/indonesia             country panel
//   /plate/pacific-plate           tectonic plate panel
//   /compare/etna-vs-fuji          comparison (2 or 3 volcanoes, in slot order)
// Slugs come from the names in the data, so they stay readable and stable.

import { COUNTRY_ISO } from '../data/countryIso'
import { PLATE_META } from '../data/plateMeta'

export const BASE_TITLE = 'Volcano Explorer'
const COMPARE_SEP = '-vs-' // slugs never contain this, so it splits unambiguously

export const slugify = (s) =>
  String(s).toLowerCase().replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

// What the URL should say for what's on screen. Priority when several are
// open: comparison, plate, volcano, country.
export function pathFor({ compareVolcanoes, plateName, volcano, country }) {
  if (compareVolcanoes && compareVolcanoes.length >= 2) {
    return `/compare/${compareVolcanoes.map((v) => slugify(v.name)).join(COMPARE_SEP)}`
  }
  if (plateName) return `/plate/${slugify(plateName)}`
  if (volcano) return `/volcano/${slugify(volcano.name)}`
  if (country) return `/country/${slugify(country.name)}`
  return '/'
}

export function titleFor({ compareVolcanoes, plateName, volcano, country }) {
  if (compareVolcanoes && compareVolcanoes.length >= 2) {
    return `Compare ${compareVolcanoes.map((v) => v.name).join(', ')} | ${BASE_TITLE}`
  }
  if (plateName) return `${plateName} | ${BASE_TITLE}`
  if (volcano) return `${volcano.name} | ${BASE_TITLE}`
  if (country) return `${country.name} | ${BASE_TITLE}`
  return null // caller restores the page's own title
}

// Reads a pathname back into what to open. Unknown or malformed paths give
// { kind: 'none' }, which the app treats as the plain map.
export function parsePath(pathname, volcanoes) {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean)
  if (parts.length !== 2) return { kind: 'none' }
  const [section, raw] = parts
  let slug
  try { slug = decodeURIComponent(raw).toLowerCase() } catch { return { kind: 'none' } }

  if (section === 'volcano') {
    const volcano = volcanoes.find((v) => slugify(v.name) === slug)
    return volcano ? { kind: 'volcano', volcano } : { kind: 'none' }
  }
  if (section === 'country') {
    const name = [...new Set(volcanoes.map((v) => v.country))].find((c) => slugify(c) === slug)
    if (!name) return { kind: 'none' }
    return {
      kind: 'country',
      country: { name, iso: COUNTRY_ISO[name], volcanoes: volcanoes.filter((v) => v.country === name) },
    }
  }
  if (section === 'plate') {
    const plateName = Object.keys(PLATE_META).find((n) => slugify(n) === slug)
    return plateName ? { kind: 'plate', plateName } : { kind: 'none' }
  }
  if (section === 'compare') {
    const list = []
    for (const s of slug.split(COMPARE_SEP)) {
      const v = volcanoes.find((x) => slugify(x.name) === s)
      if (v && !list.includes(v)) list.push(v)
    }
    return list.length >= 2 ? { kind: 'compare', volcanoes: list.slice(0, 3) } : { kind: 'none' }
  }
  return { kind: 'none' }
}
