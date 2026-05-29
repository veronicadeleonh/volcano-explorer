import { useState } from 'react'
import './TokenGate.css'

export default function TokenGate({ onSave }) {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const t = token.trim()
    if (!t.startsWith('pk.')) {
      setError('Token must start with "pk." — copy it from your Mapbox account.')
      return
    }
    onSave(t)
  }

  return (
    <div className="tg-wrap">
      <div className="tg-card">
        <div className="tg-icon">🌋</div>
        <h1>Volcano Explorer</h1>
        <p className="tg-sub">Explore 50 volcanoes around the world on an interactive 3D globe.<br/>You need a free Mapbox token to get started.</p>
        <form onSubmit={handleSubmit}>
          <input
            className="tg-input"
            type="text"
            placeholder="pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJ..."
            value={token}
            onChange={e => { setToken(e.target.value); setError('') }}
            autoFocus
            spellCheck={false}
          />
          {error && <p className="tg-error">{error}</p>}
          <button className="tg-btn" type="submit" disabled={!token.trim()}>
            Open the map →
          </button>
        </form>
        <p className="tg-help">
          Don't have a token? Get one for free at{' '}
          <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noreferrer">
            account.mapbox.com
          </a>
        </p>
      </div>
    </div>
  )
}
