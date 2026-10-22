const MAX_DIM = 3000

async function loadBitmap(file: File): Promise<ImageBitmap> {
  const bitmap = await createImageBitmap(file)
  const { width: w, height: h } = bitmap
  if (Math.max(w, h) <= MAX_DIM) return bitmap
  const scale = MAX_DIM / Math.max(w, h)
  const canvas = new OffscreenCanvas(Math.round(w * scale), Math.round(h * scale))
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return createImageBitmap(canvas)
}

async function toURL(canvas: OffscreenCanvas): Promise<string> {
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.95 })
  return URL.createObjectURL(blob)
}

// Running average: draw(i) contributes weight 1/(i+1) so all samples end up equal weight.
// bgColor fills the canvas first so empty areas (corners after rotation/scale) use that
// color rather than compositing as black.
function accumulate(
  ctx: OffscreenCanvasRenderingContext2D,
  n: number,
  bgColor: string,
  draw: (i: number) => void,
) {
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  for (let i = 0; i < n; i++) {
    ctx.save()
    ctx.globalAlpha = 1 / (i + 1)
    draw(i)
    ctx.restore()
  }
}

// Sample the average color of the image border so callers can auto-fill bg.
export async function sampleEdgeColor(file: File): Promise<string> {
  // Downscale for speed — we only care about edge colour, not detail
  const bitmap = await createImageBitmap(file, { resizeWidth: 200, resizeHeight: 200, resizeQuality: 'medium' })
  const { width: w, height: h } = bitmap
  const canvas = new OffscreenCanvas(w, h)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  const top    = ctx.getImageData(0,     0,     w, 1).data
  const bottom = ctx.getImageData(0,     h - 1, w, 1).data
  const left   = ctx.getImageData(0,     0,     1, h).data
  const right  = ctx.getImageData(w - 1, 0,     1, h).data

  let r = 0, g = 0, b = 0, n = 0
  for (const strip of [top, bottom, left, right]) {
    for (let i = 0; i < strip.length; i += 4) {
      r += strip[i]; g += strip[i + 1]; b += strip[i + 2]; n++
    }
  }
  const hex = (v: number) => Math.round(v / n).toString(16).padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`
}

export async function linearMotionBlur(file: File, angle: number, strength: number, bgColor: string): Promise<string> {
  const img = await loadBitmap(file)
  const { width: w, height: h } = img
  const canvas = new OffscreenCanvas(w, h)
  const ctx = canvas.getContext('2d')!
  const rad = (angle * Math.PI) / 180
  const n = Math.max(3, Math.min(Math.round(strength), 80))

  accumulate(ctx, n, bgColor, (i) => {
    const t = n > 1 ? i / (n - 1) - 0.5 : 0
    ctx.drawImage(img, t * strength * Math.cos(rad), t * strength * Math.sin(rad))
  })

  img.close()
  return toURL(canvas)
}

export async function zoomBlur(
  file: File, cx: number, cy: number, strength: number, samples: number, bgColor: string,
): Promise<string> {
  const img = await loadBitmap(file)
  const { width: w, height: h } = img
  const canvas = new OffscreenCanvas(w, h)
  const ctx = canvas.getContext('2d')!
  const maxScale = 1 + strength / 50

  accumulate(ctx, samples, bgColor, (i) => {
    const t = samples > 1 ? i / (samples - 1) : 0
    const scale = 1 + (maxScale - 1) * t
    ctx.translate(cx * w, cy * h)
    ctx.scale(scale, scale)
    ctx.translate(-cx * w, -cy * h)
    ctx.drawImage(img, 0, 0)
  })

  img.close()
  return toURL(canvas)
}

export async function spinBlur(
  file: File, cx: number, cy: number, angle: number, samples: number, bgColor: string,
): Promise<string> {
  const img = await loadBitmap(file)
  const { width: w, height: h } = img
  const canvas = new OffscreenCanvas(w, h)
  const ctx = canvas.getContext('2d')!

  accumulate(ctx, samples, bgColor, (i) => {
    const t = samples > 1 ? i / (samples - 1) : 0
    const rot = ((angle * (t - 0.5)) * Math.PI) / 180
    ctx.translate(cx * w, cy * h)
    ctx.rotate(rot)
    ctx.translate(-cx * w, -cy * h)
    ctx.drawImage(img, 0, 0)
  })

  img.close()
  return toURL(canvas)
}

export async function tiltShift(
  file: File, focusY: number, focusWidth: number, blurStrength: number,
): Promise<string> {
  const img = await loadBitmap(file)
  const { width: w, height: h } = img

  const sharpCanvas = new OffscreenCanvas(w, h)
  sharpCanvas.getContext('2d')!.drawImage(img, 0, 0)
  const sharp = sharpCanvas.getContext('2d')!.getImageData(0, 0, w, h).data

  const blurDom = document.createElement('canvas')
  blurDom.width = w
  blurDom.height = h
  const blurCtx = blurDom.getContext('2d')!
  blurCtx.filter = `blur(${blurStrength}px)`
  blurCtx.drawImage(img, 0, 0)
  const blurred = blurCtx.getImageData(0, 0, w, h).data

  const focusCenterPx = focusY * h
  const focusHalfPx = (focusWidth * h) / 2
  const transitionPx = Math.max(h * 0.12, 20)
  const output = new Uint8ClampedArray(w * h * 4)

  for (let y = 0; y < h; y++) {
    const dist = Math.abs(y - focusCenterPx)
    const s = dist <= focusHalfPx ? 1 : Math.max(0, 1 - (dist - focusHalfPx) / transitionPx)
    const b = 1 - s
    const row = y * w * 4
    for (let x = 0; x < w; x++) {
      const i = row + x * 4
      output[i]     = sharp[i]     * s + blurred[i]     * b
      output[i + 1] = sharp[i + 1] * s + blurred[i + 1] * b
      output[i + 2] = sharp[i + 2] * s + blurred[i + 2] * b
      output[i + 3] = 255
    }
  }

  const result = new OffscreenCanvas(w, h)
  result.getContext('2d')!.putImageData(new ImageData(output, w, h), 0, 0)

  img.close()
  return toURL(result)
}

export async function applyEffect(
  file: File,
  effect: string,
  params: Record<string, number>,
  bgColor: string,
): Promise<string> {
  switch (effect) {
    case 'linear':     return linearMotionBlur(file, params.angle, params.strength, bgColor)
    case 'zoom':       return zoomBlur(file, params.cx, params.cy, params.strength, params.samples, bgColor)
    case 'spin':       return spinBlur(file, params.cx, params.cy, params.angle, params.samples, bgColor)
    case 'tilt_shift': return tiltShift(file, params.focus_y, params.focus_width, params.blur_strength)
    default:           throw new Error(`Unknown effect: ${effect}`)
  }
}
