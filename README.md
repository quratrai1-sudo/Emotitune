# 🎵 EmotiTune — AI Emotion Song Generator

EmotiTune detects your emotion from text or voice, then generates song lyrics and plays real AI-composed music that matches your mood.

## Features

- 🎙️ **Voice or text input** — speak or type how you feel
- 🧠 **AI emotion detection** — powered by Hugging Face
- ✍️ **AI lyrics generation** — unique song written for your emotion
- 🎵 **Real music playback** — melody, chords, bass & drums via Tone.js
- 🎧 **7 emotions** — Joy, Sadness, Anger, Fear, Disgust, Surprise, Neutral
- 📋 Copy, download, or share your generated song

## Setup

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/ai-emotion-song.git
cd ai-emotion-song
```

### 2. Add your API key
```bash
cp config.example.js config.js
```
Open `config.js` and replace `hf_YOUR_TOKEN_HERE` with your free token from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).

### 3. Open in browser
Just open `index.html` in Chrome or Edge. No build step needed.

## Tech Stack

| Tool | Purpose |
|------|---------|
| Hugging Face Inference API | Emotion detection + lyrics generation |
| Tone.js | Real music synthesis (melody, chords, bass, drums) |
| Web Speech API | Voice input + lyrics narration |
| Vanilla JS / HTML / CSS | Frontend — no framework needed |

## Note

`config.js` is listed in `.gitignore` and will never be committed.  
Always use `config.example.js` as the template for others to follow.
