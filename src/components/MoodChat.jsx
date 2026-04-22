// ok so this is the mood chat page
// basically user tells us how they're feeling, we look for keywords
// and then pull songs from itunes that kinda match
// nothing too fancy, just vibes lol

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RefreshCw, Music2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { fetchSongs } from '../utils/api';

// mood map — each word maps to a search query + what the bot says back
// i just picked the ones that felt right, can always add more later
const MOOD_MAP = {
  sad:        { mood: 'sad',        emoji: '😢', searchQuery: 'sad acoustic ballad',       response: "aw, i feel you. here's some music for that 💙" },
  depressed:  { mood: 'sad',        emoji: '😔', searchQuery: 'emotional piano songs',     response: "hey, music helps. sending you these, hope it's okay" },
  happy:      { mood: 'happy',      emoji: '😊', searchQuery: 'happy pop upbeat',          response: "omg yes!! let's keep that energy going 🎉" },
  excited:    { mood: 'excited',    emoji: '🥳', searchQuery: 'excited high energy pop',   response: "YESSS let's gooo!! here's something to match that hype" },
  angry:      { mood: 'angry',      emoji: '😤', searchQuery: 'metal rage intense',        response: "ok yeah let it OUT. here's some stuff to blast 🔥" },
  chill:      { mood: 'chill',      emoji: '😌', searchQuery: 'lofi chill beats',          response: "nice, same tbh. here's something lowkey and smooth" },
  relax:      { mood: 'relaxed',    emoji: '🛋️', searchQuery: 'relaxing ambient music',    response: "okay yeah just breathe. here u go 🌿" },
  focus:      { mood: 'focused',    emoji: '🎯', searchQuery: 'focus study instrumental',  response: "locked in mode!! these should help you stay in the zone" },
  study:      { mood: 'studying',   emoji: '📚', searchQuery: 'lofi study beats',          response: "studyyyying... okay here's some lofi to help" },
  workout:    { mood: 'energetic',  emoji: '💪', searchQuery: 'workout gym motivation',    response: "let's GET IT!! here's your workout playlist 💥" },
  hype:       { mood: 'hyped',      emoji: '🔥', searchQuery: 'hype trap rap',             response: "okayyyy we're hyped!! 🔥🔥" },
  party:      { mood: 'party',      emoji: '🎊', searchQuery: 'party dance hits',          response: "it's a PARTY!! here's the vibe 🎊" },
  dance:      { mood: 'dancing',    emoji: '💃', searchQuery: 'dance edm pop',             response: "okay LET'S DANCE!! here u go 💃" },
  love:       { mood: 'romantic',   emoji: '❤️', searchQuery: 'romantic love songs',       response: "awww that's cute!! here are some love songs 💕" },
  romantic:   { mood: 'romantic',   emoji: '💕', searchQuery: 'romantic date night music', response: "ooooh setting the vibe huh 👀 here ya go" },
  sleep:      { mood: 'sleepy',     emoji: '😴', searchQuery: 'sleep calm ambient',        response: "okay okay, wind down time. here's something soft 🌙" },
  tired:      { mood: 'tired',      emoji: '😪', searchQuery: 'relaxing calm music',       response: "you need rest bestie, here's something chill" },
  nostalgic:  { mood: 'nostalgic',  emoji: '📻', searchQuery: 'nostalgic 90s throwback',   response: "taking you waaay back 📻 classic stuff incoming" },
  heartbreak: { mood: 'heartbroken',emoji: '💔', searchQuery: 'heartbreak breakup songs',  response: "hey, it'll be okay. here are songs that get it 💔" },
  motivated:  { mood: 'motivated',  emoji: '🚀', searchQuery: 'motivation pump up',        response: "you got thisss!!! here's your hype playlist 🚀" },
  night:      { mood: 'late night', emoji: '🌙', searchQuery: 'late night chill ambient',  response: "late night hours... here's your late night soundtrack 🌙" },
};

// tries to figure out the mood from what the user typed
// just loops through the mood map and checks if any keyword shows up
function keywordFallback(text) {
  const lower = text.toLowerCase();

  for (const [keyword, data] of Object.entries(MOOD_MAP)) {
    if (lower.includes(keyword)) return data;
  }

  // some extra phrases people commonly say — adding more over time
  if (lower.includes('feeling down') || lower.includes('feeling blue') || lower.includes('feeling low')) return MOOD_MAP.sad;
  if (lower.includes('need to focus') || lower.includes('need to study') || lower.includes('need to work')) return MOOD_MAP.study;
  if (lower.includes("let's party") || lower.includes('lets party') || lower.includes("let's dance")) return MOOD_MAP.party;
  if (lower.includes("can't sleep") || lower.includes('cannot sleep')) return MOOD_MAP.sleep;
  if (lower.includes('just got dumped') || lower.includes('just broke up') || lower.includes('got cheated')) return MOOD_MAP.heartbreak;
  if (lower.includes('aced my exam') || lower.includes('passed my exam')) return MOOD_MAP.excited;
  if (lower.includes('in love') || lower.includes('in a relationship')) return MOOD_MAP.love;
  if (lower.includes('late night') || lower.includes('night vibes')) return MOOD_MAP.night;

  return null; // nothing matched, no clue what mood this is
}

// Detects direct artist/song requests like "play Drake" or "play some Ed Sheeran"
function detectDirectSearch(text) {
  const lower = text.toLowerCase().trim();

  // Trigger words that mean the user wants a specific artist or song
  const triggers = ['play', 'put on', 'listen to', 'i love', 'i like', 'show me', 'give me'];

  for (const trigger of triggers) {
    if (lower.startsWith(trigger)) {
      // Everything after the trigger word is the search query
      const query = text.slice(trigger.length).trim();
      // Only use it if it's long enough to be a real artist/song name
      if (query.length >= 2) return query;
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
