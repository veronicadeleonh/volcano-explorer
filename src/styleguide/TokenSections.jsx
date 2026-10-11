import { useState } from 'react'
import { under, byNumber, contrastOnPanel, groupNote } from './tokenData'

const copy = (text) => { try { navigator.clipboard?.writeText(text) } catch { /* ignore */ } }

export function Section({ id, title, lead, children }) {
  return (
    <section className="sg-section" id={id}>
      <h2>{title}</h2>
      {lead && <p className="sg-lead">{lead}</p>}
      {children}
    </section>
  )
}

function Swatch({ t, mode = 'fill' }) {
  const [done, setDone] = useState(false)
  const onClick = () => { copy(`var(${t.cssVar})`); setDone(true); setTimeout(() => setDone(false), 900) }
  const onAccent = t.path === 'color.text.on-accent' // dark text: shown on the accent fill it is meant for
  const ratio = mode === 'text' ? contrastOnPanel(t.resolved, onAccent ? '#ff6432' : undefined) : null
  return (
    <button className={`sg-sw sg-sw-${mode}`} style={{ '--c': `var(${t.cssVar})` }} onClick={onClick} title={`Copiar var(${t.cssVar})`}>
      <span className="sg-sw-chip" style={onAccent ? { background: 'var(--color-accent-default)' } : undefined}>{mode === 'text' ? 'Aa' : ''}</span>
      <span className="sg-sw-name">{t.path.replace(/^color\./, '')}</span>
      <span className="sg-sw-val">{done ? 'copiado' : t.alias ? `→ ${t.alias.replace(/^color\./, '')}` : t.resolved}</span>
      {ratio && <span className={`sg-badge ${ratio >= 4.5 ? 'ok' : 'bad'}`}>{ratio.toFixed(1)}:1</span>}
    </button>
  )
}

function Group({ title, prefix, mode, sort, note }) {
  const items = under(prefix).sort(sort ?? (() => 0))
  return (
    <div className="sg-group">
      <h3>{title} <small>{items.length}</small></h3>
      {note && <p className="sg-note">{note}</p>}
      <div className="sg-sw-grid">{items.map((t) => <Swatch key={t.path} t={t} mode={mode} />)}</div>
    </div>
  )
}

export function Colors() {
  return (
    <Section id="colors" title="Color" lead="Clic en un token para copiar su var(). Los swatches se pintan con la variable real, así que siempre muestran el valor actual. La razón de contraste es contra el panel oscuro de la app (AA pide 4.5:1 en texto).">
      <h3 className="sg-h3">Semánticos</h3>
      <Group title="Texto" prefix="color.text" mode="text" note={groupNote('color.text')} />
      <Group title="Superficies" prefix="color.surface" mode="fill" note={groupNote('color.surface')} />
      <Group title="Bordes" prefix="color.border" mode="border" />
      <Group title="Acento" prefix="color.accent" mode="fill" note={groupNote('color.accent')} />
      <Group title="Estado de volcán" prefix="color.status" mode="fill" note={groupNote('color.status')} />
      <Group title="Capas del mapa" prefix="color.boundary" mode="fill" note={groupNote('color.boundary')} />
      <Group title="Resalte" prefix="color.highlight" mode="fill" />
      <Group title="Info (azul)" prefix="color.info" mode="fill" note={groupNote('color.info')} />
      <Group title="País (teal)" prefix="color.country" mode="fill" note={groupNote('color.country')} />
      <h3 className="sg-h3">Primitivos</h3>
      <Group title="Blanco (opacidad)" prefix="color.white" mode="fill" sort={byNumber} />
      <Group title="Negro (opacidad)" prefix="color.black" mode="fill" sort={byNumber} />
      <Group title="Ember (opacidad)" prefix="color.ember" mode="fill" sort={byNumber} />
      <Group title="Sky (opacidad)" prefix="color.sky" mode="fill" sort={byNumber} />
    </Section>
  )
}

export function Typography() {
  const sizes = under('font.size').sort(byNumber)
  const sample = 'Krakatau 1883 · VEI 6'
  return (
    <Section id="typography" title="Tipografía" lead="JetBrains Mono es la voz de toda la app. La fuente sans solo se usa en párrafos largos de los paneles.">
      <div className="sg-group"><h3>Familias</h3>
        {under('font.family').map((t) => (
          <div key={t.path} className="sg-row"><code>{t.cssVar}</code><span style={{ fontFamily: `var(${t.cssVar})`, fontSize: 'var(--font-size-16)' }}>Volcano Explorer — {sample}</span></div>
        ))}
      </div>
      <div className="sg-group"><h3>Tamaños <small>{sizes.length}</small></h3>
        {sizes.map((t) => (
          <div key={t.path} className="sg-row"><code>{t.cssVar}</code><span className="sg-dim">{t.resolved}</span><span style={{ fontSize: `var(${t.cssVar})`, lineHeight: 1.2 }}>{sample}</span></div>
        ))}
      </div>
      <div className="sg-cols">
        <div className="sg-group"><h3>Pesos</h3>
          {under('font.weight').map((t) => <div key={t.path} className="sg-row"><code>{t.key}</code><span className="sg-dim">{t.resolved}</span><span style={{ fontWeight: `var(${t.cssVar})`, fontSize: 'var(--font-size-14)' }}>{sample}</span></div>)}
        </div>
        <div className="sg-group"><h3>Interletrado</h3>
          {under('font.tracking').map((t) => <div key={t.path} className="sg-row"><code>{t.key}</code><span className="sg-dim">{t.resolved}</span><span style={{ letterSpacing: `var(${t.cssVar})`, fontSize: 'var(--font-size-11)', textTransform: 'uppercase' }}>Active volcanoes</span></div>)}
        </div>
      </div>
      <div className="sg-group"><h3>Interlineado</h3>
        <div className="sg-cols">
          {under('font.line-height').sort(byNumber).map((t) => (
            <p key={t.path} className="sg-lh" style={{ lineHeight: `var(${t.cssVar})` }}><code>{t.resolved}</code> Las erupciones explosivas ocurren cuando el magma rico en gas asciende y se fragmenta al llegar a la superficie.</p>
          ))}
        </div>
      </div>
    </Section>
  )
}

export function Spacing() {
  const items = under('space').sort(byNumber)
  return (
    <Section id="spacing" title="Espaciado" lead="Escala para padding, margin y gap. Los valores fuera de escala (3, 5, 7, 9, 11, 13 px) siguen en el CSS como literales y están en la lista de fusiones.">
      <div className="sg-group">
        {items.map((t) => <div key={t.path} className="sg-row"><code>{t.cssVar}</code><span className="sg-dim">{t.resolved}</span><span className="sg-bar" style={{ width: `var(${t.cssVar})` }} /></div>)}
      </div>
      <div className="sg-group"><h3>Tamaño mínimo de objetivo</h3>
        {under('size').map((t) => <div key={t.path} className="sg-row"><code>{t.cssVar}</code><span className="sg-dim">{t.resolved}</span><span><span className="sg-target" /></span></div>)}
        <p className="sg-note">Todo control clicable mide al menos esto en alto y ancho (WCAG 2.5.8). Si el dibujo es más pequeño, el área de clic se amplía con padding o min-width/min-height.</p>
      </div>
    </Section>
  )
}

export function Shape() {
  return (
    <Section id="shape" title="Radios, sombras y blur">
      <div className="sg-group"><h3>Radios</h3>
        <div className="sg-tiles">{under('radius').map((t) => (
          <div key={t.path} className="sg-tile"><span className="sg-box" style={{ borderRadius: `var(${t.cssVar})` }} /><code>{t.key}</code><span className="sg-dim">{t.resolved}</span></div>
        ))}</div>
      </div>
      <div className="sg-group"><h3>Sombras</h3>
        <div className="sg-tiles sg-tiles-wide">{under('shadow').map((t) => (
          <div key={t.path} className="sg-tile"><span className="sg-box sg-box-lg" style={{ boxShadow: `var(${t.cssVar})` }} /><code>{t.key}</code><span className="sg-dim">{t.description}</span></div>
        ))}</div>
      </div>
      <div className="sg-group"><h3>Blur (backdrop-filter)</h3>
        <div className="sg-tiles sg-tiles-wide">{under('blur').sort(byNumber).map((t) => (
          <div key={t.path} className="sg-tile"><span className="sg-blurbox"><span style={{ backdropFilter: `blur(var(${t.cssVar}))` }} /></span><code>{t.cssVar}</code><span className="sg-dim">{t.resolved}</span></div>
        ))}</div>
      </div>
    </Section>
  )
}

function Dot({ varName, ease, tick }) {
  return <span className="sg-track"><span className="sg-dot" style={{ transform: tick ? 'translateX(var(--sg-travel))' : 'none', transition: `transform var(${varName}) ${ease}` }} /></span>
}

export function Motion() {
  const [tick, setTick] = useState(false)
  return (
    <Section id="motion" title="Movimiento y capas" lead="Reproduce para comparar duraciones y la curva emphasized.">
      <div className="sg-group">
        <h3>Duraciones <button className="sg-btn" onClick={() => setTick((t) => !t)}>Reproducir</button></h3>
        {under('duration').sort(byNumber).map((t) => <div key={t.path} className="sg-row"><code>{t.key}</code><span className="sg-dim">{t.resolved}</span><Dot varName={t.cssVar} ease="ease-out" tick={tick} /></div>)}
        <div className="sg-row"><code>ease.emphasized</code><span className="sg-dim">{under('ease')[0]?.resolved}</span><Dot varName="--duration-700" ease="var(--ease-emphasized)" tick={tick} /></div>
      </div>
      <div className="sg-cols">
        <div className="sg-group"><h3>Capas (z-index)</h3>
          {under('z').sort((a, b) => Number(a.resolved) - Number(b.resolved)).map((t) => <div key={t.path} className="sg-row"><code>{t.key}</code><span className="sg-dim">{t.resolved}</span></div>)}
        </div>
        <div className="sg-group"><h3>Breakpoints</h3>
          {under('breakpoint').map((t) => <div key={t.path} className="sg-row"><code>{t.key}</code><span className="sg-dim">{t.resolved}</span></div>)}
          <p className="sg-note">Solo documentación: las custom properties no funcionan dentro de @media.</p>
        </div>
      </div>
    </Section>
  )
}
