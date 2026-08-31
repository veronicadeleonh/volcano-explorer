import { useState, useEffect, useCallback } from 'react'
import Map from './components/Map'
import SearchBar from './components/SearchBar'
import VolcanoPanel from './components/VolcanoPanel'
import LayerControls from './components/LayerControls'
import CompareBar from './components/CompareBar'
import CompareModal from './components/CompareModal'
import TokenGate from './components/TokenGate'
import WelcomeModal from './components/WelcomeModal'
import './App.css'

const DEFAULT_LAYERS = {
  boundaries: true, ringOfFire: true,
  showActive: true, showDormant: true,
  recentEruption: false,
  typeStratovolcano: true, typeCaldera: true, typeShield: true, typeSubmarine: true,
}

export default function App() {
  const [volcanoes, setVolcanoes] = useState([])
  const [selected, setSelected]   = useState(null)
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
    if (volcano) setFlyTo({ lon: volcano.lon, lat: volcano.lat })
  }

  const handleToggleLayer = useCallback((id) => {
    setLayers(prev => {
      const next = { ...prev, [id]: !prev[id] }
      // Enabling "Erupted recently" → always ensure Active is on (dormant volcanoes don't have recent eruptions in the dataset)
      if (id === 'recentEruption' && next.recentEruption && !next.showActive) {
        next.showActive = true
      }
      return next
    })
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
      <LayerControls layers={layers} onToggle={handleToggleLayer} />
      {!compareMode && selected && (
        <VolcanoPanel key={selected.id} volcano={selected} onClose={() => setSelected(null)} />
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
