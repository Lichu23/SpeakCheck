import { useRef, useState } from 'react'

const ACCEPTED = ['video/mp4', 'video/webm', 'video/quicktime', 'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg']
const MAX_AUDIO_MB = 25
const MAX_VIDEO_MB = 500

export default function VideoUploader({ onFileSelect, file, done }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')

  function validate(f) {
    setError('')
    if (!ACCEPTED.includes(f.type)) {
      setError('Unsupported format. Use MP4, WebM, MOV, MP3, WAV, or OGG.')
      return false
    }
    const isVideo = f.type.startsWith('video/')
    const limitMB = isVideo ? MAX_VIDEO_MB : MAX_AUDIO_MB
    if (f.size > limitMB * 1024 * 1024) {
      setError(isVideo
        ? `File too large. Max ${MAX_VIDEO_MB}MB for video.`
        : `File too large. Max ${MAX_AUDIO_MB}MB for audio (Groq Whisper limit).`
      )
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
            <p className="drop-title">Drop your video or audio</p>
            <p className="drop-sub">or click to browse · MP4, WebM, MOV, MP3, WAV · Video up to 500MB · Audio up to 25MB</p>
          </div>
        )}
      </div>

      {error && <p className="upload-error">{error}</p>}

      {file && file.type.startsWith('video/') && !done && (
        <video
          className="video-preview"
          src={URL.createObjectURL(file)}
          controls
        />
      )}
    </div>
  )
}
