import { useState, useEffect } from 'react'

// NEW COMPONENT: WordCounter
// Shows word count, character count, and reading time for a given text.

export default function WordCounter({ text = '' }) {
  const [showDetails, setShowDetails] = useState(false)
  const [stats, setStats] = useState({
    wordCount: 0,
    charCount: 0,
    charNoSpaces: 0,
    sentenceCount: 0,
    readingTime: 0,
  })

  useEffect(() => {
    const trimmed = text.trim()
    const wordCount = trimmed === '' ? 0 : trimmed.split(/\s+/).length
    const charCount = text.length
    const charNoSpaces = text.replace(/\s/g, '').length
    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
    const readingTime = Math.ceil(wordCount / 200)

    setStats({ wordCount, charCount, charNoSpaces, sentenceCount, readingTime })
  }, [text])

  const { wordCount, charCount, charNoSpaces, sentenceCount, readingTime } = stats

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 14, color: '#4a5568' }}>📊 Word Counter</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{ fontSize: 12, background: 'none', border: '1px solid #cbd5e0', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}
        >
          {showDetails ? 'Hide' : 'Details'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 24, marginTop: 10 }}>
        <Stat label="Words" value={wordCount} />
        <Stat label="Sentences" value={sentenceCount} />
        <Stat label="Characters" value={charCount} />
        <Stat label="Reading time" value={`${readingTime} min`} />
      </div>

      {showDetails && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#718096', borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
          <p>Chars (no spaces): {charNoSpaces}</p>
          <p>Avg word length: {wordCount > 0 ? (charNoSpaces / wordCount).toFixed(1) : 0} chars</p>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#2d3748' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#a0aec0', textTransform: 'uppercase' }}>{label}</div>
    </div>
  )
}
