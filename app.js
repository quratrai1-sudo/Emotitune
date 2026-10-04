// EmotiTune — AI Emotion Song Generator
// Groq API (free) + Tone.js music + Web Speech

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama3-8b-8192";

// ── Selected language / genre / script ───────
let selectedLang   = "English";
let selectedGenre  = "Pop";
let selectedScript = "roman"; // "roman" | "native"

function selectChip(type, btn) {
  const container = type === "lang" ? document.getElementById("langChips") : document.getElementById("genreChips");
  container.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
  btn.classList.add("active");
  if (type === "lang") {
    selectedLang = btn.dataset.value;
    // Show native script toggle for non-English languages
    const needsScript = ["Hindi","Urdu","Punjabi","Roman Urdu"].includes(selectedLang);
    document.getElementById("scriptToggle").style.display = needsScript ? "flex" : "none";
  } else {
    selectedGenre = btn.dataset.value;
  }
}

function selectScript(btn) {
  document.querySelectorAll("#scriptToggle .chip").forEach(c => c.classList.remove("active"));
  btn.classList.add("active");
  selectedScript = btn.dataset.value;
}

// ── Emotion metadata ──────────────────────────
const EMOTION_META = {
  joy:        { emoji:"😊", genre:"upbeat pop",         spotifyQuery:"happy uplifting feel good",       titles:["Sunshine in My Veins","Golden Days","Light Up the World","Happy Place"] },
  sadness:    { emoji:"😢", genre:"melancholic indie",   spotifyQuery:"sad emotional heartbreak",        titles:["Tears in the Rain","Empty Hallways","Fading Light","The Weight of Goodbye"] },
  anger:      { emoji:"😠", genre:"intense rock",        spotifyQuery:"angry intense powerful rock",     titles:["Burning Bridges","Rage & Fire","Shattered Glass","Storm Inside"] },
  fear:       { emoji:"😨", genre:"atmospheric dark",    spotifyQuery:"dark ambient anxious atmospheric", titles:["Shadows Follow Me","The Unknown","Trembling Walls","Into the Dark"] },
  disgust:    { emoji:"🤢", genre:"alternative grunge",  spotifyQuery:"raw alternative grunge heavy",    titles:["Rotten Roots","Bitter Taste","Filth & Fury","Hollow Disgust"] },
  surprise:   { emoji:"😲", genre:"energetic electronic",spotifyQuery:"surprising unexpected energetic",  titles:["Out of Nowhere","Plot Twist","Electric Shock","Unbelievable"] },
  neutral:    { emoji:"😐", genre:"lo-fi chill",         spotifyQuery:"chill lofi calm background",      titles:["Still Waters","Quiet Hours","The In-Between","Steady Pulse"] },
  love:       { emoji:"❤️", genre:"romantic pop",        spotifyQuery:"love romantic tender",            titles:["Heart on Fire","Yours Always","Love in Every Breath","Close to You"] },
  loneliness: { emoji:"🌑", genre:"melancholic indie",   spotifyQuery:"lonely alone empty night",        titles:["Empty Room","No One Left","Echoes of You","Alone Again"] },
  hope:       { emoji:"🌅", genre:"uplifting indie",     spotifyQuery:"hope uplifting inspiring rise",   titles:["New Dawn","Rising Again","One More Day","The Light Ahead"] },
  calm:       { emoji:"🌊", genre:"lo-fi chill",         spotifyQuery:"calm peaceful serene ambient",    titles:["Still Horizon","Breathe Easy","Gentle Current","Quiet Mind"] },
  nostalgia:  { emoji:"🍂", genre:"acoustic indie",      spotifyQuery:"nostalgic memories bittersweet",  titles:["Old Photographs","Days Gone By","Remember When","Faded Gold"] },
};

// ── Music profiles (Tone.js) ──────────────────
const MUSIC_PROFILES = {
  joy:     { bpm:118, chords:[["C4","E4","G4"],["A3","C4","E4"],["F3","A3","C4"],["G3","B3","D4"]], bassNotes:["C2","A2","F2","G2"], melody:["E5","G5","A5","G5","E5","C5","D5","E5","G4","A4","C5","E5"], drum:{kick:[0,8],snare:[4,12],hihat:[0,2,4,6,8,10,12,14]}, synth:"triangle", rev:0.15, del:0.1 },
  sadness: { bpm:58,  chords:[["A3","C4","E4"],["F3","A3","C4"],["C3","E3","G3"],["G3","B3","D4"]], bassNotes:["A2","F2","C2","G2"], melody:["A4","G4","E4","D4","C4","A3","C4","D4","E4","G4","A4","G4"], drum:{kick:[0],snare:[8],hihat:[0,4,8,12]},          synth:"sine",     rev:0.6,  del:0.35 },
  anger:   { bpm:148, chords:[["E2","G2","B2"],["D2","F2","A2"],["C2","E2","G2"],["B1","D2","F2"]], bassNotes:["E1","D1","C1","B0"], melody:["E4","E4","G4","E4","D4","E4","G4","A4","E4","D4","C4","B3"], drum:{kick:[0,2,4,6,8,10,12,14],snare:[4,12],hihat:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]}, synth:"sawtooth", rev:0.1, del:0.05 },
  fear:    { bpm:72,  chords:[["D3","F3","Ab3"],["Eb3","G3","Bb3"],["C3","Eb3","Gb3"],["B2","D3","F3"]], bassNotes:["D2","Eb2","C2","B1"], melody:["Ab4","F4","Eb4","D4","F4","Ab4","Bb4","Ab4","F4","Eb4","D4","C4"], drum:{kick:[0,6,10],snare:[8],hihat:[0,2,4,6,8,10,12]}, synth:"sine", rev:0.75, del:0.5 },
  disgust: { bpm:90,  chords:[["C2","Eb2","G2"],["Bb1","D2","F2"],["Ab1","C2","Eb2"],["G1","B1","D2"]], bassNotes:["C1","Bb1","Ab1","G1"], melody:["Eb4","C4","Bb3","Ab3","G3","F3","Eb3","C3","Eb3","F3","G3","Bb3"], drum:{kick:[0,4,8,10],snare:[4,12],hihat:[0,2,4,6,8,10,12,14]}, synth:"sawtooth", rev:0.2, del:0.15 },
  surprise:{ bpm:132, chords:[["G3","B3","D4"],["D3","F#3","A3"],["E3","G3","B3"],["C3","E3","G3"]], bassNotes:["G2","D2","E2","C2"], melody:["G5","F#5","E5","D5","G5","A5","B5","G5","E5","D5","C5","B4"], drum:{kick:[0,3,8,11],snare:[4,12],hihat:[0,2,4,6,8,10,12,14]}, synth:"triangle", rev:0.2, del:0.2 },
  neutral: { bpm:80,  chords:[["F3","A3","C4"],["C3","E3","G3"],["D3","F3","A3"],["Bb2","D3","F3"]], bassNotes:["F2","C2","D2","Bb1"], melody:["F4","E4","D4","C4","A3","Bb3","C4","D4","F4","E4","D4","C4"], drum:{kick:[0,8],snare:[4,12],hihat:[0,2,4,6,8,10,12,14]}, synth:"sine", rev:0.4, del:0.25 },
};

// ── Player state ──────────────────────────────
let playerState = { isPlaying:false, progress:0, interval:null, duration:0, currentEmotion:"neutral" };
let currentUtterance = null;
let toneStarted = false;
let instruments = null;
let sequences   = [];
let toneLoop    = null;

// ── Voice input state ─────────────────────────
let recognition = null;
let isListening  = false;

function getApiKey() {
  if (typeof CONFIG !== "undefined") {
    return CONFIG.HF_API_KEY || CONFIG.GROQ_API_KEY || null;
  }
  return null;
}

// ── Init ──────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const textarea = document.getElementById("emotionInput");
  textarea.addEventListener("input", () => {
    document.getElementById("charCount").textContent = `${textarea.value.length} / 500`;
  });
  textarea.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "Enter") generateSong();
  });

  // Beat volume slider
  document.getElementById("beatSlider")?.addEventListener("input", () => {
    if (beatBus) try { beatBus.gain.rampTo(document.getElementById("beatSlider").value / 100, 0.1); } catch(e){}
  });

  // Vocal volume slider
  document.getElementById("vocalSlider")?.addEventListener("input", () => {
    // Vocal volume controls speech synthesis volume (applied on next syllable)
    // and melody bus
    if (melodBus) try { melodBus.gain.rampTo((document.getElementById("vocalSlider").value / 100) * 0.7, 0.1); } catch(e){}
  });

  // Legacy volumeSlider still wired (beatSlider replaces it but keep for compat)
  document.getElementById("volumeSlider")?.addEventListener("input", () => {
    const vol = (document.getElementById("volumeSlider")?.value || 70) / 100;
    try { Tone.getDestination().volume.rampTo(Tone.gainToDb(vol * 0.85), 0.1); } catch(e){}
  });
});

// ── Generate song ─────────────────────────────
async function generateSong() {
  const input = document.getElementById("emotionInput").value.trim();
  if (!input || input.length < 5) { showToast("✍️ Please write a bit more about your feelings."); return; }
  const apiKey = getApiKey();
  if (!apiKey) { showToast("⚠️ API key missing. Check config.js"); return; }
  document.getElementById("generateBtn").disabled = true;
  document.getElementById("resultSection").style.display = "none";
  document.getElementById("loadingSection").style.display = "block";
  try {
    setStep(1);
    const emotion = await detectEmotion(input, apiKey);

    // Too short
    if (emotion.tooShort) {
      showToast("💬 Tell me a bit more — at least 3 words.");
      document.getElementById("loadingSection").style.display = "none";
      document.getElementById("emotionInput").focus();
      document.getElementById("generateBtn").disabled = false;
      return;
    }

    // Low confidence — ask user to confirm
    if (emotion.lowConf) {
      document.getElementById("loadingSection").style.display = "none";
      document.getElementById("generateBtn").disabled = false;
      const confirmed = await showEmotionConfirm(emotion);
      if (!confirmed) return;
      // Re-show loading for lyrics step
      document.getElementById("generateBtn").disabled = true;
      document.getElementById("loadingSection").style.display = "block";
    }

    setStep(2);
    document.getElementById("loadingText").textContent = "Writing your lyrics...";
    const songData = await generateLyrics(input, emotion, apiKey);
    setStep(3);
    await sleep(500);
    displayResults(emotion, songData, input);
  } catch (err) {
    console.error(err);
    showToast("❌ " + (err.message || "Something went wrong."));
    document.getElementById("loadingSection").style.display = "none";
  } finally {
    document.getElementById("generateBtn").disabled = false;
  }
}

let currentStep = 0;
function setStep(step) {
  currentStep = step;
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`step${i}`);
    el.className = i < step ? "step done" : i === step ? "step active" : "step";
  }
  const texts = ["Detecting your emotion...","Writing your lyrics...","Composing your song..."];
  document.getElementById("loadingText").textContent = texts[step - 1];
}

// ── Multilingual keyword dictionary ──────────
const KEYWORD_DICT = {
  joy:        ["happy","joy","joyful","excited","glad","cheerful","wonderful","amazing","great","awesome","smile","laugh","delight","bliss","khush","khushi","mast","zindagi","anand","prasann","harakh"],
  sadness:    ["sad","cry","tears","depressed","lonely","heartbreak","miss","lost","empty","pain","hurt","grief","broken","hopeless","udaas","dukh","dard","rona","aansu","tanha","gham","zakhm","bichad"],
  anger:      ["angry","rage","furious","hate","frustrated","annoyed","mad","irritated","livid","outraged","explode","gussa","krodh","naraaz","khafa","jalana","nafrat"],
  fear:       ["scared","fear","terrified","anxious","panic","nervous","worried","afraid","dread","horror","darr","darr gaya","khauf","wehshat","ghabraya","fitrat"],
  love:       ["love","adore","beloved","heart","darling","romantic","affection","crush","pyaar","mohabbat","ishq","dil","dilruba","chahna","aashiq","preet","wafa"],
  loneliness: ["lonely","alone","isolated","nobody","abandoned","forgotten","silence","void","tanha","akela","akelapan","koi nahi","judai","dur","duri","bhool"],
  hope:       ["hope","better","tomorrow","dream","believe","rise","strength","faith","ummeed","aas","vishwas","naya","subah","roshni","himmat","umang","nayi"],
  calm:       ["calm","peace","quiet","serene","still","relax","breathe","tranquil","sukoon","chain","aram","shaant","shukar","itminan","raahat"],
  nostalgia:  ["remember","memories","past","old","childhood","miss","yesterday","used to","yaad","yaadein","purana","purani","bachpan","waqt","guzra","beet gaya"],
  disgust:    ["disgusted","gross","sick","awful","horrible","terrible","nasty","repulsed","nafrat","ghinauna","bura","bekar","zaleel"],
  surprise:   ["surprised","shocked","unexpected","wow","omg","sudden","astonished","stunned","achanak","hairan","ajeeb","sach mein"],
  neutral:    [],
};

const ALL_EMOTIONS = Object.keys(KEYWORD_DICT);

// ── Keyword scoring (local) ───────────────────
function keywordScore(text) {
  const t = text.toLowerCase();
  const raw = {};
  let total = 0;
  for (const [emo, words] of Object.entries(KEYWORD_DICT)) {
    const count = words.filter(w => t.includes(w)).length;
    raw[emo] = count;
    total += count;
  }
  // Normalise to probabilities
  const probs = {};
  const base  = 1 / ALL_EMOTIONS.length; // uniform prior
  for (const emo of ALL_EMOTIONS) {
    probs[emo] = total > 0 ? (raw[emo] / total) : base;
  }
  return probs;
}

// ── AI emotion scoring via Groq ───────────────
async function detectEmotion(text, apiKey) {
  // Require at least 3 words
  if (text.trim().split(/\s+/).length < 3) {
    return { tooShort: true };
  }

  const kw = keywordScore(text);
  let aiProbs = null;

  if (apiKey) {
    try {
      const res = await fetch(GROQ_API, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            {
              role: "system",
              content: `You are an emotion classifier. Given text, return a JSON object with probability scores (0-1) for ALL of these emotions that sum to exactly 1.0:
joy, sadness, anger, fear, disgust, surprise, neutral, love, loneliness, hope, calm, nostalgia.
Respond ONLY with valid JSON like: {"joy":0.05,"sadness":0.45,"anger":0.02,"fear":0.03,"disgust":0.01,"surprise":0.02,"neutral":0.05,"love":0.03,"loneliness":0.25,"hope":0.04,"calm":0.03,"nostalgia":0.02}`
            },
            { role: "user", content: `Classify emotions in: "${text}"` }
          ],
          temperature: 0.1,
          max_tokens: 120,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const raw  = data.choices[0].message.content.trim();
        const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]);
        // Normalise in case model doesn't sum to exactly 1
        let sum = Object.values(parsed).reduce((a, b) => a + b, 0);
        if (sum > 0) {
          aiProbs = {};
          for (const [k, v] of Object.entries(parsed)) {
            aiProbs[k.toLowerCase()] = v / sum;
          }
        }
      }
    } catch (e) {
      console.warn("Groq emotion failed:", e.message);
    }
  }

  // Combine: 70% AI + 30% keyword (or 100% keyword if AI failed)
  const combined = {};
  for (const emo of ALL_EMOTIONS) {
    const ai  = aiProbs ? (aiProbs[emo] || 0) : null;
    const kwv = kw[emo] || 0;
    combined[emo] = ai !== null ? (0.7 * ai + 0.3 * kwv) : kwv;
  }

  // Sort descending
  const sorted = Object.entries(combined)
    .sort((a, b) => b[1] - a[1])
    .map(([name, score]) => ({ name, score }));

  const top  = sorted[0];
  const top2 = sorted[1];

  return {
    name:     top.name,
    score:    top.score,
    meta:     EMOTION_META[top.name] || EMOTION_META.neutral,
    all:      sorted,          // all 12 sorted by score
    top3:     sorted.slice(0, 3),
    lowConf:  top.score < 0.60,
    second:   top2,
  };
}

// ── Lyrics generation via Groq ────────────────
async function generateLyrics(userText, emotion, apiKey) {
  const lang        = selectedLang;
  const genre       = selectedGenre;
  const script      = selectedScript;
  const emotionName = emotion.name;

  const structureGuide = {
    "Bollywood":      "Write in Bollywood style: Mukhda (catchy hook), Antara 1 (verse), Mukhda, Antara 2, Mukhda.",
    "Sufi":           "Write in Sufi/Qawwali style: repeated devotional refrain, two verses with spiritual imagery, closing couplet.",
    "Hip-Hop":        "Write in Hip-Hop style: Verse 1 (8 lines with internal rhyme), Hook (4 lines), Verse 2 (8 lines), Hook, Bridge, Hook.",
    "Pakistani Pop":  "Write in Pakistani Pop / Coke Studio style: Verse 1, Chorus, Verse 2, Chorus, Bridge, Chorus. Mix poetic Urdu/Roman Urdu with English.",
    "Acoustic Indie": "Write in Acoustic Indie style: Verse 1, Pre-Chorus, Chorus, Verse 2, Pre-Chorus, Chorus, Bridge, Chorus.",
    "Lo-fi":          "Write in Lo-fi style: short Verse 1, Hook, Verse 2, Hook, Outro. Keep it minimal and dreamy.",
    "Pop":            "Write in Pop style: Verse 1, Pre-Chorus, Chorus, Verse 2, Pre-Chorus, Chorus, Bridge, Final Chorus.",
  };

  const langGuide = {
    "English":    "Write entirely in English.",
    "Hindi":      script === "native" ? "Write in Hindi Devanagari script." : "Write in Roman Hindi (Hinglish), mixing natural English words.",
    "Urdu":       script === "native" ? "Write in Urdu Nastaliq script." : "Write in Roman Urdu, mixing natural English words.",
    "Punjabi":    script === "native" ? "Write in Punjabi Gurmukhi script." : "Write in Roman Punjabi.",
    "Roman Urdu": "Write in Roman Urdu / Hinglish — Urdu words in Roman letters mixed naturally with English.",
  };

  const prompt = `You are a professional songwriter. Write ORIGINAL song lyrics. Never copy existing songs.

Emotion: ${emotionName}
The person feels: "${userText}"
Genre: ${genre}
Language: ${lang}

${structureGuide[genre] || structureGuide["Pop"]}
${langGuide[lang] || langGuide["English"]}

Rules:
- Label each section clearly like [Verse 1], [Chorus], [Bridge] etc.
- Write 4 lines per section minimum.
- Make the lyrics deeply emotional and personal to "${userText}".
- Do NOT add any explanation or commentary. Output ONLY the song lyrics.`;

  if (!apiKey) return buildLocalSongData(emotionName, lang, genre);

  try {
    const res = await fetch(GROQ_API, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: "You are a professional songwriter. Output ONLY song lyrics with section labels like [Verse 1], [Chorus], [Bridge]. No JSON. No explanations. Just lyrics." },
          { role: "user",   content: prompt }
        ],
        temperature: 0.9,
        max_tokens: 900,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.warn("Groq lyrics HTTP error:", res.status, errBody);
      throw new Error(`Groq ${res.status}`);
    }

    const data    = await res.json();
    const rawText = data.choices?.[0]?.message?.content?.trim() || "";

    if (!rawText || rawText.length < 60) throw new Error("Empty response from Groq");

    // Parse plain-text lyrics into sections
    return parsePlainLyrics(rawText, emotionName, lang, genre);

  } catch (e) {
    console.warn("Groq lyrics failed, using local fallback:", e.message);
    return buildLocalSongData(emotionName, lang, genre);
  }
}

// Parse plain lyrics text (with [Section] labels) into songData object
function parsePlainLyrics(text, emotionName, lang, genre) {
  // Clean up any markdown code fences or JSON artifacts
  const clean = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`/g, "")
    .trim();

  const sections = [];
  // Split on section headers like [Verse 1], [Chorus] etc.
  const parts = clean.split(/\n(?=\[)/);

  parts.forEach(part => {
    const headerMatch = part.match(/^\[([^\]]+)\]/);
    if (headerMatch) {
      const type  = headerMatch[1].trim();
      const body  = part.replace(/^\[[^\]]+\]\s*\n?/, "").trim();
      const lines = body.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length > 0) {
        sections.push({ type, lines });
      }
    }
  });

  // If no sections found (model didn't use labels), treat whole text as one block
  if (sections.length === 0) {
    const lines = clean.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    const chunkSize = 4;
    const sectionNames = ["Verse 1","Chorus","Verse 2","Chorus","Bridge","Chorus"];
    for (let i = 0; i < lines.length; i += chunkSize) {
      sections.push({
        type:  sectionNames[Math.floor(i / chunkSize)] || `Section ${Math.floor(i / chunkSize) + 1}`,
        lines: lines.slice(i, i + chunkSize),
      });
    }
  }

  return {
    title:      null,
    emotion:    emotionName,
    confidence: 0.9,
    language:   lang,
    genre:      genre,
    bpm:        null,
    key:        null,
    sections,
  };
}

// Convert song data to display text
function songDataToText(songData) {
  if (typeof songData === "string") return songData;
  if (!songData?.sections?.length) return "";
  return songData.sections
    .map(s => `[${s.type}]\n${s.lines.join("\n")}`)
    .join("\n\n");
}

// Build local fallback as the same JSON structure
function buildLocalSongData(emotionName, lang, genre) {
  const lyrics = generateLocalLyrics(emotionName);
  const sections = [];
  const blocks = lyrics.split(/\n\n+/);
  blocks.forEach(block => {
    const match = block.match(/^\[(.+?)\]\n([\s\S]+)/);
    if (match) sections.push({ type: match[1], lines: match[2].split("\n").filter(Boolean) });
  });
  return { title: null, emotion: emotionName, confidence: 0.5, language: lang, genre: genre, bpm: 90, key: "C major", sections };
}

// ── Local lyrics fallback ─────────────────────
function generateLocalLyrics(e) {
  const t = {
    joy:`[Verse 1]\nThe morning sun is calling out my name\nGolden light is washing out the pain\nI feel alive, I feel the world again\nEvery heartbeat sings a new refrain\n\n[Chorus]\nOh, I'm dancing in the light\nEverything feels right tonight\nJoy is running through my veins\nLike a song that still remains\n\n[Verse 2]\nLaughing at the things I used to fear\nEvery breath I take feels crystal clear\nThe world is bright, the world is finally mine\nI'm rising up to meet the sunshine\n\n[Chorus]\nOh, I'm dancing in the light\nEverything feels right tonight\nJoy is running through my veins\nLike a song that still remains\n\n[Bridge]\nLet the good times roll\nLet this feeling take control\nNothing's gonna bring me down\nNot today, not this time around\n\n[Chorus]\nOh, I'm dancing in the light\nEverything feels right tonight\nJoy is running through my veins\nLike a song that still remains`,
    sadness:`[Verse 1]\nEmpty rooms and echoed memories\nThe silence screams your name so quietly\nI trace the lines where you used to be\nA ghost inside my heart that won't leave me\n\n[Chorus]\nTears fall like rain in the night\nI'm searching for a sign, a tiny light\nHold me in this storm that I face\nI'm lost without you, missing your embrace\n\n[Verse 2]\nPhotographs and faded yellow notes\nThe words we said now stuck inside my throat\nI walk the halls, I wear your favorite coat\nJust trying to stay afloat\n\n[Chorus]\nTears fall like rain in the night\nI'm searching for a sign, a tiny light\nHold me in this storm that I face\nI'm lost without you, missing your embrace\n\n[Bridge]\nMaybe time will heal what's broken\nMaybe words don't need to be spoken\nI'll find my way back to the shore\nEven if I'm not the same anymore\n\n[Chorus]\nTears fall like rain in the night\nI'm searching for a sign, a tiny light\nHold me in this storm that I face\nI'm lost without you, missing your embrace`,
    anger:`[Verse 1]\nBurning through the walls you built for me\nI'm breaking every chain that kept me weak\nYou thought you'd have me on my knees\nBut the fire inside won't let you breathe\n\n[Chorus]\nI'm a storm that you can't contain\nFeel the rage, feel the burning flame\nI will rise from this wreckage again\nYou can't break what you couldn't chain\n\n[Verse 2]\nEvery word you said cut deep inside\nBut I refuse to run, refuse to hide\nYour games are done, your power's expired\nI'm fueled by every wound, I'm fired\n\n[Chorus]\nI'm a storm that you can't contain\nFeel the rage, feel the burning flame\nI will rise from this wreckage again\nYou can't break what you couldn't chain\n\n[Bridge]\nWatch me walk through the fire\nI'll become everything you despise\nA force of nature, a burning desire\nWatch me rise, watch me rise\n\n[Chorus]\nI'm a storm that you can't contain\nFeel the rage, feel the burning flame\nI will rise from this wreckage again\nYou can't break what you couldn't chain`,
    fear:`[Verse 1]\nShadows creeping on the bedroom wall\nEvery creak and whisper down the hall\nHeart is racing, cannot catch my breath\nParalyzed between the life and death\n\n[Chorus]\nFear is calling out my name\nNothing ever feels the same\nHold me close before I fall\nInto shadows swallowing it all\n\n[Verse 2]\nDarkest hour stretches through the night\nEvery monster magnified in fright\nTrembling hands and voices in my head\nClutching at the morning light instead\n\n[Chorus]\nFear is calling out my name\nNothing ever feels the same\nHold me close before I fall\nInto shadows swallowing it all\n\n[Bridge]\nBreathe in, breathe out, face the unknown\nEven in the dark, you're not alone\nThe morning always follows every night\nI will find my courage, find my light\n\n[Chorus]\nFear is calling out my name\nNothing ever feels the same\nHold me close before I fall\nInto shadows swallowing it all`,
    disgust:`[Verse 1]\nUnderneath the perfect painted smile\nLies a rotten system gone hostile\nSee through every mask and every lie\nWatch the false idols slowly die\n\n[Chorus]\nStrip it bare and see what's underneath\nThe filth you've built on shattered belief\nI won't bow to what makes me sick\nTime to call it out and make it stick\n\n[Verse 2]\nDrowning in the shallow and mundane\nEvery hollow word just brings more pain\nComfortable corruption, broken trust\nWatch it crumble back to ash and dust\n\n[Chorus]\nStrip it bare and see what's underneath\nThe filth you've built on shattered belief\nI won't bow to what makes me sick\nTime to call it out and make it stick\n\n[Bridge]\nCleanse the poison, clear the air\nTruth is raw and truth is rare\nI'd rather live in honest pain\nThan breathe the comfortable disdain\n\n[Chorus]\nStrip it bare and see what's underneath\nThe filth you've built on shattered belief\nI won't bow to what makes me sick\nTime to call it out and make it stick`,
    surprise:`[Verse 1]\nDidn't see it coming from a mile\nKnocked me sideways with that unexpected smile\nLife just flipped the script without a sign\nEverything I thought I knew — redefined\n\n[Chorus]\nOut of nowhere, out of the blue\nEverything just changed when I found you\nSurprise, surprise, I never knew\nThat life could twist and turn into something new\n\n[Verse 2]\nPlot twist at the corner of my street\nMagic hiding in the ordinary beat\nWhat I thought was ending was a start\nSomething brand new beating in my heart\n\n[Chorus]\nOut of nowhere, out of the blue\nEverything just changed when I found you\nSurprise, surprise, I never knew\nThat life could twist and turn into something new\n\n[Bridge]\nI was ready for the ordinary\nGot extraordinary\nThe universe was planning this for me\nA beautiful mystery\n\n[Chorus]\nOut of nowhere, out of the blue\nEverything just changed when I found you\nSurprise, surprise, I never knew\nThat life could twist and turn into something new`,
    neutral:`[Verse 1]\nJust another day beneath the grey\nThoughts are drifting slowly, drifting away\nNot too high, not too low, somewhere in between\nLiving in the spaces in between the dream\n\n[Chorus]\nStill waters running deep inside my soul\nJust existing, feeling almost whole\nNeither here nor there but somewhere real\nIn the quiet calm of what I feel\n\n[Verse 2]\nCoffee getting cold beside the chair\nStaring at the patterns in the air\nNothing extraordinary on my mind\nJust the gentle passage of the time\n\n[Chorus]\nStill waters running deep inside my soul\nJust existing, feeling almost whole\nNeither here nor there but somewhere real\nIn the quiet calm of what I feel\n\n[Bridge]\nSometimes peace is just the absence of the noise\nSometimes quiet is its own kind of voice\nNot every moment needs a mountain high\nSometimes still is beautiful enough\n\n[Chorus]\nStill waters running deep inside my soul\nJust existing, feeling almost whole\nNeither here nor there but somewhere real\nIn the quiet calm of what I feel`,
  };
  return t[e] || t.neutral;
}

// ── Low-confidence confirm dialog ─────────────
function showEmotionConfirm(emotion) {
  return new Promise((resolve) => {
    const top1 = emotion.name;
    const top2 = emotion.second?.name || "neutral";
    const pct1 = Math.round(emotion.score * 100);
    const pct2 = Math.round((emotion.second?.score || 0) * 100);
    const meta1 = EMOTION_META[top1] || EMOTION_META.neutral;
    const meta2 = EMOTION_META[top2] || EMOTION_META.neutral;

    // Remove any existing dialog
    document.getElementById("emotionConfirmDialog")?.remove();

    const dialog = document.createElement("div");
    dialog.id = "emotionConfirmDialog";
    dialog.className = "emotion-confirm-dialog";
    dialog.innerHTML = `
      <div class="ecd-card">
        <p class="ecd-title">🤔 Which emotion fits better?</p>
        <p class="ecd-sub">I detected two close emotions — pick the one that feels right.</p>
        <div class="ecd-options">
          <button class="ecd-btn" data-emotion="${top1}">
            <span class="ecd-emoji">${meta1.emoji}</span>
            <span class="ecd-label">${cap(top1)}</span>
            <span class="ecd-pct">${pct1}%</span>
          </button>
          <button class="ecd-btn" data-emotion="${top2}">
            <span class="ecd-emoji">${meta2.emoji}</span>
            <span class="ecd-label">${cap(top2)}</span>
            <span class="ecd-pct">${pct2}%</span>
          </button>
        </div>
        <button class="ecd-cancel">Cancel</button>
      </div>`;

    dialog.querySelectorAll(".ecd-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const chosen = btn.dataset.emotion;
        emotion.name  = chosen;
        emotion.meta  = EMOTION_META[chosen] || EMOTION_META.neutral;
        emotion.score = chosen === top1 ? emotion.score : (emotion.second?.score || 0.5);
        dialog.remove();
        resolve(true);
      });
    });
    dialog.querySelector(".ecd-cancel").addEventListener("click", () => {
      dialog.remove(); resolve(false);
    });

    document.querySelector(".container").appendChild(dialog);
    dialog.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

// ── Display results ───────────────────────────
function displayResults(emotion, songData, originalText) {
  stopAllAudio();
  playerState.currentEmotion  = emotion.name;
  playerState.currentSongData = songData;  // store for player
  document.getElementById("loadingSection").style.display = "none";

  // ── Emotion bar chart (top 3) ──
  const top3 = emotion.top3 || [{ name: emotion.name, score: emotion.score }];
  const barHTML = top3.map((e, i) => {
    const meta = EMOTION_META[e.name] || EMOTION_META.neutral;
    const pct  = Math.round(e.score * 100);
    return `
      <div class="ebar-row">
        <span class="ebar-emoji">${meta.emoji}</span>
        <span class="ebar-label">${cap(e.name)}</span>
        <div class="ebar-track">
          <div class="ebar-fill ${i === 0 ? "ebar-top" : ""}" style="width:0%" data-target="${pct}%"></div>
        </div>
        <span class="ebar-pct" data-final="${pct}">0%</span>
      </div>`;
  }).join("");

  document.getElementById("emotionBadge").innerHTML = `
    <div class="emotion-bar-chart">
      <div class="ebar-header">
        <span class="emotion-emoji-big">${(EMOTION_META[emotion.name]||EMOTION_META.neutral).emoji}</span>
        <div>
          <div class="emotion-name" id="emotionName">${cap(emotion.name)}</div>
          <div class="emotion-label">Detected Emotion</div>
          <div class="emotion-tags" id="emotionTags">
            <span class="emotion-tag">${selectedLang}</span>
            <span class="emotion-tag">${selectedGenre}</span>
          </div>
        </div>
        <div class="emotion-confidence">
          <span class="conf-label">Confidence</span>
          <span class="conf-value" id="confValue">0%</span>
        </div>
      </div>
      <div class="ebar-list">${barHTML}</div>
    </div>`;

  // Animate bars + confidence counter
  requestAnimationFrame(() => {
    document.querySelectorAll(".ebar-fill").forEach(el => {
      el.style.transition = "width 0.8s ease";
      el.style.width = el.dataset.target;
    });
    document.querySelectorAll(".ebar-pct").forEach(el => {
      const target = parseInt(el.dataset.final);
      let current  = 0;
      const step   = Math.ceil(target / 40);
      const timer  = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current + "%";
        if (current >= target) clearInterval(timer);
      }, 20);
    });
    // Animate main confidence
    const finalConf = Math.round(emotion.score * 100);
    let cur = 0;
    const confEl = document.getElementById("confValue");
    const t = setInterval(() => {
      cur = Math.min(cur + Math.ceil(finalConf / 40), finalConf);
      if (confEl) confEl.textContent = cur + "%";
      if (cur >= finalConf) clearInterval(t);
    }, 20);
  });

  // Song title
  const title = songData.title || emotion.meta.titles[Math.floor(Math.random() * emotion.meta.titles.length)];
  document.getElementById("songTitle").textContent = title;
  const bpmKey = songData.bpm ? ` • ${songData.bpm} BPM • ${songData.key}` : "";
  document.getElementById("songMeta").textContent = `${selectedGenre} • ${selectedLang} • AI Generated${bpmKey}`;

  // Lyrics — render as karaoke spans
  renderKaraokeLyrics(songDataToText(songData));

  // Search links
  const emotion2 = emotion.name === "loneliness" ? "lonely" : emotion.name;
  const lang2    = selectedLang !== "English" ? selectedLang : "";
  const base     = `${emotion2} ${lang2} ${selectedGenre}`.trim().replace(/\s+/g, " ");
  const q        = encodeURIComponent(base + " songs");
  const q2025    = encodeURIComponent(base + " songs 2025");
  const qlofi    = encodeURIComponent(emotion2 + " " + (lang2 || "chill") + " lofi");

  document.getElementById("spotifyLink").href = `https://open.spotify.com/search/${q}`;
  document.getElementById("youtubeLink").href = `https://www.youtube.com/results?search_query=${q}`;

  // Mood playlists row
  const moodEl = document.getElementById("moodPlaylists");
  const rowsEl = document.getElementById("playlistRows");
  if (moodEl && rowsEl) {
    moodEl.style.display = "block";
    rowsEl.innerHTML = `
      <div class="playlist-item">
        <span class="playlist-query">${decodeURIComponent(q)}</span>
        <a href="https://open.spotify.com/search/${q}" target="_blank" rel="noopener" class="pl-btn pl-sp"><i class="fab fa-spotify"></i></a>
        <a href="https://www.youtube.com/results?search_query=${q}" target="_blank" rel="noopener" class="pl-btn pl-yt"><i class="fab fa-youtube"></i></a>
      </div>
      <div class="playlist-item">
        <span class="playlist-query">${decodeURIComponent(q2025)}</span>
        <a href="https://open.spotify.com/search/${q2025}" target="_blank" rel="noopener" class="pl-btn pl-sp"><i class="fab fa-spotify"></i></a>
        <a href="https://www.youtube.com/results?search_query=${q2025}" target="_blank" rel="noopener" class="pl-btn pl-yt"><i class="fab fa-youtube"></i></a>
      </div>
      <div class="playlist-item">
        <span class="playlist-query">${decodeURIComponent(qlofi)}</span>
        <a href="https://open.spotify.com/search/${qlofi}" target="_blank" rel="noopener" class="pl-btn pl-sp"><i class="fab fa-spotify"></i></a>
        <a href="https://www.youtube.com/results?search_query=${qlofi}" target="_blank" rel="noopener" class="pl-btn pl-yt"><i class="fab fa-youtube"></i></a>
      </div>`;
  }

  document.getElementById("resultSection").style.display = "block";
  setTimeout(() => document.getElementById("resultSection").scrollIntoView({ behavior: "smooth", block: "start" }), 100);
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }

// ── Tone.js music engine ──────────────────────
async function ensureToneStarted() {
  if (!toneStarted) { await Tone.start(); toneStarted = true; }
}

// ═══════════════════════════════════════════════════════════
//  TONE.JS MUSIC ENGINE — genre drum patterns, song structure,
//  AI BPM/key, beat/vocal/intensity controls, analyser viz
// ═══════════════════════════════════════════════════════════

// ── Genre drum patterns (16-step grid) ───────
// Each array = steps 0-15 that trigger on a 16th-note grid
const GENRE_DRUMS = {
  // Boom-bap Hip-Hop
  "Hip-Hop": {
    bpm: 90,
    kick:  [0, 6, 8, 14],
    snare: [4, 12],
    hihat: [0, 2, 4, 6, 8, 10, 12, 14],  // 8th-note
    clap:  [4, 12],
    openHat: [],
    trapRolls: false,
  },
  // Trap variant (high BPM, rolling hi-hats)
  "Hip-Hop Trap": {
    bpm: 140,
    kick:  [0, 3, 8, 11],
    snare: [4, 12],
    hihat: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], // 16th rolls
    clap:  [],
    openHat: [6, 14],
    trapRolls: true,
  },
  // Bollywood / dholak 4/4
  "Bollywood": {
    bpm: 108,
    kick:  [0, 3, 8, 11],
    snare: [4, 10, 12],
    hihat: [0, 2, 4, 6, 8, 10, 12, 14],
    clap:  [4, 8, 12],
    openHat: [],
    trapRolls: false,
  },
  // Pakistani Pop / Coke Studio
  "Pakistani Pop": {
    bpm: 100,
    kick:  [0, 6, 8, 14],
    snare: [4, 12],
    hihat: [0, 2, 4, 6, 8, 10, 12, 14],
    clap:  [4, 12],
    openHat: [7, 15],
    trapRolls: false,
  },
  // Sufi / Qawwali — handclap + dholak, steady 4/4
  "Sufi": {
    bpm: 96,
    kick:  [0, 8],
    snare: [4, 12],
    hihat: [0, 4, 8, 12],
    clap:  [0, 2, 4, 6, 8, 10, 12, 14], // constant handclap
    openHat: [],
    trapRolls: false,
  },
  // Acoustic / Lo-fi — soft brush, swing feel
  "Acoustic Indie": {
    bpm: 78,
    kick:  [0, 9],
    snare: [4, 13],          // swung slightly
    hihat: [0, 3, 6, 9, 12], // triplet feel
    clap:  [],
    openHat: [6],
    trapRolls: false,
  },
  "Lo-fi": {
    bpm: 75,
    kick:  [0, 10],
    snare: [4, 13],
    hihat: [0, 3, 6, 9, 12, 15],
    clap:  [],
    openHat: [],
    trapRolls: false,
  },
  // Pop default
  "Pop": {
    bpm: 110,
    kick:  [0, 8],
    snare: [4, 12],
    hihat: [0, 2, 4, 6, 8, 10, 12, 14],
    clap:  [],
    openHat: [6, 14],
    trapRolls: false,
  },
  // Default fallback
  _default: {
    bpm: 95,
    kick:  [0, 8],
    snare: [4, 12],
    hihat: [0, 2, 4, 6, 8, 10, 12, 14],
    clap:  [],
    openHat: [],
    trapRolls: false,
  },
};

// ── Song section structure ────────────────────
// Maps lyric section names to arrangement intensity
const SECTION_INTENSITY = {
  "intro":   0,   // minimal
  "verse 1": 1,
  "verse 2": 1,
  "pre-chorus": 1.5,
  "mukhda":  2,
  "antara":  1,
  "chorus":  2,   // full
  "hook":    2,
  "refrain": 2,
  "bridge":  1.5,
  "outro":   0.5,
  "_default": 1,
};

function getSectionIntensity(sectionName) {
  const k = (sectionName || "").toLowerCase();
  for (const [key, val] of Object.entries(SECTION_INTENSITY)) {
    if (k.includes(key)) return val;
  }
  return SECTION_INTENSITY._default;
}

// ── Gain buses ───────────────────────────────
let beatBus   = null;  // drum + bass → here
let melodBus  = null;  // melody + chords → here
let analyser  = null;
let vizRafId  = null;

// ── Current AI song data BPM/key ─────────────
let currentSongBpm = null;
let currentSongKey = null;
let currentSectionIndex = 0;
let lyricSections = [];  // [{type, startBar}]

function buildInstruments(p, drumPattern) {
  // Two gain buses
  beatBus  = new Tone.Gain(1).toDestination();
  melodBus = new Tone.Gain(1).toDestination();

  // Analyser for visualizer (connected to master)
  analyser = new Tone.Analyser("waveform", 128);
  Tone.getDestination().connect(analyser);

  const reverb = new Tone.Reverb({ decay: 3.5, wet: p.rev });
  reverb.toDestination();
  reverb.connect(melodBus);

  const delay = new Tone.FeedbackDelay("8n", 0.25);
  delay.wet.value = p.del;
  delay.connect(reverb);

  // Melody
  const melSynth = new Tone.Synth({
    oscillator: { type: p.synth },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.8 },
    volume: -6,
  }).connect(delay);

  // Chords
  const chordSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" },
    envelope: { attack: 0.3, decay: 0.5, sustain: 0.7, release: 1.5 },
    volume: -14,
  }).connect(reverb);

  // Bass
  const bassSynth = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.05, decay: 0.4, sustain: 0.6, release: 0.5 },
    volume: -8,
  }).connect(beatBus);

  // ── Drums — tuned per genre ───────────────
  // Kick — dholak-style: lower pitch + longer decay for Indian genres
  const isIndian = ["Bollywood","Pakistani Pop","Sufi"].includes(selectedGenre);
  const kick = new Tone.MembraneSynth({
    pitchDecay:  isIndian ? 0.1 : 0.05,
    octaves:     isIndian ? 6   : 8,
    envelope:    { attack: 0.001, decay: isIndian ? 0.4 : 0.3, sustain: 0, release: 0.1 },
    volume:      -4,
  }).connect(beatBus);

  // Snare — brushed for Acoustic/Lo-fi, crispier for others
  const isLofi = ["Acoustic Indie","Lo-fi"].includes(selectedGenre);
  const snare = new Tone.NoiseSynth({
    noise:    { type: isLofi ? "pink" : "white" },
    envelope: { attack: 0.001, decay: isLofi ? 0.25 : 0.15, sustain: 0, release: isLofi ? 0.15 : 0.08 },
    volume:   isLofi ? -16 : -12,
  }).connect(beatBus);

  // Clap — separate noise synth, sharper
  const clap = new Tone.NoiseSynth({
    noise:    { type: "white" },
    envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.05 },
    volume:   -14,
  }).connect(beatBus);

  // Hi-hat — closed
  const hihat = new Tone.MetalSynth({
    frequency:       isLofi ? 300 : 400,
    envelope:        { attack: 0.001, decay: isLofi ? 0.08 : 0.04, release: 0.01 },
    harmonicity:     5.1,
    modulationIndex: 32,
    resonance:       4000,
    octaves:         1.5,
    volume:          isLofi ? -24 : -20,
  }).connect(beatBus);

  // Open hi-hat
  const openHat = new Tone.MetalSynth({
    frequency:       isLofi ? 280 : 350,
    envelope:        { attack: 0.001, decay: 0.3, release: 0.1 },
    harmonicity:     3.5,
    modulationIndex: 16,
    resonance:       3000,
    octaves:         1.2,
    volume:          -22,
  }).connect(beatBus);

  return { melSynth, chordSynth, bassSynth, kick, snare, clap, hihat, openHat, reverb, delay, beatBus, melodBus };
}

function disposeInstruments() {
  sequences.forEach(s => { try { s.stop(); s.dispose(); } catch(e){} });
  sequences = [];
  if (toneLoop) { try { toneLoop.stop(); toneLoop.dispose(); } catch(e){} toneLoop = null; }
  if (instruments) { Object.values(instruments).forEach(i => { try { if (i && typeof i.dispose==="function") i.dispose(); } catch(e){} }); instruments = null; }
  if (vizRafId)  { cancelAnimationFrame(vizRafId); vizRafId = null; }
  beatBus = null; melodBus = null; analyser = null;
}

async function startBackgroundMusic(emotion, songData) {
  disposeInstruments();
  await ensureToneStarted();

  // Use AI-provided BPM/key if available
  const mp  = MUSIC_PROFILES[emotion] || MUSIC_PROFILES.neutral;
  const genreDrum = GENRE_DRUMS[selectedGenre] || GENRE_DRUMS._default;

  const bpm = (songData && songData.bpm)
    ? Math.max(60, Math.min(200, songData.bpm))
    : genreDrum.bpm || mp.bpm;

  Tone.getTransport().bpm.value = bpm;
  currentSongBpm = bpm;

  // Apply initial volume levels
  applyVolumeSettings();

  instruments = buildInstruments(mp, genreDrum);

  // Parse lyric sections for structure-aware playback
  lyricSections = parseLyricSections();
  currentSectionIndex = 0;

  const STEPS = 16;
  let step = 0;
  let bar  = 0;

  // ── Get intensity (1–3) from slider ──────
  function getRhythmIntensity() {
    return parseInt(document.getElementById("intensitySlider")?.value || 2);
  }

  // ── Section intensity at current bar ─────
  function getSectionIntensityNow() {
    if (!lyricSections.length) return 1;
    // Find which section we're in
    let secIntensity = 1;
    for (let i = lyricSections.length - 1; i >= 0; i--) {
      if (bar >= lyricSections[i].startBar) {
        secIntensity = lyricSections[i].intensity;
        break;
      }
    }
    return secIntensity;
  }

  toneLoop = new Tone.Sequence((time) => {
    if (!instruments) return;
    const { melSynth, chordSynth, bassSynth, kick, snare, clap, hihat, openHat } = instruments;
    const intensity  = getRhythmIntensity();       // 1-3 from slider
    const secInt     = getSectionIntensityNow();   // 0-2 from song section
    const combined   = Math.min(3, intensity * secInt * 0.8 + 0.5) ;

    // ── DRUMS ──
    // Kick — always plays at intensity ≥ 1
    if (genreDrum.kick.includes(step)) {
      kick.triggerAttackRelease("C1", "8n", time);
    }

    // Snare
    if (combined >= 1 && genreDrum.snare.includes(step)) {
      snare.triggerAttackRelease("8n", time);
    }

    // Clap (layered on snare for Bollywood/Sufi)
    if (combined >= 1.5 && genreDrum.clap.includes(step)) {
      clap.triggerAttackRelease("8n", time);
    }

    // Hi-hat
    if (combined >= 1 && genreDrum.hihat.includes(step)) {
      // Trap rolls: vary volume for ghost notes
      if (genreDrum.trapRolls) {
        const ghostVol = (step % 4 === 0) ? 0 : -8;
        hihat.volume.value = -20 + ghostVol;
      }
      hihat.triggerAttackRelease("16n", time);
    }

    // Open hi-hat
    if (combined >= 2 && genreDrum.openHat.includes(step)) {
      openHat.triggerAttackRelease("8n", time);
    }

    // ── BASS — every bar on beat 1 ──
    if (step === 0) {
      bassSynth.triggerAttackRelease(
        mp.bassNotes[bar % mp.bassNotes.length], "2n", time
      );
    }

    // ── CHORDS — beat 1 and beat 3 ──
    if (combined >= 1 && (step === 0 || step === 8)) {
      const chordIdx = (step === 0 ? bar : bar + 1) % mp.chords.length;
      chordSynth.triggerAttackRelease(mp.chords[chordIdx], "4n", time);
    }

    // ── MELODY — on 8th notes ──
    if (combined >= 1.5 && step % 2 === 0) {
      melSynth.triggerAttackRelease(
        mp.melody[(bar * 8 + step / 2) % mp.melody.length], "8n", time
      );
    }

    step++;
    if (step >= STEPS) { step = 0; bar++; }

  }, [...Array(STEPS).keys()], "16n");

  toneLoop.start(0);
  Tone.getTransport().start();

  // Start visualizer
  startVisualizer();
}

// ── Parse lyric sections for structure ───────
function parseLyricSections() {
  const lines  = document.getElementById("lyricsContent")?.innerText?.split("\n") || [];
  const result = [];
  let bar = 0;
  let linesInSection = 0;
  const barsPerLine = 1; // 1 bar per lyric line

  lines.forEach(line => {
    const hdr = line.match(/^\[?([^\]]+)\]?$/);
    if (hdr && /verse|chorus|bridge|mukhda|antara|hook|refrain|intro|outro|pre/i.test(hdr[1])) {
      result.push({ type: hdr[1], startBar: bar, intensity: getSectionIntensity(hdr[1]) });
      linesInSection = 0;
    } else if (line.trim()) {
      bar += barsPerLine;
      linesInSection++;
    }
  });
  return result;
}

// ── Volume / slider helpers ───────────────────
function applyVolumeSettings() {
  const beatVol  = (document.getElementById("beatSlider")?.value  || 70) / 100;
  const vocalVol = (document.getElementById("vocalSlider")?.value || 85) / 100;
  // Master volume at a sensible level
  try { Tone.getDestination().volume.value = Tone.gainToDb(Math.max(beatVol, vocalVol) * 0.85); } catch(e){}
  if (beatBus)  try { beatBus.gain.rampTo(beatVol,  0.1); } catch(e){}
  if (melodBus) try { melodBus.gain.rampTo(vocalVol * 0.7, 0.1); } catch(e){}
}

function stopBackgroundMusic() {
  try { Tone.getTransport().stop(); } catch(e) {}
  disposeInstruments();
}

// ── Visualizer (Tone.Analyser → canvas) ──────
function startVisualizer() {
  const canvas = document.getElementById("vizCanvas");
  if (!canvas || !analyser) return;
  const ctx    = canvas.getContext("2d");
  const W      = canvas.offsetWidth  || 740;
  const H      = canvas.offsetHeight || 48;
  canvas.width  = W;
  canvas.height = H;

  const barCount = 48;
  const barW     = W / barCount;

  function draw() {
    if (!analyser || !playerState.isPlaying) {
      ctx.clearRect(0, 0, W, H);
      vizRafId = null;
      return;
    }
    vizRafId = requestAnimationFrame(draw);

    const data = analyser.getValue(); // Float32Array, -1 to 1
    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < barCount; i++) {
      const sample  = Math.abs(data[Math.floor(i * data.length / barCount)] || 0);
      const barH    = Math.max(2, sample * H * 2.5);
      const y       = (H - barH) / 2;
      // Gradient: purple → pink
      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, "rgba(168,85,247,0.9)");
      grad.addColorStop(1, "rgba(236,72,153,0.7)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(i * barW + 1, y, barW - 2, barH, 2);
      ctx.fill();
    }
  }
  vizRafId = requestAnimationFrame(draw);
}

// ── Wire up sliders on DOMContentLoaded ──────
// (added to existing DOMContentLoaded in Init section)

// ── Audio player controls ─────────────────────
function togglePlay() { playerState.isPlaying ? pauseAudio() : playAudio(); }

function playAudio() {
  const lyricsEl = document.getElementById("lyricsContent");
  if (!lyricsEl || !lyricsEl.textContent.trim()) return;
  playerState.isPlaying = true;
  document.getElementById("playIcon").className = "fas fa-pause";
  document.getElementById("discIcon").classList.add("playing");
  startBackgroundMusic(playerState.currentEmotion, playerState.currentSongData || null);
  speakLyrics(); // reads karaoke lines directly from DOM
}

function pauseAudio() {
  playerState.isPlaying = false;
  document.getElementById("playIcon").className = "fas fa-play";
  document.getElementById("discIcon").classList.remove("playing");
  window.speechSynthesis.cancel();
  stopBackgroundMusic();
  clearInterval(playerState.interval);
}

// singing timeout handle
let singingTimeout = null;

function stopAllAudio() {
  window.speechSynthesis.cancel();
  stopBackgroundMusic();
  clearInterval(playerState.interval);
  if (singingTimeout) { clearTimeout(singingTimeout); singingTimeout = null; }
  playerState.isPlaying = false;
  playerState.progress  = 0;
  // Clear karaoke highlights
  getLyricLines().forEach(el => el.classList.remove("active","sung"));
  const pi = document.getElementById("playIcon");
  const di = document.getElementById("discIcon");
  const pf = document.getElementById("progressFill");
  const ct = document.getElementById("currentTime");
  if (pi) pi.className = "fas fa-play";
  if (di) di.classList.remove("playing");
  if (pf) pf.style.width = "0%";
  if (ct) ct.textContent = "0:00";
}

function prevSong()  { stopAllAudio(); setTimeout(() => playAudio(), 300); }
function nextSong()  { stopAllAudio(); showToast("🎵 Generate a new song to play next!"); }
function resetPlayer(){ stopAllAudio(); }

// ── Speech synthesis ──────────────────────────
// ═══════════════════════════════════════════════════════════
//  SINGING ENGINE — melody-driven vocal with karaoke highlight
// ═══════════════════════════════════════════════════════════

// ── Scales: note names → Tone.js frequencies ──
// Each scale is an array of semitone offsets from root C4 (261.63 Hz)
const VOCAL_SCALES = {
  // Western
  major:      [0,2,4,5,7,9,11,12],        // C D E F G A B C
  minor:      [0,2,3,5,7,8,10,12],         // C D Eb F G Ab Bb C
  phrygian:   [0,1,3,5,7,8,10,12],         // dark/fear
  dorian:     [0,2,3,5,7,9,10,12],         // soulful
  // South Asian / Bollywood
  bhairavi:   [0,1,3,5,7,8,10,12],         // morning raga, emotional
  kafi:       [0,2,3,5,7,9,10,12],         // playful/devotional
  yaman:      [0,2,4,6,7,9,11,12],         // romantic/evening
  bhairav:    [0,1,4,5,7,8,11,12],         // spiritual/sufi
};

// ── Emotion + genre → scale + root pitch ──────
function getVocalProfile(emotion, genre) {
  const g = genre.toLowerCase();
  const e = emotion.toLowerCase();

  // Genre overrides
  if (g.includes("sufi") || g.includes("qawwali")) return { scale: VOCAL_SCALES.bhairav,   rootHz: 220,    ornament: true  };
  if (g.includes("bollywood"))                       return { scale: VOCAL_SCALES.bhairavi,  rootHz: 246.94, ornament: true  };
  if (g.includes("pakistani") || g.includes("coke")) return { scale: VOCAL_SCALES.kafi,      rootHz: 246.94, ornament: false };
  if (g.includes("hip-hop") || g.includes("rap"))    return { scale: VOCAL_SCALES.minor,     rootHz: 185,    ornament: false };

  // Emotion-based
  const map = {
    joy:        { scale: VOCAL_SCALES.major,    rootHz: 261.63, ornament: false },
    sadness:    { scale: VOCAL_SCALES.phrygian, rootHz: 220,    ornament: false },
    anger:      { scale: VOCAL_SCALES.minor,    rootHz: 185,    ornament: false },
    fear:       { scale: VOCAL_SCALES.phrygian, rootHz: 207.65, ornament: false },
    disgust:    { scale: VOCAL_SCALES.minor,    rootHz: 196,    ornament: false },
    surprise:   { scale: VOCAL_SCALES.yaman,    rootHz: 293.66, ornament: false },
    love:       { scale: VOCAL_SCALES.yaman,    rootHz: 261.63, ornament: true  },
    loneliness: { scale: VOCAL_SCALES.phrygian, rootHz: 220,    ornament: false },
    hope:       { scale: VOCAL_SCALES.major,    rootHz: 246.94, ornament: false },
    calm:       { scale: VOCAL_SCALES.dorian,   rootHz: 220,    ornament: false },
    nostalgia:  { scale: VOCAL_SCALES.kafi,     rootHz: 220,    ornament: true  },
    neutral:    { scale: VOCAL_SCALES.major,    rootHz: 261.63, ornament: false },
  };
  return map[e] || map.neutral;
}

// ── Semitone offset → Hz ──────────────────────
function semitoneToHz(rootHz, semitones) {
  return rootHz * Math.pow(2, semitones / 12);
}

// ── Hz → SpeechSynthesis pitch (0.1–2.0, 1.0 ≈ normal) ──
// Browser pitch range covers roughly ±1 octave around 1.0
function hzToPitch(hz, referenceHz = 261.63) {
  // Map 130–520 Hz → 0.5–1.8 (clamped)
  const ratio = hz / referenceHz;
  return Math.max(0.4, Math.min(1.9, ratio * 0.85 + 0.2));
}

// ── Syllable splitter ─────────────────────────
// ── Build karaoke DOM ─────────────────────────
function renderKaraokeLyrics(lyricsText) {
  const container = document.getElementById("lyricsContent");
  container.innerHTML = "";
  const lines = lyricsText.split("\n");
  lines.forEach((line) => {
    if (/^\[.+\]$/.test(line.trim())) {
      const hdr = document.createElement("span");
      hdr.className = "lyric-section-header";
      hdr.textContent = line.trim().replace(/[\[\]]/g, "");
      container.appendChild(hdr);
      return;
    }
    if (!line.trim()) {
      container.appendChild(document.createElement("br"));
      return;
    }
    const span = document.createElement("span");
    span.className = "lyric-line";
    span.textContent = line;
    container.appendChild(span);
  });
}

function getLyricLines() {
  return Array.from(document.querySelectorAll(".lyric-line"));
}

function highlightLine(index) {
  getLyricLines().forEach((el, i) => {
    el.classList.remove("active", "sung");
    if (i < index)  el.classList.add("sung");
    if (i === index) {
      el.classList.add("active");
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });
}

// ── Singing engine — one utterance per line, chained via onend ──
function speakLyrics() {
  if (!("speechSynthesis" in window)) {
    showToast("⚠️ Speech not supported. Use Chrome or Edge.");
    return;
  }
  window.speechSynthesis.cancel();

  const emotion  = playerState.currentEmotion;
  const genre    = selectedGenre || "Pop";
  const profile  = getVocalProfile(emotion, genre);
  const sp       = SPEECH_PROFILES[emotion] || SPEECH_PROFILES.neutral;
  const lineEls  = getLyricLines();
  if (!lineEls.length) return;

  // Pick best available English voice
  const voices = window.speechSynthesis.getVoices();
  const voice  = voices.find(v => v.lang.startsWith("en") && v.name.includes("Google"))
              || voices.find(v => v.lang.startsWith("en-US"))
              || voices.find(v => v.lang.startsWith("en"))
              || voices[0] || null;

  // Estimate total duration for progress bar (avg ~2.5s per line)
  const avgLineMs = Math.max(1800, (60 / (currentSongBpm || 90)) * 1000 * 4);
  playerState.duration = Math.ceil(lineEls.length * avgLineMs / 1000);
  document.getElementById("totalTime").textContent = formatTime(playerState.duration);
  startProgressTracking();

  let lineIndex = 0;

  function singLine() {
    if (!playerState.isPlaying || lineIndex >= lineEls.length) {
      if (playerState.isPlaying && lineIndex >= lineEls.length) {
        stopAllAudio();
        showToast("🎵 Song finished!");
      }
      return;
    }

    const text = lineEls[lineIndex].textContent.trim();
    highlightLine(lineIndex);

    // Choose pitch from scale based on line position (melodic contour)
    const scale    = profile.scale;
    const rootHz   = profile.rootHz;
    const degree   = lineIndex % scale.length;
    const semi     = scale[degree];
    // Add gentle ornament for Indian genres on every 3rd line
    const ornSemi  = (profile.ornament && lineIndex % 3 === 0)
      ? scale[(degree + 1) % scale.length] : semi;
    const noteHz   = semitoneToHz(rootHz, ornSemi);
    const pitch    = hzToPitch(noteHz);

    const u      = new SpeechSynthesisUtterance(text);
    u.pitch      = pitch;
    u.rate       = sp.rate;
    u.volume     = Math.min(1, (document.getElementById("vocalSlider")?.value || 85) / 100);
    if (voice) u.voice = voice;

    u.onend = () => {
      lineIndex++;
      // Small pause between lines (feels more musical)
      setTimeout(() => {
        if (playerState.isPlaying) singLine();
      }, 280);
    };

    u.onerror = (ev) => {
      if (ev.error === "interrupted") return; // user paused
      console.warn("Speech error on line", lineIndex, ev.error);
      lineIndex++;
      if (playerState.isPlaying) singLine(); // skip broken line, continue
    };

    window.speechSynthesis.speak(u);
    currentUtterance = u;
  }

  // Chrome bug: voices may not be loaded yet on first call
  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      singLine();
    };
  } else {
    singLine();
  }
}

// Keep SPEECH_PROFILES for rate reference
const SPEECH_PROFILES = {
  joy:        { rate: 1.0,  pitch: 1.2  },
  sadness:    { rate: 0.82, pitch: 0.85 },
  anger:      { rate: 1.05, pitch: 0.9  },
  fear:       { rate: 0.88, pitch: 1.05 },
  disgust:    { rate: 0.92, pitch: 0.8  },
  surprise:   { rate: 1.05, pitch: 1.3  },
  love:       { rate: 0.88, pitch: 1.15 },
  loneliness: { rate: 0.78, pitch: 0.82 },
  hope:       { rate: 0.95, pitch: 1.1  },
  calm:       { rate: 0.82, pitch: 1.0  },
  nostalgia:  { rate: 0.82, pitch: 0.95 },
  neutral:    { rate: 0.92, pitch: 1.0  },
};

function startProgressTracking() {
  clearInterval(playerState.interval);
  let elapsed = 0;
  playerState.interval = setInterval(() => {
    if (!playerState.isPlaying) return;
    elapsed++;
    const dur = playerState.duration || 120;
    playerState.progress = Math.min((elapsed/dur)*100, 99);
    document.getElementById("progressFill").style.width = playerState.progress + "%";
    document.getElementById("currentTime").textContent  = formatTime(elapsed);
    document.getElementById("totalTime").textContent    = formatTime(dur);
  }, 1000);
}

function formatTime(s) { const m=Math.floor(s/60); return `${m}:${(s%60).toString().padStart(2,"0")}`; }

// ── Voice input ───────────────────────────────
function toggleVoiceInput() { isListening ? stopVoiceInput() : startVoiceInput(); }

function startVoiceInput() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { showToast("⚠️ Voice input not supported. Use Chrome or Edge."); return; }
  recognition = new SR();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";
  recognition.onstart = () => {
    isListening = true;
    document.getElementById("micBtn").classList.add("active");
    document.getElementById("micIcon").className = "fas fa-stop";
    document.getElementById("micLabel").textContent = "Stop";
    document.querySelector(".voice-bar").classList.add("listening");
    document.getElementById("voiceDots").style.display = "flex";
    setVoiceHint("🎙️ Listening... speak now", false);
  };
  recognition.onresult = (event) => {
    let interim = "", final = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const tr = event.results[i][0].transcript;
      if (event.results[i].isFinal) final += tr + " "; else interim += tr;
    }
    if (final) { const ta = document.getElementById("emotionInput"); ta.value += final; document.getElementById("charCount").textContent = `${ta.value.length} / 500`; }
    if (interim) setVoiceHint(`"${interim}"`, true);
  };
  recognition.onerror = (ev) => {
    const msgs = {"not-allowed":"❌ Mic access denied.","no-speech":"No speech detected.","network":"Network error.","audio-capture":"No mic found."};
    showToast(msgs[ev.error] || `Voice error: ${ev.error}`);
    resetMicUI();
  };
  recognition.onend = () => { if (isListening) recognition.start(); else resetMicUI(); };
  recognition.start();
}

function stopVoiceInput() {
  isListening = false;
  if (recognition) { recognition.stop(); recognition = null; }
  resetMicUI();
  const val = document.getElementById("emotionInput").value.trim();
  setVoiceHint(val.length > 5 ? '✅ Got it! Click "Generate My Song" when ready.' : "Click the mic and speak how you feel", false);
}

function resetMicUI() {
  isListening = false;
  document.getElementById("micBtn").classList.remove("active");
  document.getElementById("micIcon").className = "fas fa-microphone";
  document.getElementById("micLabel").textContent = "Speak";
  document.querySelector(".voice-bar").classList.remove("listening");
  document.getElementById("voiceDots").style.display = "none";
}

function setVoiceHint(text, isTranscript) {
  const el = document.getElementById("voiceHint");
  el.textContent = text;
  el.className = isTranscript ? "voice-hint transcript" : "voice-hint";
}

// ── Actions ───────────────────────────────────
function copySong() {
  const title = document.getElementById("songTitle").textContent;
  const emotion = document.getElementById("emotionName").textContent;
  const lyrics = document.getElementById("lyricsContent").textContent;
  navigator.clipboard.writeText(`🎵 "${title}"\nEmotion: ${emotion}\nGenerated by EmotiTune AI\n\n${lyrics}`)
    .then(() => showToast("✅ Lyrics copied!")).catch(() => showToast("⚠️ Copy failed — select manually."));
}

function downloadSong() {
  const title  = document.getElementById("songTitle").textContent;
  const emotion= document.getElementById("emotionName").textContent;
  const lyrics = document.getElementById("lyricsContent").textContent;
  const blob = new Blob([`🎵 "${title}"\nEmotion: ${emotion}\nGenerated by EmotiTune AI\n${"=".repeat(40)}\n\n${lyrics}`], {type:"text/plain;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${title.replace(/[^a-z0-9]/gi,"_")}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast("⬇️ Lyrics downloaded!");
}

function shareSong() {
  const title  = document.getElementById("songTitle").textContent;
  const emotion= document.getElementById("emotionName").textContent;
  if (navigator.share) {
    navigator.share({title:`EmotiTune: "${title}"`, text:`I generated a ${emotion} song using AI! 🎵`, url:window.location.href}).catch(()=>{});
  } else {
    navigator.clipboard.writeText(`I generated "${title}" (${emotion}) with EmotiTune AI! 🎵`);
    showToast("🔗 Share link copied!");
  }
}

function resetApp() {
  document.getElementById("resultSection").style.display = "none";
  document.getElementById("emotionInput").value = "";
  document.getElementById("charCount").textContent = "0 / 500";
  const mp = document.getElementById("moodPlaylists");
  if (mp) mp.style.display = "none";
  stopAllAudio();
  if (isListening) stopVoiceInput();
  setVoiceHint("Click the mic and speak how you feel", false);
  document.getElementById("emotionInput").focus();
  window.scrollTo({top:0, behavior:"smooth"});
}

// ── Toast & utility ───────────────────────────
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3200);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
