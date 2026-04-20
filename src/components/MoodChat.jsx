// WHAT THIS FILE DOES:
// The full-page Mood Chat feature. User types how they feel,
// the app detects their mood from keywords, searches iTunes, and shows matching songs.

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RefreshCw, Music2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { fetchSongs } from '../utils/api';

// --- Mood keyword map ---
// Maps mood words to iTunes search queries and a friendly response
const MOOD_MAP = {
  sad:        { mood: 'sad',        emoji: '😢', searchQuery: 'sad acoustic ballad',       response: "I can feel that. Here are some songs that match your mood." },
  depressed:  { mood: 'sad',        emoji: '😔', searchQuery: 'emotional piano songs',     response: "Sometimes music is the best comfort. Sending you these." },
  happy:      { mood: 'happy',      emoji: '😊', searchQuery: 'happy pop upbeat',          response: "Love the energy! Here's some feel-good music for you." },
  excited:    { mood: 'excited',    emoji: '🥳', searchQuery: 'excited high energy pop',   response: "Let's go! Here are some tracks to match that excitement!" },
  angry:      { mood: 'angry',      emoji: '😤', searchQuery: 'metal rage intense',        response: "Let it out. Here's some music to channel that energy." },
  chill:      { mood: 'chill',      emoji: '😌', searchQuery: 'lofi chill beats',          response: "Perfect vibe. Here's something smooth and relaxed." },
  relax:      { mood: 'relaxed',    emoji: '🛋️', searchQuery: 'relaxing ambient music',    response: "Take it easy with these calming tracks." },
  focus:      { mood: 'focused',    emoji: '🎯', searchQuery: 'focus study instrumental',  response: "Get in the zone with these concentration tracks." },
  study:      { mood: 'studying',   emoji: '📚', searchQuery: 'lofi study beats',          response: "Study mode activated. Here's your playlist." },
  workout:    { mood: 'energetic',  emoji: '💪', searchQuery: 'workout gym motivation',    response: "Let's crush it! Here's your workout playlist." },
  hype:       { mood: 'hyped',      emoji: '🔥', searchQuery: 'hype trap rap',             response: "Maximum hype incoming!" },
  party:      { mood: 'party',      emoji: '🎊', searchQuery: 'party dance hits',          response: "Time to party! Here's the soundtrack." },
  dance:      { mood: 'dancing',    emoji: '💃', searchQuery: 'dance edm pop',             response: "Let's dance! Here are some floor-fillers." },
  love:       { mood: 'romantic',   emoji: '❤️', searchQuery: 'romantic love songs',       response: "How sweet! Here are some love songs for you." },
  romantic:   { mood: 'romantic',   emoji: '💕', searchQuery: 'romantic date night music', response: "Setting the mood with these romantic tracks." },
  sleep:      { mood: 'sleepy',     emoji: '😴', searchQuery: 'sleep calm ambient',        response: "Wind down with these soothing tracks." },
  tired:      { mood: 'tired',      emoji: '😪', searchQuery: 'relaxing calm music',       response: "Rest your mind with these gentle sounds." },
  nostalgic:  { mood: 'nostalgic',  emoji: '📻', searchQuery: 'nostalgic 90s throwback',   response: "Taking you back with these classic vibes." },
  heartbreak: { mood: 'heartbroken',emoji: '💔', searchQuery: 'heartbreak breakup songs',  response: "It gets better. Here are some songs that understand." },
  motivated:  { mood: 'motivated',  emoji: '🚀', searchQuery: 'motivation pump up',        response: "You've got this! Here's your motivation playlist." },
  night:      { mood: 'late night', emoji: '🌙', searchQuery: 'late night chill ambient',  response: "Perfect for the late hours. Here's your night soundtrack." },
};

// Checks the user's message for any known mood keywords
function keywordFallback(text) {
  const lower = text.toLowerCase();

  // Check each keyword in the mood map
  for (const [keyword, data] of Object.entries(MOOD_MAP)) {
    if (lower.includes(keyword)) return data;
  }

  // Extra fuzzy patterns for common phrases
  if (/feel(ing)?\s+(down|blue|low|bad)/.test(lower))                return MOOD_MAP.sad;
  if (/need\s+to\s+(focus|study|work|concentrate)/.test(lower))     return MOOD_MAP.study;
  if (/let'?s?\s+(go|party|dance|celebrate)/.test(lower))           return MOOD_MAP.party;
  if (/can'?t\s+sleep/.test(lower))                                  return MOOD_MAP.sleep;
  if (/just\s+(got|been)\s+(dump|broke|cheated|heart)/.test(lower)) return MOOD_MAP.heartbreak;
  if (/ace[d]?\s+(my|the)\s+exam/.test(lower))                      return MOOD_MAP.excited;
  if (/in\s+(love|a\s+relationship)/.test(lower))                    return MOOD_MAP.love;
  if (/late\s+night|night\s+vibes/.test(lower))                     return MOOD_MAP.night;

  return null; // no mood detected
}

// Detects direct artist/song requests like "play some Drake" or "put on Ed Sheeran"
const DIRECT_PATTERNS = [
  /(?:wanna|want to|can you|please)?\s*(?:listen to|play|put on|hear|find)\s+(?:some\s+)?(.+)/i,
  /(?:give me|show me|queue up|add)\s+(?:some\s+)?(.+?)(?:\s+(?:music|songs?|tracks?))?$/i,
  /(?:i(?:'m|\s+am)\s+in(?:to)?|i love|i like|big fan of)\s+(.+)/i,
  /^(?:some\s+)?(.+?)\s+(?:music|songs?|tracks?|vibes?)$/i,
];

function detectDirectSearch(text) {
  const cleaned = text.trim().replace(/[!?.]+$/, '');
  for (const pattern of DIRECT_PATTERNS) {
    const match = cleaned.match(pattern);
    if (match) {
      const query = match[1].trim();
      // Reject very short or common words — probably not an artist name
      if (query.length >= 2 && !['a', 'an', 'the', 'me', 'my', 'up', 'on', 'something'].includes(query)) {
        return query;
      }
    }
  }
  return null;
}

// Quick mood suggestion chips shown above the input
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

// Renders a single song result row inside a bot message
function SongResultRow({ song, onPlay }) {
  const [imgErr, setImgErr] = useState(false);
  const cover = song.cover || song.album?.cover || song.album?.coverSmall;

  return (
    <div
      onClick={() => onPlay(song)}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer group
        transition-colors hover:bg-white/5 border border-white/[0.04] hover:border-[#1db954]/20"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      {/* Album art */}
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#282828]">
        {cover && !imgErr ? (
          <img
            src={cover}
            alt={song.title}
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music2 size={14} className="text-[#555]" />
          </div>
        )}
      </div>

      {/* Title and artist */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-semibold truncate">{song.title}</p>
        <p className="text-[#a7a7a7] text-[11px] truncate">{song.artist?.name}</p>
      </div>

      {/* Play button — visible on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onPlay(song); }}
        className="w-7 h-7 rounded-full bg-[#1db954] flex items-center justify-center flex-shrink-0
          opacity-0 group-hover:opacity-100 transition-all hover:bg-[#1ed760] hover:scale-110 active:scale-95"
        aria-label={`Play ${song.title}`}
      >
        <svg width="9" height="10" viewBox="0 0 9 10" fill="white"><path d="M1 1.5l7 3.5-7 3.5V1.5z"/></svg>
      </button>
    </div>
  );
}

// A bot message bubble (left-aligned)
function BotMessage({ msg }) {
  return (
    <div className="flex items-start gap-3 max-w-[88%]">
      {/* Bot avatar */}
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1db954, #7c3aed)', boxShadow: '0 0 12px rgba(29,185,84,0.3)' }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
          <path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        {/* Text bubble */}
        <div
          className="inline-block rounded-2xl rounded-tl-sm px-4 py-3 mb-2"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-white text-sm leading-relaxed">{msg.text}</p>
        </div>

        {/* Song results (if any) */}
        {msg.songs?.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {msg.songs.map(song => (
              <SongResultRow key={song.id} song={song} onPlay={msg.onPlay} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// A user message bubble (right-aligned)
function UserMessage({ msg }) {
  return (
    <div className="flex justify-end">
      <div
        className="rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]"
        style={{ background: 'linear-gradient(135deg, #1db954, #15a347)', boxShadow: '0 2px 12px rgba(29,185,84,0.25)' }}
      >
        <p className="text-white text-sm leading-relaxed font-medium">{msg.text}</p>
      </div>
    </div>
  );
}

// The main MoodChat component
export default function MoodChat() {
  // We use context here to access playSong and recentlyPlayed
  const { playSong } = usePlayer();

  const [messages,    setMessages]    = useState([{
    id: 'welcome', role: 'bot',
    text: "Hey! 👋 Tell me how you're feeling and I'll find the perfect songs. Try \"I'm feeling chill\" or \"play some Drake\".",
  }]);
  const [inputValue,  setInputValue]  = useState('');
  const [isLoading,   setIsLoading]   = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  // Auto-scroll to the latest message whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Process the user's message and fetch matching songs
  const processMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setInputValue('');
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: trimmed }]);
    setIsLoading(true);

    // Short delay for a more natural chat feel
    await new Promise(r => setTimeout(r, 600));

    // Step 1: Check if the user is asking for a specific artist or song
    const directQuery = detectDirectSearch(trimmed);
    if (directQuery) {
      try {
        const songs = await fetchSongs(directQuery, 5);
        if (songs.length > 0) {
          const onPlay = (song) => playSong(song, songs);
          setMessages(prev => [...prev, {
            id: Date.now() + 1, role: 'bot',
            text: `Here are some results for "${directQuery}" 🎵`,
            songs,
            onPlay,
          }]);
          setIsLoading(false);
          return;
        }
      } catch {
        // If direct search fails, fall through to mood detection
      }
    }

    // Step 2: Try keyword mood detection
    const moodData = keywordFallback(trimmed);

    if (!moodData) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'bot',
        text: "I couldn't detect your mood 🤔 Try: \"I'm sad\", \"need to study\", \"play drake\", or \"workout time\".",
      }]);
      setIsLoading(false);
      return;
    }

    // Step 3: Fetch songs matching the detected mood
    try {
      const songs = await fetchSongs(moodData.searchQuery, 5);
      const onPlay = (song) => playSong(song, songs);

      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'bot',
        text: `${moodData.emoji} ${moodData.response}`,
        songs: songs.length > 0 ? songs : [],
        onPlay,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'bot',
        text: "Couldn't load songs right now. Please try again in a moment!",
      }]);
    }

    setIsLoading(false);
  };

  const handleSend = () => processMessage(inputValue);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearMessages = () => {
    setMessages([{
      id: 'welcome', role: 'bot',
      text: "Hey! 👋 Tell me how you're feeling and I'll find the perfect songs.",
    }]);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/[0.05]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1db954, #7c3aed)', boxShadow: '0 4px 20px rgba(29,185,84,0.3)' }}
            >
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Mood Chat</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1db954]" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
                <p className="text-[#a7a7a7] text-xs">Keyword AI Active</p>
              </div>
            </div>
          </div>

          <button
            onClick={clearMessages}
            className="flex items-center gap-1.5 text-[#a7a7a7] hover:text-white text-xs font-semibold
              px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
          >
            <RefreshCw size={11} /> Clear
          </button>
        </div>

        {/* Quick mood chips */}
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {QUICK_CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => processMessage(chip)}
              disabled={isLoading}
              className="flex-shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full
                text-[#a7a7a7] hover:text-white transition-all disabled:opacity-40
                hover:scale-105 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#2a2a2a transparent' }}>
        {messages.map(msg =>
          msg.role === 'user'
            ? <UserMessage key={msg.id} msg={msg} />
            : <BotMessage  key={msg.id} msg={msg} />
        )}

        {/* Typing indicator — shown while fetching songs */}
        {isLoading && (
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1db954, #7c3aed)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
              </svg>
            </div>
            <div
              className="flex items-center gap-1 rounded-2xl rounded-tl-sm px-5 py-3"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <span className="typing-dot w-2 h-2 bg-[#1db954] rounded-full" />
              <span className="typing-dot w-2 h-2 bg-[#1db954] rounded-full" />
              <span className="typing-dot w-2 h-2 bg-[#1db954] rounded-full" />
            </div>
          </div>
        )}

        {/* Invisible div at the bottom — used for auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div
        className="flex items-center gap-3 px-4 py-4 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}
      >
        <div
          className="flex-1 flex items-center gap-2 rounded-2xl px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Sparkles size={14} className="text-[#1db954] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder='Try "I just aced my exam!" or "play some Drake" 🎉'
            className="flex-1 text-white text-sm outline-none placeholder:text-[#535353]
              disabled:opacity-40 bg-transparent"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading}
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0
            transition-all disabled:opacity-30 disabled:cursor-not-allowed
            hover:scale-105 active:scale-95"
          style={{
            background: inputValue.trim() && !isLoading
              ? 'linear-gradient(135deg, #1db954, #15a347)'
              : 'rgba(255,255,255,0.08)',
            boxShadow: inputValue.trim() && !isLoading ? '0 4px 16px rgba(29,185,84,0.4)' : 'none',
          }}
          aria-label="Send"
        >
          <Send size={16} className="text-white" />
        </button>
      </div>

      {/* Keyboard shortcut hint */}
      <p className="text-[#535353] text-[10px] text-center pb-3">
        Space = play/pause · Alt+→/← = next/prev · M = mute
      </p>
    </div>
  );
}
