import { useState } from 'react'
import VideoUploader from './components/VideoUploader'
import Transcription from './components/Transcription'
import Analysis from './components/Analysis'
import { transcribeVideo, analyzeEnglish } from './services/groq'

export default function App() {
  const [file, setFile] = useState(null)
  const [transcription, setTranscription] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [step, setStep] = useState('idle') // idle | transcribing | analyzing | done
  const [error, setError] = useState('')

  function handleFileSelect(f) {
    setFile(f)
    setTranscription('')
    setAnalysis('')
    setStep('idle')
    setError('')
  }

  async function handleAnalyze() {
    if (!file) return
    setError('')
    setTranscription('')
    setAnalysis('')

    try {
      setStep('transcribing')
      const text = await transcribeVideo(file)
      setTranscription(text)

      setStep('analyzing')
      const feedback = await analyzeEnglish(text)
      setAnalysis(feedback)

      setStep('done')
    } catch (err) {
      setError(err.message)
      setStep('idle')
    }
  }

  const isLoading = step === 'transcribing' || step === 'analyzing'

  return (
    <div className="app">
      <header className="header">
        <h1>🎙️ SpeakCheck</h1>
        <p>Upload a video or audio recording — get your transcription and English feedback instantly.</p>
      </header>

      <main className="main">
        <VideoUploader file={file} onFileSelect={handleFileSelect} done={step === 'done'} isLoading={isLoading} step={step} />

        {file && !isLoading && step !== 'done' && (
          <button
            className="analyze-btn"
            onClick={handleAnalyze}
          >
            🚀 Transcribe & Analyze
          </button>
        )}

        {error && (
          <div className="error-box">
            <strong>Error:</strong> {error}
          </div>
        )}

        {step === 'done' && transcription && analysis && (
          <div className="results">
            <Transcription text={transcription} improved={analysis.improved} />
            <Analysis data={analysis} />
          </div>
        )}
      </main>
    </div>
  )
}
