import { useState, useEffect } from 'react'

// Componente sin dependency array — el useEffect corre en CADA render
export default function RenderLogger() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    console.log('Component rendered! Count is:', count)
    // Sin [] al final → corre después de cada render
  })

  return (
    <div style={{ marginTop: 24, padding: 16, border: '1px dashed #f6ad55', borderRadius: 8, textAlign: 'center' }}>
      <p style={{ margin: '0 0 8px', fontSize: 13, color: '#718096' }}>
        Render counter (open the console to see the useEffect firing)
      </p>
      <span style={{ fontSize: 32, fontWeight: 700, color: '#dd6b20' }}>{count}</span>
      <br />
      <button
        onClick={() => setCount(c => c + 1)}
        style={{ marginTop: 10, padding: '6px 16px', borderRadius: 6, border: 'none', background: '#ed8936', color: '#fff', cursor: 'pointer', fontSize: 13 }}
      >
        Click me
      </button>
    </div>
  )
}
