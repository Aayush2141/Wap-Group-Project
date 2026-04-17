import {
  createContext, useContext, useState, useRef,
  useEffect, useCallback, useMemo,
} from 'react';

const PlayerContext = createContext(null);

/* ── localStorage helpers ──────────────────────────────────────────────────── */
const ls = {
  get:  (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } },
  set:  (k, v)  => { try { localStorage.setItem(k, JSON.stringify(v)); }       catch {}               },
};

/* ── time formatter ────────────────────────────────────────────────────────── */
export function fmt(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);

  /* ── core state ─────────────────────────────────────────────────────────── */
  const [currentSong, setCurrentSong] = useState(null);
  const [queue,       setQueue]       = useState([]);
  const [queueIndex,  setQueueIndex]  = useState(0);
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [volume,      setVolume]      = useState(() => ls.get('volume', 0.75));
  const [isMuted,     setIsMuted]     = useState(false);
  const [isExpanded,  setIsExpanded]  = useState(false); // expandable player

  /* ── persisted state ────────────────────────────────────────────────────── */
  const [likedSongs,     setLikedSongs]     = useState(() => ls.get('likedSongs', []));
  const [recentlyPlayed, setRecentlyPlayed] = useState(() => ls.get('recentlyPlayed', []));
  const [moodHistory,    setMoodHistory]    = useState(() => ls.get('moodHistory', []));

  useEffect(() => { ls.set('likedSongs',     likedSongs);     }, [likedSongs]);
  useEffect(() => { ls.set('recentlyPlayed', recentlyPlayed); }, [recentlyPlayed]);
  useEffect(() => { ls.set('moodHistory',    moodHistory);    }, [moodHistory]);
  useEffect(() => { ls.set('volume',         volume);         }, [volume]);

  /* ── audio event wiring ─────────────────────────────────────────────────── */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime     = () => audio.duration && setProgress((audio.currentTime / audio.duration) * 100);
    const onMeta     = () => setDuration(audio.duration);
    const onEnded    = () => skipNext();

    audio.addEventListener('timeupdate',    onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended',         onEnded);
    return () => {
      audio.removeEventListener('timeupdate',    onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended',         onEnded);
    };
  }, [queue, queueIndex]); // re-bind when queue changes

  /* ── volume ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  /* ── play / pause ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    if (isPlaying) audio.play().catch(() => setIsPlaying(false));
    else           audio.pause();
  }, [isPlaying, currentSong]);

  /* ── keyboard shortcuts (global) ────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      // Don't intercept while typing in inputs
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (currentSong) setIsPlaying(p => !p);
          break;
        case 'ArrowRight':
          if (e.altKey) { e.preventDefault(); skipNext(); }
          break;
        case 'ArrowLeft':
          if (e.altKey) { e.preventDefault(); skipPrev(); }
          break;
        case 'KeyM':
          setIsMuted(m => !m);
          break;
        default: break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentSong]); // eslint-disable-line

  /* ── internal: load track into audio element ────────────────────────────── */
  const loadSong = useCallback((song) => {
    if (!song?.preview) return;
    const audio = audioRef.current;
    audio.src = song.preview;
    audio.load();
    setCurrentSong(song);
    setProgress(0);
    setDuration(0);

    // recently played — dedup & cap at 30
    setRecentlyPlayed(prev =>
      [song, ...prev.filter(s => s.id !== song.id)].slice(0, 30)
    );
  }, []);

  /* ── public API ─────────────────────────────────────────────────────────── */
  const playSong = useCallback((song, newQueue = null) => {
    if (newQueue?.length) {
      setQueue(newQueue);
      const idx = newQueue.findIndex(s => s.id === song.id);
      setQueueIndex(idx >= 0 ? idx : 0);
    }
    loadSong(song);
    setIsPlaying(true);
  }, [loadSong]);

  const togglePlay = useCallback(() => setIsPlaying(p => !p), []);

  const seekTo = useCallback((pct) => {
    const audio = audioRef.current;
    if (audio?.duration) {
      audio.currentTime = (pct / 100) * audio.duration;
      setProgress(pct);
    }
  }, []);

  const skipNext = useCallback(() => {
    if (!queue.length) return;
    const next = (queueIndex + 1) % queue.length;
    setQueueIndex(next);
    loadSong(queue[next]);
    setIsPlaying(true);
  }, [queue, queueIndex, loadSong]);

  const skipPrev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) { audio.currentTime = 0; return; }
    if (!queue.length) return;
    const prev = (queueIndex - 1 + queue.length) % queue.length;
    setQueueIndex(prev);
    loadSong(queue[prev]);
    setIsPlaying(true);
  }, [queue, queueIndex, loadSong]);

  const toggleLike = useCallback((song) => {
    setLikedSongs(prev =>
      prev.some(s => s.id === song.id)
        ? prev.filter(s => s.id !== song.id)
        : [song, ...prev]
    );
  }, []);

  const isLiked = useCallback((id) => likedSongs.some(s => s.id === id), [likedSongs]);

  const setMoodQueue = useCallback((songs) => {
    if (!songs.length) return;
    setQueue(songs);
    setQueueIndex(0);
    loadSong(songs[0]);
    setIsPlaying(true);
  }, [loadSong]);

  const addMoodEntry = useCallback((entry) => {
    setMoodHistory(prev => [entry, ...prev].slice(0, 60));
  }, []);

  /* ── computed ───────────────────────────────────────────────────────────── */
  const currentTime = useMemo(() => (progress / 100) * duration, [progress, duration]);
  const upNext      = useMemo(() => queue[queueIndex + 1] || null, [queue, queueIndex]);

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
    <PlayerContext.Provider value={value}>
      <audio ref={audioRef} preload="metadata" />
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be inside PlayerProvider');
  return ctx;
}
