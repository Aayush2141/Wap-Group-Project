import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, RefreshCw, Music2, AlertCircle } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { fetchSongs } from '../utils/api';

/* ─── Mood detection map ──────────────────────────────────────────────────────
   Each mood maps to an array of queries. A random one is picked for variety.
─────────────────────────────────────────────────────────────────────────────── */
const MOOD_MAP = {
  // Sad
  sad:         { queries: ['sad acoustic guitar', 'emotional piano ballad'], emoji: '😢', label: 'Sad',          color: '#5b7fe0', pill: 'bg-blue-900/40 border-blue-700/40' },
  depressed:   { queries: ['sad acoustic guitar', 'depression music'],       emoji: '😔', label: 'Depressed',    color: '#5b7fe0', pill: 'bg-blue-900/40 border-blue-700/40' },
  lonely:      { queries: ['lonely songs', 'missing you music'],             emoji: '🥺', label: 'Lonely',       color: '#5b7fe0', pill: 'bg-blue-900/40 border-blue-700/40' },
  heartbreak:  { queries: ['heartbreak ballad', 'breakup songs'],            emoji: '💔', label: 'Heartbroken',  color: '#e05c7b', pill: 'bg-rose-900/40 border-rose-700/40' },
  miss:        { queries: ['missing you songs', 'distance love songs'],      emoji: '💔', label: 'Missing someone', color: '#e05c7b', pill: 'bg-rose-900/40 border-rose-700/40' },

  // Happy
  happy:       { queries: ['happy pop upbeat', 'feel good songs'],           emoji: '😊', label: 'Happy',        color: '#f9c74f', pill: 'bg-yellow-900/40 border-yellow-700/40' },
  excited:     { queries: ['excited energy pop', 'euphoric songs'],          emoji: '🥳', label: 'Excited',      color: '#f9c74f', pill: 'bg-yellow-900/40 border-yellow-700/40' },
  joyful:      { queries: ['joyful songs', 'happy upbeat music'],            emoji: '😄', label: 'Joyful',       color: '#f9c74f', pill: 'bg-yellow-900/40 border-yellow-700/40' },
  great:       { queries: ['feel good hits', 'positive vibes music'],        emoji: '✨', label: 'Feeling great', color: '#f9c74f', pill: 'bg-yellow-900/40 border-yellow-700/40' },

  // Angry
  angry:       { queries: ['rage metal intense', 'anger release music'],     emoji: '😤', label: 'Angry',        color: '#ef233c', pill: 'bg-red-900/40 border-red-700/40' },
  frustrated:  { queries: ['frustration songs', 'intense rock music'],       emoji: '😠', label: 'Frustrated',   color: '#ef233c', pill: 'bg-red-900/40 border-red-700/40' },
  mad:         { queries: ['metal heavy rage', 'punk rock angry'],           emoji: '🤬', label: 'Mad',          color: '#ef233c', pill: 'bg-red-900/40 border-red-700/40' },

  // Energetic / Workout
  energetic:   { queries: ['workout hip hop gym', 'high energy edm'],        emoji: '⚡', label: 'Energetic',    color: '#f77f00', pill: 'bg-orange-900/40 border-orange-700/40' },
  hype:        { queries: ['hype trap', 'gym playlist rap'],                 emoji: '🔥', label: 'Hyped',        color: '#f77f00', pill: 'bg-orange-900/40 border-orange-700/40' },
  workout:     { queries: ['workout motivation songs', 'gym music'],         emoji: '💪', label: 'Workout',      color: '#f77f00', pill: 'bg-orange-900/40 border-orange-700/40' },
  pump:        { queries: ['pumped up songs', 'pre-workout music'],          emoji: '🏋️', label: 'Pumped',       color: '#f77f00', pill: 'bg-orange-900/40 border-orange-700/40' },

  // Chill
  chill:       { queries: ['lofi chill beats', 'chill vibes playlist'],      emoji: '😌', label: 'Chill',        color: '#06d6a0', pill: 'bg-teal-900/40 border-teal-700/40' },
  relax:       { queries: ['relaxing music', 'lo-fi study beats'],           emoji: '🛋️', label: 'Relaxed',      color: '#06d6a0', pill: 'bg-teal-900/40 border-teal-700/40' },
  calm:        { queries: ['calming ambient music', 'peaceful songs'],       emoji: '🌊', label: 'Calm',         color: '#06d6a0', pill: 'bg-teal-900/40 border-teal-700/40' },
  peace:       { queries: ['peaceful ambient', 'meditation music'],          emoji: '☮️', label: 'Peaceful',     color: '#06d6a0', pill: 'bg-teal-900/40 border-teal-700/40' },

  // Focused / Study
  focus:       { queries: ['focus study beats', 'concentration music'],      emoji: '🎯', label: 'Focused',      color: '#4cc9f0', pill: 'bg-cyan-900/40 border-cyan-700/40' },
  study:       { queries: ['study lofi beats', 'studying music playlist'],   emoji: '📚', label: 'Studying',     color: '#4cc9f0', pill: 'bg-cyan-900/40 border-cyan-700/40' },
  work:        { queries: ['work from home music', 'focus instrumental'],    emoji: '💻', label: 'Working',      color: '#4cc9f0', pill: 'bg-cyan-900/40 border-cyan-700/40' },
  concentrate: { queries: ['deep focus music', 'brain power music'],         emoji: '🧠', label: 'Concentrating',color: '#4cc9f0', pill: 'bg-cyan-900/40 border-cyan-700/40' },

  // Romantic
  romantic:    { queries: ['romantic love songs', 'date night music'],       emoji: '💕', label: 'Romantic',     color: '#f72585', pill: 'bg-pink-900/40 border-pink-700/40' },
  love:        { queries: ['love songs', 'romantic ballads'],                emoji: '❤️', label: 'In Love',      color: '#f72585', pill: 'bg-pink-900/40 border-pink-700/40' },
  crush:       { queries: ['crush songs', 'falling in love music'],          emoji: '🥰', label: 'Crushing',     color: '#f72585', pill: 'bg-pink-900/40 border-pink-700/40' },

  // Party
  party:       { queries: ['party hits popular', 'dance party edm'],         emoji: '🎊', label: 'Party',        color: '#9b5de5', pill: 'bg-purple-900/40 border-purple-700/40' },
  dance:       { queries: ['dance music pop', 'edm dancefloor'],             emoji: '💃', label: 'Dancing',      color: '#9b5de5', pill: 'bg-purple-900/40 border-purple-700/40' },
  club:        { queries: ['club music edm', 'techno dance club'],           emoji: '🕺', label: 'Club',         color: '#9b5de5', pill: 'bg-purple-900/40 border-purple-700/40' },

  // Sleepy / Night
  sleep:       { queries: ['sleep aid music', 'lullaby calm'],               emoji: '😴', label: 'Sleepy',       color: '#94a3b8', pill: 'bg-slate-900/40 border-slate-700/40' },
  tired:       { queries: ['tired music chill', 'relaxing sleep music'],     emoji: '😪', label: 'Tired',        color: '#94a3b8', pill: 'bg-slate-900/40 border-slate-700/40' },
  night:       { queries: ['night drive synthwave', 'late night music'],     emoji: '🌙', label: 'Night vibes',  color: '#94a3b8', pill: 'bg-slate-900/40 border-slate-700/40' },

  // Nostalgic
  nostalgic:   { queries: ['nostalgic 90s hits', 'retro throwback music'],   emoji: '📻', label: 'Nostalgic',    color: '#a3b18a', pill: 'bg-green-900/40 border-green-700/40' },
  memories:    { queries: ['memory songs', 'throwback hits'],                emoji: '🎞️', label: 'Memories',     color: '#a3b18a', pill: 'bg-green-900/40 border-green-700/40' },
};

/* ─── Mood keyword detector ─────────────────────────────────────────────────── */
function detectMood(text) {
  const lower = text.toLowerCase();
  for (const [kw, data] of Object.entries(MOOD_MAP)) {
    if (lower.includes(kw)) return { keyword: kw, ...data };
  }
  // Fuzzy patterns
  if (/feel(ing)?\s+(down|blue|low)/.test(lower)) return { keyword: 'sad', ...MOOD_MAP.sad };
  if (/can'?t\s+sleep/.test(lower))              return { keyword: 'sleep', ...MOOD_MAP.sleep };
  if (/need\s+to\s+(focus|study|work)/.test(lower)) return { keyword: 'study', ...MOOD_MAP.study };
  if (/let'?s\s+(go|party|dance)/.test(lower))   return { keyword: 'party', ...MOOD_MAP.party };
  if (/i'?\s?m\s+(good|great|fine|okay)/.test(lower)) return { keyword: 'happy', ...MOOD_MAP.happy };
  return null;
}

/* ─── Quick mood chips ──────────────────────────────────────────────────────── */
const QUICK_CHIPS = [
  "I'm feeling happy 😊",
  "Need to study 📚",
  "Workout time 💪",
  "Feeling chill ✨",
  "I'm really sad 😢",
  "Party mood 🎉",
  "Late night vibes 🌙",
  "Feeling romantic 💕",
];

/* ─── Typing dots indicator ─────────────────────────────────────────────────── */
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 6 }}
      className="flex items-end gap-2"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1db954] to-[#7c3aed] flex items-center justify-center flex-shrink-0">
        <Sparkles size={13} className="text-white" />
      </div>
      <div className="bg-[#1e1e1e] border border-white/[0.06] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        <span className="typing-dot w-2 h-2 bg-[#a7a7a7] rounded-full" />
        <span className="typing-dot w-2 h-2 bg-[#a7a7a7] rounded-full" />
        <span className="typing-dot w-2 h-2 bg-[#a7a7a7] rounded-full" />
      </div>
    </motion.div>
  );
}

/* ─── Mini song row inside chat bubble ─────────────────────────────────────── */
function MiniSongRow({ song, allSongs }) {
  const { playSong, currentSong, isPlaying } = usePlayer();
  const active = currentSong?.id === song.id;

  return (
    <motion.div
      whileHover={{ x: 3 }}
      onClick={() => playSong(song, allSongs)}
      className="flex items-center gap-2.5 bg-black/30 hover:bg-black/50 rounded-xl px-3 py-2 cursor-pointer transition-colors border border-white/5"
    >
      <img
        src={song.album?.coverSmall || song.album?.cover}
        alt={song.title}
        className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
      />
      <div className="overflow-hidden flex-1">
        <p className={`text-xs font-semibold truncate ${active ? 'text-[#1db954]' : 'text-white'}`}>{song.title}</p>
        <p className="text-[10px] text-[#a7a7a7] truncate">{song.artist?.name}</p>
      </div>
      {active && isPlaying && (
        <div className="flex items-end gap-0.5 h-4 flex-shrink-0">
          <span className="eq-bar" style={{ height: 6  }} />
          <span className="eq-bar" style={{ height: 12 }} />
          <span className="eq-bar" style={{ height: 6  }} />
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
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1db954] to-[#7c3aed] flex items-center justify-center flex-shrink-0 mb-0.5 shadow-lg">
          <Sparkles size={13} className="text-white" />
        </div>
      )}

      <div
        className={`max-w-[82%] flex flex-col gap-2.5 rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? 'bg-gradient-to-br from-[#1db954] to-[#158a3e] text-black rounded-br-sm font-medium shadow-lg shadow-green-900/30'
            : 'bg-[#1e1e1e] text-white rounded-bl-sm border border-white/[0.06]'
          }`}
      >
        {/* Mood pill (bot only) */}
        {msg.moodLabel && (
          <span className={`self-start text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${msg.moodPill}`}>
            {msg.moodEmoji} {msg.moodLabel}
          </span>
        )}
        <p>{msg.content}</p>

        {/* Inline songs */}
        {msg.songs?.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1">
            {msg.songs.slice(0, 5).map(s => (
              <MiniSongRow key={s.id} song={s} allSongs={msg.songs} />
            ))}
            {msg.songs.length > 5 && (
              <p className="text-[11px] text-[#a7a7a7] text-center mt-0.5">
                +{msg.songs.length - 5} more in queue ↓
              </p>
            )}
          </div>
        )}

        {/* Timestamp */}
        <span className={`text-[10px] self-end mt-0.5 ${isUser ? 'text-black/50' : 'text-[#535353]'}`}>
          {msg.time}
        </span>
      </div>
    </motion.div>
  );
}

/* ─── MoodChat main component ───────────────────────────────────────────────── */
export default function MoodChat() {
  const { setMoodQueue, addMoodEntry } = usePlayer();

  const welcome = {
    id: 'welcome',
    role: 'bot',
    content: "Hi! I'm your AI mood DJ 🎧 Tell me how you're feeling — in a word, a sentence, or just an emoji — and I'll craft the perfect playlist instantly.",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const [messages, setMessages] = useState([welcome]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  /* Auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  /* Send message */
  const sendMessage = useCallback(async (text = input) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput('');
    const userMsg = { id: Date.now(), role: 'user', content: trimmed, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const mood = detectMood(trimmed);

    if (!mood) {
      setTimeout(() => {
        const errMsg = {
          id: Date.now() + 1, role: 'bot', time: now(),
          content: "Hmm, I couldn't detect a mood there 🤔 Try something like: \"I feel sad\", \"need to focus\", \"workout time\", or \"let's party!\"",
        };
        setMessages(prev => [...prev, errMsg]);
        setLoading(false);
      }, 900);
      return;
    }

    // Pick a random query variant for variety
    const query = mood.queries[Math.floor(Math.random() * mood.queries.length)];

    try {
      const songs = await fetchSongs(query, 25);
      const botMsg = {
        id: Date.now() + 1,
        role: 'bot',
        time: now(),
        content: `${songs.length} songs queued for your "${mood.label}" mood ✨ Playing now — enjoy!`,
        songs: songs.slice(0, 8),
        moodLabel: mood.label,
        moodEmoji: mood.emoji,
        moodPill: mood.pill,
      };
      setMessages(prev => [...prev, botMsg]);
      if (songs.length > 0) setMoodQueue(songs);
      addMoodEntry(userMsg);
      addMoodEntry(botMsg);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'bot', time: now(),
        content: '⚠️ Couldn\'t fetch songs right now. Please check your connection and try again.',
      }]);
    }

    setLoading(false);
    inputRef.current?.focus();
  }, [input, loading, setMoodQueue, addMoodEntry]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([{ ...welcome, id: Date.now(), content: "Chat cleared! I'm ready for a fresh vibe. How are you feeling? 🎶" }]);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/[0.05]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1db954] to-[#7c3aed] flex items-center justify-center shadow-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl leading-tight">Mood Chat</h1>
              <p className="text-[#535353] text-xs">AI-powered playlist generation</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/8 text-[#a7a7a7] hover:text-white text-xs font-medium transition-colors"
          >
            <RefreshCw size={12} />
            Clear
          </motion.button>
        </div>

        {/* Quick mood chips */}
        <div className="flex flex-wrap gap-2">
          {QUICK_CHIPS.map(chip => (
            <motion.button
              key={chip}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => sendMessage(chip)}
              className="text-xs px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08]
                text-[#a7a7a7] hover:text-white hover:bg-white/10 hover:border-white/15 transition-all"
            >
              {chip}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <ChatBubble key={msg.id} msg={msg} />
          ))}
          {loading && (
            <motion.div key="typing">
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 pb-6 pt-3 flex-shrink-0 border-t border-white/[0.05]">
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
            placeholder="Tell me how you're feeling..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-[#535353]"
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
  );
}
