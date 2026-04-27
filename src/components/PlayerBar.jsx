import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, SkipBack, SkipForward, Heart, Volume2, VolumeX, Music2 } from 'lucide-react';
import { usePlayer, fmt } from '../context/PlayerContext';

function SeekBar({ value, onChange, className = '' }) {
  const trackRef = useRef(null);

  const handleClick = (e) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    onChange(pct);
  };

  return (
    <div ref={trackRef} onClick={handleClick} className={`progress-group relative flex items-center cursor-pointer ${className}`}>
      <div className="progress-track w-full">
        <div className="progress-fill" style={{ width: `${value}%` }} />
        <div className="progress-thumb" style={{ left: `${value}%` }} />
      </div>
    </div>
  );
}

export default function PlayerBar() {
  const navigate = useNavigate();
  const { currentSong, isPlaying, togglePlay, skipNext, skipPrev, seekTo, progress, duration, currentTime, volume, setVolume, isMuted, setIsMuted, toggleLike, isLiked } = usePlayer();

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
    <footer className="h-[84px] glass-dark border-t border-white/[0.05] flex items-center gap-4 px-5" style={{ boxShadow: 'var(--shadow-player)' }}>
      <div className="flex items-center gap-3 w-[220px] min-w-0">
        <img src={currentSong.album?.cover || currentSong.album?.coverSmall} alt={currentSong.title} className="w-14 h-14 rounded-xl object-cover shadow-lg flex-shrink-0" />
        <div className="overflow-hidden flex-1">
          <p className="text-white text-sm font-semibold truncate">{currentSong.title}</p>
          <button onClick={() => currentSong.artist?.id && navigate(`/artist/${currentSong.artist.id}`)} className="text-[#a7a7a7] text-xs hover:text-white hover:underline truncate block text-left transition-colors">
            {currentSong.artist?.name}
          </button>
        </div>
        <button onClick={() => toggleLike(currentSong)} className={`flex-shrink-0 transition-colors active:scale-90 ${liked ? 'text-[#1db954]' : 'text-[#a7a7a7] hover:text-white'}`}>
          <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-2 flex-1 max-w-xl">
        <div className="flex items-center gap-6">
          <button onClick={skipPrev} className="text-[#a7a7a7] hover:text-white transition-colors hover:scale-110 active:scale-90" aria-label="Previous">
            <SkipBack size={19} />
          </button>
          <button onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'} className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform">
            {isPlaying ? <Pause size={17} fill="black" className="text-black" /> : <Play size={17} fill="black" className="text-black ml-0.5" />}
          </button>
          <button onClick={skipNext} className="text-[#a7a7a7] hover:text-white transition-colors hover:scale-110 active:scale-90" aria-label="Next">
            <SkipForward size={19} />
          </button>
        </div>
        <div className="w-full flex items-center gap-2">
          <span className="text-[#a7a7a7] text-[11px] tabular-nums w-8 text-right">{fmt(currentTime)}</span>
          <SeekBar value={progress} onChange={seekTo} className="flex-1 h-5" />
          <span className="text-[#a7a7a7] text-[11px] tabular-nums w-8">{fmt(duration)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 w-[160px] justify-end">
        <button onClick={() => setIsMuted(m => !m)} className="text-[#a7a7a7] hover:text-white transition-colors active:scale-90">
          {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <SeekBar value={(isMuted ? 0 : volume) * 100} onChange={(pct) => { setVolume(pct / 100); setIsMuted(false); }} className="w-24 h-5" />
      </div>
    </footer>
  );
}
