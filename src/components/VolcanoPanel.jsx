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

const ERUPTION_KEYWORDS = ['eruption', 'erupted', 'eruptive', 'lava', 'ash', 'pyroclastic', 'explosion', 'volcanic activity']

function hasRecentEruption(results = []) {
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 1)
  return results.some(r => {
    const withinYear = r.published_date && new Date(r.published_date) >= cutoff
    const mentionsEruption = ERUPTION_KEYWORDS.some(w =>
      r.title?.toLowerCase().includes(w) || r.content?.toLowerCase().includes(w)
    )
    return withinYear && mentionsEruption
  })
}

async function fetchVolcanoNews(name, country) {
  const key = import.meta.env.VITE_TAVILY_KEY
  if (!key || key === 'your_tavily_key_here') return null
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: key,
      query: `${name} volcano ${country} eruption activity`,
      search_depth: 'basic',
      topic: 'news',
      days: 365,
      max_results: 5,
    }),
  })
  if (!res.ok) throw new Error('Tavily error')
  return res.json()
}

export default function VolcanoPanel({ volcano: v, onClose }) {
  const [imgSrc, setImgSrc]     = useState(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError]  = useState(false)
  const [news, setNews]               = useState(null)
  const [newsLoading, setNewsLoading] = useState(false)
  const [recentEruption, setRecentEruption] = useState(false)

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

  // Fetch news whenever volcano changes
  useEffect(() => {
    setNews(null)
    setRecentEruption(false)
    setNewsLoading(true)
    fetchVolcanoNews(v.name, v.country)
      .then(data => {
        const results = data?.results ?? []
        setNews(results)
        setRecentEruption(hasRecentEruption(results))
      })
      .catch(() => setNews([]))
      .finally(() => setNewsLoading(false))
  }, [v.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="vp-overlay" onClick={onClose}>
      <div className="vp-panel" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="vp-header">
          <button className="vp-close" onClick={onClose} title="Close">✕</button>
          <div className="vp-badges">
            <div className="vp-badge" style={{ background: sc.bg, color: sc.text }}>
              <span style={{ color: sc.dot }}>●</span> {v.status}
            </div>
            {recentEruption && (
              <div className="vp-badge vp-badge-eruption">
                ▲ Erupted in last 12 months
              </div>
            )}
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
              ['Elevation',     v.elevation > 0 ? `${v.elevation.toLocaleString()} m` : 'Submarine'],
              ['Type',          v.type],
              ['Last eruption', formatYear(v.last_eruption)],
              ['Eruptions rec.', v.eruptions?.length ?? 0],
              ['Coordinates',   `${v.lat.toFixed(2)}°, ${v.lon.toFixed(2)}°`],
              ['Max VEI',       maxVei > 0 ? maxVei : '—'],
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
              <h3 className="vp-section-title">VEI History</h3>
              <EruptionChart eruptions={v.eruptions} />
            </div>
          )}

          {/* Eruption list */}
          {sortedEruptions.length > 0 && (
            <div className="vp-section">
              <h3 className="vp-section-title">Notable Eruptions</h3>
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

          {/* Latest News */}
          <div className="vp-section">
            <h3 className="vp-section-title">Latest News</h3>
            {newsLoading && (
              <div className="vp-news-skeleton">
                {[1,2,3].map(i => <div key={i} className="vp-news-skel-item" />)}
              </div>
            )}
            {!newsLoading && news?.length > 0 && (
              <div className="vp-news">
                {news.map((item, i) => (
                  <a
                    key={i}
                    className="vp-news-item"
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="vp-news-title">{item.title}</div>
                    {item.published_date && (
                      <div className="vp-news-date">
                        {new Date(item.published_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    )}
                    <div className="vp-news-snippet">{item.content?.slice(0, 120)}…</div>
                  </a>
                ))}
              </div>
            )}
            {!newsLoading && news?.length === 0 && (
              <p className="vp-news-empty">No recent news found.</p>
            )}
          </div>

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
