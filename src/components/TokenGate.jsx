import { useState } from 'react'
import './TokenGate.css'

export default function TokenGate({ onSave }) {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const t = token.trim()
    if (!t.startsWith('pk.')) {
      setError('El token debe comenzar con "pk." — cópialo desde tu cuenta de Mapbox.')
      return
    }
    onSave(t)
  }

  return (
    <div className="tg-wrap">
      <div className="tg-card">
        <div className="tg-icon">🌋</div>
        <h1>Volcano Explorer</h1>
        <p className="tg-sub">Explora 50 volcanes del mundo en un mapa interactivo.<br/>Necesitas un token gratuito de Mapbox para comenzar.</p>
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
            Abrir el mapa →
          </button>
        </form>
        <p className="tg-help">
          ¿No tienes token? Crea uno gratis en{' '}
          <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noreferrer">
            account.mapbox.com
          </a>
        </p>
      </div>
    </div>
  )
}
