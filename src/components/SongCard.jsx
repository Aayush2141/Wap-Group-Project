// WHAT THIS FILE DOES:
// A single song card used in grids and carousels.
// Shows album art, title, artist, a play button on hover, and a like button.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Play, Pause, Clock, Music2 } from 'lucide-react';
import { usePlayer, fmt } from '../context/PlayerContext';

// Loading skeleton — shown while songs are being fetched
export function SongCardSkeleton() {
  return (
    <div className="bg-[#161616] rounded-2xl p-4 flex flex-col gap-3">
      <div className="skeleton w-full aspect-square rounded-xl" />
      <div className="skeleton h-3.5 w-4/5 rounded-md" />
      <div className="skeleton h-3 w-3/5 rounded-md" />
    </div>
  );
}

// Album art with a fallback placeholder if the image fails to load
function AlbumArt({ song, isActive, isPlaying }) {
  const [imgFailed, setImgFailed] = useState(false);

  // Try every possible cover source in priority order
  const src =
    song.cover ||
    song.album?.cover ||
    song.album?.cover_medium ||
    song.album?.coverSmall ||
    null;

  return (
    <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#1a1a1a]">
      {src && !imgFailed ? (
        <img
          src={src}
          alt={song.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setImgFailed(true)}
        />
      ) : (
        // Placeholder when no image is available
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]">
          <Music2 size={36} className="text-[#2a2a2a]" />
          <span className="text-[#2a2a2a] text-[10px] text-center px-2 truncate w-full">
            {song.title?.slice(0, 20)}
          </span>
        </div>
      )}

      {/* Animated equalizer bars — shown when this song is actively playing */}
      {isActive && isPlaying && (
        <div className="absolute inset-0 bg-black/40 flex items-end justify-center pb-3 gap-1 pointer-events-none">
          <span className="eq-bar" />
          <span className="eq-bar" />
          <span className="eq-bar" />
        </div>
      )}
    </div>
  );
}

// The full song card component
export default function SongCard({ song, queue = [], index = 0 }) {
  // We use context here to access playSong, currentSong, isPlaying, togglePlay, toggleLike, isLiked
  const {
    playSong, currentSong, isPlaying,
    togglePlay, toggleLike, isLiked,
  } = usePlayer();

  const navigate = useNavigate();

  const active = currentSong?.id === song.id;
  const liked  = isLiked(song.id);

  // If there is a queue, use it so next/prev navigation works after clicking
  const songContext = queue.length > 0 ? queue : [song];

  const handleMainClick = () => {
    if (active) {
      togglePlay(); // pause/resume if already the current song
    } else {
      playSong(song, songContext);
    }
  };

  const handleArtistClick = (e) => {
    e.stopPropagation(); // don't trigger the card click
    const id = song.artistId || song.artist?.id;
    if (id) navigate(`/artist/${id}`);
  };

  return (
    <div
      id={`song-card-${song.id}`}
      onClick={handleMainClick}
      className={`group relative bg-[#161616] hover:bg-[#1e1e1e] rounded-2xl p-4
        flex flex-col gap-3 cursor-pointer transition-all duration-200
        border border-transparent hover:border-white/[0.07] hover:-translate-y-1`}
      style={{ boxShadow: active ? '0 0 0 1px rgba(29,185,84,0.3)' : undefined }}
    >
      {/* Album art */}
      <div className="relative">
        <AlbumArt song={song} isActive={active} isPlaying={isPlaying} />

        {/* Play/pause overlay — appears on card hover */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/70 via-black/10 to-transparent
          flex items-end justify-between px-3 pb-3
          opacity-0 group-hover:opacity-100 transition-opacity duration-200">

          <button
            onClick={(e) => { e.stopPropagation(); handleMainClick(); }}
            className="w-11 h-11 rounded-full bg-[#1db954] shadow-lg shadow-green-900/50
              flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
            aria-label={active && isPlaying ? 'Pause' : 'Play'}
          >
            {active && isPlaying
              ? <Pause size={18} fill="black" className="text-black" />
              : <Play  size={18} fill="black" className="text-black ml-0.5" />
            }
          </button>

          <span className="text-[10px] font-mono text-white/70 bg-black/60 rounded-md px-1.5 py-0.5 flex items-center gap-1">
            <Clock size={9} /> {fmt(song.duration)}
          </span>
        </div>

        {/* Like button — top-right corner, visible on hover or when liked */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
          aria-label={liked ? 'Unlike' : 'Like'}
          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center
            backdrop-blur-sm border transition-all active:scale-90
            opacity-0 group-hover:opacity-100
            ${liked
              ? '!opacity-100 bg-[#1db954]/20 border-[#1db954]/40 text-[#1db954]'
              : 'bg-black/50 border-white/10 text-white/70'
            }`}
        >
          <Heart size={12} fill={liked ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>
      </div>

      {/* Song title and artist name */}
      <div className="flex flex-col gap-1 min-w-0">
        <p className={`text-sm font-semibold truncate leading-tight transition-colors
          ${active ? 'text-[#1db954]' : 'text-white'}`}>
          {song.title}
        </p>
        <button
          onClick={handleArtistClick}
          className="text-[11px] text-[#a7a7a7] hover:text-white hover:underline text-left truncate transition-colors"
        >
          {typeof song.artist === 'string' ? song.artist : song.artist?.name}
        </button>
      </div>
    </div>
  );
}
