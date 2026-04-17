import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Play, Pause, Music2, Clock, Shuffle } from 'lucide-react';
import { usePlayer, fmt } from '../context/PlayerContext';

/* ── Liked song row ──────────────────────────────────────────────────────────── */
function LikedRow({ song, index, allSongs }) {
  const {
    playSong, currentSong, isPlaying,
    togglePlay, toggleLike,
  } = usePlayer();
  const navigate = useNavigate();
  const active   = currentSong?.id === song.id;

  const handlePlay = (e) => {
    e.stopPropagation();
    active ? togglePlay() : playSong(song, allSongs);
  };

  return (
    <motion.div
      id={`liked-${song.id}`}
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25 }}
      onClick={handlePlay}
      className={`grid items-center gap-4 px-4 py-3 rounded-xl cursor-pointer group transition-colors
        ${active ? 'bg-white/8' : 'hover:bg-white/5'}`}
      style={{ gridTemplateColumns: '28px 48px 1fr 1fr auto auto' }}
    >
      {/* # / play indicator */}
      <div className="text-center text-sm">
        {active && isPlaying ? (
          <div className="flex items-end justify-center gap-0.5 h-4">
            <span className="eq-bar" /><span className="eq-bar" /><span className="eq-bar" />
          </div>
        ) : (
          <>
            <span className={`text-xs ${active ? 'text-[#1db954]' : 'text-[#a7a7a7]'} group-hover:hidden`}>
              {index + 1}
            </span>
            <Play size={12} fill="white" className="text-white hidden group-hover:block mx-auto" />
          </>
        )}
      </div>

      {/* Cover */}
      <img
        src={song.album?.coverSmall || song.album?.cover}
        alt={song.title}
        className="w-12 h-12 rounded-xl object-cover shadow-md"
      />

      {/* Title + artist */}
      <div className="overflow-hidden">
        <p className={`text-sm font-semibold truncate ${active ? 'text-[#1db954]' : 'text-white'}`}>
          {song.title}
        </p>
        <button
          onClick={e => { e.stopPropagation(); song.artist?.id && navigate(`/artist/${song.artist.id}`); }}
          className="text-xs text-[#a7a7a7] hover:text-white hover:underline truncate block text-left transition-colors"
        >
          {song.artist?.name}
        </button>
      </div>

      {/* Album */}
      <p className="text-[#a7a7a7] text-xs truncate hidden md:block">{song.album?.title}</p>

      {/* Unlike */}
      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={e => { e.stopPropagation(); toggleLike(song); }}
        className="text-[#1db954] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
        title="Remove from liked"
      >
        <Heart size={14} fill="currentColor" />
      </motion.button>

      {/* Duration */}
      <span className="text-[#a7a7a7] text-xs tabular-nums text-right">{fmt(song.duration)}</span>
    </motion.div>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────────────── */
function EmptyState() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 gap-4"
    >
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-24 h-24 rounded-full bg-[#1a1a1a] border border-white/5 flex items-center justify-center"
      >
        <Music2 size={40} className="text-[#535353]" />
      </motion.div>
      <p className="text-white text-xl font-bold">Songs you like will appear here</p>
      <p className="text-[#a7a7a7] text-sm text-center max-w-xs leading-relaxed">
        Save songs by tapping the ♥ icon next to any track you love.
      </p>
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => navigate('/search')}
        className="mt-3 px-7 py-2.5 bg-white text-black font-bold text-sm rounded-full hover:bg-white/90 transition-colors"
      >
        Find songs
      </motion.button>
    </motion.div>
  );
}

/* ── Liked Songs page ────────────────────────────────────────────────────────── */
export default function LikedSongs() {
  const { likedSongs, playSong, currentSong, isPlaying, togglePlay } = usePlayer();

  const isAnyLikedActive = likedSongs.some(s => s.id === currentSong?.id) && isPlaying;

  const handlePlayAll = () => {
    if (!likedSongs.length) return;
    isAnyLikedActive ? togglePlay() : playSong(likedSongs[0], likedSongs);
  };

  const handleShuffle = () => {
    if (!likedSongs.length) return;
    const shuffled = [...likedSongs].sort(() => Math.random() - 0.5);
    playSong(shuffled[0], shuffled);
  };

  const totalDuration = likedSongs.reduce((acc, s) => acc + (s.duration || 30), 0);
  const totalMins     = Math.floor(totalDuration / 60);

  return (
    <div className="page-enter">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden px-8 pt-10 pb-8"
        style={{ background: 'linear-gradient(135deg, #1e1040 0%, #0f2027 50%, #0a0a0a 100%)' }}
      >
        {/* Decorative blur */}
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }}
        />
        <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #1db954, transparent)' }}
        />

        <div className="relative z-10 flex items-end gap-6">
          {/* Playlist cover */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-48 h-48 rounded-2xl flex-shrink-0 shadow-2xl flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #4c1d95, #7c3aed, #1db954)' }}
          >
            {/* Mini album grid for visual flair */}
            {likedSongs.length >= 4 ? (
              <div className="grid grid-cols-2 gap-0.5 w-full h-full">
                {likedSongs.slice(0, 4).map(s => (
                  <img key={s.id}
                    src={s.album?.coverSmall || s.album?.cover}
                    alt="" className="w-full h-full object-cover"
                  />
                ))}
              </div>
            ) : (
              <Heart size={72} fill="white" className="text-white opacity-90" />
            )}
          </motion.div>

          <div className="overflow-hidden">
            <p className="text-[#a7a7a7] text-xs font-bold uppercase tracking-widest mb-2">Playlist</p>
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-black text-white mb-3 leading-none drop-shadow-lg"
            >
              Liked Songs
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-[#a7a7a7] text-sm"
            >
              {likedSongs.length} song{likedSongs.length !== 1 ? 's' : ''}
              {totalMins > 0 && ` · ${totalMins} min`}
            </motion.p>
          </div>
        </div>
      </div>

      {/* ── Controls ────────────────────────────────────────────────────── */}
      {likedSongs.length > 0 && (
        <div className="px-8 py-5 flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={handlePlayAll}
            className="w-14 h-14 rounded-full bg-[#1db954] hover:bg-[#1ed760] flex items-center justify-center
              shadow-lg shadow-green-900/40 transition-colors"
            aria-label={isAnyLikedActive ? 'Pause' : 'Play all'}
          >
            {isAnyLikedActive
              ? <Pause size={22} fill="black" className="text-black" />
              : <Play  size={22} fill="black" className="text-black ml-0.5" />
            }
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleShuffle}
            className="w-11 h-11 rounded-full bg-white/8 hover:bg-white/12 border border-white/8
              flex items-center justify-center text-[#a7a7a7] hover:text-white transition-all"
            title="Shuffle play"
          >
            <Shuffle size={16} />
          </motion.button>
          <p className="text-[#a7a7a7] text-sm ml-1">
            {likedSongs.length} song{likedSongs.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* ── Track list ──────────────────────────────────────────────────── */}
      <div className="px-6 pb-10">
        {likedSongs.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Table header */}
            <div className="grid items-center gap-4 px-4 py-2 mb-1 text-[#535353] text-xs font-bold uppercase tracking-wider border-b border-white/[0.06]"
              style={{ gridTemplateColumns: '28px 48px 1fr 1fr auto auto' }}>
              <span className="text-center">#</span>
              <span />
              <span>Title</span>
              <span className="hidden md:block">Album</span>
              <Heart size={12} />
              <Clock size={12} />
            </div>

            <AnimatePresence mode="popLayout">
              {likedSongs.map((song, i) => (
                <LikedRow key={song.id} song={song} index={i} allSongs={likedSongs} />
              ))}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
