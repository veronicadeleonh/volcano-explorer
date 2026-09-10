import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import './Map.css'

// ── helpers ───────────────────────────────────────────────────────────────
function getColor(status = '') {
  if (status.includes('Active'))  return '#ff4422'
  if (status.includes('Dormant')) return '#ffaa22'
  return '#8888aa'
}

// Maps the `country` field used in our dataset to ISO 3166-1 alpha-2 codes,
// which is how mapbox.country-boundaries-v1 identifies each country polygon.
// Only covers the countries actually present in volcanoes.json.
const COUNTRY_ISO = {
  Cameroon: 'CM', 'Cape Verde': 'CV', Chile: 'CL', Colombia: 'CO', Comoros: 'KM',
  'Costa Rica': 'CR', 'Dem. Rep. Congo': 'CD', Ecuador: 'EC', France: 'FR',
  Greece: 'GR', Guatemala: 'GT', Iceland: 'IS', Indonesia: 'ID', Iran: 'IR',
  Italy: 'IT', Japan: 'JP', Mexico: 'MX', 'New Zealand': 'NZ',
  'Papua New Guinea': 'PG', Peru: 'PE', Philippines: 'PH', Russia: 'RU',
  Spain: 'ES', Tanzania: 'TZ', Tonga: 'TO', Turkey: 'TR', USA: 'US', Vanuatu: 'VU',
}
const ISO_TO_COUNTRY = Object.fromEntries(
  Object.entries(COUNTRY_ISO).map(([name, iso]) => [iso, name])
)

function toGeoJSON(volcanoes) {
  const recentCutoff = new Date().getFullYear() - 1 // "active in the last year"
  return {
    type: 'FeatureCollection',
    features: volcanoes.map(v => ({
      type: 'Feature',
      id: v.id,
      geometry: { type: 'Point', coordinates: [v.lon, v.lat] },
      properties: {
        ...v,
        color: getColor(v.status),
        recentlyActive: (v.last_eruption ?? -Infinity) >= recentCutoff,
      },
    })),
  }
}

function makePulsingDot(map) {
  const S = 100
  return {
    width: S, height: S,
    data: new Uint8Array(S * S * 4),
    onAdd() {
      const c = document.createElement('canvas')
      c.width = S; c.height = S
      this.ctx = c.getContext('2d')
    },
    render() {
      const t   = (performance.now() % 1800) / 1800
      const ctx = this.ctx, r = S / 2
      ctx.clearRect(0, 0, S, S)

      // soft outer glow behind the ring, brightest at the start of each pulse
      const glowR = r * (0.34 + t * 0.66)
      const glow = ctx.createRadialGradient(r, r, glowR * 0.35, r, r, glowR)
      glow.addColorStop(0, `rgba(255,90,40,${(1 - t) * 0.55})`)
      glow.addColorStop(1, 'rgba(255,90,40,0)')
      ctx.beginPath()
      ctx.arc(r, r, glowR, 0, Math.PI * 2)
      ctx.fillStyle = glow
      ctx.fill()

      // bright expanding ring
      ctx.beginPath()
      ctx.arc(r, r, r * (0.3 + t * 0.66), 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(255,110,50,${(1 - t) * 0.9})`
      ctx.lineWidth = 3.5
      ctx.stroke()

      // solid center dot
      ctx.beginPath()
      ctx.arc(r, r, r * 0.26, 0, Math.PI * 2)
      ctx.fillStyle = '#ff4422'
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'
      ctx.lineWidth = 2
      ctx.stroke()

      this.data = ctx.getImageData(0, 0, S, S).data
      map.triggerRepaint()
      return true
    },
  }
}

const VIS = (on) => (on ? 'visible' : 'none')

// ── component ─────────────────────────────────────────────────────────────
export default function Map({ token, volcanoes, selected, compareList = [], onSelect, onCountryClick, activeCountry, flyTo, layers }) {
  const containerRef  = useRef(null)
  const mapRef        = useRef(null)
  const popupRef      = useRef(null)
  const onSelectRef   = useRef(onSelect)
  const onCountryClickRef = useRef(onCountryClick)
  // (the "active" country highlight is filter-driven — see the effect below)

  // Caches so async map callbacks always see latest values
  const volCacheRef       = useRef([])
  const layerCacheRef     = useRef(layers)
  const compareListRef    = useRef(compareList)
  const spinEnabledRef    = useRef(true)   // ambient globe rotation, off after first interaction
  const spinGlobeRef      = useRef(null)   // lets other effects resume the ambient spin
  const userInteractingRef = useRef(false) // true while a drag/touch is in progress on the globe

  useEffect(() => { onSelectRef.current = onSelect      }, [onSelect])
  useEffect(() => { onCountryClickRef.current = onCountryClick }, [onCountryClick])
  useEffect(() => { volCacheRef.current = volcanoes     }, [volcanoes])
  useEffect(() => { layerCacheRef.current = layers      }, [layers])
  useEffect(() => { compareListRef.current = compareList }, [compareList])

  // ── init map (runs once per token) ───────────────────────────────────────
  useEffect(() => {
    if (!token || !containerRef.current) return
    mapboxgl.accessToken = token

    // On narrow viewports the globe reads better pulled back a bit further —
    // filter panels and side sheets take up relatively more room on a phone,
    // so a lower initial zoom keeps the whole globe visible and legible.
    const vw = window.innerWidth
    const initialZoom = vw <= 480 ? 0.75 : vw <= 768 ? 1.2 : 1.8

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [20, 15],
      zoom: initialZoom,
      projection: 'globe',
      attributionControl: false,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

    // ── ambient globe rotation — slow drift until the user takes over ──────
    const SECONDS_PER_REVOLUTION = 180
    const MAX_SPIN_ZOOM  = 4
    const SLOW_SPIN_ZOOM = 2.5

    const spinGlobe = () => {
      if (!spinEnabledRef.current || userInteractingRef.current) return
      const zoom = map.getZoom()
      if (zoom >= MAX_SPIN_ZOOM) return
      let distancePerSecond = 360 / SECONDS_PER_REVOLUTION
      if (zoom > SLOW_SPIN_ZOOM) {
        distancePerSecond *= (MAX_SPIN_ZOOM - zoom) / (MAX_SPIN_ZOOM - SLOW_SPIN_ZOOM)
      }
      const center = map.getCenter()
      center.lng -= distancePerSecond
      map.easeTo({ center, duration: 1000, easing: (n) => n })
    }

    spinGlobeRef.current = spinGlobe

    let interactionSafetyTimer = null

    const markInteracting = () => {
      userInteractingRef.current = true
      clearTimeout(interactionSafetyTimer)
      // Safety net: if the browser never fires a matching end event (a known
      // mobile quirk -- e.g. touchcancel instead of touchend during scroll/zoom
      // conflicts), don't let rotation stay stuck off forever.
      interactionSafetyTimer = setTimeout(() => { userInteractingRef.current = false }, 3000)
    }
    const markInteractionEnd = () => {
      userInteractingRef.current = false
      clearTimeout(interactionSafetyTimer)
    }

    map.on('mousedown',   markInteracting)
    map.on('dragstart',   markInteracting)
    map.on('touchstart',  markInteracting)
    map.on('mouseup',     markInteractionEnd)
    map.on('touchend',    markInteractionEnd)
    map.on('touchcancel', markInteractionEnd)
    map.on('pitchend',    markInteractionEnd)
    map.on('rotateend',   markInteractionEnd)
    map.on('moveend', () => { if (!userInteractingRef.current) spinGlobe() })
    map.once('load', spinGlobe)

    map.on('style.load', () => {
      // atmosphere
      map.setFog({
        color: 'rgb(10,10,20)',
        'high-color': 'rgb(120,46,12)',  // warm amber horizon glow, Seismic-inspired
        'horizon-blend': 0.02,           // even tighter, crisper ring
        'space-color': 'rgb(4,4,12)',
        'star-intensity': 0.25,
      })

      // hide place labels (country/state/city names) — they use the style's
      // own glyphs, which can't be swapped for --font-mono, so they'd always
      // clash with the rest of the UI — and drop the political admin borders
      // too, so the ring-of-fire / plate-boundary lines read as THE borders
      // on the globe instead of competing with country outlines.
      map.getStyle().layers.forEach(l => {
        const isLabel        = l.type === 'symbol' && l.layout && l.layout['text-field']
        const isAdminBoundary = l['source-layer'] === 'admin'
        if (isLabel || isAdminBoundary) map.setLayoutProperty(l.id, 'visibility', 'none')
      })

      // ── country hover/click — highlight + list volcanoes by country ──────
      map.addSource('country-boundaries', {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1',
      })

      map.addLayer({
        id: 'country-hover-fill',
        type: 'fill',
        source: 'country-boundaries',
        'source-layer': 'country_boundaries',
        filter: ['in', ['get', 'iso_3166_1'], ['literal', []]], // populated once volcano data loads
        paint: {
          'fill-color': '#ff6432',
          'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.14, 0],
        },
      })

      // persistent tint for the country whose panel is open — driven by a
      // filter on iso_3166_1 (like vl-ring for volcanoes) rather than
      // feature-state, since vector-tile feature ids aren't reliably
      // trackable by hand across tiles/zoom changes.
      map.addLayer({
        id: 'country-active-fill',
        type: 'fill',
        source: 'country-boundaries',
        'source-layer': 'country_boundaries',
        filter: ['==', ['get', 'iso_3166_1'], '__none__'],
        paint: {
          'fill-color': '#ff6432',
          'fill-opacity': 0.22,
        },
      })

      // animated dot image for volcanoes active within the last year
      map.addImage('pulsing-dot', makePulsingDot(map), { pixelRatio: 2 })

      // ── volcano source + layers (always visible) ─────────────────────────
      map.addSource('volcanoes', {
        type: 'geojson',
        data: toGeoJSON(volCacheRef.current), // seed with any data already loaded
      })

      // compare ring (blue) — shown for volcanes in compareList
      map.addLayer({
        id: 'vl-compare-ring',
        type: 'circle',
        source: 'volcanoes',
        filter: ['==', ['get', 'id'], -999],   // match-nothing until compareList is set
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 13, 8, 22],
          'circle-color': 'transparent',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#64a0ff',
        },
      })

      // selection ring (white)
      map.addLayer({
        id: 'vl-ring',
        type: 'circle',
        source: 'volcanoes',
        filter: ['==', ['get', 'id'], -999],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 10, 8, 18],
          'circle-color': 'transparent',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
        },
      })

      // dormant / extinct circles
      map.addLayer({
        id: 'vl-dormant',
        type: 'circle',
        source: 'volcanoes',
        filter: ['!', ['>', ['index-of', 'Active', ['get', 'status']], -1]],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 4, 8, 7],
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': 'rgba(255,255,255,0.7)',
        },
      })

      // active volcanoes that erupted within the last year — pulsing symbol
      map.addLayer({
        id: 'vl-active-pulse',
        type: 'symbol',
        source: 'volcanoes',
        filter: ['all',
          ['>', ['index-of', 'Active', ['get', 'status']], -1],
          ['==', ['get', 'recentlyActive'], true],
        ],
        layout: {
          'icon-image': 'pulsing-dot',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-size': ['interpolate', ['linear'], ['zoom'], 2, 0.75, 8, 1.05],
        },
      })

      // active volcanoes with no eruption in the last year — solid dot, no pulse
      map.addLayer({
        id: 'vl-active-static',
        type: 'circle',
        source: 'volcanoes',
        filter: ['all',
          ['>', ['index-of', 'Active', ['get', 'status']], -1],
          ['!=', ['get', 'recentlyActive'], true],
        ],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 4, 8, 7],
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': 'rgba(255,255,255,0.7)',
        },
      })

      // ── geological layers (loaded async, inserted BELOW volcano layers) ──
      const geoLayersBefore = 'vl-ring'  // insert before the first volcano layer

      fetch('/data/plate_boundaries.json')
        .then(r => r.json())
        .then(data => {
          if (!map.getStyle()) return  // map may have been destroyed
          map.addSource('plate-boundaries', { type: 'geojson', data })

          map.addLayer({
            id: 'geo-transform',
            type: 'line',
            source: 'plate-boundaries',
            filter: ['==', ['get', 'boundaryType'], 'transform'],
            layout: { 'line-cap': 'round', 'visibility': VIS(layerCacheRef.current.boundaries) },
            paint: { 'line-color': '#a0a0c0', 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.4, 6, 1.2], 'line-opacity': 0.5 },
          }, geoLayersBefore)

          map.addLayer({
            id: 'geo-divergent',
            type: 'line',
            source: 'plate-boundaries',
            filter: ['==', ['get', 'boundaryType'], 'divergent'],
            layout: { 'line-cap': 'round', 'visibility': VIS(layerCacheRef.current.boundaries) },
            paint: { 'line-color': '#4da8da', 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.6, 6, 1.8], 'line-opacity': 0.65 },
          }, geoLayersBefore)

          map.addLayer({
            id: 'geo-subduction',
            type: 'line',
            source: 'plate-boundaries',
            filter: ['==', ['get', 'boundaryType'], 'subduction'],
            layout: { 'line-cap': 'round', 'visibility': VIS(layerCacheRef.current.boundaries) },
            paint: { 'line-color': '#b56cf0', 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.8, 6, 2.2], 'line-opacity': 0.75 },
          }, geoLayersBefore)
        })
        .catch(() => {}) // silently ignore if data not available

      fetch('/data/ring_of_fire.json')
        .then(r => r.json())
        .then(data => {
          if (!map.getStyle()) return
          map.addSource('ring-of-fire', { type: 'geojson', data })

          map.addLayer({
            id: 'geo-rof-glow',
            type: 'line',
            source: 'ring-of-fire',
            layout: { 'line-cap': 'round', 'visibility': VIS(layerCacheRef.current.ringOfFire) },
            paint: { 'line-color': '#ff6a35', 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 4, 6, 10], 'line-opacity': 0.16, 'line-blur': 5 },
          }, geoLayersBefore)

          map.addLayer({
            id: 'geo-rof-line',
            type: 'line',
            source: 'ring-of-fire',
            layout: { 'line-cap': 'round', 'visibility': VIS(layerCacheRef.current.ringOfFire) },
            paint: {
              'line-color': '#ff6a35',
              'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.9, 6, 2],
              'line-opacity': 0.92,
              'line-dasharray': [1, 1.3],
            },
          }, geoLayersBefore)
        })
        .catch(() => {})

      // ── interactions ─────────────────────────────────────────────────────
      const VOLCANO_LAYERS = ['vl-active-pulse', 'vl-active-static', 'vl-dormant']

      map.on('click', VOLCANO_LAYERS, (e) => {
        e.originalEvent.stopPropagation()
        const id = e.features[0].properties.id
        const v  = volCacheRef.current.find(v => v.id === id)
        if (v) onSelectRef.current(v)
      })

      map.on('mouseenter', VOLCANO_LAYERS, (e) => {
        map.getCanvas().style.cursor = 'pointer'
        const p = e.features[0].properties
        if (popupRef.current) popupRef.current.remove()
        popupRef.current = new mapboxgl.Popup({ closeButton: false, offset: 14, maxWidth: '240px' })
          .setLngLat(e.features[0].geometry.coordinates.slice())
          .setHTML(`
            <strong style="color:#fff">${p.name}</strong><br/>
            <span style="color:${p.color};font-size:11px">● ${p.status}</span><br/>
            <span style="color:rgba(255,255,255,0.45);font-size:11px">
              ${p.country} · ${p.elevation > 0 ? Number(p.elevation).toLocaleString() + ' m' : 'Submarine'}
            </span>`)
          .addTo(map)
      })

      map.on('mouseleave', VOLCANO_LAYERS, () => {
        map.getCanvas().style.cursor = ''
        if (popupRef.current) { popupRef.current.remove(); popupRef.current = null }
      })

      map.on('click', (e) => {
        if (!map.queryRenderedFeatures(e.point, { layers: VOLCANO_LAYERS }).length) {
          onSelectRef.current(null)
        }
      })

      // ── country hover + click ────────────────────────────────────────────
      let hoveredCountryId = null

      map.on('mousemove', 'country-hover-fill', (e) => {
        if (!e.features.length) return
        if (hoveredCountryId !== null) {
          map.setFeatureState({ source: 'country-boundaries', sourceLayer: 'country_boundaries', id: hoveredCountryId }, { hover: false })
        }
        hoveredCountryId = e.features[0].id
        map.setFeatureState({ source: 'country-boundaries', sourceLayer: 'country_boundaries', id: hoveredCountryId }, { hover: true })
        map.getCanvas().style.cursor = 'pointer'
      })

      map.on('mouseleave', 'country-hover-fill', () => {
        if (hoveredCountryId !== null) {
          map.setFeatureState({ source: 'country-boundaries', sourceLayer: 'country_boundaries', id: hoveredCountryId }, { hover: false })
        }
        hoveredCountryId = null
        map.getCanvas().style.cursor = ''
      })

      map.on('click', 'country-hover-fill', (e) => {
        // a volcano marker sitting on top of the country owns this click
        if (map.queryRenderedFeatures(e.point, { layers: VOLCANO_LAYERS }).length) return
        const iso  = e.features[0]?.properties?.iso_3166_1
        const name = ISO_TO_COUNTRY[iso]
        if (!name) return
        const inCountry = volCacheRef.current.filter(v => v.country === name)
        if (inCountry.length) onCountryClickRef.current({ name, iso, volcanoes: inCountry })
      })
    })

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── update volcano source data when prop changes ──────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !volcanoes.length) return

    const apply = () => {
      const src = map.getSource('volcanoes')
      if (src) src.setData(toGeoJSON(volcanoes))

      const isoList = [...new Set(volcanoes.map(v => COUNTRY_ISO[v.country]).filter(Boolean))]
      const isoFilter = ['in', ['get', 'iso_3166_1'], ['literal', isoList]]
      if (map.getLayer('country-hover-fill')) map.setFilter('country-hover-fill', isoFilter)
    }

    // Try immediately (works when style is already loaded)
    apply()

    // Also hook into style.load so we're covered if style hasn't fired yet,
    // or if it reloads. Cleaned up when effect re-runs or component unmounts.
    map.on('style.load', apply)
    return () => map.off('style.load', apply)
  }, [volcanoes])

  // ── highlight selected volcano ─────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const update = () => {
      if (!map.getLayer('vl-ring')) return
      map.setFilter('vl-ring',
        selected ? ['==', ['get', 'id'], selected.id] : ['==', ['get', 'id'], -999]
      )
    }
    if (map.isStyleLoaded()) update()
    else map.once('style.load', update)
  }, [selected])

  // ── keep the "active" country fill in sync with the open panel ─────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const iso = activeCountry ? COUNTRY_ISO[activeCountry.name] : null
    const update = () => {
      if (!map.getLayer('country-active-fill')) return
      map.setFilter('country-active-fill',
        iso ? ['==', ['get', 'iso_3166_1'], iso] : ['==', ['get', 'iso_3166_1'], '__none__']
      )
    }
    if (map.isStyleLoaded()) update()
    else map.once('style.load', update)
  }, [activeCountry])

  // ── highlight compare list ────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const update = () => {
      if (!map.getLayer('vl-compare-ring')) return
      const ids = compareList.map(v => v.id)
      map.setFilter('vl-compare-ring',
        ids.length
          ? ['match', ['get', 'id'], ids, true, false]
          : ['==', ['get', 'id'], -999]
      )
    }
    if (map.isStyleLoaded()) update()
    else map.once('style.load', update)
  }, [compareList])

  // ── fly to selected ───────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !flyTo) return
    spinEnabledRef.current = false // stop ambient rotation once the user is exploring
    map.flyTo({ center: [flyTo.lon, flyTo.lat], zoom: Math.max(map.getZoom(), 5), duration: 1400 })
  }, [flyTo])

  // ── resume ambient rotation once nothing is selected ────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (selected || activeCountry) return // still exploring something — stay stopped
    spinEnabledRef.current = true
    spinGlobeRef.current?.()
  }, [selected, activeCountry])

  // ── toggle geological layer visibility ────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    const GEO_LAYERS = {
      boundaries: ['geo-transform', 'geo-divergent', 'geo-subduction'],
      ringOfFire: ['geo-rof-glow', 'geo-rof-line'],
    }

    Object.entries(GEO_LAYERS).forEach(([key, ids]) => {
      ids.forEach(id => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', VIS(layers[key]))
      })
    })

    // ── volcano status visibility ──────────────────────────────────────
    if (map.getLayer('vl-active-pulse'))  map.setLayoutProperty('vl-active-pulse',  'visibility', VIS(layers.showActive))
    if (map.getLayer('vl-active-static')) map.setLayoutProperty('vl-active-static', 'visibility', VIS(layers.showActive))
    if (map.getLayer('vl-dormant'))       map.setLayoutProperty('vl-dormant',       'visibility', VIS(layers.showDormant))

    // ── combined type + recency filter ──────────────────────────────────
    const ALL_TYPES = ['Stratovolcano', 'Caldera', 'Shield', 'Submarine']
    const activeTypes = ALL_TYPES.filter(t => layers[`type${t}`])

    const typeFilter = activeTypes.length === ALL_TYPES.length
      ? null
      : activeTypes.length === 0
        ? ['==', ['get', 'type'], '__none__']  // match nothing
        : ['match', ['get', 'type'], activeTypes, true, false]

    // Eruption dates in the dataset are year-only, so "6 months" and "1 year"
    // are approximated at year granularity: 6m -> this calendar year,
    // 1y -> this year or last.
    const currentYear = new Date().getFullYear()
    const RECENCY_CUTOFF = { '6m': currentYear, '1y': currentYear - 1 }
    const recentFilter = layers.recencyFilter && layers.recencyFilter !== 'all'
      ? ['>=', ['get', 'last_eruption'], RECENCY_CUTOFF[layers.recencyFilter]]
      : null

    const buildFilter = (statusExpr) => {
      const parts = [statusExpr, typeFilter, recentFilter].filter(Boolean)
      return parts.length === 1 ? parts[0] : ['all', ...parts]
    }

    const activeStatus = ['>', ['index-of', 'Active', ['get', 'status']], -1]
    if (map.getLayer('vl-active-pulse')) {
      map.setFilter('vl-active-pulse', buildFilter(['all', activeStatus, ['==', ['get', 'recentlyActive'], true]]))
    }
    if (map.getLayer('vl-active-static')) {
      map.setFilter('vl-active-static', buildFilter(['all', activeStatus, ['!=', ['get', 'recentlyActive'], true]]))
    }
    if (map.getLayer('vl-dormant')) {
      map.setFilter('vl-dormant', buildFilter(['!', activeStatus]))
    }

    // Defensive: never let a filter interaction leave rotation stuck off.
    if (!selected && !activeCountry) {
      userInteractingRef.current = false
      spinEnabledRef.current = true
      spinGlobeRef.current?.()
    }
  }, [layers, selected, activeCountry])

  return <div ref={containerRef} className="map-container" />
}
