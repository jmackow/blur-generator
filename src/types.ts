export type Effect = 'linear' | 'zoom' | 'spin' | 'tilt_shift'

export interface LinearParams extends Record<string, number> {
  angle: number
  strength: number
}

export interface ZoomParams extends Record<string, number> {
  cx: number
  cy: number
  strength: number
  samples: number
}

export interface SpinParams extends Record<string, number> {
  cx: number
  cy: number
  angle: number
  samples: number
}

export interface TiltShiftParams extends Record<string, number> {
  focus_y: number
  focus_width: number
  blur_strength: number
}
