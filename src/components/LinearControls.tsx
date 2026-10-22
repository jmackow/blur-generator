import Slider from './Slider'
import type { LinearParams } from '../types'

export default function LinearControls({ params, onChange }: { params: LinearParams; onChange: (p: LinearParams) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Slider label="Angle" value={params.angle} min={0} max={360} unit="°" onChange={v => onChange({ ...params, angle: v })} />
      <Slider label="Strength" value={params.strength} min={3} max={200} unit="px" onChange={v => onChange({ ...params, strength: v })} />
    </div>
  )
}
