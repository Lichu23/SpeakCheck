export default function Analysis({ data }) {
  return (
    <div className="analysis-wrapper">
      <div className="panel-header">
        <h2>🧑‍🏫 Native English</h2>
      </div>

      <div className="phrases-list">
        {data.phrases.map((item, i) => {
          const isPerfect = item.original.trim() === item.native.trim()
          return (
            <div key={i} className={`phrase-card ${isPerfect ? 'perfect' : ''}`}>
              <div className="phrase-row">
                <span className="phrase-label you">You said</span>
                <p className="phrase-original">{item.original}</p>
              </div>
              {!isPerfect && (
                <div className="phrase-row">
                  <span className="phrase-label native">Native</span>
                  <p className="phrase-native">{item.native}</p>
                </div>
              )}
              {item.note && (
                <p className="phrase-note">{isPerfect ? '✅ ' : '💡 '}{item.note}</p>
              )}
            </div>
          )
        })}
      </div>

      {data.overall && (
        <div className="overall-box">
          <p>{data.overall}</p>
        </div>
      )}
    </div>
  )
}
