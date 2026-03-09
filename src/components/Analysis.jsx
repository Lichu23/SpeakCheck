export default function Analysis({ data }) {
  const total = data.phrases.length
  const grammarErrors = data.phrases.filter(p => p.type === 'grammar').length
  const correct = total - grammarErrors
  const score = total > 0 ? Math.round((correct / total) * 100) : 100

  const level =
    score >= 90 ? { label: 'B2+', color: '#38a169' } :
    score >= 75 ? { label: 'B1',  color: '#3182ce' } :
    score >= 55 ? { label: 'A2',  color: '#d69e2e' } :
                  { label: 'A1',  color: '#e53e3e' }

  return (
    <div className="analysis-wrapper">
      <div className="panel-header">
        <h2>🧑‍🏫 Native English</h2>
      </div>

      {/* Score card */}
      <div className="score-card">
        <div className="score-left">
          <span className="score-number" style={{ color: level.color }}>{score}%</span>
          <span className="score-label">Grammar score</span>
        </div>
        <div className="score-right">
          <span className="score-level" style={{ background: level.color }}>{level.label}</span>
          <div className="score-bar-track">
            <div className="score-bar-fill" style={{ width: `${score}%`, background: level.color }} />
          </div>
          <p className="score-sub">{grammarErrors} grammar error{grammarErrors !== 1 ? 's' : ''} · {total - grammarErrors} correct</p>
        </div>
      </div>

      {/* Phrase cards */}
      <div className="phrases-list">
        {data.phrases.map((item, i) => {
          const isPerfect = item.type === 'perfect'
          const isGrammarError = item.type === 'grammar'
          const cardClass = isPerfect ? 'perfect' : isGrammarError ? 'grammar-error' : 'style-note'

          return (
            <div key={i} className={`phrase-card ${cardClass}`}>
              <div className="phrase-row">
                <span className="phrase-label you">You</span>
                <p className="phrase-original">{item.original}</p>
              </div>
              {!isPerfect && (
                <div className="phrase-row">
                  <span className="phrase-label native">Native</span>
                  <p className="phrase-native">{item.native}</p>
                </div>
              )}
              {item.note && (
                <p className="phrase-note">
                  {isPerfect ? '✅' : isGrammarError ? '🔴' : '🟡'} {item.note}
                </p>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}
