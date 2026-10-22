import Slider from './Slider'
import type { TiltShiftParams } from '../types'

export default function TiltShiftControls({ params, onChange }: { params: TiltShiftParams; onChange: (p: TiltShiftParams) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 11, color: 'var(--text-subtle)', margin: 0, lineHeight: 1.5 }}>
        Click the image to set the focus position.
      </p>
      <Slider
        label="Focus position"
        value={Math.round(params.focus_y * 100)}
        min={0} max={100} unit="%"
        onChange={v => onChange({ ...params, focus_y: v / 100 })}
      />
      <Slider
        label="Focus width"
        value={Math.round(params.focus_width * 100)}
        min={1} max={100} unit="%"
        onChange={v => onChange({ ...params, focus_width: v / 100 })}
      />
      <Slider
        label="Blur strength"
        value={params.blur_strength}
        min={1} max={50}
        onChange={v => onChange({ ...params, blur_strength: v })}
      />
    </div>
  )
}
