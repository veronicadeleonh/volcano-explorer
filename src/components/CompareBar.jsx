import './CompareBar.css'

const MAX = 3

function getColor(status = '') {
  if (status.includes('Active'))  return '#ff4422'
  if (status.includes('Dormant')) return '#ffaa22'
  return '#8888aa'
}

export default function CompareBar({ compareList, onRemove, onOpen, onCancel }) {
  const slots = Array.from({ length: MAX }, (_, i) => compareList[i] || null)
  const canCompare = compareList.length >= 2

  return (
    <div className="cb-wrap">
      <div className="cb-hint">
        {compareList.length === 0 && 'Haz clic en un volcán para añadirlo'}
        {compareList.length === 1 && 'Añade al menos un volcán más'}
        {compareList.length >= 2 && `${compareList.length} volcanes seleccionados`}
      </div>

      <div className="cb-slots">
        {slots.map((v, i) => (
          <div key={i} className={`cb-slot ${v ? 'filled' : 'empty'}`}>
            {v ? (
              <>
                <span className="cb-dot" style={{ background: getColor(v.status) }} />
                <span className="cb-name">{v.name}</span>
                <button className="cb-remove" onClick={() => onRemove(v.id)} title="Quitar">✕</button>
              </>
            ) : (
              <span className="cb-placeholder">+ Vacío</span>
            )}
          </div>
        ))}

        <button
          className={`cb-go ${canCompare ? 'ready' : 'disabled'}`}
          onClick={canCompare ? onOpen : undefined}
          title={canCompare ? 'Ver comparación' : 'Selecciona al menos 2 volcanes'}
        >
          Ver comparación →
        </button>
      </div>

      <button className="cb-cancel" onClick={onCancel}>✕ Cancelar</button>
    </div>
  )
}
