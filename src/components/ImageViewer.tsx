interface Props {
  src: string
  center: { x: number; y: number } | null
  focusY: number | null
  focusHalf: number | null
  onCenterChange: ((x: number, y: number) => void) | null
}

export default function ImageViewer({ src, center, focusY, focusHalf, onCenterChange }: Props) {
  const handleClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!onCenterChange) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    onCenterChange(x, y)
  }

  return (
    <div style={{ position: 'relative', lineHeight: 0 }}>
      <img
        src={src}
        onClick={handleClick}
        draggable={false}
        style={{
          maxWidth: 'calc(100vw - 272px - 48px)',
          maxHeight: 'calc(100vh - 48px)',
          display: 'block',
          cursor: onCenterChange ? 'crosshair' : 'default',
        }}
      />

      {/* Zoom / Spin center dot */}
      {center && (
        <div
          style={{
            position: 'absolute',
            left: `${center.x * 100}%`,
            top: `${center.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: 14,
            height: 14,
            borderRadius: '50%',
            border: '1.5px solid rgba(255,255,255,0.9)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Tilt-shift focus band lines */}
      {focusY !== null && focusHalf !== null && (
        <>
          <div style={{ position: 'absolute', left: 0, right: 0, top: `${focusY * 100}%`, height: 1, background: 'rgba(255,255,255,0.75)', boxShadow: '0 0 0 0.5px rgba(0,0,0,0.4)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: `${Math.max(0, focusY - focusHalf) * 100}%`, height: 1, background: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: `${Math.min(1, focusY + focusHalf) * 100}%`, height: 1, background: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
        </>
      )}
    </div>
  )
}
