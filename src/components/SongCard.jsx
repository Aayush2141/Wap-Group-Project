import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Play, Pause, Clock, Music2 } from 'lucide-react';
import { useState } from 'react';
import { usePlayer, fmt } from '../context/PlayerContext';

/* ── Skeleton ──────────────────────────────────────────────────────────────── */
export function SongCardSkeleton() {
  return (
    <div className="bg-[#161616] rounded-2xl p-4 flex flex-col gap-3">
      <div className="skeleton w-full aspect-square rounded-xl" />
      <div className="skeleton h-3.5 w-4/5 rounded-md" />
      <div className="skeleton h-3 w-3/5 rounded-md" />
    </div>
  );

}
/* ── Album Art with graceful fallback ─────────────────────────────────────── */
function AlbumArt({ song, isActive, isPlaying }) {
  const [imgFailed, setImgFailed] = useState(false);

  // Try every possible cover source in priority order
  const src =
    song.cover ||               // top-level (direct Deezer mapping)
    song.album?.cover ||        // normalized album object
    song.album?.cover_medium || // raw Deezer field
    song.album?.coverSmall ||   // small fallback
    null;

  return (
    <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#1a1a1a]">
      {/* Actual image */}
      {src && !imgFailed ? (
        <img
          src={src}
          alt={song.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setImgFailed(true)}
        />
      ) : (
        /* Fallback: music note placeholder */
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]">
          <Music2 size={36} className="text-[#2a2a2a]" />
          <span className="text-[#2a2a2a] text-[10px] text-center px-2 truncate w-full text-center">
            {song.title?.slice(0, 20)}
          </span>
        </div>
      )}

      {/* Equalizer overlay when active */}
      {isActive && isPlaying && (
        <div className="absolute inset-0 bg-black/40 flex items-end justify-center pb-3 gap-1 pointer-events-none">
          <span className="eq-bar" />
          <span className="eq-bar" />
          <span className="eq-bar" />
        </div>
      )}
    </div>
  )
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
    const id = song.artistId || song.artist?.id;
    if (id) navigate(`/artist/${id}`);
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
      style={{ boxShadow: active ? '0 0 0 1px rgba(29,185,84,0.3)' : undefined }}
      onClick={handleMainClick}
    >
      {/* Album art with fallback */}
      <div className="relative">
        <AlbumArt song={song} isActive={active} isPlaying={isPlaying} />
        {/* Play / pause overlay button */}
        <motion.div
          initial={false}
          className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/70 via-black/10 to-transparent
            flex items-end justify-between px-3 pb-3
            opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            onClick={(e) => { e.stopPropagation(); handleMainClick(); }}
            className="w-11 h-11 rounded-full bg-[#1db954] shadow-lg shadow-green-900/50
              flex items-center justify-center"
            aria-label={active && isPlaying ? 'Pause' : 'Play'}
          >
            {active && isPlaying
              ? <Pause size={18} fill="black" className="text-black" />
              : <Play  size={18} fill="black" className="text-black ml-0.5" />
            }
          </motion.button>
          <span className="text-[10px] font-mono text-white/70 bg-black/60 rounded-md
            px-1.5 py-0.5 flex items-center gap-1">
            <Clock size={9} /> {fmt(song.duration)}
          </span>
        </motion.div>

        {/* Like button */}
        <motion.button
          whileTap={{scale:0.8 }}
          onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
          aria-label={liked ? 'Unlike' : 'Like'}
          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center
            backdrop-blur-sm border transition-all
            opacity-0 group-hover:opacity-100
            ${liked
              ? '!opacity-100 bg-[#1db954]/20 border-[#1db954]/40 text-[#1db954]'
              : 'bg-black/50 border-white/10 text-white/70'
            }`}
        >
          <Heart size={12} fill={liked ? 'currentColor' : 'none'} strokeWidth={2} />
        </motion.button>
      </div>

      {/* Info */}
<div className="flex flex-col gap-1 min-w-0">
  <p
    className={`text-sm font-semibold truncate leading-tight transition-colors ${
      active ? "text-[#1db954]" : "text-white"
    }`}
  >
    {song.title}
  </p>

  <button
    onClick={handleArtist}
    className="text-[11px] text-[#a7a7a7] hover:text-white hover:underline text-left truncate transition-colors"
  >
    {typeof song.artist === "string"
      ? song.artist
      : song.artist?.name}
  </button>
</div>
</motion.div>
  );
}
