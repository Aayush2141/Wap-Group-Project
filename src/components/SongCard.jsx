import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Play, Pause, Clock } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { fmt } from '../context/PlayerContext';

/* ── Skeleton ──────────────────────────────────────────────────────────────── */
export function SongCardSkeleton() {
  return (
    <div className="bg-[#161616] rounded-2xl p-4 flex flex-col gap-3">
      <div className="skeleton w-full aspect-square rounded-xl" />
      <div className="skeleton h-3.5 w-4/5 rounded-md" />
      <div className="skeleton h-3 w-3/5 rounded-md" />
      <div className="skeleton h-2.5 w-2/5 rounded-md" />
    </div>
  );
}

/* ── SongCard ──────────────────────────────────────────────────────────────── */
export default function SongCard({ song, queue = [], index = 0 }) {
  const {
    playSong, currentSong, isPlaying,
    togglePlay, toggleLike, isLiked,
  } = usePlayer();
  const navigate = useNavigate();

  const active = currentSong?.id === song.id;
  const liked  = isLiked(song.id);
  const ctx    = queue.length > 0 ? queue : [song];

  const handleMainClick = () => {
    if (active) togglePlay();
    else playSong(song, ctx);
  };

  const handleArtist = (e) => {
    e.stopPropagation();
    if (song.artist?.id) navigate(`/artist/${song.artist.id}`);
  };

  return (
    <motion.div
      id={`song-card-${song.id}`}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
      whileHover={{ y: -4 }}
      className={`group relative bg-[#161616] hover:bg-[#1e1e1e] rounded-2xl p-4
        flex flex-col gap-3 cursor-pointer transition-colors duration-200
        border border-transparent hover:border-white/[0.07]`}
      style={{ boxShadow: active ? '0 0 0 1px rgba(29,185,84,0.3), 0 8px 32px rgba(0,0,0,0.5)' : undefined }}
      onClick={handleMainClick}
    >
      {/* Album art */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#0a0a0a]">
        <img
          src={song.album?.cover || song.album?.coverSmall}
          alt={song.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Active equalizer */}
        {active && isPlaying && (
          <div className="absolute inset-0 bg-black/40 flex items-end justify-center pb-3 gap-1">
            <span className="eq-bar" />
            <span className="eq-bar" />
            <span className="eq-bar" />
          </div>
        )}

        {/* Hover play overlay */}
        <motion.div
          initial={false}
          animate={{ opacity: (active && isPlaying) ? 1 : 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent
            flex items-end justify-between px-3 pb-3"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            onClick={(e) => { e.stopPropagation(); handleMainClick(); }}
            className="relative w-11 h-11 rounded-full bg-[#1db954] shadow-lg shadow-green-900/50
              flex items-center justify-center"
            aria-label={active && isPlaying ? 'Pause' : 'Play'}
          >
            {active && isPlaying
              ? <Pause size={18} fill="black" className="text-black" />
              : <Play  size={18} fill="black" className="text-black ml-0.5" />
            }
          </motion.button>

          {/* Duration badge */}
          <span className="text-[10px] font-mono text-white/70 bg-black/50 rounded-md px-1.5 py-0.5 flex items-center gap-1">
            <Clock size={9} /> {fmt(song.duration)}
          </span>
        </motion.div>

        {/* Like button (always visible when liked, hover otherwise) */}
        <motion.button
          initial={false}
          animate={{ opacity: liked ? 1 : 0 }}
          whileHover={{ opacity: 1 }}
          whileTap={{ scale: 0.85 }}
          onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
          aria-label={liked ? 'Unlike' : 'Like'}
          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center
            backdrop-blur-sm border transition-all
            ${liked
              ? 'bg-[#1db954]/20 border-[#1db954]/40 text-[#1db954]'
              : 'bg-black/50 border-white/10 text-white/70 group-hover:opacity-100'
            }`}
        >
          <Heart size={12} fill={liked ? 'currentColor' : 'none'} strokeWidth={2} />
        </motion.button>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 min-w-0">
        <p className={`text-sm font-semibold truncate leading-tight transition-colors
          ${active ? 'text-[#1db954]' : 'text-white'}`}>
          {song.title}
        </p>
        <button
          onClick={handleArtist}
          className="text-[11px] text-[#a7a7a7] hover:text-white hover:underline text-left truncate transition-colors"
        >
          {song.artist?.name}
        </button>
      </div>
    </motion.div>
  );
}
