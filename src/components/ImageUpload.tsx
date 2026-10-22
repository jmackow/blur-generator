import { useRef, useState } from 'react'

interface Props {
  onUpload: (file: File) => void
  currentFileName: string | null
}

export default function ImageUpload({ onUpload, currentFileName }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) onUpload(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `1px dashed ${isDragging ? 'var(--text-muted)' : 'var(--border)'}`,
        borderRadius: 2,
        padding: '10px 12px',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'border-color 0.12s',
        background: isDragging ? 'rgba(0,0,0,0.03)' : 'transparent',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      {currentFileName ? (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentFileName}
        </p>
      ) : (
        <p style={{ fontSize: 11, color: 'var(--text-subtle)', margin: 0 }}>
          Drop image or click to browse
        </p>
      )}
    </div>
  )
}
