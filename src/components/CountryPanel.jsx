import { useState, useEffect } from 'react'
import './CountryPanel.css'

function isoToFlag(iso) {
  if (!iso || iso.length !== 2) return '🌐'
  return iso.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)))
}

function statusColor(status = '') {
  if (status.includes('Active'))  return '#ff4422'
  if (status.includes('Dormant')) return '#ffaa22'
  return '#8888aa'
}

// Same lookup VolcanoPanel uses — fetch a real photo from Wikipedia's REST
// API when we have an article link, falling back to the dataset's own image.
async function fetchWikiImage(wikiUrl, fallbackUrl) {
  if (!wikiUrl) return fallbackUrl || null
  try {
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

function VolcanoCard({ volcano: v, onClick }) {
  const [imgSrc, setImgSrc] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchWikiImage(v.wikipedia, v.image).then(src => {
      if (src) setImgSrc(src)
      else setError(true)
    })
  }, [v.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="cp-card" onClick={() => onClick(v)}>
      <div className={`cp-card-img-wrap ${loaded ? 'loaded' : ''}`}>
        {!error && imgSrc && (
          <img
            src={imgSrc}
            alt={v.name}
            className="cp-card-img"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        )}
        {!imgSrc && !error && <div className="cp-card-skeleton" />}
        {error && <div className="cp-card-fallback">🌋</div>}
        <span className="cp-card-status-dot" style={{ background: statusColor(v.status) }} />
      </div>
      <div className="cp-card-body">
        <span className="cp-card-name">{v.name}</span>
        <span className="cp-card-meta">
          {v.region} · {v.elevation > 0 ? `${v.elevation.toLocaleString()} m` : 'Submarine'}
        </span>
      </div>
      <span className="cp-card-arrow">›</span>
    </div>
  )
}

export default function CountryPanel({ country, onClose, onSelectVolcano }) {
  const { name, iso, volcanoes } = country
  const sorted = [...volcanoes].sort((a, b) => a.name.localeCompare(b.name))

  const activeCount  = volcanoes.filter(v => v.status?.includes('Active')).length
  const dormantCount = volcanoes.length - activeCount

  const highest = volcanoes.reduce((best, v) =>
    (v.elevation > 0 && (!best || v.elevation > best.elevation)) ? v : best, null)

  const mostRecent = volcanoes.reduce((best, v) =>
    (v.last_eruption != null && (!best || v.last_eruption > best.last_eruption)) ? v : best, null)

  const totalEruptions = volcanoes.reduce((sum, v) => sum + (v.eruptions?.length || 0), 0)

  return (
    <div className="cp-overlay" onClick={onClose}>
      <div className="cp-panel" onClick={e => e.stopPropagation()}>
        <div className="cp-header">
          <button className="cp-close" onClick={onClose} title="Close">✕</button>
          <div className="cp-eyebrow">Country</div>
          <h2 className="cp-title">
            <span className="cp-flag">{isoToFlag(iso)}</span> {name}
          </h2>
          <p className="cp-subtitle">{volcanoes.length} volcano{volcanoes.length !== 1 ? 'es' : ''}</p>

          <div className="cp-stats">
            <div className="cp-stat">
              <span className="cp-stat-label">Status</span>
              <span className="cp-stat-value">{activeCount} active · {dormantCount} dormant</span>
            </div>
            <div className="cp-stat">
              <span className="cp-stat-label">Highest Peak</span>
              <span className="cp-stat-value" title={highest ? `${highest.elevation.toLocaleString()} m` : ''}>
                {highest ? highest.name : '—'}
              </span>
            </div>
            <div className="cp-stat">
              <span className="cp-stat-label">Last Eruption</span>
              <span className="cp-stat-value">
                {mostRecent ? `${mostRecent.last_eruption} · ${mostRecent.name}` : '—'}
              </span>
            </div>
            <div className="cp-stat">
              <span className="cp-stat-label">Eruptions Rec.</span>
              <span className="cp-stat-value">{totalEruptions}</span>
            </div>
          </div>
        </div>

        <div className="cp-cards">
          {sorted.map(v => (
            <VolcanoCard key={v.id} volcano={v} onClick={onSelectVolcano} />
          ))}
        </div>
      </div>
    </div>
  )
}
