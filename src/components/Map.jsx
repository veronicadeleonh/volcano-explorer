import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import './Map.css'

// ─── helpers ────────────────────────────────────────────────────────────────
function getColor(status) {
  if (!status) return '#ff4422'
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

// Animated pulsing-dot image for active volcanoes
function makePulsingDot(map, color = '#ff4422') {
  const SIZE = 80
  return {
    width: SIZE, height: SIZE,
    data: new Uint8Array(SIZE * SIZE * 4),
    onAdd() {
      const canvas = document.createElement('canvas')
      canvas.width = SIZE; canvas.height = SIZE
      this.ctx = canvas.getContext('2d')
    },
    render() {
      const t = (performance.now() % 2200) / 2200
      const ctx = this.ctx
      const r = SIZE / 2
      ctx.clearRect(0, 0, SIZE, SIZE)

      // outer pulse ring
      ctx.beginPath()
      ctx.arc(r, r, r * (0.28 + t * 0.62), 0, Math.PI * 2)
      ctx.strokeStyle = color.replace(')', `, ${(1 - t) * 0.65})`)
        .replace('rgb(', 'rgba(')
        .replace('#', 'rgba(')
      // simpler: just use rgba string
      const alpha = (1 - t) * 0.65
      ctx.strokeStyle = `rgba(255,68,34,${alpha})`
      ctx.lineWidth = 2.5
      ctx.stroke()

      // inner solid dot
      ctx.beginPath()
      ctx.arc(r, r, r * 0.23, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'
      ctx.lineWidth = 2
      ctx.stroke()

      this.data = ctx.getImageData(0, 0, SIZE, SIZE).data
      map.triggerRepaint()
      return true
    },
  }
}

// ─── component ──────────────────────────────────────────────────────────────
export default function Map({ token, volcanoes, selected, onSelect, flyTo }) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const popupRef     = useRef(null)
  const onSelectRef  = useRef(onSelect)
  const sourceReadyRef = useRef(false)

  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])

  // ── init map ──────────────────────────────────────────────────────────────
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
      // atmosphere / space
      map.setFog({
        color: 'rgb(10,10,20)',
        'high-color': 'rgb(20,8,35)',
        'horizon-blend': 0.07,
        'space-color': 'rgb(4,4,12)',
        'star-intensity': 0.55,
      })

      // animated image for active dots
      map.addImage('pulsing-dot', makePulsingDot(map), { pixelRatio: 2 })

      // ── GeoJSON source (empty; filled once volcanoes arrive) ──
      map.addSource('volcanoes', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      sourceReadyRef.current = true

      // ── layers ────────────────────────────────────────────────
      // 1. selection ring (behind everything else)
      map.addLayer({
        id: 'vl-selected-ring',
        type: 'circle',
        source: 'volcanoes',
        filter: ['==', ['get', 'id'], -999],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 10, 8, 18],
          'circle-color': 'transparent',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.9,
        },
      })

      // 2. dormant / extinct dots (simple circles)
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
          'circle-stroke-opacity': 0.75,
        },
      })

      // 3. active dots (animated symbol layer)
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

      // ── interactions ──────────────────────────────────────────
      const CLICK_LAYERS = ['vl-active', 'vl-dormant']

      map.on('click', CLICK_LAYERS, (e) => {
        e.originalEvent.stopPropagation()
        const props = e.features[0].properties
        // props are serialized, so we find the full object by id
        const fullVolcano = map.__volcanoData?.find(v => v.id === props.id)
        if (fullVolcano) onSelectRef.current(fullVolcano)
      })

      map.on('mouseenter', CLICK_LAYERS, (e) => {
        map.getCanvas().style.cursor = 'pointer'
        const props = e.features[0].properties
        const coords = e.features[0].geometry.coordinates.slice()
        const color   = props.color || '#ff4422'

        if (popupRef.current) popupRef.current.remove()
        popupRef.current = new mapboxgl.Popup({
          closeButton: false,
          offset: 14,
          maxWidth: '240px',
        })
          .setLngLat(coords)
          .setHTML(`
            <strong style="color:#fff">${props.name}</strong><br/>
            <span style="color:${color};font-size:11px">● ${props.status}</span><br/>
            <span style="color:rgba(255,255,255,0.45);font-size:11px">
              ${props.country} · ${props.elevation > 0 ? props.elevation.toLocaleString() + ' m' : 'Submarina'}
            </span>`)
          .addTo(map)
      })

      map.on('mouseleave', CLICK_LAYERS, () => {
        map.getCanvas().style.cursor = ''
        if (popupRef.current) { popupRef.current.remove(); popupRef.current = null }
      })

      // click on empty space → deselect
      map.on('click', (e) => {
        if (!map.queryRenderedFeatures(e.point, { layers: CLICK_LAYERS }).length) {
          onSelectRef.current(null)
        }
      })
    })

    mapRef.current = map
    return () => {
      sourceReadyRef.current = false
      map.remove()
      mapRef.current = null
    }
  }, [token])

  // ── feed volcano data to source when ready ──────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || volcanoes.length === 0) return

    // store full data on map for click handler
    map.__volcanoData = volcanoes

    const tryUpdate = () => {
      if (!map.getSource('volcanoes')) return
      map.getSource('volcanoes').setData(toGeoJSON(volcanoes))
    }

    if (map.isStyleLoaded() && sourceReadyRef.current) {
      tryUpdate()
    } else {
      map.once('style.load', tryUpdate)
    }
  }, [volcanoes])

  // ── highlight selected ──────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    const updateFilter = () => {
      if (!map.getLayer('vl-selected-ring')) return
      map.setFilter('vl-selected-ring',
        selected
          ? ['==', ['get', 'id'], selected.id]
          : ['==', ['get', 'id'], -999]
      )
    }

    if (map.isStyleLoaded()) updateFilter()
    else map.once('style.load', updateFilter)
  }, [selected])

  // ── fly to ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !flyTo) return
    map.flyTo({
      center: [flyTo.lon, flyTo.lat],
      zoom: Math.max(map.getZoom(), 5),
      duration: 1400,
      essential: true,
    })
  }, [flyTo])

  return <div ref={containerRef} className="map-container" />
}
