import { useState, useEffect } from 'react'
import Map from './components/Map'
import SearchBar from './components/SearchBar'
import VolcanoPanel from './components/VolcanoPanel'
import TokenGate from './components/TokenGate'
import './App.css'

export default function App() {
  const [volcanoes, setVolcanoes] = useState([])
  const [selected, setSelected] = useState(null)
  const [flyTo, setFlyTo] = useState(null)
  const [token, setToken] = useState(() => import.meta.env.VITE_MAPBOX_TOKEN || localStorage.getItem('mapbox_token') || '')

  useEffect(() => {
    fetch('/data/volcanoes.json').then(r => r.json()).then(setVolcanoes)
  }, [])

  const handleSaveToken = (t) => {
    localStorage.setItem('mapbox_token', t)
    setToken(t)
  }

  const handleSelect = (volcano) => {
    setSelected(volcano)
    if (volcano) setFlyTo({ lon: volcano.lon, lat: volcano.lat })
  }

  if (!token) return <TokenGate onSave={handleSaveToken} />

  return (
    <div className="app">
      <Map token={token} volcanoes={volcanoes} selected={selected} onSelect={handleSelect} flyTo={flyTo} />
      <SearchBar volcanoes={volcanoes} onSelect={handleSelect} selected={selected} />
      {selected && <VolcanoPanel key={selected.id} volcano={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
