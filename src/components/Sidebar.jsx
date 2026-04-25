// WHAT THIS FILE DOES:
// The left sidebar — shows the Tuneify logo, navigation links, recently played songs,
// and a liked songs shortcut banner. Always visible on every page.

import { NavLink } from 'react-router-dom';
import { Home, Search, Heart, MessageCircle, Music2, Clock } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

// A single navigation link in the sidebar
// isActive is provided automatically by NavLink
function NavItem({ to, icon: Icon, label, exact = false }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200
         ${isActive ? 'text-white' : 'text-[#a7a7a7] hover:text-white'}`
      }
    >
      {({ isActive }) => (
        <>
          {/* Highlight background — shown when this link is the active page */}
          {isActive && <div className="absolute inset-0 bg-white/8 rounded-xl" />}

          <Icon
            size={20}
            className="relative z-10 flex-shrink-0"
            fill={isActive ? 'currentColor' : 'none'}
            strokeWidth={isActive ? 2.5 : 2}
          />
          <span className="relative z-10">{label}</span>

          {/* Green dot — only shown when this link is active */}
          {isActive && (
            <div className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-[#1db954]" />
          )}
        </>
      )}
    </NavLink>
  );
}

// A single recently played song item in the sidebar list
function RecentItem({ song }) {
  // We use context here to access playSong, currentSong, isPlaying
  const { playSong, currentSong, isPlaying } = usePlayer();
  const active = currentSong?.id === song.id;

  return (
    <li
      onClick={() => playSong(song)}
      className={`flex items-center gap-3 px-2 py-2 rounded-xl cursor-pointer transition-colors duration-150 group
        ${active ? 'bg-white/8' : 'hover:bg-white/5'}`}
    >
      <div className="relative w-10 h-10 flex-shrink-0">
        <img
          src={song.album?.coverSmall || song.album?.cover}
          alt={song.title}
          className="w-10 h-10 rounded-lg object-cover"
        />
        {/* Show animated EQ bars if this song is currently playing */}
        {active && isPlaying ? (
          <div className="absolute inset-0 rounded-lg bg-black/50 flex items-center justify-center gap-0.5">
            <span className="eq-bar" style={{ height: 8 }} />
            <span className="eq-bar" style={{ height: 14 }} />
            <span className="eq-bar" style={{ height: 8 }} />
          </div>
        ) : (
          // Show play icon on hover
          <div className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M5 3l14 9-14 9V3z"/></svg>
          </div>
        )}
      </div>
      <div className="overflow-hidden">
        <p className={`text-xs font-semibold truncate leading-tight ${active ? 'text-[#1db954]' : 'text-white'}`}>
          {song.title}
        </p>
        <p className="text-[11px] text-[#a7a7a7] truncate">{song.artist?.name}</p>
      </div>
    </li>
  );
}

// The main Sidebar component
export default function Sidebar() {
  // We use context here to access likedSongs and recentlyPlayed
  const { likedSongs, recentlyPlayed } = usePlayer();

  return (
    <aside className="w-[240px] flex-shrink-0 flex flex-col gap-2 p-2 overflow-hidden bg-[#050505]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 py-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1db954] to-[#7c3aed] flex items-center justify-center shadow-lg">
          <Music2 size={18} fill="black" className="text-black" />
        </div>
        <div>
          <span className="text-white font-black text-lg tracking-tight leading-none block">Tuneify</span>
          <span className="text-[10px] text-[#535353] font-medium">Mood-powered music</span>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="bg-[#111111] rounded-2xl p-2 flex flex-col gap-0.5">
        <NavItem to="/"       icon={Home}          label="Home"        exact />
        <NavItem to="/search" icon={Search}        label="Search" />
        <NavItem to="/mood"   icon={MessageCircle} label="Mood Chat" />
        <NavItem to="/liked"  icon={Heart}         label="Liked Songs" />
      </nav>

      {/* Recently Played list */}
      <div className="bg-[#111111] rounded-2xl p-3 flex-1 overflow-y-auto">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Clock size={14} className="text-[#535353]" />
          <span className="text-[#a7a7a7] text-xs font-bold uppercase tracking-wider">Recently Played</span>
          {recentlyPlayed.length > 0 && (
            <span className="ml-auto text-[10px] text-[#535353] bg-white/5 rounded-full px-1.5 py-0.5">
              {recentlyPlayed.length}
            </span>
          )}
        </div>

        {recentlyPlayed.length === 0 ? (
          <p className="text-[#535353] text-xs px-1 py-4 text-center leading-relaxed">
            Songs you play<br />will appear here
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {recentlyPlayed.slice(0, 12).map(song => (
              <RecentItem key={song.id} song={song} />
            ))}
          </ul>
        )}
      </div>

      {/* Liked songs banner — only shown when the user has liked at least one song */}
      {likedSongs.length > 0 && (
        <NavLink
          to="/liked"
          className="mx-0.5 mb-1 flex items-center gap-3 rounded-2xl p-3 overflow-hidden relative
            bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border border-white/5
            hover:border-white/10 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Heart size={16} fill="white" className="text-white" />
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-xs font-bold">Liked Songs</p>
            <p className="text-[#a7a7a7] text-[11px]">
              {likedSongs.length} song{likedSongs.length !== 1 ? 's' : ''}
            </p>
          </div>
        </NavLink>
      )}
    </aside>
  );
}
