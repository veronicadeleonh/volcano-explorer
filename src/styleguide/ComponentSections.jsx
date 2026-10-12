import { useEffect, useState } from 'react'
import { Section } from './TokenSections'
import LayerControls from '../components/LayerControls'
import SearchBar from '../components/SearchBar'
import CompareBar from '../components/CompareBar'
import VolcanoPanel from '../components/VolcanoPanel'
import CountryPanel from '../components/CountryPanel'
import PlateModal from '../components/PlateModal'
import CompareModal from '../components/CompareModal'
import WelcomeModal from '../components/WelcomeModal'
import TokenGate from '../components/TokenGate'
import EruptionChart from '../components/EruptionChart'

const DEFAULT_LAYERS = {
  boundaries: true, ringOfFire: true, showActive: true, showDormant: true,
  recencyFilter: 'all', typeStratovolcano: true, typeCaldera: true, typeShield: true, typeSubmarine: true,
}
const noop = () => {}

// Each component renders for real inside a "stage". The stage is a transformed,
// positioned box, so the app's absolute/fixed overlays stay inside it instead of
// covering the whole page. Components that can be closed get a "Reabrir" button.
function Stage({ id, title, file, note, height = 560, children }) {
  const [open, setOpen] = useState(true)
  const [run, setRun] = useState(0)
  const content = typeof children === 'function' ? children(() => setOpen(false)) : children
  return (
    <div className="sg-comp" id={id}>
      <div className="sg-comp-head">
        <div><h3>{title}</h3><code>{file}</code></div>
        {typeof children === 'function' && !open && (
          <button className="sg-btn" onClick={() => { setRun((r) => r + 1); setOpen(true) }}>Reabrir</button>
        )}
      </div>
      {note && <p className="sg-note">{note}</p>}
      <div className="sg-stage" style={{ height }}>
        {open ? <div key={run} className="sg-stage-in">{content}</div> : null}
      </div>
    </div>
  )
}

function LayerDemo() {
  const [layers, setLayers] = useState(DEFAULT_LAYERS)
  return (
    <LayerControls
      layers={layers}
      onToggle={(id) => setLayers((l) => ({ ...l, [id]: !l[id] }))}
      onSetRecency={(r) => setLayers((l) => ({ ...l, recencyFilter: r }))}
    />
  )
}

function SearchDemo({ volcanoes }) {
  const [compareMode, setCompareMode] = useState(false)
  return <SearchBar volcanoes={volcanoes} onSelect={noop} selected={null} compareMode={compareMode} onToggleCompare={() => setCompareMode((m) => !m)} />
}

function CompareBarDemo({ volcanoes }) {
  const [list, setList] = useState(() => volcanoes.slice(0, 2))
  return (
    <CompareBar
      compareList={list}
      volcanoes={volcanoes}
      onAdd={(v) => setList((l) => (l.find((x) => x.id === v.id) ? l.filter((x) => x.id !== v.id) : l.length >= 3 ? l : [...l, v]))}
      onRemove={(id) => setList((l) => l.filter((v) => v.id !== id))}
      onOpen={noop}
      onCancel={noop}
    />
  )
}

export function Components() {
  const [volcanoes, setVolcanoes] = useState([])
  useEffect(() => {
    fetch('/data/volcanoes.json').then((r) => r.json()).then(setVolcanoes).catch(noop)
  }, [])

  const ready = volcanoes.length > 0
  const krakatau = volcanoes.find((v) => v.name === 'Krakatau') ?? volcanoes[0]
  const indonesia = { name: 'Indonesia', iso: 'ID', volcanoes: volcanoes.filter((v) => v.country === 'Indonesia') }

  return (
    <Section id="components" title="Componentes" lead="Son los componentes reales de la app con datos reales de volcanoes.json, no copias. Cada uno funciona dentro de su recuadro. El mapa y las etiquetas de placas necesitan Mapbox y no se muestran aquí.">
      {!ready ? <p className="sg-note">Cargando volcanes…</p> : (
        <>
          <Stage id="c-layers" title="LayerControls" file="LayerControls.jsx · filtros y capas" note="Chips de estado, tipo, 'Last eruption' y las dos capas geológicas. Los sonidos de hover funcionan igual que en la app."><LayerDemo /></Stage>
          <Stage id="c-search" title="SearchBar" file="SearchBar.jsx · búsqueda y modo Compare" height={420}><SearchDemo volcanoes={volcanoes} /></Stage>
          <Stage id="c-comparebar" title="CompareBar" file="CompareBar.jsx · hasta 3 volcanes" height={360}><CompareBarDemo volcanoes={volcanoes} /></Stage>
          <Stage id="c-volcano" title="VolcanoPanel" file="VolcanoPanel.jsx · detalle de volcán" height={720}>
            {(close) => <VolcanoPanel volcano={krakatau} onClose={close} />}
          </Stage>
          <Stage id="c-country" title="CountryPanel" file="CountryPanel.jsx · volcanes por país" height={720}>
            {(close) => <CountryPanel country={indonesia} onClose={close} onSelectVolcano={noop} />}
          </Stage>
          <Stage id="c-plate" title="PlateModal" file="PlateModal.jsx · panel de placa tectónica" height={720}>
            {(close) => <PlateModal plateName="Pacific Plate" side="right" onArrowPositioned={noop} onClose={close} />}
          </Stage>
          <Stage id="c-compare" title="CompareModal" file="CompareModal.jsx · comparación lado a lado" height={720}>
            {(close) => <CompareModal volcanoes={volcanoes.slice(0, 3)} onClose={close} />}
          </Stage>
          <Stage id="c-chart" title="EruptionChart" file="EruptionChart.jsx · historial VEI (Recharts)" height={220}>
            <div className="sg-chart"><EruptionChart eruptions={krakatau.eruptions ?? []} /></div>
          </Stage>
          <Stage id="c-welcome" title="WelcomeModal" file="WelcomeModal.jsx · bienvenida" height={640}>
            {() => <WelcomeModal remember={false} />}
          </Stage>
          <Stage id="c-token" title="TokenGate" file="TokenGate.jsx · pide el token de Mapbox" height={620}>
            <TokenGate onSave={noop} />
          </Stage>
        </>
      )}
    </Section>
  )
}
