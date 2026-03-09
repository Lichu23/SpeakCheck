import { useRef, useState } from 'react'

const ACCEPTED = ['video/mp4', 'video/webm', 'video/quicktime', 'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg']
const MAX_MB = 25

export default function VideoUploader({ onFileSelect, file }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')

  function validate(f) {
    setError('')
    if (!ACCEPTED.includes(f.type)) {
      setError('Unsupported format. Use MP4, WebM, MOV, MP3, WAV, or OGG.')
      return false
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File too large. Max ${MAX_MB}MB (Groq Whisper limit).`)
      return false
    }
    return true
  }

  function handleFile(f) {
    if (validate(f)) onFileSelect(f)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  return (
    <div className="uploader-wrapper">
      <div
        className={`drop-zone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*,audio/*"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
        />

        {file ? (
          <div className="file-info">
            <span className="file-icon">🎬</span>
            <div>
              <p className="file-name">{file.name}</p>
              <p className="file-size">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            <button
              className="change-btn"
              onClick={(e) => { e.stopPropagation(); onFileSelect(null) }}
            >
              Change
            </button>
          </div>
        ) : (
          <div className="drop-hint">
            <span className="upload-icon">📁</span>
            <p className="drop-title">Drop your video here</p>
            <p className="drop-sub">or click to browse · MP4, WebM, MOV, MP3, WAV · Max 25MB</p>
          </div>
        )}
      </div>

      {error && <p className="upload-error">{error}</p>}

      {file && file.type.startsWith('video/') && (
        <video
          className="video-preview"
          src={URL.createObjectURL(file)}
          controls
        />
      )}
    </div>
  )
}
