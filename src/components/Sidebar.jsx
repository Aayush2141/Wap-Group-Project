import { NavLink } from 'react-router-dom';
import { Home, Search, Heart, MessageCircle, Music2, Clock } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

/* ── CSS animations (replaces framer-motion) ───────────────────────────────── */
const styles = `
@keyframes fadeSlideDown  { from { opacity:0; transform:translateY(-10px) } to { opacity:1; transform:translateY(0) } }
@keyframes fadeSlideUp    { from { opacity:0; transform:translateY( 10px) } to { opacity:1; transform:translateY(0) } }
@keyframes fadeSlideLeft  { from { opacity:0; transform:translateX(-10px) } to { opacity:1; transform:translateX(0) } }
@keyframes scalePop       { from { transform:scale(0) }                     to { transform:scale(1) } }

.logo-anim   { animation: fadeSlideDown  0.3s  ease forwards; }
.liked-anim  { animation: fadeSlideUp    0.3s  ease forwards; }
.recent-item { animation: fadeSlideLeft  0.25s ease forwards; }
.dot-anim    { animation: scalePop       0.2s  ease forwards; }

.nav-pill {
  position: absolute; inset: 0;
  background: rgba(255,255,255,0.08);
  border-radius: 0.75rem;
}
`;

/* ── Single nav link ────────────────────────────────────────────────────────── */
function NavItem({ to, icon: Icon, label, exact = false }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) => {
        let color;
        if (isActive) {
          color = 'text-white';
        } else {
          color = 'text-[#a7a7a7] hover:text-white';
        }
        return `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 ${color}`;
      }}
    >
      {({ isActive }) => {
        let iconFill;
        let iconStroke;
        if (isActive) {
          iconFill = 'currentColor';
          iconStroke = 2.5;
        } else {
          iconFill = 'none';
          iconStroke = 2;
        }

        return (
          <>
            {/* Highlight background when active */}
            {isActive && <div className="nav-pill" />}

            <Icon size={20} className="relative z-10 flex-shrink-0" fill={iconFill} strokeWidth={iconStroke} />
            <span className="relative z-10">{label}</span>

            {/* Green dot indicator when active */}
            {isActive && <div className="dot-anim relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-[#1db954]" />}
          </>
        );
      }}
    </NavLink>
  );
}

/* ── One song row in the recently played list ───────────────────────────────── */
function RecentItem({ song, index }) {
  const { playSong, currentSong, isPlaying } = usePlayer();
  const active = currentSong?.id === song.id;

  // Base class shared by both active and inactive states
  const baseClass = 'recent-item flex items-center gap-3 px-2 py-2 rounded-xl cursor-pointer transition-colors duration-150 group';
  let liClass;
  if (active) {
    liClass = baseClass + ' bg-white/8';
  } else {
    liClass = baseClass + ' hover:bg-white/5';
  }

  let titleColor;
  if (active) {
    titleColor = 'text-[#1db954]';
  } else {
    titleColor = 'text-white';
  }

  // Show equalizer bars when song is playing, play button on hover otherwise
  let overlay;
  if (active && isPlaying) {
    overlay = (
      <div className="absolute inset-0 rounded-lg bg-black/50 flex items-center justify-center gap-0.5">
        <span className="eq-bar" style={{ height: 8 }} />
        <span className="eq-bar" style={{ height: 14 }} />
        <span className="eq-bar" style={{ height: 8 }} />
      </div>
    );
  } else {
    overlay = (
      <div className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M5 3l14 9-14 9V3z" /></svg>
      </div>
    );
  }

  return (
    <li
      onClick={() => playSong(song)}
      className={liClass}
      style={{ animationDelay: `${index * 0.05}s`, opacity: 0, animationFillMode: 'forwards' }}
    >
      {/* Album art with overlay */}
      <div className="relative w-10 h-10 flex-shrink-0">
        <img
          src={song.album?.coverSmall || song.album?.cover}
          alt={song.title}
          className="w-10 h-10 rounded-lg object-cover"
        />
        {overlay}
      </div>

      {/* Song title + artist */}
      <div className="overflow-hidden">
        <p className={`text-xs font-semibold truncate leading-tight ${titleColor}`}>{song.title}</p>
        <p className="text-[11px] text-[#a7a7a7] truncate">{song.artist?.name}</p>
      </div>
    </li>
  );
}

/* ── Main sidebar ───────────────────────────────────────────────────────────── */
export default function Sidebar() {
  const { likedSongs, recentlyPlayed } = usePlayer();

  return (
    <aside className="w-[240px] flex-shrink-0 flex flex-col gap-2 p-2 overflow-hidden bg-[#050505]">
      <style>{styles}</style>

      {/* App logo */}
      <div className="logo-anim flex items-center gap-2.5 px-3 py-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1db954] to-[#7c3aed] flex items-center justify-center shadow-lg">
          <Music2 size={18} fill="black" className="text-black" />
        </div>
        <div>
          <span className="text-white font-black text-lg tracking-tight leading-none block">Moodify</span>
          <span className="text-[10px] text-[#535353] font-medium">Mood-powered music</span>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="bg-[#111111] rounded-2xl p-2 flex flex-col gap-0.5">
        <NavItem to="/"       icon={Home}          label="Home"        exact />
        <NavItem to="/search" icon={Search}        label="Search" />
        <NavItem to="/mood"   icon={MessageCircle} label="Mood Chat" />
        <NavItem to="/liked"  icon={Heart}         label="Liked Songs" />
      </nav>

      {/* Recently played list */}
      <div className="bg-[#111111] rounded-2xl p-3 flex-1 overflow-y-auto">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-3 px-1">
          <Clock size={14} className="text-[#535353]" />
          <span className="text-[#a7a7a7] text-xs font-bold uppercase tracking-wider">Recently Played</span>
          {recentlyPlayed.length > 0 && (
            <span className="ml-auto text-[10px] text-[#535353] bg-white/5 rounded-full px-1.5 py-0.5">
              {recentlyPlayed.length}
            </span>
          )}
        </div>

        {/* Empty state */}
        {recentlyPlayed.length === 0 && (
          <p className="text-[#535353] text-xs px-1 py-4 text-center leading-relaxed">
            Songs you play<br />will appear here
          </p>
        )}

        {/* Song list */}
        {recentlyPlayed.length > 0 && (
          <ul className="flex flex-col gap-0.5">
            {recentlyPlayed.slice(0, 12).map((song, i) => (
              <RecentItem key={song.id} song={song} index={i} />
            ))}
          </ul>
        )}
      </div>

      {/* Liked songs shortcut — only shown when there are liked songs */}
      {likedSongs.length > 0 && (
        <div className="liked-anim">
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
              <p className="text-[#a7a7a7] text-[11px]">{likedSongs.length} song{likedSongs.length !== 1 && 's'}</p>
            </div>
          </NavLink>
        </div>
      )}
    </aside>
  );
}
