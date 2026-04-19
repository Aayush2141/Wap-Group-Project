// PlayerContext.jsx
// This file creates a "shared box" (context) that every component can read from.
// It holds: which song is playing, the audio player, liked songs, recently played, etc.

import { createContext, useContext, useState, useRef, useEffect } from 'react';

// Step 1: Create the context — think of it as an empty shared box
const PlayerContext = createContext(null);

// ── localStorage helpers ──────────────────────────────────────────────────────
// These two functions safely read/write data to the browser's localStorage.
const ls = {
  // get: reads a value from localStorage. If nothing is there, return the fallback (fb).
  get: (k, fb) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? fb; }
    catch { return fb; }
  },
  // set: saves a value to localStorage as a JSON string.
  set: (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); }
    catch {}
  },
};

// ── time formatter ────────────────────────────────────────────────────────────
// Converts seconds (e.g. 125) into "2:05" format for display.
export function fmt(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);                          // get minutes
  const s = Math.floor(secs % 60).toString().padStart(2, '0'); // get seconds, pad to 2 digits
  return `${m}:${s}`;
}

// ── PlayerProvider ────────────────────────────────────────────────────────────
// This component wraps the whole app and shares all music state.
export function PlayerProvider({ children }) {
  // useRef creates a reference to the <audio> HTML element — persists across re-renders
  const audioRef = useRef(null);

  // ── core state ────────────────────────────────────────────────────────────
  // useState stores a value AND a function to update it
  const [currentSong, setCurrentSong] = useState(null);      // the song currently loaded
  const [queue,       setQueue]       = useState([]);         // list of songs in the queue
  const [queueIndex,  setQueueIndex]  = useState(0);         // which position we're at in the queue
  const [isPlaying,   setIsPlaying]   = useState(false);     // true = playing, false = paused
  const [progress,    setProgress]    = useState(0);         // 0–100, how far through the song
  const [duration,    setDuration]    = useState(0);         // total length of song in seconds
  const [volume,      setVolume]      = useState(() => ls.get('volume', 0.75)); // 0.0–1.0 volume
  const [isMuted,     setIsMuted]     = useState(false);     // whether the user muted the audio
  const [isExpanded,  setIsExpanded]  = useState(false);     // whether the big player overlay is open
  const [isShuffling, setIsShuffling] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off' | 'one' | 'all'

  // ── persisted state ───────────────────────────────────────────────────────
  // Helper: rejects old Deezer-format songs that have dead CDN links
  const isValidSong = (s) => {
    const cover   = s?.cover || s?.album?.cover || s?.album?.coverSmall || '';
    const preview = s?.preview || '';
    // Deezer CDN URLs contain 'dzcdn.net' — they no longer work after switching to iTunes
    return !cover.includes('dzcdn.net') && !preview.includes('dzcdn');
  };

  // Load liked songs from localStorage on first render, filtering out stale Deezer tracks
  const [likedSongs,     setLikedSongs]     = useState(() => ls.get('likedSongs', []).filter(isValidSong));
  // Load recently played from localStorage on first render
  const [recentlyPlayed, setRecentlyPlayed] = useState(() => ls.get('recentlyPlayed', []).filter(isValidSong));
  // Load mood chat history from localStorage on first render
  const [moodHistory,    setMoodHistory]    = useState(() => ls.get('moodHistory', []));

  // This runs when likedSongs changes. It saves liked songs to localStorage.
  useEffect(() => { ls.set('likedSongs', likedSongs); }, [likedSongs]);
  // This runs when recentlyPlayed changes. It saves it to localStorage.
  useEffect(() => { ls.set('recentlyPlayed', recentlyPlayed); }, [recentlyPlayed]);
  // This runs when moodHistory changes. It saves it to localStorage.
  useEffect(() => { ls.set('moodHistory', moodHistory); }, [moodHistory]);
  // This runs when volume changes. It saves the volume preference to localStorage.
  useEffect(() => { ls.set('volume', volume); }, [volume]);

  // ── audio event wiring ────────────────────────────────────────────────────
  // This runs when the queue or queueIndex changes. It wires up audio event listeners.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // onTime: fires every ~250ms while playing. Updates the progress bar.
    const onTime  = () => audio.duration && setProgress((audio.currentTime / audio.duration) * 100);
    // onMeta: fires when the browser knows the audio duration. Saves the duration.
    const onMeta  = () => setDuration(audio.duration);
    // onEnded: fires when the song finishes. Skips to the next song.
    const onEnded = () => skipNext();

    audio.addEventListener('timeupdate',     onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended',          onEnded);

    // Cleanup: remove listeners when this effect re-runs or component unmounts
    return () => {
      audio.removeEventListener('timeupdate',     onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended',          onEnded);
    };
  }, [queue, queueIndex]); // re-bind whenever queue changes

  // This runs when volume or isMuted changes. It updates the audio element's volume.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // This runs when isPlaying or currentSong changes. It plays or pauses the audio.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (isPlaying) {
      // Wrap in async/await — browsers may reject play() before audio is ready
      const attemptPlay = async () => {
        try {
          await audio.play();
        } catch (err) {
          // AbortError = another play() interrupted this one (safe to ignore)
          // NotAllowedError = autoplay blocked by browser (user must interact first)
          if (err.name !== 'AbortError') setIsPlaying(false);
        }
      };
      // If audio is already loaded enough, play immediately; otherwise wait for canplay event
      if (audio.readyState >= 2) {
        attemptPlay();
      } else {
        audio.addEventListener('canplay', attemptPlay, { once: true });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong]);

  // ── keyboard shortcuts ───────────────────────────────────────────────────
  // This runs once (empty deps). It listens for global keyboard shortcuts.
  useEffect(() => {
    const handler = (e) => {
      // Don't intercept keyboard shortcuts while typing in a text input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (currentSong) setIsPlaying(p => !p); // toggle play/pause with Space
          break;
        case 'ArrowRight':
          if (e.altKey) { e.preventDefault(); skipNext(); } // Alt+Right = next track
          break;
        case 'ArrowLeft':
          if (e.altKey) { e.preventDefault(); skipPrev(); } // Alt+Left = prev track
          break;
        case 'KeyM':
          setIsMuted(m => !m); // M = toggle mute
          break;
        default: break;
      }
    };
    window.addEventListener('keydown', handler);
    // Cleanup: remove listener when component unmounts
    return () => window.removeEventListener('keydown', handler);
  }, [currentSong]); // eslint-disable-line

  // ── internal: load a track into the audio element ───────────────────────
  // loadSong sets the audio src, loads it, and updates recentlyPlayed.
  function loadSong(song) {
    if (!song?.preview) return; // no preview URL = can't play
    const audio = audioRef.current;

    // IMPORTANT: set src BEFORE calling load() — required for all browsers
    audio.src = song.preview;
    audio.load();

    setCurrentSong(song);
    setProgress(0);   // reset progress bar
    setDuration(0);   // reset duration

    // Add to recently played, removing duplicates, keeping max 30 items
    setRecentlyPlayed(prev =>
      [song, ...prev.filter(s => s.id !== song.id)].slice(0, 30)
    );
  }

  // ── public API ────────────────────────────────────────────────────────────
  // playSong: loads and plays a song. Optionally sets a new queue.
  function playSong(song, newQueue = null) {
    if (newQueue?.length) {
      setQueue(newQueue);
      const idx = newQueue.findIndex(s => s.id === song.id); // find song position in queue
      setQueueIndex(idx >= 0 ? idx : 0);
    }
    loadSong(song);
    setIsPlaying(true); // start playing immediately
  }

  // togglePlay: flips isPlaying between true and false
  function togglePlay() {
    setIsPlaying(p => !p);
  }

  // seekTo: jumps to a specific position in the song (0–100 percentage)
  function seekTo(pct) {
    const audio = audioRef.current;
    if (audio?.duration) {
      audio.currentTime = (pct / 100) * audio.duration; // convert % to seconds
      setProgress(pct);
    }
  }

  // skipNext: moves to the next song in the queue
function skipNext() {
  if (!queue.length) return;

  let next;

  if (isShuffling) {
    next = Math.floor(Math.random() * queue.length);
  } else {
    next = (queueIndex + 1) % queue.length;
  }

  setQueueIndex(next);
  loadSong(queue[next]);
  setIsPlaying(true);
}

  // skipPrev: if we're past 3 seconds, restart; otherwise go to previous song
  function skipPrev() {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) { audio.currentTime = 0; return; }
    if (!queue.length) return;
    const prev = (queueIndex - 1 + queue.length) % queue.length; // wrap around if at start
    setQueueIndex(prev);
    loadSong(queue[prev]);
    setIsPlaying(true);
  }

  // toggleLike: adds or removes a song from likedSongs
  function toggleLike(song) {
    setLikedSongs(prev =>
      prev.some(s => s.id === song.id)
        ? prev.filter(s => s.id !== song.id) // remove if already liked
        : [song, ...prev]                    // add to front if not liked
    );
  }

  // isLiked: returns true if a song (by id) is in likedSongs
  function isLiked(id) {
    return likedSongs.some(s => s.id === id);
  }

  // setMoodQueue: plays the first song in a new mood-based queue
  function setMoodQueue(songs) {
    if (!songs.length) return;
    setQueue(songs);
    setQueueIndex(0);
    loadSong(songs[0]);
    setIsPlaying(true);
  }

  // addMoodEntry: appends a chat message to the mood history (max 60 items)
  function addMoodEntry(entry) {
    setMoodHistory(prev => [entry, ...prev].slice(0, 60));
  }

  // ── derived values ────────────────────────────────────────────────────────
  // currentTime: the current playback position in seconds
  const currentTime = (progress / 100) * duration;
  // upNext: the song after the current one in the queue
  const upNext = queue[queueIndex + 1] || null;

  // Everything inside this object is shared with every component via usePlayer()
  const value = {
    currentSong, queue, queueIndex, upNext,
    isPlaying, progress, duration, currentTime,
    volume, isMuted, isExpanded,
    likedSongs, recentlyPlayed, moodHistory,
    playSong, togglePlay, seekTo, skipNext, skipPrev,
    toggleLike, isLiked,
    setVolume, setIsMuted, setIsExpanded,
    setMoodQueue, addMoodEntry,
  };

  return (
    // Step 2: Provide the value to all children components
    <PlayerContext.Provider value={value}>
      {/* The hidden <audio> element that actually plays the music */}
      <audio ref={audioRef} preload="metadata" />
      {children}
    </PlayerContext.Provider>
  );
}

// ── usePlayer ─────────────────────────────────────────────────────────────────
// Custom hook: any component calls usePlayer() to access the shared music state.
// We use context here to access the player state without passing props
export function usePlayer() {
  const ctx = useContext(PlayerContext); // We use context here to access PlayerContext
  if (!ctx) throw new Error('usePlayer must be inside PlayerProvider');
  return ctx;
}
