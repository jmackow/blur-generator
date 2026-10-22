import Slider from './Slider'
import type { ZoomParams } from '../types'

export default function ZoomControls({ params, onChange }: { params: ZoomParams; onChange: (p: ZoomParams) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 11, color: 'var(--text-subtle)', margin: 0, lineHeight: 1.5 }}>
        Click the image to set the zoom origin.
      </p>
      <Slider label="Strength" value={params.strength} min={1} max={100} onChange={v => onChange({ ...params, strength: v })} />
      <Slider label="Samples" value={params.samples} min={5} max={40} onChange={v => onChange({ ...params, samples: v })} />
    </div>
  )
}
