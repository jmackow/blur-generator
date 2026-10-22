import { useState, useEffect, useRef, useCallback } from 'react'
import ImageUpload from './components/ImageUpload'
import EffectSelector from './components/EffectSelector'
import ImageViewer from './components/ImageViewer'
import LinearControls from './components/LinearControls'
import ZoomControls from './components/ZoomControls'
import SpinControls from './components/SpinControls'
import TiltShiftControls from './components/TiltShiftControls'
import { applyEffect, sampleEdgeColor } from './blurEffects'
import type { Effect, LinearParams, ZoomParams, SpinParams, TiltShiftParams } from './types'

const SIDEBAR = 272

export default function App() {
  const [file, setFile] = useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)
  const [showOriginal, setShowOriginal] = useState(false)
  const [effect, setEffect] = useState<Effect>('zoom')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bgColor, setBgColor] = useState('#ffffff')

  const [linearParams, setLinearParams] = useState<LinearParams>({ angle: 0, strength: 40 })
  const [zoomParams, setZoomParams] = useState<ZoomParams>({ cx: 0.5, cy: 0.5, strength: 40, samples: 20 })
  const [spinParams, setSpinParams] = useState<SpinParams>({ cx: 0.5, cy: 0.5, angle: 20, samples: 20 })
  const [tiltParams, setTiltParams] = useState<TiltShiftParams>({ focus_y: 0.5, focus_width: 0.2, blur_strength: 20 })

  const runIdRef = useRef(0)

  // Auto-apply with 350 ms debounce whenever file or any param changes
  useEffect(() => {
    if (!file) return

    const params = effect === 'linear' ? linearParams
      : effect === 'zoom' ? zoomParams
      : effect === 'spin' ? spinParams
      : tiltParams

    const timer = setTimeout(async () => {
      const id = ++runIdRef.current
      setIsProcessing(true)
      setError(null)
      try {
        const url = await applyEffect(file, effect, params, bgColor)
        if (runIdRef.current !== id) { URL.revokeObjectURL(url); return }
        setProcessedUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url })
        setShowOriginal(false)
      } catch (err) {
        if (runIdRef.current === id) setError(err instanceof Error ? err.message : 'Error')
      } finally {
        if (runIdRef.current === id) setIsProcessing(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [file, effect, linearParams, zoomParams, spinParams, tiltParams, bgColor])

  const handleUpload = (f: File) => {
    setFile(f)
    setOriginalUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(f) })
    setProcessedUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })
    setShowOriginal(false)
    setError(null)
    sampleEdgeColor(f).then(setBgColor)
  }

  const handleDownload = () => {
    if (!processedUrl) return
    const a = document.createElement('a')
    a.href = processedUrl
    a.download = `blur-${effect}.jpg`
    a.click()
  }

  const handleCenterChange = useCallback((x: number, y: number) => {
    if (effect === 'zoom') setZoomParams(p => ({ ...p, cx: x, cy: y }))
    else if (effect === 'spin') setSpinParams(p => ({ ...p, cx: x, cy: y }))
    else if (effect === 'tilt_shift') setTiltParams(p => ({ ...p, focus_y: y }))
  }, [effect])

  const center = effect === 'zoom' ? { x: zoomParams.cx, y: zoomParams.cy }
               : effect === 'spin' ? { x: spinParams.cx, y: spinParams.cy }
               : null

  const focusY = effect === 'tilt_shift' ? tiltParams.focus_y : null
  const focusHalf = effect === 'tilt_shift' ? tiltParams.focus_width / 2 : null
  const interactive = effect !== 'linear'
  const displayUrl = showOriginal ? originalUrl : (processedUrl ?? originalUrl)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: SIDEBAR,
        flexShrink: 0,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{ height: 28, flexShrink: 0 }} />

        <div style={{ padding: '0 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
            Blur Generator
          </span>
        </div>

        <div style={{ padding: 16, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <ImageUpload onUpload={handleUpload} currentFileName={file?.name ?? null} />
        </div>

        {file && (
          <>
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: 8 }}>
                Effect
              </div>
              <EffectSelector current={effect} onChange={setEffect} />
            </div>

            <div style={{ padding: 16, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                {effect === 'linear'     && <LinearControls    params={linearParams} onChange={setLinearParams} />}
                {effect === 'zoom'       && <ZoomControls      params={zoomParams}   onChange={setZoomParams} />}
                {effect === 'spin'       && <SpinControls      params={spinParams}   onChange={setSpinParams} />}
                {effect === 'tilt_shift' && <TiltShiftControls params={tiltParams}   onChange={setTiltParams} />}
              </div>

              {/* Background colour — only visible for effects that can expose canvas edges */}
              {(effect === 'zoom' || effect === 'spin' || effect === 'linear') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Background</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Colour swatch that opens native picker */}
                    <div style={{ position: 'relative', width: 20, height: 20, flexShrink: 0 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 2, border: '1px solid var(--border)', background: bgColor }} />
                      <input
                        type="color"
                        value={bgColor}
                        onChange={e => setBgColor(e.target.value)}
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                      />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', flex: 1 }}>
                      {bgColor.toUpperCase()}
                    </span>
                    <button
                      onClick={() => file && sampleEdgeColor(file).then(setBgColor)}
                      style={{
                        padding: '3px 8px',
                        fontSize: 10,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        border: '1px solid var(--border)',
                        borderRadius: 2,
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      Sample
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: 16, borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {error && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{error}</p>}
              <div style={{ minHeight: 16 }}>
                {isProcessing && (
                  <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Processing…</span>
                )}
              </div>
              {processedUrl && (
                <SecondaryButton onClick={handleDownload}>Download</SecondaryButton>
              )}
            </div>
          </>
        )}
      </aside>

      {/* ── Main ── */}
      <main style={{
        flex: 1,
        background: 'var(--bg-body)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {displayUrl ? (
          <>
            <div style={{ opacity: isProcessing ? 0.7 : 1, transition: 'opacity 0.15s' }}>
              <ImageViewer
                src={displayUrl}
                center={center}
                focusY={focusY}
                focusHalf={focusHalf}
                onCenterChange={interactive ? handleCenterChange : null}
              />
            </div>

            {processedUrl && (
              <button
                onClick={() => setShowOriginal(s => !s)}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  padding: '4px 10px',
                  fontSize: 11,
                  letterSpacing: '0.02em',
                  border: '1px solid var(--border)',
                  borderRadius: 2,
                  background: 'var(--bg-surface)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {showOriginal ? 'Original' : 'Result'}
              </button>
            )}
          </>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-subtle)', margin: 0 }}>
            Upload a photo to get started
          </p>
        )}
      </main>
    </div>
  )
}

function SecondaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        padding: '6px 0',
        fontSize: 11,
        letterSpacing: '0.02em',
        border: `1px solid ${hovered ? 'var(--text-muted)' : 'var(--border)'}`,
        borderRadius: 2,
        background: 'transparent',
        color: hovered ? 'var(--text-primary)' : 'var(--text-muted)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'border-color 0.12s, color 0.12s',
      }}
    >
      {children}
    </button>
  )
}
