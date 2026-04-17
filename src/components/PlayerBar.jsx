import { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward,
  Heart, Volume2, VolumeX, Music2,
  ChevronUp, ChevronDown, ListMusic,
} from 'lucide-react';
import { usePlayer, fmt } from '../context/PlayerContext';

/* ── Interactive progress / volume track ───────────────────────────────────── */
function SeekBar({ value, onChange, className = '' }) {
  const trackRef = useRef(null);

  const handleClick = useCallback((e) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    onChange(pct);
  }, [onChange]);

  return (
    <div
      ref={trackRef}
      onClick={handleClick}
      className={`progress-group relative flex items-center cursor-pointer ${className}`}
    >
      <div className="progress-track w-full">
        <div className="progress-fill" style={{ width: `${value}%` }} />
        <div className="progress-thumb" style={{ left: `${value}%` }} />
      </div>
    </div>
  );
}

/* ── Expanded overlay ──────────────────────────────────────────────────────── */
function ExpandedPlayer({ song, onClose }) {
  const {
    isPlaying, togglePlay, skipNext, skipPrev,
    progress, duration, currentTime,
    volume, isMuted, setVolume, setIsMuted,
    seekTo, toggleLike, isLiked,
    queue, queueIndex, upNext,
  } = usePlayer();
  const navigate = useNavigate();
  const liked = isLiked(song.id);

  return (
    <motion.div
      key="expanded"
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', stiffness: 280, damping: 32 }}
      className="fixed inset-0 z-50 flex flex-col"
    >
      {/* Blurred album art background */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={song.album?.coverLarge || song.album?.cover}
          alt=""
          className="w-full h-full object-cover scale-110"
        />
        <div className="absolute inset-0 bg-black/75 backdrop-blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col h-full px-8 pt-6 pb-8 max-w-lg mx-auto w-full">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center"
          >
            <ChevronDown size={18} className="text-white" />
          </motion.button>
          <span className="text-white font-semibold text-sm">Now Playing</span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center"
          >
            <ListMusic size={16} className="text-white" />
          </motion.button>
        </div>

        {/* Album art */}
        <motion.div
          layout
          className="flex-1 flex items-center justify-center mb-8"
        >
          <motion.img
            key={song.id}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            src={song.album?.coverLarge || song.album?.cover}
            alt={song.title}
            className={`w-64 h-64 rounded-2xl object-cover shadow-2xl
              ${isPlaying ? 'vinyl-spin' : 'vinyl-spin paused'}`}
            style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}
          />
        </motion.div>

        {/* Song info */}
        <div className="flex items-center justify-between mb-6">
          <div className="overflow-hidden">
            <motion.p
              key={song.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-white text-2xl font-bold truncate"
            >
              {song.title}
            </motion.p>
            <button
              onClick={() => { onClose(); if (song.artist?.id) navigate(`/artist/${song.artist.id}`); }}
              className="text-[#a7a7a7] hover:text-white text-sm transition-colors"
            >
              {song.artist?.name}
            </button>
          </div>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => toggleLike(song)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
              ${liked ? 'bg-[#1db954]/20 text-[#1db954]' : 'bg-white/10 text-[#a7a7a7] hover:text-white'}`}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
          </motion.button>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <SeekBar value={progress} onChange={seekTo} className="h-8" />
          <div className="flex justify-between mt-1">
            <span className="text-[#a7a7a7] text-xs tabular-nums">{fmt(currentTime)}</span>
            <span className="text-[#a7a7a7] text-xs tabular-nums">{fmt(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-8 mb-6">
          <motion.button whileTap={{ scale: 0.85 }} onClick={skipPrev}
            className="text-[#a7a7a7] hover:text-white transition-colors">
            <SkipBack size={28} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={togglePlay}
            className="relative w-16 h-16 rounded-full bg-white flex items-center justify-center"
            style={{ boxShadow: '0 4px 24px rgba(29,185,84,0.4)' }}
          >
            {isPlaying
              ? <Pause size={26} fill="black" className="text-black" />
              : <Play  size={26} fill="black" className="text-black ml-1" />
            }
          </motion.button>

          <motion.button whileTap={{ scale: 0.85 }} onClick={skipNext}
            className="text-[#a7a7a7] hover:text-white transition-colors">
            <SkipForward size={28} />
          </motion.button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMuted(m => !m)} className="text-[#a7a7a7] hover:text-white transition-colors">
            {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <SeekBar
            value={(isMuted ? 0 : volume) * 100}
            onChange={(pct) => { setVolume(pct / 100); setIsMuted(false); }}
            className="flex-1 h-6"
          />
        </div>

        {/* Up Next */}
        {upNext && (
          <div className="mt-5 flex items-center gap-3 bg-white/6 rounded-xl px-3 py-2.5 border border-white/6">
            <p className="text-[#a7a7a7] text-xs font-semibold whitespace-nowrap">Up next</p>
            <img src={upNext.album?.coverSmall} alt={upNext.title} className="w-8 h-8 rounded-md object-cover" />
            <div className="overflow-hidden">
              <p className="text-white text-xs font-semibold truncate">{upNext.title}</p>
              <p className="text-[#a7a7a7] text-[11px] truncate">{upNext.artist?.name}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Compact player bar ─────────────────────────────────────────────────────── */
export default function PlayerBar() {
  const navigate = useNavigate();
  const {
    currentSong, isPlaying, togglePlay,
    skipNext, skipPrev, seekTo,
    progress, duration, currentTime,
    volume, setVolume, isMuted, setIsMuted,
    toggleLike, isLiked,
    isExpanded, setIsExpanded,
  } = usePlayer();

  if (!currentSong) {
    return (
      <footer className="h-[68px] glass-dark border-t border-white/[0.05] flex items-center justify-center px-6">
        <p className="text-[#535353] text-sm flex items-center gap-2">
          <Music2 size={15} /> Choose a song to start listening
        </p>
      </footer>
    );
  }

  const liked = isLiked(currentSong.id);

  return (
    <>
      {/* Expanded full-screen player */}
      <AnimatePresence>
        {isExpanded && (
          <ExpandedPlayer song={currentSong} onClose={() => setIsExpanded(false)} />
        )}
      </AnimatePresence>

      {/* Mini bar */}
      <motion.footer
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
        className="h-[84px] glass-dark border-t border-white/[0.05] flex items-center gap-4 px-5"
        style={{ boxShadow: 'var(--shadow-player)' }}
      >
        {/* ── Song info area ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 w-[220px] min-w-0">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(true)}
            className="relative flex-shrink-0"
          >
            <img
              src={currentSong.album?.cover || currentSong.album?.coverSmall}
              alt={currentSong.title}
              className={`w-14 h-14 rounded-xl object-cover shadow-lg cursor-pointer transition-all
                ${isPlaying ? 'vinyl-spin' : 'vinyl-spin paused'}`}
            />
            {/* Expand hint */}
            <div className="absolute inset-0 rounded-xl bg-black/0 hover:bg-black/40 transition-colors
              flex items-center justify-center opacity-0 hover:opacity-100">
              <ChevronUp size={16} className="text-white" />
            </div>
          </motion.button>

          <div className="overflow-hidden flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSong.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-white text-sm font-semibold truncate">{currentSong.title}</p>
                <button
                  onClick={() => currentSong.artist?.id && navigate(`/artist/${currentSong.artist.id}`)}
                  className="text-[#a7a7a7] text-xs hover:text-white hover:underline truncate block text-left transition-colors"
                >
                  {currentSong.artist?.name}
                </button>
              </motion.div>
            </AnimatePresence>
          </div>

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => toggleLike(currentSong)}
            className={`flex-shrink-0 transition-colors ${liked ? 'text-[#1db954]' : 'text-[#a7a7a7] hover:text-white'}`}
          >
            <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
          </motion.button>
        </div>

        {/* ── Controls + progress ────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-xl">
          <div className="flex items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={skipPrev}
              className="text-[#a7a7a7] hover:text-white transition-colors"
              aria-label="Previous"
            >
              <SkipBack size={19} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center
                shadow-lg transition-shadow hover:shadow-green-500/30"
            >
              {isPlaying
                ? <Pause size={17} fill="black" className="text-black" />
                : <Play  size={17} fill="black" className="text-black ml-0.5" />
              }
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={skipNext}
              className="text-[#a7a7a7] hover:text-white transition-colors"
              aria-label="Next"
            >
              <SkipForward size={19} />
            </motion.button>
          </div>

          {/* Progress bar */}
          <div className="w-full flex items-center gap-2">
            <span className="text-[#a7a7a7] text-[11px] tabular-nums w-8 text-right">{fmt(currentTime)}</span>
            <SeekBar value={progress} onChange={seekTo} className="flex-1 h-5" />
            <span className="text-[#a7a7a7] text-[11px] tabular-nums w-8">{fmt(duration)}</span>
          </div>
        </div>

        {/* ── Volume ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 w-[160px] justify-end">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMuted(m => !m)}
            className="text-[#a7a7a7] hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </motion.button>
          <SeekBar
            value={(isMuted ? 0 : volume) * 100}
            onChange={(pct) => { setVolume(pct / 100); setIsMuted(false); }}
            className="w-24 h-5"
          />
        </div>
      </motion.footer>
    </>
  );
}
