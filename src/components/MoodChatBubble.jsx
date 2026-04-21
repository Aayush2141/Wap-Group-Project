// WHAT THIS FILE DOES:
// Floating Mood DJ chat bubble fixed to the bottom-right corner.
// Uses simple keyword matching to detect mood, then fetches songs from Deezer.

import { useState, useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';

// Maps mood keywords to Deezer search queries
const moodMap = {
  happy: 'happy pop upbeat',
  sad: 'sad emotional acoustic',
  energetic: 'workout energy hype',
  chill: 'chill lofi relax',
  focus: 'focus study instrumental',
  party: 'party dance hits',
  heartbreak: 'heartbreak breakup',
  motivated: 'motivation pump up',
  sleepy: 'sleep calm peaceful',
  angry: 'rage metal intense',
  romantic: 'romantic love songs',
  nostalgic: 'nostalgic 90s throwback',
  night: 'late night chill ambient',
};

// Check the user's message for any known mood keyword
function detectMood(message) {
  const lower = message.toLowerCase();
  for (let keyword in moodMap) {
    if (lower.includes(keyword)) {
      return { mood: keyword, query: moodMap[keyword] };
    }
  }
  return null;
}

// Fetch 4 songs from Deezer (via CORS proxy) based on a mood query
async function fetchMoodSongs(query) {
  const deezerUrl = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=4`;
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(deezerUrl)}`;
  const response = await fetch(proxyUrl);
  const data = await response.json();

  return (data.data || []).map(t => ({
    id: t.id,
    title: t.title,
    preview: t.preview,
    cover: t.album?.cover_medium || t.album?.cover_small || null,
    artist: { id: t.artist?.id || null, name: t.artist?.name || 'Unknown' },
    album: {
      id: t.album?.id || null, title: t.album?.title || '',
      cover: t.album?.cover_medium || null,
      coverSmall: t.album?.cover_small || null,
      coverLarge: t.album?.cover_big || null,
    },
    duration: t.duration || 30,
  }));
}

// Quick mood buttons shown in the panel
const CHIPS = ['😊 Happy', '😌 Chill', '💪 Energetic', '😢 Sad', '🎉 Party', '🎯 Focus'];


function SongCard({ song, onPlay }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div
      onClick={() => onPlay(song)}
      className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 cursor-pointer group
        transition-all duration-150 hover:bg-white/8 border border-white/5 hover:border-[#1db954]/30"
      style={{ background: 'rgba(255,255,255,0.04)' }}
    >
      {/* Album art */}
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#282828]">
        {song.cover && !imgErr ? (
          <img src={song.cover} alt={song.title} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
              <path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
            </svg>
          </div>
        )}
      </div>

      {/* Title and artist */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-[11px] font-semibold truncate leading-tight">{song.title}</p>
        <p className="text-[#a7a7a7] text-[10px] truncate">{song.artist?.name}</p>
      </div>

      {/* Play button — revealed on hover */}
      <button
        onClick={e => { e.stopPropagation(); onPlay(song); }}
        className="w-7 h-7 rounded-full bg-[#1db954] flex items-center justify-center flex-shrink-0
          opacity-0 group-hover:opacity-100 transition-all hover:bg-[#1ed760] hover:scale-110"
        aria-label="Play song"
      >
        <svg width="9" height="10" viewBox="0 0 9 10" fill="white"><path d="M1 1.5l7 3.5-7 3.5V1.5z" /></svg>
      </button>
    </div>
  );
}

// Bot message bubble
function BotBubble({ msg }) {
  return (
    <div className="flex items-start gap-2 max-w-[92%]">
      <div className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1db954, #7b2fbe)', boxShadow: '0 0 8px rgba(29,185,84,0.35)' }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
          <path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="inline-block rounded-2xl rounded-tl-sm px-3.5 py-2.5 mb-2"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-white text-[12px] leading-relaxed">{msg.text}</p>
        </div>
        {msg.songs?.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {msg.songs.map(s => <SongCard key={s.id} song={s} onPlay={msg.onPlay} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// User message bubble
function UserBubble({ msg }) {
  return (
    <div className="flex justify-end">
      <div className="rounded-2xl rounded-tr-sm px-3.5 py-2.5 max-w-[80%]"
        style={{ background: 'linear-gradient(135deg, #1db954, #15a347)', boxShadow: '0 2px 12px rgba(29,185,84,0.25)' }}>
        <p className="text-white text-[12px] leading-relaxed font-medium">{msg.text}</p>
      </div>
    </div>
  );
}

export default function MoodChatBubble() {
  const { playSong } = usePlayer();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{
    id: 'welcome', role: 'bot',
    text: "Hey! 👋 Tell me how you're feeling and I'll find the perfect songs. Try 'I'm feeling chill' or tap a mood below.",
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus the input when the panel opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 350);
  }, [isOpen]);

  // Detect mood from text then fetch matching songs
  const processMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setInputValue('');
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: trimmed }]);
    setIsLoading(true);

    await new Promise(r => setTimeout(r, 750));

    const detected = detectMood(trimmed);

    if (!detected) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'bot',
        text: "I didn't catch a mood there 😊 Try words like: happy, sad, chill, energetic, party, or focus!",
      }]);
      setIsLoading(false);
      return;
    }

    let songs = [];
    try {
      songs = await fetchMoodSongs(detected.query);
    } catch {
      songs = [];
    }

    const onPlay = (song) => playSong(song, songs);

    setMessages(prev => [...prev, {
      id: Date.now() + 1, role: 'bot',
      text: songs.length > 0
        ? `Here are some ${detected.mood} vibes 🎧`
        : `I detected a ${detected.mood} mood but couldn't reach the music service. Try again in a sec!`,
      songs: songs.length > 0 ? songs : [],
      onPlay,
    }]);
    setIsLoading(false);
  };

  const handleSend = () => processMessage(inputValue);
  const handleChip = (chip) => processMessage(chip.replace(/^[^\s]+\s/, '')); // strip emoji prefix
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <>
      {/* Chat panel — shown/hidden with CSS transform + opacity (no framer-motion) */}
      <div
        className="fixed right-5 z-40 flex flex-col overflow-hidden"
        style={{
          bottom: '108px', width: '340px', height: '480px', borderRadius: '20px',
          background: 'rgba(18,18,18,0.97)', backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: isOpen
            ? '0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(29,185,84,0.2), inset 0 1px 0 rgba(255,255,255,0.06)'
            : 'none',
          transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.96)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'all' : 'none',
          transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease',
          transformOrigin: 'bottom right',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(29,185,84,0.12) 0%, rgba(123,47,190,0.12) 100%)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #1db954, #7b2fbe, #1db954)', backgroundSize: '200% 200%', animation: 'gradientShift 4s ease infinite', boxShadow: '0 4px 16px rgba(29,185,84,0.3)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Mood DJ</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1db954]" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
                <p className="text-[#a7a7a7] text-[10px]">Keyword mode · Always ready</p>
              </div>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#a7a7a7] hover:text-white transition-colors hover:bg-white/8"
            aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l10 10M11 1L1 11" />
            </svg>
          </button>
        </div>

        {/* Quick mood chips */}
        <div className="flex gap-1.5 px-4 py-2.5 flex-shrink-0 overflow-x-auto"
          style={{ scrollbarWidth: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {CHIPS.map(chip => (
            <button key={chip} onClick={() => handleChip(chip)} disabled={isLoading}
              className="flex-shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full
                text-[#a7a7a7] hover:text-white transition-all disabled:opacity-40 hover:scale-105 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>
              {chip}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#2a2a2a transparent' }}>
          {messages.map(msg =>
            msg.role === 'user'
              ? <UserBubble key={msg.id} msg={msg} />
              : <BotBubble key={msg.id} msg={msg} />
          )}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #1db954, #7b2fbe)' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                  <path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                </svg>
              </div>
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="typing-dot w-1.5 h-1.5 bg-[#1db954] rounded-full" />
                <span className="typing-dot w-1.5 h-1.5 bg-[#1db954] rounded-full" />
                <span className="typing-dot w-1.5 h-1.5 bg-[#1db954] rounded-full" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-2.5 px-3.5 py-3 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.3)' }}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="How are you feeling right now?"
            className="flex-1 text-white text-xs outline-none placeholder:text-[#555] disabled:opacity-40 bg-transparent"
            style={{ caretColor: '#1db954' }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
              transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 active:scale-90"
            style={{
              background: inputValue.trim() && !isLoading ? 'linear-gradient(135deg, #1db954, #15a347)' : 'rgba(255,255,255,0.1)',
              boxShadow: inputValue.trim() && !isLoading ? '0 4px 16px rgba(29,185,84,0.4)' : 'none',
            }}
            aria-label="Send"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M1.5 6.5h10M7 2l5 4.5L7 11" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Floating trigger button */}
      <div
        className="fixed right-5 z-50 flex items-center gap-2.5 group"
        style={{ bottom: '108px' }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Tooltip — appears to the left on hover */}
        <div className="flex items-center gap-2 rounded-full px-3.5 py-2 pointer-events-none"
          style={{
            background: 'rgba(18,18,18,0.95)', border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)',
            opacity: showTooltip && !isOpen ? 1 : 0,
            transform: showTooltip && !isOpen ? 'translateX(0) scale(1)' : 'translateX(8px) scale(0.95)',
            transition: 'opacity 0.2s ease, transform 0.2s ease', whiteSpace: 'nowrap',
          }}>
          <span className="text-[10px] font-bold text-[#1db954] uppercase tracking-wider">Mood DJ</span>
          <span className="text-[10px] text-[#a7a7a7]">Ask me anything</span>
        </div>

        {/* The circular button itself */}
        <button
          onClick={() => setIsOpen(prev => !prev)}
          aria-label="Open Mood DJ"
          className="relative flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
          style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: isOpen ? 'rgba(40,40,40,0.95)' : 'linear-gradient(135deg, #1db954 0%, #7b2fbe 100%)',
            backgroundSize: '200% 200%',
            animation: isOpen ? 'none' : 'gradientShift 4s ease infinite',
            boxShadow: isOpen
              ? '0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)'
              : '0 4px 24px rgba(29,185,84,0.4), 0 0 0 1px rgba(29,185,84,0.2)',
            border: 'none',
            transition: 'box-shadow 0.2s ease, background 0.3s ease',
          }}
        >
          {/* Icon rotates between X (open) and music note (closed) */}
          <div style={{ transition: 'transform 0.3s ease', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            {isOpen
              ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M1 1l12 12M13 1L1 13" /></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /></svg>
            }
          </div>

          {/* Pulsing green badge — only shown when the panel is closed */}
          {!isOpen && (
            <span
              className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-[#1db954] border-2"
              style={{ borderColor: '#0a0a0a', animation: 'pulse-dot 2.5s ease-in-out infinite' }}
            />
          )}
        </button>
      </div>
    </>
  );
}
