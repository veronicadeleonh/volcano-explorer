import { useState, useEffect, useCallback } from 'react'
import { Analytics } from '@vercel/analytics/react'
import Map from './components/Map'
import SearchBar from './components/SearchBar'
import VolcanoPanel from './components/VolcanoPanel'
import { VolcanoFilters, GeoLayers } from './components/LayerControls'
import CountryPanel from './components/CountryPanel'
import CompareBar from './components/CompareBar'
import { sfx } from './lib/sound'
import { boundsForVolcanoes } from './lib/motion'
import { COUNTRY_BOUNDS } from './data/countryBounds'
import CompareModal from './components/CompareModal'
import PlateModal from './components/PlateModal'
import TokenGate from './components/TokenGate'
import WelcomeModal from './components/WelcomeModal'
import { hasSeenWelcome } from './lib/welcomeSeen'
import './App.css'

const DEFAULT_LAYERS = {
  boundaries: true, ringOfFire: true,
  showActive: true, showDormant: true,
  recencyFilter: 'all', // 'all' | '6m' | '1y'
  typeStratovolcano: true, typeCaldera: true, typeShield: true, typeSubmarine: true,
}

export default function App() {
  const [volcanoes, setVolcanoes]           = useState([])
  const [selected, setSelected]             = useState(null)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [flyTo, setFlyTo]         = useState(null)
  // Mobile only: which collapsible layer panel is open ('volcanoes' | 'geo' | null); opening one closes the other.
  const [mobilePanel, setMobilePanel] = useState(null)
  const [welcomeOpen, setWelcomeOpen] = useState(() => !hasSeenWelcome()) // first visit, or reopened with the help button
  const [layers, setLayers]       = useState(DEFAULT_LAYERS)
  const [token, setToken]         = useState(
    () => import.meta.env.VITE_MAPBOX_TOKEN || localStorage.getItem('mapbox_token') || ''
  )

  // ── compare state ─────────────────────────────────────────────────────────
  const [compareMode, setCompareMode] = useState(false)
  const [compareList, setCompareList] = useState([])
  const [compareOpen, setCompareOpen] = useState(false)

  // ── tectonic plate detail modal ───────────────────────────────────────────
  const [selectedPlate, setSelectedPlate] = useState(null) // { name, side } | null
  const [plateArrowPoint, setPlateArrowPoint] = useState(null) // modal's measured arrow tip -- feeds the map connector line

  useEffect(() => {
    fetch('/data/volcanoes.json').then(r => r.json()).then(setVolcanoes)
  }, [])

  const handleSaveToken = (t) => {
    localStorage.setItem('mapbox_token', t)
    setToken(t)
  }

  const handleAddToCompare = useCallback((volcano) => {
    // sound lives out here, not inside the state updater (StrictMode runs
    // updaters twice, which would play it twice)
    if (compareList.find(v => v.id === volcano.id)) sfx.compareRemove()
    else if (compareList.length >= 3) sfx.compareFull()
    else sfx.compareAdd(compareList.length + 1)
    setCompareList(prev => {
      if (prev.find(v => v.id === volcano.id)) return prev.filter(v => v.id !== volcano.id)
      if (prev.length >= 3) return prev
      return [...prev, volcano]
    })
  }, [compareList])

  const handleToggleCompareMode = useCallback(() => {
    sfx.compareMode(!compareMode)
    if (compareMode) { setCompareList([]); setCompareOpen(false) }
    setCompareMode(!compareMode)
  }, [compareMode])

  // Volcano and plate selection are mutually exclusive -- opening one always
  // closes the other, in every path (search, map click, compare mode).
  const handleSelect = (volcano) => {
    setSelectedPlate(null)
    setPlateArrowPoint(null)
    if (compareMode && volcano) {
      handleAddToCompare(volcano)
      if (volcano) setFlyTo({ lon: volcano.lon, lat: volcano.lat })
      return
    }
    setSelected(volcano)
    setSelectedCountry(null)
    if (volcano) setFlyTo({ lon: volcano.lon, lat: volcano.lat })
  }

  const handleCountryClick = useCallback((country) => {
    if (compareMode) return
    setSelectedPlate(null)
    setPlateArrowPoint(null)
    setSelectedCountry(country ?? null)
    setSelected(null)
  }, [compareMode])

  // Picking a country from the search box also takes the camera there
  // (clicking it on the map doesn't -- you're already looking at it).
  const handleSearchCountry = useCallback((country) => {
    handleCountryClick(country)
    if (!country) return
    // the country's own extent (so it's centred as a whole, not just its
    // volcanoes); falls back to the volcanoes if it isn't in the table
    const box = COUNTRY_BOUNDS[country.name]
    const bounds = box ? [[box[0], box[1]], [box[2], box[3]]] : boundsForVolcanoes(country.volcanoes)
    if (bounds) setFlyTo({ bounds })
  }, [handleCountryClick])

  const handleToggleLayer = useCallback((id) => {
    setLayers(prev => {
      const next = { ...prev, [id]: !prev[id] }
      if (id === 'showActive' && !next.showActive) next.recencyFilter = 'all'
      return next
    })
  }, [])

  const handleSetRecency = useCallback((recencyFilter) => {
    setLayers(prev => ({ ...prev, recencyFilter }))
  }, [])

  // Clicking the same plate label again closes the modal (and, via Map.jsx's
  // selectedPlate effect, zooms the camera back in). The panel always opens on
  // the right, vertically centered, and the dashed line drawn by PlateLabels
  // points back at the plate itself instead of a little modal arrow. Also
  // closes the volcano/country panel -- only one of the three can be open at
  // a time.
  const handlePlateClick = useCallback((name) => {
    setSelected(null)
    setSelectedCountry(null)
    setSelectedPlate(prev => {
      if (prev?.name === name) {
        setPlateArrowPoint(null)
        return null
      }
      return { name, side: 'right' }
    })
  }, [])

  if (!token) return <main><TokenGate onSave={handleSaveToken} /></main>

  return (
    <main className="app">
      <h1 className="sr-only">Volcano Explorer: interactive 3D globe of the world's volcanoes</h1>
      <WelcomeModal open={welcomeOpen} onClose={() => setWelcomeOpen(false)} />
      {/* DOM order = keyboard Tab order (WCAG 2.4.3), following the visual reading
          order, left→right and top→bottom: volcano filters → search → compare →
          map (+ its zoom/sound/logo controls) → geological layers → panels →
          credits. Everything is absolutely positioned, so this doesn't change the
          layout. */}
      <VolcanoFilters
        layers={layers}
        onToggle={handleToggleLayer}
        onSetRecency={handleSetRecency}
        open={mobilePanel === 'volcanoes'}
        onToggleOpen={() => setMobilePanel(p => p === 'volcanoes' ? null : 'volcanoes')}
      />
      <SearchBar
        volcanoes={volcanoes}
        onSelect={handleSelect}
        onSelectCountry={handleSearchCountry}
        selected={compareMode ? null : selected}
        compareMode={compareMode}
        onToggleCompare={handleToggleCompareMode}
      />
      {compareMode && (
        <CompareBar
          compareList={compareList}
          volcanoes={volcanoes}
          onAdd={handleAddToCompare}
          onRemove={(id) => { sfx.compareRemove(); setCompareList(prev => prev.filter(v => v.id !== id)) }}
          onOpen={() => { sfx.compareOpen(); setCompareOpen(true) }}
          onCancel={handleToggleCompareMode}
        />
      )}
      <Map
        token={token}
        volcanoes={volcanoes}
        selected={compareMode ? null : selected}
        compareList={compareList}
        onSelect={handleSelect}
        onCountryClick={handleCountryClick}
        activeCountry={selectedCountry}
        flyTo={flyTo}
        layers={layers}
        selectedPlate={selectedPlate}
        onPlateClick={handlePlateClick}
        modalArrowPoint={plateArrowPoint}
        onHelp={() => setWelcomeOpen(true)}
      />
      <GeoLayers
        layers={layers}
        onToggle={handleToggleLayer}
        onPlateClick={handlePlateClick}
        selectedPlateName={selectedPlate?.name}
        open={mobilePanel === 'geo'}
        onToggleOpen={() => setMobilePanel(p => p === 'geo' ? null : 'geo')}
      />
      {!compareMode && selected && (
        <VolcanoPanel key={selected.id} volcano={selected} onClose={() => setSelected(null)} />
      )}
      {!compareMode && !selected && selectedCountry && (
        <CountryPanel
          country={selectedCountry}
          onClose={() => setSelectedCountry(null)}
          onSelectVolcano={handleSelect}
        />
      )}
      {compareOpen && (
        <CompareModal
          volcanoes={compareList}
          onClose={() => { sfx.compareClose(); setCompareOpen(false) }}
        />
      )}
      {selectedPlate && (
        <PlateModal
          key={selectedPlate.name}
          plateName={selectedPlate.name}
          side={selectedPlate.side}
          onArrowPositioned={setPlateArrowPoint}
          onClose={() => { setSelectedPlate(null); setPlateArrowPoint(null) }}
        />
      )}
      <div className="app-attribution">
        <span className="app-attribution-line">
          By <a href="https://veronicadeleonh.de" target="_blank" rel="noopener noreferrer">Verónica De León Hernández</a>
        </span>
        <span className="app-attribution-sep" aria-hidden="true">·</span>
        <span className="app-attribution-line">
          Data: <a href="https://volcano.si.edu" target="_blank" rel="noopener noreferrer">GVP / Smithsonian</a>,{' '}
          <a href="https://en.wikipedia.org" target="_blank" rel="noopener noreferrer">Wikipedia</a>,{' '}
          <a href="https://github.com/fraxen/tectonicplates" target="_blank" rel="noopener noreferrer">PB2002</a>
        </span>
        <span className="app-attribution-sep" aria-hidden="true">·</span>
        <span className="app-attribution-line">
          Map: <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noopener noreferrer">© Mapbox</a>,{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap</a>
        </span>
      </div>
      <Analytics />
    </main>
  )
}
