// WHAT THIS FILE DOES:
// The Liked Songs page — shows all songs the user has liked, with play, shuffle,
// and unlike controls. Liked songs are stored in and read from localStorage.

import { useNavigate } from 'react-router-dom';
import { Heart, Play, Pause, Music2, Clock, Shuffle } from 'lucide-react';
import { usePlayer, fmt } from '../context/PlayerContext';

// A single row in the liked songs list
function LikedRow({ song, index, allSongs }) {
  // We use context here to access playSong, currentSong, isPlaying, togglePlay, toggleLike
  const {
    playSong, currentSong, isPlaying,
    togglePlay, toggleLike,
  } = usePlayer();
  const navigate = useNavigate();
  const active   = currentSong?.id === song.id;

  const handlePlay = (e) => {
    e.stopPropagation();
    if (active) {
      togglePlay(); // pause/resume if already playing this song
    } else {
      playSong(song, allSongs); // play this song with full liked list as queue
    }
  };

  return (
    <div
      onClick={handlePlay}
      className={`grid items-center gap-4 px-4 py-3 rounded-xl cursor-pointer group
        transition-colors ${active ? 'bg-white/8' : 'hover:bg-white/5'}`}
      style={{ gridTemplateColumns: '28px 48px 1fr 1fr auto auto' }}
    >
      {/* Row number / EQ / play icon */}
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

      {/* Album art */}
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
          onClick={e => {
            e.stopPropagation();
            if (song.artist?.id) navigate(`/artist/${song.artist.id}`);
          }}
          className="text-xs text-[#a7a7a7] hover:text-white hover:underline truncate block text-left transition-colors"
        >
          {song.artist?.name}
        </button>
      </div>

      {/* Album title */}
      <p className="text-[#a7a7a7] text-xs truncate hidden md:block">{song.album?.title}</p>

      {/* Unlike button */}
      <button
        onClick={e => { e.stopPropagation(); toggleLike(song); }}
        className="text-[#1db954] hover:text-red-400 opacity-0 group-hover:opacity-100
          transition-all active:scale-90 p-1"
        title="Remove from liked"
      >
        <Heart size={14} fill="currentColor" />
      </button>

      {/* Duration */}
      <span className="text-[#a7a7a7] text-xs tabular-nums text-right">{fmt(song.duration)}</span>
    </div>
  );
}

// Shown when the user has no liked songs yet
function EmptyState() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-24 h-24 rounded-full bg-[#1a1a1a] border border-white/5 flex items-center justify-center">
        <Music2 size={40} className="text-[#535353]" />
      </div>
      <p className="text-white text-xl font-bold">Songs you like will appear here</p>
      <p className="text-[#a7a7a7] text-sm text-center max-w-xs leading-relaxed">
        Save songs by tapping the ♥ icon next to any track you love.
      </p>
      <button
        onClick={() => navigate('/search')}
        className="mt-3 px-7 py-2.5 bg-white text-black font-bold text-sm rounded-full
          hover:bg-white/90 transition-colors hover:scale-105 active:scale-97"
      >
        Find songs
      </button>
    </div>
  );
}

// The main Liked Songs page
export default function LikedSongs() {
  // We use context here to access likedSongs, playSong, currentSong, isPlaying, togglePlay
  const { likedSongs, playSong, currentSong, isPlaying, togglePlay } = usePlayer();

  // True when any liked song is currently playing
  const isAnyLikedActive = likedSongs.some(s => s.id === currentSong?.id) && isPlaying;

  const handlePlayAll = () => {
    if (!likedSongs.length) return;
    if (isAnyLikedActive) {
      togglePlay(); // pause if already playing
    } else {
      playSong(likedSongs[0], likedSongs); // play first song in liked list
    }
  };

  // Shuffle: create a randomly sorted copy and play it as the queue
  const handleShuffle = () => {
    if (!likedSongs.length) return;
    const shuffled = [...likedSongs].sort(() => Math.random() - 0.5);
    playSong(shuffled[0], shuffled);
  };

  const totalDuration = likedSongs.reduce((acc, s) => acc + (s.duration || 30), 0);
  const totalMins     = Math.floor(totalDuration / 60);

  return (
    <div className="page-enter">

      {/* Hero section */}
      <div
        className="relative overflow-hidden px-8 pt-10 pb-8"
        style={{ background: 'linear-gradient(135deg, #1e1040 0%, #0f2027 50%, #0a0a0a 100%)' }}
      >
        {/* Decorative blurred orbs */}
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #1db954, transparent)' }} />

        <div className="relative z-10 flex items-end gap-6">
          {/* Playlist cover — shows a 2×2 album art grid when there are 4+ liked songs */}
          <div
            className="w-48 h-48 rounded-2xl flex-shrink-0 shadow-2xl flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #4c1d95, #7c3aed, #1db954)' }}
          >
            {likedSongs.length >= 4 ? (
              <div className="grid grid-cols-2 gap-0.5 w-full h-full">
                {likedSongs.slice(0, 4).map(s => (
                  <img
                    key={s.id}
                    src={s.album?.coverSmall || s.album?.cover}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ))}
              </div>
            ) : (
              <Heart size={72} fill="white" className="text-white opacity-90" />
            )}
          </div>

          <div className="overflow-hidden">
            <p className="text-[#a7a7a7] text-xs font-bold uppercase tracking-widest mb-2">Playlist</p>
            <h1 className="text-5xl font-black text-white mb-3 leading-none drop-shadow-lg">
              Liked Songs
            </h1>
            <p className="text-[#a7a7a7] text-sm">
              {likedSongs.length} song{likedSongs.length !== 1 ? 's' : ''}
              {totalMins > 0 && ` · ${totalMins} min`}
            </p>
          </div>
        </div>
      </div>

      {/* Controls — Play All and Shuffle */}
      {likedSongs.length > 0 && (
        <div className="px-8 py-5 flex items-center gap-4">
          <button
            onClick={handlePlayAll}
            className="w-14 h-14 rounded-full bg-[#1db954] hover:bg-[#1ed760] flex items-center justify-center
              shadow-lg shadow-green-900/40 transition-all hover:scale-106 active:scale-94"
            aria-label={isAnyLikedActive ? 'Pause' : 'Play all'}
          >
            {isAnyLikedActive
              ? <Pause size={22} fill="black" className="text-black" />
              : <Play  size={22} fill="black" className="text-black ml-0.5" />
            }
          </button>

          <button
            onClick={handleShuffle}
            className="w-11 h-11 rounded-full bg-white/8 hover:bg-white/12 border border-white/8
              flex items-center justify-center text-[#a7a7a7] hover:text-white
              transition-all hover:scale-106 active:scale-94"
            title="Shuffle play"
          >
            <Shuffle size={16} />
          </button>

          <p className="text-[#a7a7a7] text-sm ml-1">
            {likedSongs.length} song{likedSongs.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Track list */}
      <div className="px-6 pb-10">
        {likedSongs.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Table header */}
            <div
              className="grid items-center gap-4 px-4 py-2 mb-1 text-[#535353] text-xs font-bold
                uppercase tracking-wider border-b border-white/[0.06]"
              style={{ gridTemplateColumns: '28px 48px 1fr 1fr auto auto' }}
            >
              <span className="text-center">#</span>
              <span />
              <span>Title</span>
              <span className="hidden md:block">Album</span>
              <Heart size={12} />
              <Clock size={12} />
            </div>

            {/* Song rows — plain .map() replaces AnimatePresence */}
            {likedSongs.map((song, i) => (
              <LikedRow key={song.id} song={song} index={i} allSongs={likedSongs} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
