
// Extracts audio from a video file.
// Returns an Opus/OGG file (~8× smaller than WAV) if WebCodecs is available,
// otherwise falls back to a 16kHz mono WAV blob.
async function extractAudio(videoFile) {
  console.log('[extractAudio] Starting — input:', videoFile.name, `(${(videoFile.size / 1024 / 1024).toFixed(2)} MB, ${videoFile.type})`)

  const arrayBuffer = await videoFile.arrayBuffer()
  console.log('[extractAudio] File read as ArrayBuffer')

  const audioCtx = new AudioContext()
  const decoded = await audioCtx.decodeAudioData(arrayBuffer)
  await audioCtx.close()
  console.log(`[extractAudio] Decoded — duration: ${decoded.duration.toFixed(1)}s, channels: ${decoded.numberOfChannels}, sample rate: ${decoded.sampleRate}Hz`)

  const targetSampleRate = 16000
  const offlineCtx = new OfflineAudioContext(1, decoded.duration * targetSampleRate, targetSampleRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = decoded
  source.connect(offlineCtx.destination)
  source.start()
  const resampled = await offlineCtx.startRendering()
  console.log(`[extractAudio] Resampled to 16kHz mono — samples: ${resampled.length}`)

  if (typeof AudioEncoder !== 'undefined') {
    try {
      console.log('[extractAudio] Encoding to Opus/OGG...')
      const oggBlob = await encodeOpusOgg(resampled)
      const oggFile = new File([oggBlob], 'audio.ogg', { type: 'audio/ogg' })
      console.log(`[extractAudio] OGG ready — size: ${(oggFile.size / 1024 / 1024).toFixed(2)} MB`)
      return oggFile
    } catch (e) {
      console.warn('[extractAudio] Opus encoding failed, falling back to WAV:', e)
    }
  } else {
    console.log('[extractAudio] AudioEncoder unavailable, falling back to WAV')
  }

  const wavFile = new File([audioBufferToWav(resampled)], 'audio.wav', { type: 'audio/wav' })
  console.log(`[extractAudio] WAV ready — size: ${(wavFile.size / 1024 / 1024).toFixed(2)} MB`)
  return wavFile
}

async function encodeOpusOgg(audioBuffer) {
  const samples = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate  // 16000
  const frameSize = 960  // 60ms at 16kHz
  const packets = []

  await new Promise((resolve, reject) => {
    const encoder = new AudioEncoder({
      output: (chunk) => {
        const data = new Uint8Array(chunk.byteLength)
        chunk.copyTo(data)
        packets.push(data)
      },
      error: reject,
    })

    encoder.configure({ codec: 'opus', sampleRate, numberOfChannels: 1, bitrate: 32000 })

    for (let offset = 0; offset < samples.length; offset += frameSize) {
      const frameData = new Float32Array(frameSize)
      frameData.set(samples.subarray(offset, offset + frameSize))
      const audioData = new AudioData({
        format: 'f32-planar',
        sampleRate,
        numberOfChannels: 1,
        numberOfFrames: frameSize,
        timestamp: Math.round((offset / sampleRate) * 1e6),
        data: frameData,
      })
      encoder.encode(audioData)
      audioData.close()
    }

    encoder.flush().then(resolve).catch(reject)
  })

  console.log(`[encodeOpusOgg] Encoded ${packets.length} Opus packets`)
  return buildOgg(packets, sampleRate, 312)
}

function buildOgg(packets, inputSampleRate, preSkip) {
  const serial = (Math.random() * 0xFFFFFFFF) >>> 0
  const pages = []

  // Page 1 (BOS): OpusHead
  const opusHead = new Uint8Array(19)
  const headView = new DataView(opusHead.buffer)
  for (let i = 0; i < 8; i++) opusHead[i] = 'OpusHead'.charCodeAt(i)
  headView.setUint8(8, 1)                         // version
  headView.setUint8(9, 1)                         // channels
  headView.setUint16(10, preSkip, true)            // pre-skip
  headView.setUint32(12, inputSampleRate, true)    // input sample rate
  headView.setUint16(16, 0, true)                  // output gain
  headView.setUint8(18, 0)                         // channel mapping family
  pages.push(oggPage(opusHead, 0x02, 0, serial, 0))

  // Page 2: OpusTags
  const vendor = 'WebCodecs'
  const opusTags = new Uint8Array(8 + 4 + vendor.length + 4)
  const tagsView = new DataView(opusTags.buffer)
  for (let i = 0; i < 8; i++) opusTags[i] = 'OpusTags'.charCodeAt(i)
  tagsView.setUint32(8, vendor.length, true)
  for (let i = 0; i < vendor.length; i++) opusTags[12 + i] = vendor.charCodeAt(i)
  tagsView.setUint32(12 + vendor.length, 0, true)  // zero user comments
  pages.push(oggPage(opusTags, 0x00, 0, serial, 1))

  // Pages 3+: one Opus packet per page
  const samplesPerFrame = 2880  // 60ms at 48kHz (Opus granule clock)
  for (let i = 0; i < packets.length; i++) {
    const granule = (i + 1) * samplesPerFrame - preSkip
    const headerType = i === packets.length - 1 ? 0x04 : 0x00  // EOS on last page
    pages.push(oggPage(packets[i], headerType, granule, serial, i + 2))
  }

  const totalSize = pages.reduce((sum, p) => sum + p.length, 0)
  const result = new Uint8Array(totalSize)
  let offset = 0
  for (const page of pages) { result.set(page, offset); offset += page.length }

  return new Blob([result], { type: 'audio/ogg' })
}

function oggPage(data, headerType, granule, serial, seq) {
  // Build lacing table (segments of max 255 bytes each)
  const segments = []
  let rem = data.length
  while (rem >= 255) { segments.push(255); rem -= 255 }
  segments.push(rem)  // terminating segment (0 if packet length is multiple of 255)

  const headerSize = 27 + segments.length
  const page = new Uint8Array(headerSize + data.length)
  const view = new DataView(page.buffer)

  // Capture pattern "OggS"
  page[0] = 0x4F; page[1] = 0x67; page[2] = 0x67; page[3] = 0x53
  view.setUint8(4, 0)               // stream structure version
  view.setUint8(5, headerType)
  view.setUint32(6, granule >>> 0, true)   // granule position low 32 bits
  view.setUint32(10, 0, true)              // granule position high 32 bits
  view.setUint32(14, serial, true)
  view.setUint32(18, seq, true)
  view.setUint32(22, 0, true)       // CRC placeholder
  view.setUint8(26, segments.length)
  for (let i = 0; i < segments.length; i++) page[27 + i] = segments[i]
  page.set(data, headerSize)

  view.setUint32(22, crc32ogg(page), true)
  return page
}

// OGG CRC-32: polynomial 0x04C11DB7, MSB-first, init=0, no final XOR
function crc32ogg(data) {
  let crc = 0
  for (let i = 0; i < data.length; i++) {
    crc = (crc ^ ((data[i] & 0xFF) << 24)) >>> 0
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x80000000
        ? ((crc << 1) >>> 0) ^ 0x04C11DB7
        : (crc << 1) >>> 0
    }
  }
  return crc
}

function audioBufferToWav(buffer) {
  const samples = buffer.getChannelData(0)
  const dataSize = samples.length * 2
  const ab = new ArrayBuffer(44 + dataSize)
  const view = new DataView(ab)

  const write = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)) }
  write(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true)
  write(8, 'WAVE'); write(12, 'fmt ')
  view.setUint32(16, 16, true); view.setUint16(20, 1, true)  // PCM
  view.setUint16(22, 1, true)                                 // mono
  view.setUint32(24, buffer.sampleRate, true)
  view.setUint32(28, buffer.sampleRate * 2, true)
  view.setUint16(32, 2, true); view.setUint16(34, 16, true)
  write(36, 'data'); view.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
    offset += 2
  }

  return new Blob([ab], { type: 'audio/wav' })
}

function fixTranscription(text) {
  return text
    // Capitalize I before apostrophe: i'm → I'm, i've → I've, i'll → I'll, i'd → I'd
    // covers both ASCII apostrophe (') and Unicode right single quote (\u2019)
    .replace(/\bi(?=['\u2019])/g, 'I')
    // Capitalize standalone I
    .replace(/\bi\b/g, 'I')
    // Capitalize first letter after sentence-ending punctuation (. ! ?)
    .replace(/(^|[.!?]\s+)([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase())
    // Capitalize the very first character of the transcription
    .replace(/^([a-z])/, ch => ch.toUpperCase())
    .trim()
}

export async function transcribeVideo(file) {
  console.log('[transcribeVideo] File received:', file.name, file.type)

  const isVideo = file.type.startsWith('video/')
  const audioFile = isVideo ? await extractAudio(file) : file
  if (!isVideo) console.log('[transcribeVideo] Audio file — skipping extraction, sending directly')

  console.log('[transcribeVideo] Sending to Groq Whisper...')
  const formData = new FormData()
  formData.append('file', audioFile)
  formData.append('model', 'whisper-large-v3')
  formData.append('response_format', 'text')
  formData.append('language', 'en')
  formData.append('prompt', 'This is spoken English. Transcribe with proper capitalization and punctuation. The pronoun "I" must always be capitalized. Example: "I\'m going to the store. I think it\'s great."')

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text()
    console.error('[transcribeVideo] error:', text)
    let message = 'Transcription failed'
    try { message = JSON.parse(text).error?.message || message } catch {}
    throw new Error(message)
  }

  const raw = await response.text()
  const text = fixTranscription(raw)
  console.log('[transcribeVideo] Transcription received:', text.slice(0, 100) + (text.length > 100 ? '...' : ''))
  return text
}

export async function analyzeEnglish(transcription) {
  console.log('[analyzeEnglish] Sending transcription to Groq LLaMA...')
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a friendly English tutor. The user recorded themselves SPEAKING English — this is a speech transcription, not written text. Spoken English has different norms than written English.

Break their speech into meaningful phrases or sentences and for each one provide the native, natural spoken English version.

Return ONLY a JSON object in this exact format:
{
  "improved": "the full speech rewritten as one natural, native-sounding paragraph",
  "phrases": [
    {
      "original": "what the user said",
      "native": "how a native speaker would say it",
      "note": "short explanation of what changed and why (max 1 sentence)",
      "type": "grammar"
    }
  ],
  "overall": "2-3 sentence encouraging summary of their English level and main area to work on"
}

Rules:
- SKIP filler words and filler-only phrases entirely — do NOT include phrases that are only: um, uh, like, you know, I mean, well, so, right, okay (when used as filler)
- SKIP false starts and self-corrections (e.g. "I... I went") — these are normal in spoken English
- Do NOT push toward formal written English — keep corrections natural for casual speech
- Set type = "grammar" ONLY for mistakes a native speaker would NEVER make in casual speech: wrong tense ("I go yesterday"), wrong verb form ("he don't"), subject-verb disagreement ("they was"), missing/wrong article that sounds clearly wrong, wrong preposition that changes meaning
- Set type = "style" if the phrase is grammatically correct but could sound more natural or fluent
- Set type = "perfect" if no change is needed (native = original, note = "Perfect!")
- Do NOT flag informal contractions like "gonna", "wanna", "kinda" — these are normal in speech
- Do NOT flag sentence fragments — they are common in spoken English
- Do NOT flag capitalization or punctuation — this is a transcription, the user was SPEAKING, not writing
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
    const text = await response.text()
    console.error('[analyzeEnglish] error:', text)
    let message = 'Analysis failed'
    try { message = JSON.parse(text).error?.message || message } catch {}
    throw new Error(message)
  }

  const data = await response.json()
  const result = JSON.parse(data.choices[0].message.content)
  console.log('[analyzeEnglish] Analysis received — phrases:', result.phrases?.length)
  return result
}
