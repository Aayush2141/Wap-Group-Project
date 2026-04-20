import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, User, Bell, X } from 'lucide-react';

const styles = `
@keyframes navbarFadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.navbar-root {
  animation: navbarFadeIn 0.3s ease forwards;
}
.nav-icon-btn {
  transition: transform 0.1s ease, color 0.15s;
}
.nav-icon-btn:active { transform: scale(0.9); }

.nav-profile-btn {
  transition: transform 0.15s ease, border-color 0.15s;
}
.nav-profile-btn:hover  { transform: scale(1.05); }
.nav-profile-btn:active { transform: scale(0.95); }

.search-wrapper {
  width: 320px;
  transition: width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.search-wrapper:focus-within { width: 420px; }

.clear-btn {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.clear-btn.hidden-btn {
  opacity: 0;
  transform: scale(0.7);
  pointer-events: none;
}
.clear-btn.visible-btn {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
}
`;

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim()) navigate(`/search?q=${val.trim()}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) navigate(`/search?q=${query.trim()}`);
    if (e.key === 'Escape') setQuery('');
  };

  return (
    <>
      <style>{styles}</style>
      <header className="navbar-root flex items-center justify-between px-6 py-3 glass-dark sticky top-0 z-40 border-b border-white/[0.06]">

        {/* Back / Forward */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => navigate(-1)} aria-label="Back"
            className="nav-icon-btn w-8 h-8 rounded-full bg-black/50 border border-white/5 flex items-center justify-center text-[#a7a7a7] hover:text-white transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => navigate(1)} aria-label="Forward"
            className="nav-icon-btn w-8 h-8 rounded-full bg-black/50 border border-white/5 flex items-center justify-center text-[#a7a7a7] hover:text-white transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Search bar */}
        <div className="search-wrapper relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a7a7a7] pointer-events-none" />
          <input
            id="navbar-search"
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (location.pathname !== '/search') navigate('/search'); }}
            placeholder="What do you want to play?"
            className="w-full pl-9 pr-8 py-2 text-sm text-white rounded-full
              bg-white/10 border border-white/8
              focus:bg-white/14 focus:border-white/20 focus:outline-none
              placeholder:text-[#535353] transition-all duration-200"
          />
          <button
            onClick={() => setQuery('')}
            className={`clear-btn absolute right-3 top-1/2 -translate-y-1/2 text-[#a7a7a7] hover:text-white transition-colors ${query ? 'visible-btn' : 'hidden-btn'}`}
          >
            <X size={14} />
          </button>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button className="nav-icon-btn w-8 h-8 rounded-full bg-black/40 border border-white/5 flex items-center justify-center text-[#a7a7a7] hover:text-white transition-colors" aria-label="Notifications">
            <Bell size={15} />
          </button>
          <button className="nav-profile-btn flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/8 hover:border-white/15 transition-colors" aria-label="User profile">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#1db954] to-[#7c3aed] flex items-center justify-center">
              <User size={11} className="text-white" />
            </div>
            <span className="text-white text-xs font-semibold">Profile</span>
          </button>
        </div>
      </header>
    </>
  );
}
