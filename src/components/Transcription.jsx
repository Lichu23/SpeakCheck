export default function Transcription({ text, improved }) {
  return (
    <div className="result-panel">
      <div className="panel-header">
        <h2>📝 Transcription</h2>
        <button className="copy-btn" onClick={() => navigator.clipboard.writeText(text)}>Copy</button>
      </div>

      <div className="transcription-block">
        <span className="block-label you">You said</span>
        <p className="transcription-text">{text}</p>
      </div>

      {improved && (
        <div className="transcription-block improved-block">
          <span className="block-label native">Improved</span>
          <p className="transcription-text improved-text">{improved}</p>
          <button
            className="copy-btn copy-improved"
            onClick={() => navigator.clipboard.writeText(improved)}
          >
            Copy
          </button>
        </div>
      )}
    </div>
  )
}
