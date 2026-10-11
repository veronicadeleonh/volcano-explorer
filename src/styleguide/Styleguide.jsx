import { useEffect } from 'react'
import { Colors, Typography, Spacing, Shape, Motion } from './TokenSections'
import { Components } from './ComponentSections'
import { flat } from './tokenData'
import './Styleguide.css'

const NAV = [
  ['colors', 'Color'], ['typography', 'Tipografía'], ['spacing', 'Espaciado'],
  ['shape', 'Radios y sombras'], ['motion', 'Movimiento y capas'], ['components', 'Componentes'],
]

export default function Styleguide() {
  // The app locks the page to the viewport (the map fills it); this page scrolls.
  useEffect(() => {
    document.body.classList.add('sg-body')
    document.title = 'Volcano Explorer · Styleguide'
    return () => document.body.classList.remove('sg-body')
  }, [])

  return (
    <div className="sg">
      <aside className="sg-nav">
        <a className="sg-brand" href="/">🌋 Volcano Explorer</a>
        <span className="sg-eyebrow">Styleguide</span>
        <nav>{NAV.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav>
        <p className="sg-count">{flat.length} tokens · generados desde <code>tokens/tokens.json</code></p>
      </aside>
      <main className="sg-main">
        <header className="sg-hero">
          <span className="sg-eyebrow">Sistema de diseño</span>
          <h1>Styleguide</h1>
          <p>Todos los tokens y componentes de la app, leídos de la misma fuente que usa el código. Si cambias <code>tokens/tokens.json</code> y corres <code>npm run tokens</code>, esta página se actualiza sola.</p>
        </header>
        <Colors />
        <Typography />
        <Spacing />
        <Shape />
        <Motion />
        <Components />
      </main>
    </div>
  )
}
