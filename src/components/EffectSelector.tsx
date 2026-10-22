import type { Effect } from '../types'

const EFFECTS: { id: Effect; label: string }[] = [
  { id: 'linear', label: 'Motion' },
  { id: 'zoom',   label: 'Zoom' },
  { id: 'spin',   label: 'Spin' },
  { id: 'tilt_shift', label: 'Tilt' },
]

export default function EffectSelector({ current, onChange }: { current: Effect; onChange: (e: Effect) => void }) {
  return (
    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.06)', borderRadius: 3, padding: 2, gap: 2 }}>
      {EFFECTS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          style={{
            flex: 1,
            padding: '5px 0',
            border: 'none',
            borderRadius: 2,
            background: current === id ? 'var(--bg-surface)' : 'transparent',
            color: current === id ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: 11,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.1s, color 0.1s',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
