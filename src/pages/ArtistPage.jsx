import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Heart, Clock, ArrowLeft, Music2 } from 'lucide-react';
import { useFetchArtist } from '../hooks/useFetchSongs';
import { usePlayer, fmt } from '../context/PlayerContext';

function TrackRow({ song, index, queue }) {
  const { playSong, currentSong, isPlaying, togglePlay, toggleLike, isLiked } = usePlayer();
  const active = currentSong?.id === song.id;
  const liked = isLiked(song.id);

  const handlePlay = () => {
    if (active) {
      togglePlay();
    } else {
      playSong(song, queue);
    }
  };

  return (
    <div
      onClick={handlePlay}
      className={`grid items-center gap-4 px-4 py-3 rounded-xl cursor-pointer group transition-colors ${active ? 'bg-white/8' : 'hover:bg-white/5'}`}
      style={{ gridTemplateColumns: '28px 48px 1fr auto auto' }}
    >
      <div className="text-center text-sm w-7">
        {active && isPlaying ? (
          <div className="flex items-end justify-center gap-0.5 h-4">
            <span className="eq-bar" /><span className="eq-bar" /><span className="eq-bar" />
          </div>
        ) : (
          <>
            <span className={`${active ? 'text-[#1db954]' : 'text-[#a7a7a7]'} group-hover:hidden text-xs`}>{index + 1}</span>
            <Play size={13} fill="white" className="text-white hidden group-hover:block mx-auto" />
          </>
        )}
      </div>

      <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#1a1a1a] flex-shrink-0">
        {(song.cover || song.album?.cover) ? (
          <img src={song.cover || song.album?.cover} alt={song.title} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music2 size={16} className="text-[#333]" />
          </div>
        )}
      </div>

      <div className="overflow-hidden">
        <p className={`text-sm font-semibold truncate ${active ? 'text-[#1db954]' : 'text-white'}`}>{song.title}</p>
        <p className="text-xs text-[#a7a7a7] truncate">{song.album?.title}</p>
      </div>

      <button
        onClick={e => { e.stopPropagation(); toggleLike(song); }}
        className={`p-1 transition-all opacity-0 group-hover:opacity-100 active:scale-90 ${liked ? '!opacity-100 text-[#1db954]' : 'text-[#a7a7a7] hover:text-white'}`}
      >
        <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
      </button>

      <span className="text-[#a7a7a7] text-xs tabular-nums text-right">{fmt(song.duration)}</span>
    </div>
  );
}

export default function ArtistPage() {
  const { artistId } = useParams();
  const { artist, songs, loading, error } = useFetchArtist(artistId);
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayer();
  const navigate = useNavigate();

  const isArtistActive = songs.some(s => s.id === currentSong?.id) && isPlaying;

  const handlePlayAll = () => {
    if (!songs.length) return;
    if (isArtistActive) {
      togglePlay();
    } else {
      playSong(songs[0], songs);
    }
  };

  if (error) return (
    <div className="flex items-center justify-center h-full page-enter">
      <div className="text-center">
        <p className="text-5xl mb-4">🎤</p>
        <p className="text-white text-xl font-bold mb-2">Artist not found</p>
        <p className="text-[#a7a7a7] text-sm mb-6">{error}</p>
        <button onClick={() => navigate(-1)} className="px-5 py-2 bg-white/10 rounded-full text-white text-sm hover:bg-white/15 transition-colors">Go back</button>
      </div>
    </div>
  );

  const artistName = artist?.name || 'Artist';
  const hue = artistName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const gradientBg = `linear-gradient(135deg, hsl(${hue},60%,20%) 0%, hsl(${(hue + 60) % 360},50%,15%) 60%, #0a0a0a 100%)`;

  return (
    <div className="page-enter">
      <div className="px-8 pt-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[#a7a7a7] hover:text-white text-sm transition-colors bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/5 w-fit">
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      {loading ? (
        <div className="px-8 py-10 flex items-end gap-6">
          <div className="skeleton w-36 h-36 rounded-full flex-shrink-0" />
          <div className="space-y-3 flex-1">
            <div className="skeleton h-12 w-72 rounded-xl" />
            <div className="skeleton h-4 w-40 rounded-md" />
          </div>
        </div>
      ) : (
        <div className="relative px-8 pt-6 pb-8 flex items-end gap-6 mt-4 rounded-2xl mx-6" style={{ background: gradientBg }}>
          <div
            className="w-36 h-36 rounded-full flex-shrink-0 flex items-center justify-center border-4 border-white/10 shadow-2xl text-5xl font-black text-white select-none"
            style={{ background: `linear-gradient(135deg, hsl(${hue},60%,35%), hsl(${(hue + 80) % 360},60%,25%))` }}
          >
            {artistName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[#1db954] text-xs font-bold uppercase tracking-widest mb-2">Artist</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-none mb-2 drop-shadow-lg">{artistName}</h1>
            <p className="text-[#a7a7a7] text-sm">{songs.length} popular tracks</p>
          </div>
        </div>
      )}

      <div className="px-8 py-5 flex items-center gap-4">
        <button
          onClick={handlePlayAll}
          disabled={!songs.length}
          className="w-14 h-14 rounded-full bg-[#1db954] hover:bg-[#1ed760] flex items-center justify-center shadow-lg shadow-green-900/40 disabled:opacity-40 transition-all hover:scale-106 active:scale-94"
        >
          {isArtistActive ? <Pause size={22} fill="black" className="text-black" /> : <Play size={22} fill="black" className="text-black ml-0.5" />}
        </button>
      </div>

      <div className="px-6 pb-8">
        {!loading && songs.length > 0 && (
          <div className="grid items-center gap-4 px-4 py-2 mb-1 text-[#535353] text-xs font-bold uppercase tracking-wider border-b border-white/[0.06]" style={{ gridTemplateColumns: '28px 48px 1fr auto auto' }}>
            <span className="text-center">#</span>
            <span />
            <span>Title</span>
            <Heart size={12} />
            <Clock size={12} />
          </div>
        )}

        {loading && Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <div className="skeleton w-5 h-4 rounded" />
            <div className="skeleton w-12 h-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3.5 w-3/4 rounded" />
              <div className="skeleton h-2.5 w-1/2 rounded" />
            </div>
            <div className="skeleton h-3 w-8 rounded" />
          </div>
        ))}

        {songs.map((song, i) => (
          <TrackRow key={song.id} song={song} index={i} queue={songs} />
        ))}
      </div>
    </div>
  );
}
