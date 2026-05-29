import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import './Map.css'

// ── helpers ───────────────────────────────────────────────────────────────
function getColor(status = '') {
  if (status.includes('Active'))  return '#ff4422'
  if (status.includes('Dormant')) return '#ffaa22'
  return '#8888aa'
}

function toGeoJSON(volcanoes) {
  return {
    type: 'FeatureCollection',
    features: volcanoes.map(v => ({
      type: 'Feature',
      id: v.id,
      geometry: { type: 'Point', coordinates: [v.lon, v.lat] },
      properties: { ...v, color: getColor(v.status) },
    })),
  }
}

function makePulsingDot(map) {
  const S = 80
  return {
    width: S, height: S,
    data: new Uint8Array(S * S * 4),
    onAdd() {
      const c = document.createElement('canvas')
      c.width = S; c.height = S
      this.ctx = c.getContext('2d')
    },
    render() {
      const t   = (performance.now() % 2200) / 2200
      const ctx = this.ctx, r = S / 2
      ctx.clearRect(0, 0, S, S)
      ctx.beginPath()
      ctx.arc(r, r, r * (0.28 + t * 0.62), 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(255,68,34,${(1 - t) * 0.65})`
      ctx.lineWidth = 2.5
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(r, r, r * 0.23, 0, Math.PI * 2)
      ctx.fillStyle = '#ff4422'
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'
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
export default function Map({ token, volcanoes, selected, compareList = [], onSelect, flyTo, layers }) {
  const containerRef  = useRef(null)
  const mapRef        = useRef(null)
  const popupRef      = useRef(null)
  const onSelectRef   = useRef(onSelect)

  // Caches so async map callbacks always see latest values
  const volCacheRef       = useRef([])
  const layerCacheRef     = useRef(layers)
  const compareListRef    = useRef(compareList)

  useEffect(() => { onSelectRef.current = onSelect      }, [onSelect])
  useEffect(() => { volCacheRef.current = volcanoes     }, [volcanoes])
  useEffect(() => { layerCacheRef.current = layers      }, [layers])
  useEffect(() => { compareListRef.current = compareList }, [compareList])

  // ── init map (runs once per token) ───────────────────────────────────────
  useEffect(() => {
    if (!token || !containerRef.current) return
    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [20, 15],
      zoom: 1.8,
      projection: 'globe',
      attributionControl: false,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

    map.on('style.load', () => {
      // atmosphere
      map.setFog({
        color: 'rgb(10,10,20)',
        'high-color': 'rgb(20,8,35)',
        'horizon-blend': 0.07,
        'space-color': 'rgb(4,4,12)',
        'star-intensity': 0.55,
      })

      // animated dot image for active volcanoes
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

      // active volcanoes (pulsing symbol)
      map.addLayer({
        id: 'vl-active',
        type: 'symbol',
        source: 'volcanoes',
        filter: ['>', ['index-of', 'Active', ['get', 'status']], -1],
        layout: {
          'icon-image': 'pulsing-dot',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-size': ['interpolate', ['linear'], ['zoom'], 2, 0.45, 8, 0.7],
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
            paint: { 'line-color': '#ff6b35', 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.8, 6, 2.2], 'line-opacity': 0.7 },
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
            paint: { 'line-color': '#ff2200', 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 5, 6, 12], 'line-opacity': 0.12, 'line-blur': 4 },
          }, geoLayersBefore)

          map.addLayer({
            id: 'geo-rof-line',
            type: 'line',
            source: 'ring-of-fire',
            layout: { 'line-cap': 'round', 'visibility': VIS(layerCacheRef.current.ringOfFire) },
            paint: { 'line-color': '#ff2200', 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 1.2, 6, 3], 'line-opacity': 0.85 },
          }, geoLayersBefore)
        })
        .catch(() => {})

      // ── interactions ─────────────────────────────────────────────────────
      const VOLCANO_LAYERS = ['vl-active', 'vl-dormant']

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
              ${p.country} · ${p.elevation > 0 ? Number(p.elevation).toLocaleString() + ' m' : 'Submarina'}
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
    map.flyTo({ center: [flyTo.lon, flyTo.lat], zoom: Math.max(map.getZoom(), 5), duration: 1400 })
  }, [flyTo])

  // ── toggle geological layer visibility ────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    const GEO_LAYERS = {
      boundaries: ['geo-transform', 'geo-divergent', 'geo-subduction'],
      ringOfFire:  ['geo-rof-glow', 'geo-rof-line'],
    }

    Object.entries(GEO_LAYERS).forEach(([key, ids]) => {
      ids.forEach(id => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', VIS(layers[key]))
      })
    })
  }, [layers])

  return <div ref={containerRef} className="map-container" />
}
