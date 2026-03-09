const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

export async function transcribeVideo(file) {
  if (!GROQ_API_KEY) throw new Error('Missing VITE_GROQ_API_KEY in .env')

  const formData = new FormData()
  formData.append('file', file)
  formData.append('model', 'whisper-large-v3')
  formData.append('response_format', 'text')
  formData.append('language', 'en')

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
    body: formData,
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || 'Transcription failed')
  }

  return await response.text()
}

export async function analyzeEnglish(transcription) {
  if (!GROQ_API_KEY) throw new Error('Missing VITE_GROQ_API_KEY in .env')

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a friendly English tutor. The user recorded themselves speaking English.
Break their speech into individual phrases or sentences and for each one provide the native, natural English version.

Return ONLY a JSON object in this exact format:
{
  "improved": "the full speech rewritten as one natural, native-sounding paragraph",
  "phrases": [
    {
      "original": "what the user said",
      "native": "how a native speaker would say it",
      "note": "short explanation of what changed and why (max 1 sentence)"
    }
  ],
  "overall": "2-3 sentence encouraging summary of their English level and main area to work on"
}

Rules:
- If a phrase is already perfect, still include it with native = original and note = "Perfect!"
- Focus on making it sound natural and native, not just grammatically correct
- Keep notes short and practical`,
        },
        {
          role: 'user',
          content: `Analyze this transcribed speech:\n\n"${transcription}"`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || 'Analysis failed')
  }

  const data = await response.json()
  return JSON.parse(data.choices[0].message.content)
}
