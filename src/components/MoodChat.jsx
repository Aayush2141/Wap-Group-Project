// MoodChat.jsx
// The AI-powered mood chat component. User types how they feel,
// it detects the mood, searches iTunes, and queues matching songs.
// Supports: Gemini AI (smart), keyword fallback (offline), direct artist search.

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RefreshCw, Music2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { fetchSongs } from '../utils/api';
import { GEMINI_API_KEY } from '../config'; // ← key lives in src/config.js

// ── Gemini API endpoint ────────────────────────────────────────────────────────
const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// ── callGemini ─────────────────────────────────────────────────────────────────
// Sends the user's message to Gemini AI and gets back mood + search query.
// Returns an object: { mood, emoji, searchQuery, response }
async function callGemini(userMessage, apiKey) {
  // The prompt tells Gemini exactly what format to reply in
  const prompt = `The user said: "${userMessage}".
Based on their mood, return ONLY a JSON object (no markdown, no code block, no explanation — raw JSON only):
{
  "mood": "happy",
  "emoji": "😊",
  "searchQuery": "happy pop upbeat songs",
  "response": "You're in a great mood! Here are some upbeat tracks to keep the energy going."
}
Choose searchQuery to describe the music that fits the user's mood for searching on iTunes.
Make searchQuery specific (e.g. "sad acoustic guitar ballad" not just "sad").`;

  // Fetch call to the Gemini API — passing the API key as a query parameter
  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 256 },
    }),
  });

  // If the response is not OK (e.g. 401, 429), throw an error with the message
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || `Gemini error ${res.status}`);
  }

  const data = await res.json();
  // Extract the raw text from Gemini's response structure
  const raw  = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  // Remove any markdown code fences Gemini might have added
  const cleaned = raw.replace(/```json\n?|```/g, '').trim();
  return JSON.parse(cleaned); // parse the JSON string into an object
}

// ── Direct artist/song search detector ─────────────────────────────────────────
// Catches phrases like: "play some drake", "i wanna listen to ed sheeran"
const DIRECT_SEARCH_PATTERNS = [
  /(?:wanna|want to|can you|please)?\s*(?:listen to|play|put on|hear|find)\s+(?:some\s+)?(.+)/i,
  /(?:give me|show me|queue up|add)\s+(?:some\s+)?(.+?)(?:\s+(?:music|songs?|tracks?))?$/i,
  /(?:i(?:'m|\s+am)\s+in(?:to)?|i love|i like|big fan of)\s+(.+)/i,
  /^(?:some\s+)?(.+?)\s+(?:music|songs?|tracks?|vibes?)$/i,
];

// detectDirectSearch: returns the search query if matched, or null if no match
function detectDirectSearch(text) {
  const cleaned = text.trim().replace(/[!?.]+$/, ''); // remove trailing punctuation
  for (const pattern of DIRECT_SEARCH_PATTERNS) {
    const m = cleaned.match(pattern); // try each regex pattern
    if (m) {
      const query = m[1].trim();
      // Reject single common words — probably not an artist name
      if (query.length >= 2 && !['a', 'an', 'the', 'me', 'my', 'up', 'on', 'something'].includes(query)) {
        return query; // return the detected artist/song name
      }
    }
  }
  return null; // no direct search pattern detected
}

// ── MOOD_MAP — keyword → mood data ────────────────────────────────────────────
// Maps simple mood keywords to the data structure the chat needs
const MOOD_MAP = {
  sad:        { mood: 'sad',        emoji: '😢', searchQuery: 'sad acoustic ballad',      response: "I can feel that. Here are some songs that match your mood." },
  depressed:  { mood: 'sad',        emoji: '😔', searchQuery: 'emotional piano songs',    response: "Sometimes music is the best comfort. Sending you these." },
  happy:      { mood: 'happy',      emoji: '😊', searchQuery: 'happy pop upbeat',         response: "Love the energy! Here's some feel-good music for you." },
  excited:    { mood: 'excited',    emoji: '🥳', searchQuery: 'excited high energy pop',  response: "Let's go! Here are some tracks to match that excitement!" },
  angry:      { mood: 'angry',      emoji: '😤', searchQuery: 'metal rage intense',       response: "Let it out. Here's some music to channel that energy." },
  chill:      { mood: 'chill',      emoji: '😌', searchQuery: 'lofi chill beats',         response: "Perfect vibe. Here's something smooth and relaxed." },
  relax:      { mood: 'relaxed',    emoji: '🛋️', searchQuery: 'relaxing ambient music',   response: "Take it easy with these calming tracks." },
  focus:      { mood: 'focused',    emoji: '🎯', searchQuery: 'focus study instrumental', response: "Get in the zone with these concentration tracks." },
  study:      { mood: 'studying',   emoji: '📚', searchQuery: 'lofi study beats',         response: "Study mode activated. Here's your playlist." },
  workout:    { mood: 'energetic',  emoji: '💪', searchQuery: 'workout gym motivation',   response: "Let's crush it! Here's your workout playlist." },
  hype:       { mood: 'hyped',      emoji: '🔥', searchQuery: 'hype trap rap',            response: "Maximum hype incoming!" },
  party:      { mood: 'party',      emoji: '🎊', searchQuery: 'party dance hits',         response: "Time to party! Here's the soundtrack." },
  dance:      { mood: 'dancing',    emoji: '💃', searchQuery: 'dance edm pop',            response: "Let's dance! Here are some floor-fillers." },
  love:       { mood: 'romantic',   emoji: '❤️', searchQuery: 'romantic love songs',      response: "How sweet! Here are some love songs for you." },
  romantic:   { mood: 'romantic',   emoji: '💕', searchQuery: 'romantic date night music',response: "Setting the mood with these romantic tracks." },
  sleep:      { mood: 'sleepy',     emoji: '😴', searchQuery: 'sleep calm ambient',       response: "Wind down with these soothing tracks." },
  tired:      { mood: 'tired',      emoji: '😪', searchQuery: 'relaxing calm music',      response: "Rest your mind with these gentle sounds." },
  nostalgic:  { mood: 'nostalgic',  emoji: '📻', searchQuery: 'nostalgic 90s throwback',  response: "Taking you back with these classic vibes." },
  heartbreak: { mood: 'heartbroken',emoji: '💔', searchQuery: 'heartbreak breakup songs', response: "It gets better. Here are some songs that understand." },
  night:      { mood: 'late night', emoji: '🌙', searchQuery: 'late night chill ambient',     response: "Perfect for the late hours. Here's your night soundtrack." },
};

// keywordFallback: detects mood from text when Gemini is not available
function keywordFallback(text) {
  const lower = text.toLowerCase();
  // Check each keyword in our map
  for (const [kw, data] of Object.entries(MOOD_MAP)) {
    if (lower.includes(kw)) return data; // return the first matching mood
  }
  // Additional fuzzy patterns for common phrases
  if (/feel(ing)?\s+(down|blue|low|bad)/.test(lower))                return MOOD_MAP.sad;
  if (/need\s+to\s+(focus|study|work|concentrate)/.test(lower))     return MOOD_MAP.study;
  if (/let'?s?\s+(go|party|dance|celebrate)/.test(lower))           return MOOD_MAP.party;
  if (/can'?t\s+sleep/.test(lower))                                  return MOOD_MAP.sleep;
  if (/just\s+(got|been)\s+(dump|broke|cheated|heart)/.test(lower)) return MOOD_MAP.heartbreak;
  if (/ace[d]?\s+(my|the)\s+exam/.test(lower))                      return MOOD_MAP.excited;
  if (/in\s+(love|a\s+relationship)/.test(lower))                    return MOOD_MAP.love;
  if (/late\s+night|night\s+vibes/.test(lower))                      return MOOD_MAP.night;
  return null; // no mood detected
}

// ── Quick mood suggestion chips ────────────────────────────────────────────────
const QUICK_CHIPS = [
  "I'm feeling happy today 😊",
  "Need to study 📚",
  "Workout time 💪",
  "Feeling super chill ✨",
  "I'm really sad 😢",
  "Party mood 🎉",
  "Late night vibes 🌙",
  "Just got dumped 💔",
];

// ── ApiKeyModal ────────────────────────────────────────────────────────────────
// Modal dialog to let the user enter their Gemini API key.
// Props: onSave (called with key string), onSkip (called when user skips)
function ApiKeyModal({ onSave, onSkip }) {
  const [key,     setKey]     = useState('');      // the text in the input
  const [visible, setVisible] = useState(false);   // true = show password as text

  return (
    // Full-screen dark overlay — replaces framer-motion animated backdrop
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Modal card */}
      <div className="bg-[#161616] border border-white/10 rounded-3xl p-7 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1db954] to-[#7c3aed] flex items-center justify-center">
            <Key size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Enable Gemini AI</h2>
            <p className="text-[#a7a7a7] text-xs">Real AI mood detection</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-[#a7a7a7] text-sm leading-relaxed mb-4">
          Get a <span className="text-white font-semibold">free API key</span> from{' '}
          <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer"
            className="text-[#1db954] underline hover:text-[#1ed760]">
            aistudio.google.com
          </a>
          {' '}— it understands natural sentences like{' '}
          <em className="text-white">"I just aced my exam 🎉"</em> or{' '}
          <em className="text-white">"bro I got my heart broken"</em>.
        </p>

        {/* API key input with show/hide toggle */}
        <div className="relative mb-4">
          <input
            type={visible ? 'text' : 'password'} // toggle type to show/hide key
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-[#0a0a0a] border border-white/10 focus:border-[#1db954]/50
              rounded-xl px-4 py-3 text-white text-sm outline-none pr-10 transition-colors"
          />
          {/* Toggle visibility button */}
          <button
            onClick={() => setVisible(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#535353] hover:text-white transition-colors"
          >
            {visible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {/* Save key button — only enabled if something is typed */}
          <button
            onClick={() => key.trim() && onSave(key.trim())}
            disabled={!key.trim()}
            className="flex-1 py-2.5 bg-[#1db954] hover:bg-[#1ed760] disabled:opacity-30
              text-black font-bold text-sm rounded-xl transition-colors active:scale-96"
          >
            Enable AI
          </button>
          {/* Use Keywords button — skips AI setup */}
          <button
            onClick={onSkip}
            className="flex-1 py-2.5 bg-white/8 hover:bg-white/12 border border-white/10
              text-white text-sm rounded-xl transition-colors active:scale-96"
          >
            Use Keywords
          </button>
        </div>
      </div>
    </div>
  );
}

// ── TypingIndicator ────────────────────────────────────────────────────────────
// Shows animated bouncing dots while the AI is thinking.
// Props: label — text shown next to the dots
function TypingIndicator({ label = 'Thinking' }) {
  return (
    // Replaces framer-motion animated div — uses bubble-in CSS class for animation
    <div className="flex items-end gap-2 bubble-in">
      {/* AI avatar badge */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1db954] to-[#7c3aed] flex items-center justify-center flex-shrink-0">
        <Sparkles size={13} className="text-white" />
      </div>
      {/* Bubble with animated dots */}
      <div className="bg-[#1e1e1e] border border-white/[0.06] rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2">
        <span className="text-[#a7a7a7] text-xs">{label}</span>
        <div className="flex items-end gap-1 h-4">
          {/* Three bouncing dots — animated by .typing-dot CSS class */}
          <span className="typing-dot w-1.5 h-1.5 bg-[#1db954] rounded-full" />
          <span className="typing-dot w-1.5 h-1.5 bg-[#1db954] rounded-full" />
          <span className="typing-dot w-1.5 h-1.5 bg-[#1db954] rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ── MiniSongRow ────────────────────────────────────────────────────────────────
// A compact song row shown inside a chat bubble.
// Props: song, allSongs (the full list for queue context)
function MiniSongRow({ song, allSongs }) {
  // We use context here to access playSong, currentSong, isPlaying
  const { playSong, currentSong, isPlaying } = usePlayer();
  const active = currentSong?.id === song.id; // is this the currently playing song?

  return (
    // Replaces framer-motion whileHover — plain CSS hover:translate-x-1
    <div
      onClick={() => playSong(song, allSongs)} // click to play this specific song
      className="flex items-center gap-2.5 bg-black/30 hover:bg-black/50 rounded-xl px-3 py-2
        cursor-pointer transition-colors border border-white/5 hover:translate-x-0.5"
    >
      {/* Album art thumbnail */}
      {(song.cover || song.album?.cover) ? (
        <img
          src={song.cover || song.album?.cover}
          alt={song.title}
          className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
          onError={e => { e.target.style.display = 'none'; }} // hide broken images
        />
      ) : (
        <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
          <Music2 size={14} className="text-[#535353]" />
        </div>
      )}

      {/* Song title and artist */}
      <div className="overflow-hidden flex-1">
        <p className={`text-xs font-semibold truncate ${active ? 'text-[#1db954]' : 'text-white'}`}>
          {song.title}
        </p>
        <p className="text-[10px] text-[#a7a7a7] truncate">
          {/* Artist can be a string or a nested object */}
          {typeof song.artist === 'string' ? song.artist : song.artist?.name}
        </p>
      </div>

      {/* EQ bars shown while this specific song is playing */}
      {active && isPlaying && (
        <div className="flex items-end gap-0.5 h-4 flex-shrink-0">
          <span className="eq-bar" style={{ height: 6 }} />
          <span className="eq-bar" style={{ height: 12 }} />
          <span className="eq-bar" style={{ height: 6 }} />
        </div>
      )}
    </div>
  );
}

// ── ChatBubble ─────────────────────────────────────────────────────────────────
// A single message bubble — either from the user (right, green) or AI (left, dark).
// Props: msg (message object)
function ChatBubble({ msg }) {
  const isUser = msg.role === 'user'; // true = user message, false = AI message

  return (
    // Replaces framer-motion animated div — uses bubble-in CSS animation
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end gap-2 bubble-in`}>

      {/* AI avatar shown only for bot messages */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1db954] to-[#7c3aed] flex items-center justify-center flex-shrink-0 mb-0.5">
          <Sparkles size={13} className="text-white" />
        </div>
      )}

      {/* Message bubble */}
      <div className={`max-w-[82%] flex flex-col gap-2.5 rounded-2xl px-4 py-3 text-sm leading-relaxed
        ${isUser
          // User: green gradient bubble
          ? 'bg-gradient-to-br from-[#1db954] to-[#158a3e] text-black rounded-br-sm font-medium shadow-lg shadow-green-900/30'
          // AI: dark bubble with subtle border
          : 'bg-[#1e1e1e] text-white rounded-bl-sm border border-white/[0.06]'
        }`}
      >
        {/* Mood badge (e.g. "😢 sad") shown only on AI messages that detected a mood */}
        {msg.moodEmoji && (
          <span className="self-start text-[10px] font-bold uppercase tracking-wider px-2.5 py-1
            rounded-full bg-white/10 border border-white/10 text-white/80">
            {msg.moodEmoji} {msg.mood}
          </span>
        )}

        {/* The text content of the message */}
        <p>{msg.content}</p>

        {/* List of songs inside the AI's message (up to 5 shown) */}
        {msg.songs?.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1">
            {msg.songs.slice(0, 5).map(s => (
              <MiniSongRow key={s.id} song={s} allSongs={msg.songs} />
            ))}
            {/* "+3 more queued" hint if there are more than 5 */}
            {msg.songs.length > 5 && (
              <p className="text-[11px] text-[#a7a7a7] text-center mt-0.5">
                +{msg.songs.length - 5} more queued ↓
              </p>
            )}
          </div>
        )}

        {/* Timestamp in the bottom-right of the bubble */}
        <span className={`text-[10px] self-end ${isUser ? 'text-black/50' : 'text-[#535353]'}`}>
          {msg.time}
        </span>
      </div>
    </div>
  );
}

// ── MoodChat (main component) ──────────────────────────────────────────────────
export default function MoodChat() {
  // We use context here to access setMoodQueue and addMoodEntry without passing props
  const { setMoodQueue, addMoodEntry } = usePlayer();

  // geminiKey: loaded directly from src/config.js — no UI prompt needed
  const geminiKey = GEMINI_API_KEY && GEMINI_API_KEY !== 'PASTE_YOUR_KEY_HERE'
    ? GEMINI_API_KEY
    : (localStorage.getItem('geminiKey') || ''); // fallback: still works if key was saved before

  // Build the first "welcome" message shown when chat opens
  const welcome = {
    id:      'welcome',
    role:    'bot',
    content: geminiKey
      ? '🤖 Gemini AI is active! Tell me how you feel in any way — a sentence, an emoji, even slang — and I\'ll build your perfect playlist.'
      : '🎧 Hi! Tell me how you\'re feeling and I\'ll queue the right music.',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  // messages: array of all chat messages shown in the UI
  const [messages,     setMessages]     = useState([welcome]);
  // input: what the user is currently typing
  const [input,        setInput]        = useState('');
  // loading: true while waiting for AI or song fetch to complete
  const [loading,      setLoading]      = useState(false);
  // typingLabel: the text shown next to the bouncing dots
  const [typingLabel,  setTypingLabel]  = useState('Thinking');

  // bottomRef: used to auto-scroll chat to the newest message
  const bottomRef = useRef(null);
  // inputRef: used to refocus the input after sending a message
  const inputRef  = useRef(null);

  // This runs when messages or loading changes. It scrolls to the latest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Helper: returns the current time as a formatted string (e.g. "2:34 PM")
  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Key management is no longer needed — key comes from src/config.js

  // ── sendMessage ─────────────────────────────────────────────────────────────
  // Main function: processes the user's message and fetches songs.
  const sendMessage = async (text = input) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return; // don't send empty messages or if already loading

    setInput(''); // clear the input box

    // Create the user's message object and add it to the chat
    const userMsg = { id: Date.now(), role: 'user', content: trimmed, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true); // show the typing indicator

    let moodData    = null; // will hold { mood, emoji, searchQuery, response }
    let directQuery = null; // will hold detected artist/song name if applicable

    // ── Step 0: Check if user is asking for a specific artist or song ──────
    directQuery = detectDirectSearch(trimmed);

    if (directQuery) {
      // User said "play some drake" — skip mood detection and search directly
      setTypingLabel(`Searching for "${directQuery}"`);
      let songs = [];
      try { songs = await fetchSongs(directQuery, 20); } catch { songs = []; }

      const botMsg = {
        id:      Date.now() + 1,
        role:    'bot',
        time:    now(),
        content: songs.length > 0
          ? `🎵 Here's ${directQuery} for you!`
          : `😕 Couldn't find "${directQuery}" right now. Try a different spelling?`,
        songs: songs.slice(0, 8),
      };
      setMessages(prev => [...prev, botMsg]);
      if (songs.length > 0) setMoodQueue(songs); // queue all songs at once
      addMoodEntry(userMsg);
      setLoading(false);
      inputRef.current?.focus();
      return;
    }

    // ── Step 1: Detect mood (Gemini AI or keyword fallback) ────────────────
    if (geminiKey) {
      setTypingLabel('Asking Gemini AI'); // update the typing indicator label
      try {
        moodData = await callGemini(trimmed, geminiKey); // call Gemini
      } catch (err) {
        // Handle specific error types and show appropriate messages
        const msg     = err.message || '';
        const isAuth  = msg.includes('API_KEY_INVALID') || msg.includes('401');
        const isQuota = msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429');
        const shortMsg = msg.split('.')[0].replace(/\*.*/,'').trim().slice(0, 120);

        setMessages(prev => [...prev, {
          id: Date.now(), role: 'bot', time: now(),
          content: isQuota
            ? '⚠️ Gemini quota exceeded — your free tier limit is reached. Falling back to keyword detection.'
            : isAuth
              ? '⚠️ Invalid Gemini API key. Tap the key button to update it. Falling back to keywords.'
              : `⚠️ Gemini: ${shortMsg}. Falling back to keyword detection.`,
        }]);
        if (isAuth) { setGeminiKey(''); localStorage.removeItem('geminiKey'); }
        moodData = keywordFallback(trimmed); // fall back to keywords on any error
      }
    } else {
      // No API key — use keyword detection directly
      moodData = keywordFallback(trimmed);
    }

    // If no mood was detected at all, ask the user to be more specific
    if (!moodData) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'bot', time: now(),
        content: "I couldn't detect your mood 🤔 Try: \"I'm sad\", \"need to study\", \"play drake\", or \"workout time\".",
      }]);
      setLoading(false);
      return;
    }

    // ── Step 2: Fetch songs from iTunes using the detected mood query ───────
    setTypingLabel('Finding songs'); // update typing label while fetching songs
    let songs = [];
    try { songs = await fetchSongs(moodData.searchQuery, 25); } catch { songs = []; }

    // Build the AI's reply message
    const botMsg = {
      id:        Date.now() + 1,
      role:      'bot',
      time:      now(),
      content:   songs.length > 0
        ? moodData.response
        : `${moodData.response} (Couldn't reach the music API right now, but I detected your mood!)`,
      mood:      moodData.mood,
      moodEmoji: moodData.emoji,
      songs:     songs.slice(0, 8), // show up to 8 songs in the bubble
    };

    setMessages(prev => [...prev, botMsg]);
    if (songs.length > 0) setMoodQueue(songs); // load all songs into the player queue
    addMoodEntry(userMsg); // save to mood history
    addMoodEntry(botMsg);

    setLoading(false);
    inputRef.current?.focus(); // put cursor back in the input
  };

  // handleKey: sends message on Enter key (not Shift+Enter)
  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // clearChat: resets the chat to just the welcome message
  const clearChat = () => setMessages([{
    ...welcome,
    id: Date.now(),
    content: geminiKey
      ? '🤖 Chat cleared! Gemini AI is ready. Tell me how you\'re feeling!'
      : '🎧 Chat cleared! Tell me your mood and I\'ll find the music.',
  }]);

  return (
      <div className="flex flex-col h-full overflow-hidden">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/[0.05]">
          <div className="flex items-center justify-between mb-4">
            {/* Title and AI status */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1db954] to-[#7c3aed] flex items-center justify-center shadow-lg">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-xl leading-tight">Mood Chat</h1>
                <div className="flex items-center gap-1.5">
                  {geminiKey ? (
                    <span className="text-[10px] font-semibold text-[#1db954] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1db954] inline-block" />
                      Gemini AI Active
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#535353]">Keyword detection mode — add key to src/config.js</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right side: only Clear chat button remains (key is in src/config.js) */}
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5
                  border border-white/8 text-[#a7a7a7] hover:text-white text-xs font-medium transition-all active:scale-90"
              >
                <RefreshCw size={11} /> Clear
              </button>
            </div>
          </div>

          {/* ── Quick mood chips ─────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-2">
            {QUICK_CHIPS.map(chip => (
              // Each chip is a button that sends the chip text as a message
              <button
                key={chip}
                onClick={() => sendMessage(chip)}
                disabled={loading} // disable all chips while AI is thinking
                className="text-xs px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08]
                  text-[#a7a7a7] hover:text-white hover:bg-white/10 hover:border-white/15
                  disabled:opacity-40 transition-all hover:scale-104 active:scale-96"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* ── Messages area ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {/* Render each message as a ChatBubble */}
          {messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)}

          {/* Show typing indicator while loading — replaces AnimatePresence */}
          {loading && <TypingIndicator label={typingLabel} />}

          {/* Invisible div at the bottom — scrolled into view after each message */}
          <div ref={bottomRef} />
        </div>

        {/* ── Input area ────────────────────────────────────────────────────── */}
        <div className="px-6 pb-6 pt-3 flex-shrink-0 border-t border-white/[0.05]">
          {/* No key banner — key is set in src/config.js */}

          {/* Text input row */}
          <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-2xl px-4 py-3
            border border-white/[0.07] focus-within:border-[#1db954]/40 transition-colors">
            <Music2 size={16} className="text-[#535353] flex-shrink-0" />
            <input
              ref={inputRef}
              id="mood-chat-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading} // disable typing while AI is processing
              placeholder={geminiKey
                ? 'Try "I just aced my exam!" or "play some Drake" 🎉'
                : 'Try "happy", "chill", "energetic", or an artist name...'
              }
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-[#535353] disabled:opacity-50"
            />
            {/* Send button — disabled if input is empty or loading */}
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              aria-label="Send"
              className="w-8 h-8 rounded-xl bg-[#1db954] hover:bg-[#1ed760] flex items-center justify-center
                disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0
                hover:scale-110 active:scale-90"
            >
              <Send size={13} className="text-black" />
            </button>
          </div>

          {/* Keyboard shortcut hints */}
          <p className="text-[#535353] text-[10px] text-center mt-2">
            Space = play/pause · Alt+→/← = next/prev · M = mute
          </p>
        </div>
      </div>
  );
}
