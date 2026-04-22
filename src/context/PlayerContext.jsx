// WHAT THIS FILE DOES:
// Creates shared music player state (context) that every component can access.
// Handles audio playback, liked songs, recently played — all with simple React hooks.

import { createContext, useContext, useState, useRef, useEffect } from 'react';

// Converts seconds (e.g. 125) to "2:05" format for display in the player bar
export function fmt(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Step 1: Create the context — an empty shared box every component can read from
const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  // useRef holds the Audio object across renders without causing re-renders
  const audioRef = useRef(new Audio());

  // --- Core player state ---
  const [currentSong,  setCurrentSong]  = useState(null);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [progress,     setProgress]     = useState(0);    // 0–100, how far through the song
  const [duration,     setDuration]     = useState(0);    // total length in seconds
  const [isExpanded,   setIsExpanded]   = useState(false); // full-screen player open?

  // Read saved volume from localStorage, default to 0.75
  const [volume,  setVolume]  = useState(() => parseFloat(localStorage.getItem('volume') || '0.75'));
  const [isMuted, setIsMuted] = useState(false);

  // Simple array of songs — used so next/prev buttons know what to play
  const [currentQueue, setCurrentQueue] = useState([]);

  // --- Persisted state — read from localStorage on first load ---

  // Read saved liked songs from localStorage
  const [likedSongs, setLikedSongs] = useState(() => {
    return JSON.parse(localStorage.getItem('likedSongs') || '[]');
  });

  // Read saved recently played songs from localStorage
  const [recentlyPlayed, setRecentlyPlayed] = useState(() => {
    return JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
  });

  // Save liked songs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
  }, [likedSongs]);

  // Save recently played to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('recentlyPlayed', JSON.stringify(recentlyPlayed));
  }, [recentlyPlayed]);

  // Update the audio volume whenever volume or mute state changes
  useEffect(() => {
    audioRef.current.volume = isMuted ? 0 : volume;
    // Save volume preference to localStorage
    localStorage.setItem('volume', String(volume));
  }, [volume, isMuted]);

  // Wire up audio events to track progress/duration/song-end
  useEffect(() => {
    const audio = audioRef.current;

    // Runs every ~250ms while the song plays — updates the progress bar
    function handleTimeUpdate() {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    }

    // Runs when the browser knows the song's total duration
    function handleMetadata() {
      setDuration(audio.duration);
    }

    // When a song ends, automatically play the next one in the queue
    function handleEnded() {
      if (currentQueue.length > 0) {
        const idx     = currentQueue.findIndex(s => s.id === currentSong?.id);
        const nextIdx = (idx + 1) % currentQueue.length;
        const next    = currentQueue[nextIdx];
        if (next?.preview) {
          audio.src = next.preview;
          audio.load();
          setCurrentSong(next);
          setIsPlaying(true);
          setProgress(0);
          setDuration(0);
          // Add to recently played when auto-skipping
          setRecentlyPlayed(prev =>
            [next, ...prev.filter(s => s.id !== next.id)].slice(0, 10)
          );
        }
      }
    }

    audio.addEventListener('timeupdate',     handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleMetadata);
    audio.addEventListener('ended',          handleEnded);

    // Cleanup: remove listeners before next effect run or component unmount
    return () => {
      audio.removeEventListener('timeupdate',     handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleMetadata);
      audio.removeEventListener('ended',          handleEnded);
    };
  }, [currentQueue, currentSong]); // re-run when queue or current song changes

  // Play or pause audio whenever isPlaying or currentSong changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!currentSong) return;

    if (isPlaying) {
      // Browsers require async for the play() call
      const tryPlay = async () => {
        try {
          await audio.play();
        } catch (err) {
          // AbortError is normal (interrupted by another play) — ignore it
          if (err.name !== 'AbortError') setIsPlaying(false);
        }
      };
      // If audio is ready, play; otherwise wait for the canplay event
      if (audio.readyState >= 2) {
        tryPlay();
      } else {
        audio.addEventListener('canplay', tryPlay, { once: true });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong]);

  // Play a song — optionally pass a queue so next/prev buttons work
  function playSong(song, queue = []) {
    if (!song?.preview) return; // no preview URL = can't play

    const audio = audioRef.current;
    audio.src = song.preview;
    audio.load();

    setCurrentSong(song);
    setIsPlaying(true);
    setProgress(0);
    setDuration(0);

    // Save the queue array so next/prev know which songs to play
    if (queue.length > 0) {
      setCurrentQueue(queue);
    }

    // Add to recently played — remove duplicates, keep the last 10
    const updated = [song, ...recentlyPlayed.filter(s => s.id !== song.id)].slice(0, 10);
    setRecentlyPlayed(updated);
  }

  // Toggle between playing and paused
  function togglePlay() {
    setIsPlaying(prev => !prev);
  }

  // Skip to the next song in the queue
  function skipNext() {
    if (!currentQueue.length) return;
    const idx     = currentQueue.findIndex(s => s.id === currentSong?.id);
    const nextIdx = (idx + 1) % currentQueue.length;
    playSong(currentQueue[nextIdx], currentQueue);
  }

  // Go to previous song — or restart current song if more than 3 seconds in
  function skipPrev() {
    const audio = audioRef.current;
    if (audio.currentTime > 3) {
      audio.currentTime = 0; // restart the current song
      return;
    }
    if (!currentQueue.length) return;
    const idx     = currentQueue.findIndex(s => s.id === currentSong?.id);
    const prevIdx = (idx - 1 + currentQueue.length) % currentQueue.length;
    playSong(currentQueue[prevIdx], currentQueue);
  }

  // Jump to a specific position in the song — pct is 0 to 100
  function seekTo(pct) {
    const audio = audioRef.current;
    if (audio?.duration) {
      audio.currentTime = (pct / 100) * audio.duration;
      setProgress(pct);
    }
  }

  // Add or remove a song from liked songs
  function toggleLike(song) {
    const alreadyLiked = likedSongs.find(s => s.id === song.id);
    let updated;
    if (alreadyLiked) {
      updated = likedSongs.filter(s => s.id !== song.id); // remove it
    } else {
      updated = [song, ...likedSongs]; // add to front
    }
    setLikedSongs(updated);
  }

  // Returns true if a song (by ID) is in the liked songs list
  function isLiked(id) {
    return likedSongs.some(s => s.id === id);
  }

  // Current playback position in seconds (used for the timestamp display)
  const currentTime = (progress / 100) * duration;

  // The song that comes after the current one in the queue (used for "Up Next")
  const currentQueueIndex = currentQueue.findIndex(s => s.id === currentSong?.id);
  const upNext = currentQueue[currentQueueIndex + 1] || null;

  // Step 2: Share everything below with all components via usePlayer()
  const value = {
    currentSong, isPlaying, progress, duration, currentTime, upNext,
    volume, isMuted, isExpanded,
    likedSongs, recentlyPlayed,
    playSong, togglePlay, skipNext, skipPrev, seekTo,
    toggleLike, isLiked,
    setVolume, setIsMuted, setIsExpanded,
  };

  return (
    // Wrap children so any component inside can call usePlayer()
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

// Call this in any component to access the shared music player state
export function usePlayer() {
  // We use context here to read the shared player state
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
  return ctx;
}
