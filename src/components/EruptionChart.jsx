import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

function formatYear(y) {
  if (y < 0) return `${Math.abs(y)}BCE`
  return y.toString()
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: 'rgba(10,10,20,0.95)',
      border: '1px solid rgba(255,100,50,0.4)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
    }}>
      <p style={{ color: 'rgba(255,100,50,0.9)', fontWeight: 700, marginBottom: 2 }}>
        {formatYear(d.year)}
      </p>
      <p style={{ color: 'rgba(255,255,255,0.7)' }}>VEI: <strong style={{ color: '#fff' }}>{d.vei >= 0 ? d.vei : '?'}</strong></p>
      {d.description && (
        <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: 4, maxWidth: 200, lineHeight: 1.4 }}>
          {d.description.length > 80 ? d.description.slice(0, 80) + '…' : d.description}
        </p>
      )}
    </div>
  )
}

export default function EruptionChart({ eruptions }) {
  const data = [...eruptions]
    .filter(e => e.vei >= 0)
    .sort((a, b) => a.year - b.year)
    .map(e => ({ ...e, vei: e.vei || 1 }))

  if (data.length === 0) return (
    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontStyle: 'italic' }}>
      No hay datos de VEI disponibles.
    </p>
  )

  return (
    <div style={{ width: '100%', height: 130 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
          barCategoryGap="20%">
          <XAxis
            dataKey="year"
            tickFormatter={formatYear}
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 8]}
            ticks={[0, 2, 4, 6, 8]}
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="vei" radius={[3, 3, 0, 0]} maxBarSize={28}>
            {data.map((entry, i) => {
              const intensity = Math.min(entry.vei / 8, 1)
              const r = Math.round(120 + intensity * 135)
              const g = Math.round(50 - intensity * 30)
              return <Cell key={i} fill={`rgb(${r},${g},30)`} />
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
