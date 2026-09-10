import { useState, useEffect, useCallback } from 'react'
import Map from './components/Map'
import SearchBar from './components/SearchBar'
import VolcanoPanel from './components/VolcanoPanel'
import LayerControls from './components/LayerControls'
import CountryPanel from './components/CountryPanel'
import CompareBar from './components/CompareBar'
import CompareModal from './components/CompareModal'
import TokenGate from './components/TokenGate'
import WelcomeModal from './components/WelcomeModal'
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
  const [layers, setLayers]       = useState(DEFAULT_LAYERS)
  const [token, setToken]         = useState(
    () => import.meta.env.VITE_MAPBOX_TOKEN || localStorage.getItem('mapbox_token') || ''
  )

  // ── compare state ─────────────────────────────────────────────────────────
  const [compareMode, setCompareMode] = useState(false)
  const [compareList, setCompareList] = useState([])
  const [compareOpen, setCompareOpen] = useState(false)

  useEffect(() => {
    fetch('/data/volcanoes.json').then(r => r.json()).then(setVolcanoes)
  }, [])

  const handleSaveToken = (t) => {
    localStorage.setItem('mapbox_token', t)
    setToken(t)
  }

  const handleAddToCompare = useCallback((volcano) => {
    setCompareList(prev => {
      if (prev.find(v => v.id === volcano.id)) return prev.filter(v => v.id !== volcano.id)
      if (prev.length >= 3) return prev
      return [...prev, volcano]
    })
  }, [])

  const handleToggleCompareMode = useCallback(() => {
    setCompareMode(m => {
      if (m) { setCompareList([]); setCompareOpen(false) }
      return !m
    })
  }, [])

  const handleSelect = (volcano) => {
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
    setSelectedCountry(country)
    setSelected(null)
  }, [compareMode])

  const handleToggleLayer = useCallback((id) => {
    setLayers(prev => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const handleSetRecency = useCallback((recencyFilter) => {
    setLayers(prev => ({ ...prev, recencyFilter }))
  }, [])

  if (!token) return <TokenGate onSave={handleSaveToken} />

  return (
    <div className="app">
      <WelcomeModal />
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
      />
      <SearchBar
        volcanoes={volcanoes}
        onSelect={handleSelect}
        selected={compareMode ? null : selected}
        compareMode={compareMode}
        onToggleCompare={handleToggleCompareMode}
      />
      {compareMode && (
        <CompareBar
          compareList={compareList}
          volcanoes={volcanoes}
          onAdd={handleAddToCompare}
          onRemove={(id) => setCompareList(prev => prev.filter(v => v.id !== id))}
          onOpen={() => setCompareOpen(true)}
          onCancel={handleToggleCompareMode}
        />
      )}
      <LayerControls layers={layers} onToggle={handleToggleLayer} onSetRecency={handleSetRecency} />
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
          onClose={() => setCompareOpen(false)}
        />
      )}
    </div>
  )
}
