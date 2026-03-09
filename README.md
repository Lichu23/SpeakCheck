# SpeakCheck

> Record yourself, speak better.

SpeakNative transcribes your speaking videos and gives you instant native English feedback — showing you not just what's wrong, but exactly how a native speaker would say it.

---

## How it works

1. **Upload** a video or audio recording of yourself speaking English
2. **Click "Transcribe & Analyze"**
3. Get two results side by side:
   - **Transcription panel** — what you said, plus the full improved version as one clean paragraph
   - **Analysis panel** — each phrase broken down with the native alternative and a short explanation
4. **Copy** the improved text and practice saying it the right way

---

## Stack

- **React + Vite** — frontend
- **Groq Whisper** (`whisper-large-v3`) — fast and accurate transcription
- **Groq LLM** (`llama-3.3-70b-versatile`) — English analysis and corrections

---

## Getting started

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd English
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up your API key

Create a `.env` file in the root:

```bash
cp .env.example .env
```

Then open `.env` and add your Groq API key:

```
VITE_GROQ_API_KEY=your_groq_api_key_here
```

Get a free API key at [console.groq.com](https://console.groq.com).

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Supported formats

| Type  | Formats                    |
|-------|----------------------------|
| Video | MP4, WebM, MOV             |
| Audio | MP3, WAV, M4A, OGG         |

**Max file size: 25MB** (Groq Whisper limit)

---

## Project structure

```
src/
├── components/
│   ├── VideoUploader.jsx   # Drag & drop file input + video preview
│   ├── Transcription.jsx   # Original text + improved full paragraph
│   └── Analysis.jsx        # Phrase-by-phrase native corrections
├── services/
│   └── groq.js             # Whisper transcription + LLM analysis
├── App.jsx
└── index.css
```
