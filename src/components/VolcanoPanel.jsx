import { useState, useEffect } from 'react'
import EruptionChart from './EruptionChart'
import './VolcanoPanel.css'

const STATUS_COLORS = {
  Active:  { bg: 'rgba(255,68,34,0.15)',  text: '#ff7755', dot: '#ff4422' },
  Dormant: { bg: 'rgba(255,170,34,0.15)', text: '#ffcc55', dot: '#ffaa22' },
  Extinct: { bg: 'rgba(130,130,170,0.15)', text: '#aaaacc', dot: '#8888aa' },
}

function getStatusStyle(status) {
  for (const [k, v] of Object.entries(STATUS_COLORS)) {
    if (status && status.includes(k)) return v
  }
  return STATUS_COLORS.Active
}

function formatYear(y) {
  if (y === null || y === undefined) return '?'
  if (y < 0) return `${Math.abs(y).toLocaleString()} BCE`
  if (y < 1000) return `${y} CE`
  return y.toString()
}

// Fetch the best available thumbnail from Wikipedia's REST API
async function fetchWikiImage(wikiUrl, fallbackUrl) {
  if (!wikiUrl) return fallbackUrl || null
  try {
    // Extract article title from URL, e.g. ".../Mount_Fuji" → "Mount_Fuji"
    const title = wikiUrl.split('/wiki/').pop()
    const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`
    const res = await fetch(apiUrl, { headers: { 'Accept': 'application/json' } })
    if (!res.ok) throw new Error('not ok')
    const data = await res.json()
    return data?.originalimage?.source || data?.thumbnail?.source || fallbackUrl || null
  } catch {
    return fallbackUrl || null
  }
}

export default function VolcanoPanel({ volcano: v, onClose }) {
  const [imgSrc, setImgSrc]     = useState(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError]  = useState(false)

  const sc = getStatusStyle(v.status)
  const sortedEruptions = [...(v.eruptions || [])].sort((a, b) => b.year - a.year)
  const maxVei = v.eruptions?.length ? Math.max(...v.eruptions.map(e => e.vei ?? 0)) : 0

  // Load image whenever volcano changes
  useEffect(() => {
    setImgSrc(null)
    setImgLoaded(false)
    setImgError(false)

    fetchWikiImage(v.wikipedia, v.image).then(src => {
      if (src) setImgSrc(src)
      else setImgError(true)
    })
  }, [v.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="vp-overlay" onClick={onClose}>
      <div className="vp-panel" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="vp-header">
          <button className="vp-close" onClick={onClose} title="Cerrar">✕</button>
          <div className="vp-badge" style={{ background: sc.bg, color: sc.text }}>
            <span style={{ color: sc.dot }}>●</span> {v.status}
          </div>
          <h2 className="vp-title">{v.name}</h2>
          <p className="vp-subtitle">{v.country} · {v.region}</p>
        </div>

        {/* ── Image ── */}
        <div className={`vp-img-wrap ${imgLoaded ? 'loaded' : ''}`}>
          {!imgError && imgSrc && (
            <img
              src={imgSrc}
              alt={v.name}
              className="vp-img"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          )}
          {(!imgSrc && !imgError) && (
            <div className="vp-img-skeleton" />
          )}
          {imgLoaded && <div className="vp-img-fade" />}
        </div>

        {/* ── Body ── */}
        <div className="vp-body">

          {/* Stats */}
          <div className="vp-stats">
            {[
              ['Elevación',     v.elevation > 0 ? `${v.elevation.toLocaleString()} m` : 'Submarina'],
              ['Tipo',          v.type],
              ['Última erupción', formatYear(v.last_eruption)],
              ['Erupciones reg.', v.eruptions?.length ?? 0],
              ['Coordenadas',   `${v.lat.toFixed(2)}°, ${v.lon.toFixed(2)}°`],
              ['VEI máximo',    maxVei > 0 ? maxVei : '—'],
            ].map(([label, value]) => (
              <div key={label} className="vp-stat">
                <span className="vp-stat-label">{label}</span>
                <span className="vp-stat-value">
                  {label === 'VEI máximo' && maxVei > 0 ? (
                    <>
                      {maxVei}
                      <span className="vei-bar">
                        {Array.from({ length: 8 }, (_, i) => (
                          <span key={i} className={`vei-seg ${i < maxVei ? 'on' : ''}`} />
                        ))}
                      </span>
                    </>
                  ) : value}
                </span>
              </div>
            ))}
          </div>

          {/* Eruption chart */}
          {v.eruptions?.length > 0 && (
            <div className="vp-section">
              <h3 className="vp-section-title">Historial VEI</h3>
              <EruptionChart eruptions={v.eruptions} />
            </div>
          )}

          {/* Eruption list */}
          {sortedEruptions.length > 0 && (
            <div className="vp-section">
              <h3 className="vp-section-title">Erupciones destacadas</h3>
              <div className="vp-eruptions">
                {sortedEruptions.map((e, i) => (
                  <div key={i} className="vp-eruption">
                    <div className="ve-year">{formatYear(e.year)}</div>
                    <div className="ve-body">
                      {e.vei >= 0 && <span className="ve-vei">VEI {e.vei}</span>}
                      <p className="ve-desc">{e.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="vp-links">
            {v.wikipedia && (
              <a className="vp-link" href={v.wikipedia} target="_blank" rel="noreferrer">📖 Wikipedia</a>
            )}
            <a
              className="vp-link"
              href={`https://volcano.si.edu/search_volcano.cfm?search=${encodeURIComponent(v.name)}`}
              target="_blank" rel="noreferrer"
            >🔬 Smithsonian GVP</a>
            <a
              className="vp-link"
              href={`https://www.google.com/maps/@${v.lat},${v.lon},10z`}
              target="_blank" rel="noreferrer"
            >🗺 Google Maps</a>
          </div>

        </div>
      </div>
    </div>
  )
}
