import { createContext, useContext, useState, useRef, useEffect } from 'react';

export function fmt(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const audioRef = useRef(new Audio());

  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => parseFloat(localStorage.getItem('volume') || '0.75'));
  const [isMuted, setIsMuted] = useState(false);
  const [currentQueue, setCurrentQueue] = useState([]);

  const [likedSongs, setLikedSongs] = useState(() => {
    return JSON.parse(localStorage.getItem('likedSongs') || '[]');
  });

  const [recentlyPlayed, setRecentlyPlayed] = useState(() => {
    return JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
  });

  useEffect(() => {
    localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
  }, [likedSongs]);

  useEffect(() => {
    localStorage.setItem('recentlyPlayed', JSON.stringify(recentlyPlayed));
  }, [recentlyPlayed]);

  useEffect(() => {
    audioRef.current.volume = isMuted ? 0 : volume;
    localStorage.setItem('volume', String(volume));
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;

    function handleTimeUpdate() {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    }

    function handleMetadata() {
      setDuration(audio.duration);
    }

    function handleEnded() {
      if (currentQueue.length > 0) {
        const idx = currentQueue.findIndex(s => s.id === currentSong?.id);
        const nextIdx = (idx + 1) % currentQueue.length;
        const next = currentQueue[nextIdx];
        if (next?.preview) {
          audio.src = next.preview;
          audio.load();
          setCurrentSong(next);
          setIsPlaying(true);
          setProgress(0);
          setDuration(0);
          setRecentlyPlayed(prev => [next, ...prev.filter(s => s.id !== next.id)].slice(0, 10));
        }
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentQueue, currentSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!currentSong) return;

    if (isPlaying) {
      const tryPlay = async () => {
        try {
          await audio.play();
        } catch (err) {
          if (err.name !== 'AbortError') setIsPlaying(false);
        }
      };
      if (audio.readyState >= 2) {
        tryPlay();
      } else {
        audio.addEventListener('canplay', tryPlay, { once: true });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong]);

  function playSong(song, queue = []) {
    if (!song?.preview) return;

    const audio = audioRef.current;
    audio.src = song.preview;
    audio.load();

    setCurrentSong(song);
    setIsPlaying(true);
    setProgress(0);
    setDuration(0);

    if (queue.length > 0) {
      setCurrentQueue(queue);
    }

    const updated = [song, ...recentlyPlayed.filter(s => s.id !== song.id)].slice(0, 10);
    setRecentlyPlayed(updated);
  }

  function togglePlay() {
    setIsPlaying(prev => !prev);
  }

  function skipNext() {
    if (!currentQueue.length) return;
    const idx = currentQueue.findIndex(s => s.id === currentSong?.id);
    const nextIdx = (idx + 1) % currentQueue.length;
    playSong(currentQueue[nextIdx], currentQueue);
  }

  function skipPrev() {
    const audio = audioRef.current;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (!currentQueue.length) return;
    const idx = currentQueue.findIndex(s => s.id === currentSong?.id);
    const prevIdx = (idx - 1 + currentQueue.length) % currentQueue.length;
    playSong(currentQueue[prevIdx], currentQueue);
  }

  function seekTo(pct) {
    const audio = audioRef.current;
    if (audio?.duration) {
      audio.currentTime = (pct / 100) * audio.duration;
      setProgress(pct);
    }
  }

  function toggleLike(song) {
    const alreadyLiked = likedSongs.find(s => s.id === song.id);
    let updated;
    if (alreadyLiked) {
      updated = likedSongs.filter(s => s.id !== song.id);
    } else {
      updated = [song, ...likedSongs];
    }
    setLikedSongs(updated);
  }

  function isLiked(id) {
    return likedSongs.some(s => s.id === id);
  }

  const currentTime = (progress / 100) * duration;
  const currentQueueIndex = currentQueue.findIndex(s => s.id === currentSong?.id);
  const upNext = currentQueue[currentQueueIndex + 1] || null;

  const value = {
    currentSong, isPlaying, progress, duration, currentTime, upNext,
    volume, isMuted,
    likedSongs, recentlyPlayed,
    playSong, togglePlay, skipNext, skipPrev, seekTo,
    toggleLike, isLiked,
    setVolume, setIsMuted,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
  return ctx;
}
