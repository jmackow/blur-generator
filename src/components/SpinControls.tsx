import Slider from './Slider'
import type { SpinParams } from '../types'

export default function SpinControls({ params, onChange }: { params: SpinParams; onChange: (p: SpinParams) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 11, color: 'var(--text-subtle)', margin: 0, lineHeight: 1.5 }}>
        Click the image to set the rotation center.
      </p>
      <Slider label="Angle" value={params.angle} min={1} max={60} unit="°" onChange={v => onChange({ ...params, angle: v })} />
      <Slider label="Samples" value={params.samples} min={5} max={40} onChange={v => onChange({ ...params, samples: v })} />
    </div>
  )
}
