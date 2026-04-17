import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Users, Heart, Clock, ArrowLeft } from 'lucide-react';
import { useFetchArtist } from '../hooks/useFetchSongs';
import { usePlayer, fmt } from '../context/PlayerContext';

/* ── Song row (table view) ───────────────────────────────────────────────────── */
function TrackRow({ song, index, queue }) {
  const { playSong, currentSong, isPlaying, togglePlay, toggleLike, isLiked } = usePlayer();
  const active = currentSong?.id === song.id;
  const liked  = isLiked(song.id);

  const handlePlay = () => active ? togglePlay() : playSong(song, queue);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.5) }}
      onClick={handlePlay}
      className={`grid items-center gap-4 px-4 py-3 rounded-xl cursor-pointer group transition-colors
        ${active ? 'bg-white/8' : 'hover:bg-white/5'}`}
      style={{ gridTemplateColumns: '28px 40px 1fr auto auto' }}
    >
      {/* Index / play indicator */}
      <div className="text-center text-sm w-7">
        {active && isPlaying ? (
          <div className="flex items-end justify-center gap-0.5 h-4">
            <span className="eq-bar" /><span className="eq-bar" /><span className="eq-bar" />
          </div>
        ) : (
          <>
            <span className={`${active ? 'text-[#1db954]' : 'text-[#a7a7a7]'} group-hover:hidden text-xs`}>
              {index + 1}
            </span>
            <Play size={13} fill="white" className="text-white hidden group-hover:block mx-auto" />
          </>
        )}
      </div>

      {/* Album art */}
      <img
        src={song.album?.coverSmall || song.album?.cover}
        alt={song.title}
        className="w-10 h-10 rounded-lg object-cover"
      />

      {/* Title */}
      <div className="overflow-hidden">
        <p className={`text-sm font-semibold truncate ${active ? 'text-[#1db954]' : 'text-white'}`}>
          {song.title}
        </p>
        <p className="text-xs text-[#a7a7a7] truncate">{song.album?.title}</p>
      </div>

      {/* Like */}
      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={e => { e.stopPropagation(); toggleLike(song); }}
        className={`p-1 transition-all opacity-0 group-hover:opacity-100
          ${liked ? '!opacity-100 text-[#1db954]' : 'text-[#a7a7a7] hover:text-white'}`}
      >
        <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
      </motion.button>

      {/* Duration */}
      <span className="text-[#a7a7a7] text-xs tabular-nums text-right">{fmt(song.duration)}</span>
    </motion.div>
  );
}

/* ── Skeleton hero ───────────────────────────────────────────────────────────── */
function ArtistHeroSkeleton() {
  return (
    <div className="relative h-80 overflow-hidden">
      <div className="skeleton w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/40 to-transparent" />
      <div className="absolute bottom-6 left-8 flex items-end gap-5">
        <div className="skeleton w-28 h-28 rounded-full" />
        <div className="space-y-3">
          <div className="skeleton h-10 w-64 rounded-xl" />
          <div className="skeleton h-4 w-32 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/* ── Artist Page ─────────────────────────────────────────────────────────────── */
export default function ArtistPage() {
  const { artistId }                              = useParams();
  const { artist, songs, loading, error }         = useFetchArtist(artistId);
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayer();
  const navigate                                  = useNavigate();

  const isArtistActive = songs.some(s => s.id === currentSong?.id) && isPlaying;

  const handlePlayAll = () => {
    if (!songs.length) return;
    isArtistActive ? togglePlay() : playSong(songs[0], songs);
  };

  if (error) return (
    <div className="flex items-center justify-center h-full page-enter">
      <div className="text-center">
        <p className="text-5xl mb-4">🎤</p>
        <p className="text-white text-xl font-bold mb-2">Artist not found</p>
        <p className="text-[#a7a7a7] text-sm mb-6">{error}</p>
        <button onClick={() => navigate(-1)}
          className="px-5 py-2 bg-white/10 rounded-full text-white text-sm hover:bg-white/15 transition-colors">
          Go back
        </button>
      </div>
    </div>
  );

  return (
    <div className="page-enter">
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => navigate(-1)}
        className="absolute top-16 left-72 z-30 flex items-center gap-1.5 text-[#a7a7a7] hover:text-white text-sm transition-colors
          bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/5 mt-4 ml-4"
      >
        <ArrowLeft size={14} /> Back
      </motion.button>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      {loading ? <ArtistHeroSkeleton /> : (
        <div className="relative h-80 overflow-hidden">
          {/* Background image */}
          <img
            src={artist?.picture_xl || artist?.picture_big || artist?.picture_medium}
            alt={artist?.name}
            className="w-full h-full object-cover object-top"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 50%, #0a0a0a 100%)' }}
          />

          {/* Artist info */}
          <div className="absolute bottom-0 left-0 right-0 px-8 pb-6 flex items-end gap-5">
            <motion.img
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              src={artist?.picture_medium}
              alt={artist?.name}
              className="w-28 h-28 rounded-full object-cover border-4 border-white/10 shadow-2xl flex-shrink-0"
            />
            <div className="flex-1 overflow-hidden">
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[#1db954] text-xs font-bold uppercase tracking-widest mb-1"
              >
                Artist
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl font-black text-white leading-none mb-2 drop-shadow-lg"
              >
                {artist?.name}
              </motion.h1>
              {artist?.nb_fan && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-[#a7a7a7] text-sm flex items-center gap-1.5"
                >
                  <Users size={13} />
                  {artist.nb_fan >= 1_000_000
                    ? `${(artist.nb_fan / 1_000_000).toFixed(1)}M` 
                    : artist.nb_fan.toLocaleString()
                  } monthly listeners
                </motion.p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <div className="px-8 py-6 flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={handlePlayAll}
          disabled={!songs.length}
          className="w-14 h-14 rounded-full bg-[#1db954] hover:bg-[#1ed760] flex items-center justify-center
            shadow-lg shadow-green-900/40 disabled:opacity-40 transition-colors"
          aria-label={isArtistActive ? 'Pause' : 'Play all'}
        >
          {isArtistActive
            ? <Pause size={22} fill="black" className="text-black" />
            : <Play  size={22} fill="black" className="text-black ml-0.5" />
          }
        </motion.button>
        {!loading && songs.length > 0 && (
          <p className="text-[#a7a7a7] text-sm">
            <span className="text-white font-semibold">{songs.length}</span> popular tracks
          </p>
        )}
      </div>

      {/* ── Track list ────────────────────────────────────────────────────── */}
      <div className="px-6 pb-8">
        {/* Table header */}
        {!loading && songs.length > 0 && (
          <div className="grid items-center gap-4 px-4 py-2 mb-1 text-[#535353] text-xs font-bold uppercase tracking-wider border-b border-white/[0.06]"
            style={{ gridTemplateColumns: '28px 40px 1fr auto auto' }}>
            <span className="text-center">#</span>
            <span />
            <span>Title</span>
            <Heart size={12} />
            <Clock size={12} />
          </div>
        )}

        {/* Skeleton rows */}
        {loading && Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <div className="skeleton w-5 h-4 rounded" />
            <div className="skeleton w-10 h-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3.5 w-3/4 rounded" />
              <div className="skeleton h-2.5 w-1/2 rounded" />
            </div>
            <div className="skeleton h-3 w-8 rounded" />
          </div>
        ))}

        {/* Real rows */}
        <AnimatePresence>
          {songs.map((song, i) => (
            <TrackRow key={song.id} song={song} index={i} queue={songs} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
