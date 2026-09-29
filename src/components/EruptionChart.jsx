import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

function formatYear(y) {
  if (y < 0) return `${Math.abs(y)}BCE`
  return y.toString()
}

const VEI_SCALE = [
  { label: 'Non-explosive', volume: '< 10,000 m³',    ref: 'Kīlauea effusive flows'         },
  { label: 'Gentle',        volume: '> 10,000 m³',    ref: 'Stromboli, Yasur'                },
  { label: 'Explosive',     volume: '> 1,000,000 m³', ref: 'Galeras 1992, Soufrière Hills'   },
  { label: 'Severe',        volume: '> 0.01 km³',     ref: 'Nevado del Ruiz 1985'            },
  { label: 'Cataclysmic',   volume: '> 0.1 km³',      ref: 'Eyjafjallajökull 2010'           },
  { label: 'Paroxysmal',    volume: '> 1 km³',        ref: 'Mount St. Helens 1980'           },
  { label: 'Colossal',      volume: '> 10 km³',       ref: 'Pinatubo 1991'                   },
  { label: 'Super-colossal',volume: '> 100 km³',      ref: 'Tambora 1815'                    },
  { label: 'Mega-colossal', volume: '> 1,000 km³',    ref: 'Yellowstone ~640,000 years ago'  },
]

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d   = payload[0].payload
  const vei = d.vei >= 0 ? d.vei : null
  const info = vei !== null ? VEI_SCALE[vei] : null
  return (
    <div style={{
      background: 'rgba(10,10,20,0.97)',
      border: '1px solid rgba(255,100,50,0.4)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
      maxWidth: 210,
    }}>
      <p style={{ color: 'rgba(255,100,50,0.9)', fontWeight: 700, marginBottom: 4 }}>
        {formatYear(d.year)}
        {vei !== null && <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400, marginLeft: 8 }}>VEI {vei}</span>}
      </p>
      {info && <>
        <p style={{ color: '#fff', fontWeight: 600, marginBottom: 2 }}>{info.label}</p>
        <p style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 3 }}>{info.volume} ejected</p>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>e.g. {info.ref}</p>
      </>}
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
      No VEI data available.
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
