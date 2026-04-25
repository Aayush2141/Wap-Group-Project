// WHAT THIS FILE DOES:
// The persistent music player bar fixed at the bottom of the screen.
// Shows: album art + title + artist (left), playback controls + progress (center), volume (right).

import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Pause, SkipBack, SkipForward,
  Heart, Volume2, VolumeX, Music2,
  ChevronUp, ChevronDown, ListMusic,
} from 'lucide-react';
import { usePlayer, fmt } from '../context/PlayerContext';

// A clickable progress/volume bar
// Props: value (0–100), onChange (called with the new percentage)
function SeekBar({ value, onChange, className = '' }) {
  const trackRef = useRef(null);

  // When user clicks, calculate the percentage they clicked on
  const handleClick = (e) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    onChange(pct);
  };

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

// Full-screen expanded player overlay — shown when user clicks album art
function ExpandedPlayer({ song, onClose }) {
  // We use context here to access all player controls
  const {
    isPlaying, togglePlay, skipNext, skipPrev,
    progress, duration, currentTime,
    volume, isMuted, setVolume, setIsMuted,
    seekTo, toggleLike, isLiked, upNext,
  } = usePlayer();

  const navigate = useNavigate();
  const liked = isLiked(song.id);

  return (
    <div className="fixed inset-0 z-50 flex flex-col animate-expandedIn">
      {/* Blurred album art background */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={song.album?.coverLarge || song.album?.cover}
          alt=""
          className="w-full h-full object-cover scale-110"
        />
        <div className="absolute inset-0 bg-black/75 backdrop-blur-3xl" />
      </div>

      {/* Content on top of the blurred background */}
      <div className="relative z-10 flex flex-col h-full px-8 pt-6 pb-8 max-w-lg mx-auto w-full">

        {/* Top bar: close button + label + queue icon */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronDown size={18} className="text-white" />
          </button>
          <span className="text-white font-semibold text-sm">Now Playing</span>
          <button className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
            <ListMusic size={16} className="text-white" />
          </button>
        </div>

        {/* Large album art */}
        <div className="flex-1 flex items-center justify-center mb-8">
          <img
            src={song.album?.coverLarge || song.album?.cover}
            alt={song.title}
            className={`w-64 h-64 rounded-2xl object-cover shadow-2xl ${isPlaying ? 'vinyl-spin' : 'vinyl-spin paused'}`}
            style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}
          />
        </div>

        {/* Song title + artist + like button */}
        <div className="flex items-center justify-between mb-6">
          <div className="overflow-hidden">
            <p className="text-white text-2xl font-bold truncate">{song.title}</p>
            <button
              onClick={() => { onClose(); if (song.artist?.id) navigate(`/artist/${song.artist.id}`); }}
              className="text-[#a7a7a7] hover:text-white text-sm transition-colors"
            >
              {song.artist?.name}
            </button>
          </div>
          <button
            onClick={() => toggleLike(song)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors active:scale-90
              ${liked ? 'bg-[#1db954]/20 text-[#1db954]' : 'bg-white/10 text-[#a7a7a7] hover:text-white'}`}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Progress bar + timestamps */}
        <div className="mb-4">
          <SeekBar value={progress} onChange={seekTo} className="h-8" />
          <div className="flex justify-between mt-1">
            <span className="text-[#a7a7a7] text-xs tabular-nums">{fmt(currentTime)}</span>
            <span className="text-[#a7a7a7] text-xs tabular-nums">{fmt(duration)}</span>
          </div>
        </div>

        {/* Prev | Play/Pause | Next */}
        <div className="flex items-center justify-center gap-8 mb-6">
          <button onClick={skipPrev} className="text-[#a7a7a7] hover:text-white transition-colors active:scale-90">
            <SkipBack size={28} />
          </button>
          <button
            onClick={togglePlay}
            className="relative w-16 h-16 rounded-full bg-white flex items-center justify-center active:scale-90 transition-transform"
            style={{ boxShadow: '0 4px 24px rgba(29,185,84,0.4)' }}
          >
            {isPlaying
              ? <Pause size={26} fill="black" className="text-black" />
              : <Play  size={26} fill="black" className="text-black ml-1" />
            }
          </button>
          <button onClick={skipNext} className="text-[#a7a7a7] hover:text-white transition-colors active:scale-90">
            <SkipForward size={28} />
          </button>
        </div>

        {/* Volume control */}
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

        {/* Up Next card — only shown if there is a next song */}
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
    </div>
  );
}

// The compact bottom bar — always visible
export default function PlayerBar() {
  const navigate = useNavigate();

  // We use context here to access all player state
  const {
    currentSong, isPlaying, togglePlay,
    skipNext, skipPrev, seekTo,
    progress, duration, currentTime,
    volume, setVolume, isMuted, setIsMuted,
    toggleLike, isLiked,
    isExpanded, setIsExpanded,
  } = usePlayer();

  // If no song is loaded, show a placeholder
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
      {/* Full-screen expanded player — shown/hidden with simple conditional rendering */}
      {isExpanded && (
        <ExpandedPlayer song={currentSong} onClose={() => setIsExpanded(false)} />
      )}

      {/* Mini player bar */}
      <footer
        className="h-[84px] glass-dark border-t border-white/[0.05] flex items-center gap-4 px-5"
        style={{ boxShadow: 'var(--shadow-player)' }}
      >
        {/* Left: album art + song info + like */}
        <div className="flex items-center gap-3 w-[220px] min-w-0">
          <button
            onClick={() => setIsExpanded(true)}
            className="relative flex-shrink-0 hover:scale-95 active:scale-90 transition-transform"
          >
            <img
              src={currentSong.album?.cover || currentSong.album?.coverSmall}
              alt={currentSong.title}
              className={`w-14 h-14 rounded-xl object-cover shadow-lg cursor-pointer ${isPlaying ? 'vinyl-spin' : 'vinyl-spin paused'}`}
            />
            <div className="absolute inset-0 rounded-xl bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <ChevronUp size={16} className="text-white" />
            </div>
          </button>

          <div className="overflow-hidden flex-1">
            <p className="text-white text-sm font-semibold truncate">{currentSong.title}</p>
            <button
              onClick={() => currentSong.artist?.id && navigate(`/artist/${currentSong.artist.id}`)}
              className="text-[#a7a7a7] text-xs hover:text-white hover:underline truncate block text-left transition-colors"
            >
              {currentSong.artist?.name}
            </button>
          </div>

          <button
            onClick={() => toggleLike(currentSong)}
            className={`flex-shrink-0 transition-colors active:scale-90 ${liked ? 'text-[#1db954]' : 'text-[#a7a7a7] hover:text-white'}`}
          >
            <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Center: Prev + Play/Pause + Next + progress bar */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-xl">
          <div className="flex items-center gap-6">
            <button
              onClick={skipPrev}
              className="text-[#a7a7a7] hover:text-white transition-colors hover:scale-110 active:scale-90"
              aria-label="Previous"
            >
              <SkipBack size={19} />
            </button>

            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
            >
              {isPlaying
                ? <Pause size={17} fill="black" className="text-black" />
                : <Play  size={17} fill="black" className="text-black ml-0.5" />
              }
            </button>

            <button
              onClick={skipNext}
              className="text-[#a7a7a7] hover:text-white transition-colors hover:scale-110 active:scale-90"
              aria-label="Next"
            >
              <SkipForward size={19} />
            </button>
          </div>

          {/* Progress bar with timestamps */}
          <div className="w-full flex items-center gap-2">
            <span className="text-[#a7a7a7] text-[11px] tabular-nums w-8 text-right">{fmt(currentTime)}</span>
            <SeekBar value={progress} onChange={seekTo} className="flex-1 h-5" />
            <span className="text-[#a7a7a7] text-[11px] tabular-nums w-8">{fmt(duration)}</span>
          </div>
        </div>

        {/* Right: volume */}
        <div className="flex items-center gap-2 w-[160px] justify-end">
          <button
            onClick={() => setIsMuted(m => !m)}
            className="text-[#a7a7a7] hover:text-white transition-colors active:scale-90"
          >
            {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <SeekBar
            value={(isMuted ? 0 : volume) * 100}
            onChange={(pct) => { setVolume(pct / 100); setIsMuted(false); }}
            className="w-24 h-5"
          />
        </div>
      </footer>
    </>
  );
}
