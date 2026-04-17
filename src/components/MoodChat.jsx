import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, RefreshCw, Music2, Key, Eye, EyeOff, X } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { fetchSongs } from '../utils/api';

/* ─── Gemini API call ──────────────────────────────────────────────────────────
   Returns { mood, emoji, searchQuery, response } from Gemini 2.0 Flash.
   Falls back to keyword detection if API key missing or call fails.
─────────────────────────────────────────────────────────────────────────────── */
const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function callGemini(userMessage, apiKey) {
  const prompt = `The user said: "${userMessage}".
Based on their mood, return ONLY a JSON object (no markdown, no code block, no explanation — raw JSON only):
{
  "mood": "happy",
  "emoji": "😊",
  "searchQuery": "happy pop upbeat songs",
  "response": "You're in a great mood! Here are some upbeat tracks to keep the energy going."
}
Choose searchQuery to describe the music that fits the user's mood for searching on Deezer.
Make searchQuery specific (e.g. "sad acoustic guitar ballad" not just "sad").`;

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 256 },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || `Gemini error ${res.status}`);
  }

  const data = await res.json();
  const raw  = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Strip markdown code fences if present
  const cleaned = raw.replace(/```json\n?|```/g, '').trim();
  return JSON.parse(cleaned);
}

/* ─── Keyword fallback (no API key) ────────────────────────────────────────── */
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
};

function keywordFallback(text) {
  const lower = text.toLowerCase();
  for (const [kw, data] of Object.entries(MOOD_MAP)) {
    if (lower.includes(kw)) return data;
  }
  // Fuzzy
  if (/feel(ing)?\s+(down|blue|low|bad)/.test(lower)) return MOOD_MAP.sad;
  if (/need\s+to\s+(focus|study|work|concentrate)/.test(lower)) return MOOD_MAP.study;
  if (/let'?s?\s+(go|party|dance|celebrate)/.test(lower)) return MOOD_MAP.party;
  if (/can'?t\s+sleep/.test(lower)) return MOOD_MAP.sleep;
  if (/just\s+(got|been)\s+(dump|broke|cheated|heart)/.test(lower)) return MOOD_MAP.heartbreak;
  if (/ace[d]?\s+(my|the)\s+exam/.test(lower)) return MOOD_MAP.excited;
  if (/in\s+(love|a\s+relationship)/.test(lower)) return MOOD_MAP.love;
  return null;
}

/* ─── API Key modal ─────────────────────────────────────────────────────────── */
function ApiKeyModal({ onSave, onSkip }) {
  const [key,     setKey]     = useState('');
  const [visible, setVisible] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#161616] border border-white/10 rounded-3xl p-7 max-w-md w-full shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1db954] to-[#7c3aed] flex items-center justify-center">
            <Key size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Enable Gemini AI</h2>
            <p className="text-[#a7a7a7] text-xs">Real AI mood detection</p>
          </div>
        </div>

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

        <div className="relative mb-4">
          <input
            type={visible ? 'text' : 'password'}
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-[#0a0a0a] border border-white/10 focus:border-[#1db954]/50
              rounded-xl px-4 py-3 text-white text-sm outline-none pr-10 transition-colors"
          />
          <button
            onClick={() => setVisible(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#535353] hover:text-white transition-colors"
          >
            {visible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => key.trim() && onSave(key.trim())}
            disabled={!key.trim()}
            className="flex-1 py-2.5 bg-[#1db954] hover:bg-[#1ed760] disabled:opacity-30
              text-black font-bold text-sm rounded-xl transition-colors"
          >
            Enable AI
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onSkip}
            className="flex-1 py-2.5 bg-white/8 hover:bg-white/12 border border-white/10
              text-white text-sm rounded-xl transition-colors"
          >
            Use Keywords
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Quick mood chips ──────────────────────────────────────────────────────── */
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

/* ─── Typing animation ──────────────────────────────────────────────────────── */
function TypingIndicator({ label = 'Thinking' }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-end gap-2"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1db954] to-[#7c3aed] flex items-center justify-center flex-shrink-0">
        <Sparkles size={13} className="text-white" />
      </div>
      <div className="bg-[#1e1e1e] border border-white/[0.06] rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2">
        <span className="text-[#a7a7a7] text-xs">{label}</span>
        <div className="flex items-end gap-1 h-4">
          <span className="typing-dot w-1.5 h-1.5 bg-[#1db954] rounded-full" />
          <span className="typing-dot w-1.5 h-1.5 bg-[#1db954] rounded-full" />
          <span className="typing-dot w-1.5 h-1.5 bg-[#1db954] rounded-full" />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Mini song row ─────────────────────────────────────────────────────────── */
function MiniSongRow({ song, allSongs }) {
  const { playSong, currentSong, isPlaying } = usePlayer();
  const active = currentSong?.id === song.id;

  return (
    <motion.div
      whileHover={{ x: 3 }}
      onClick={() => playSong(song, allSongs)}
      className="flex items-center gap-2.5 bg-black/30 hover:bg-black/50 rounded-xl px-3 py-2 cursor-pointer transition-colors border border-white/5"
    >
      {(song.cover || song.album?.cover) ? (
        <img
          src={song.cover || song.album?.cover}
          alt={song.title}
          className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
          onError={e => { e.target.style.display='none'; }}
        />
      ) : (
        <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
          <Music2 size={14} className="text-[#535353]" />
        </div>
      )}
      <div className="overflow-hidden flex-1">
        <p className={`text-xs font-semibold truncate ${active ? 'text-[#1db954]' : 'text-white'}`}>{song.title}</p>
        <p className="text-[10px] text-[#a7a7a7] truncate">
          {typeof song.artist === 'string' ? song.artist : song.artist?.name}
        </p>
      </div>
      {active && isPlaying && (
        <div className="flex items-end gap-0.5 h-4 flex-shrink-0">
          <span className="eq-bar" style={{ height: 6 }} />
          <span className="eq-bar" style={{ height: 12 }} />
          <span className="eq-bar" style={{ height: 6 }} />
        </div>
      )}
    </motion.div>
  );
}

/* ─── Chat bubble ───────────────────────────────────────────────────────────── */
function ChatBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end gap-2`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1db954] to-[#7c3aed] flex items-center justify-center flex-shrink-0 mb-0.5">
          <Sparkles size={13} className="text-white" />
        </div>
      )}
      <div className={`max-w-[82%] flex flex-col gap-2.5 rounded-2xl px-4 py-3 text-sm leading-relaxed
        ${isUser
          ? 'bg-gradient-to-br from-[#1db954] to-[#158a3e] text-black rounded-br-sm font-medium shadow-lg shadow-green-900/30'
          : 'bg-[#1e1e1e] text-white rounded-bl-sm border border-white/[0.06]'
        }`}
      >
        {/* AI mood badge */}
        {msg.moodEmoji && (
          <span className="self-start text-[10px] font-bold uppercase tracking-wider px-2.5 py-1
            rounded-full bg-white/10 border border-white/10 text-white/80">
            {msg.moodEmoji} {msg.mood}
          </span>
        )}

        <p>{msg.content}</p>

        {/* Inline song list */}
        {msg.songs?.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1">
            {msg.songs.slice(0, 5).map(s => (
              <MiniSongRow key={s.id} song={s} allSongs={msg.songs} />
            ))}
            {msg.songs.length > 5 && (
              <p className="text-[11px] text-[#a7a7a7] text-center mt-0.5">
                +{msg.songs.length - 5} more queued ↓
              </p>
            )}
          </div>
        )}

        <span className={`text-[10px] self-end ${isUser ? 'text-black/50' : 'text-[#535353]'}`}>
          {msg.time}
        </span>
      </div>
    </motion.div>
  );
}

/* ─── Main MoodChat component ───────────────────────────────────────────────── */
export default function MoodChat() {
  const { setMoodQueue, addMoodEntry } = usePlayer();

  // API key state — persisted in localStorage
  const [geminiKey, setGeminiKey]     = useState(() => localStorage.getItem('geminiKey') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyDeclined, setKeyDeclined]  = useState(() => localStorage.getItem('geminiKeyDeclined') === '1');

  const welcome = {
    id:      'welcome',
    role:    'bot',
    content: geminiKey
      ? '🤖 Gemini AI is active! Tell me how you feel in any way — a sentence, an emoji, even slang — and I\'ll build your perfect playlist.'
      : '🎧 Hi! Tell me how you\'re feeling and I\'ll queue the right music. You can also enable Gemini AI for smarter detection.',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const [messages, setMessages] = useState([welcome]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [typingLabel, setTypingLabel] = useState('Thinking');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  /* ── Key management ──────────────────────────────────────────────────────── */
  const saveKey = (key) => {
    setGeminiKey(key);
    localStorage.setItem('geminiKey', key);
    setShowKeyModal(false);
    setMessages(prev => [...prev, {
      id: Date.now(), role: 'bot', time: now(),
      content: '✅ Gemini AI enabled! I can now understand any mood you describe — try something like "I just aced my exam!" or "bro I\'m heartbroken" 🎯',
    }]);
  };

  const declineKey = () => {
    setKeyDeclined(true);
    localStorage.setItem('geminiKeyDeclined', '1');
    setShowKeyModal(false);
  };

  const removeKey = () => {
    setGeminiKey('');
    localStorage.removeItem('geminiKey');
    setMessages(prev => [...prev, {
      id: Date.now(), role: 'bot', time: now(),
      content: 'Gemini AI disabled. Falling back to keyword detection.',
    }]);
  };

  /* ── Send message ────────────────────────────────────────────────────────── */
  const sendMessage = useCallback(async (text = input) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput('');

    const userMsg = { id: Date.now(), role: 'user', content: trimmed, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    let moodData = null;

    // ── Step 1: Detect mood via Gemini or keyword fallback ────────────────
    if (geminiKey) {
      setTypingLabel('Asking Gemini AI');
      try {
        moodData = await callGemini(trimmed, geminiKey);
      } catch (err) {
        const isAuthError = err.message?.includes('API_KEY_INVALID') || err.message?.includes('401');
        setMessages(prev => [...prev, {
          id: Date.now(), role: 'bot', time: now(),
          content: isAuthError
            ? '⚠️ Invalid Gemini API key. Please update it using the key icon. Falling back to keyword detection.'
            : `⚠️ Gemini error: ${err.message}. Falling back to keyword detection.`,
        }]);
        if (isAuthError) { setGeminiKey(''); localStorage.removeItem('geminiKey'); }
        moodData = keywordFallback(trimmed);
      }
    } else {
      moodData = keywordFallback(trimmed);
    }

    if (!moodData) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'bot', time: now(),
        content: "I couldn't detect your mood 🤔 Try: \"I'm sad\", \"need to study\", \"workout time\", or enable Gemini AI for smarter detection.",
      }]);
      setLoading(false);
      return;
    }

    // ── Step 2: Fetch songs from Deezer ──────────────────────────────────
    setTypingLabel('Finding songs');
    let songs = [];
    try {
      songs = await fetchSongs(moodData.searchQuery, 25);
    } catch {
      songs = [];
    }

    const botMsg = {
      id:       Date.now() + 1,
      role:     'bot',
      time:     now(),
      content:  songs.length > 0
        ? moodData.response
        : `${moodData.response} (Couldn't reach the music API right now, but I detected your mood!)`,
      mood:      moodData.mood,
      moodEmoji: moodData.emoji,
      songs:     songs.slice(0, 8),
    };

    setMessages(prev => [...prev, botMsg]);
    if (songs.length > 0) setMoodQueue(songs);
    addMoodEntry(userMsg);
    addMoodEntry(botMsg);

    setLoading(false);
    inputRef.current?.focus();
  }, [input, loading, geminiKey, setMoodQueue, addMoodEntry]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => setMessages([{
    ...welcome,
    id: Date.now(),
    content: geminiKey
      ? '🤖 Chat cleared! Gemini AI is ready. Tell me how you\'re feeling!'
      : '🎧 Chat cleared! Tell me your mood and I\'ll find the music.',
  }]);

  return (
    <>
      {/* API Key modal */}
      <AnimatePresence>
        {showKeyModal && (
          <ApiKeyModal onSave={saveKey} onSkip={declineKey} />
        )}
      </AnimatePresence>

      <div className="flex flex-col h-full overflow-hidden">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/[0.05]">
          <div className="flex items-center justify-between mb-4">
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
                    <span className="text-[10px] text-[#535353]">Keyword detection mode</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Key toggle button */}
              {geminiKey ? (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={removeKey}
                  title="Remove Gemini API key"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#1db954]/10
                    border border-[#1db954]/20 text-[#1db954] hover:bg-red-900/20 hover:text-red-400
                    hover:border-red-500/20 text-xs font-medium transition-all"
                >
                  <X size={11} /> Key
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowKeyModal(true)}
                  title="Enable Gemini AI"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5
                    border border-white/8 text-[#a7a7a7] hover:text-white hover:bg-white/10 text-xs font-medium transition-all"
                >
                  <Key size={11} /> Add AI Key
                </motion.button>
              )}

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={clearChat}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5
                  border border-white/8 text-[#a7a7a7] hover:text-white text-xs font-medium transition-all"
              >
                <RefreshCw size={11} /> Clear
              </motion.button>
            </div>
          </div>

          {/* Quick mood chips */}
          <div className="flex flex-wrap gap-2">
            {QUICK_CHIPS.map(chip => (
              <motion.button
                key={chip}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => sendMessage(chip)}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08]
                  text-[#a7a7a7] hover:text-white hover:bg-white/10 hover:border-white/15
                  disabled:opacity-40 transition-all"
              >
                {chip}
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Messages ────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <AnimatePresence initial={false}>
            {messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)}
            {loading && <motion.div key="typing"><TypingIndicator label={typingLabel} /></motion.div>}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* ── Input ───────────────────────────────────────────────────────── */}
        <div className="px-6 pb-6 pt-3 flex-shrink-0 border-t border-white/[0.05]">
          {!geminiKey && !keyDeclined && (
            <motion.button
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setShowKeyModal(true)}
              className="w-full mb-3 py-2 rounded-xl bg-gradient-to-r from-[#1db954]/10 to-[#7c3aed]/10
                border border-[#1db954]/20 text-[#1db954] text-xs font-semibold hover:from-[#1db954]/20
                hover:to-[#7c3aed]/20 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={12} /> Enable Gemini AI for smarter mood detection
            </motion.button>
          )}

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
              disabled={loading}
              placeholder={geminiKey
                ? 'Tell me anything — "I just aced my exam!" 🎉'
                : 'Tell me how you\'re feeling...'
              }
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-[#535353] disabled:opacity-50"
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              aria-label="Send"
              className="w-8 h-8 rounded-xl bg-[#1db954] hover:bg-[#1ed760] flex items-center justify-center
                disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <Send size={13} className="text-black" />
            </motion.button>
          </div>
          <p className="text-[#535353] text-[10px] text-center mt-2">
            Space = play/pause · Alt+→/← = next/prev · M = mute
          </p>
        </div>
      </div>
    </>
  );
}
