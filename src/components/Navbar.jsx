// WHAT THIS FILE DOES:
// The top navigation bar — shows back/forward buttons, a search input, and a profile button.
// The search input is debounced: it waits 420ms after typing before navigating to /search.

import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, User, Bell, X } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [query,   setQuery]   = useState('');
  const [focused, setFocused] = useState(false);

  // useRef holds the timer ID so we can clear it on each keystroke (debounce)
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Debounced navigation: waits 420ms after each keystroke before navigating
  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (val.trim()) navigate(`/search?q=${encodeURIComponent(val.trim())}`);
    }, 420);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
    if (e.key === 'Escape') {
      setQuery('');
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 glass-dark sticky top-0 z-40 border-b border-white/[0.06]">

      {/* Back and Forward navigation buttons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="w-8 h-8 rounded-full bg-black/50 border border-white/5 flex items-center justify-center
            text-[#a7a7a7] hover:text-white transition-colors active:scale-90"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => navigate(1)}
          aria-label="Forward"
          className="w-8 h-8 rounded-full bg-black/50 border border-white/5 flex items-center justify-center
            text-[#a7a7a7] hover:text-white transition-colors active:scale-90"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Search bar — expands when focused using CSS transition */}
      <div
        className="relative transition-all duration-300"
        style={{ width: focused ? '420px' : '320px' }}
      >
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a7a7a7] pointer-events-none" />
        <input
          ref={inputRef}
          id="navbar-search"
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setFocused(true);
            // Navigate to /search page when user clicks the search bar
            if (location.pathname !== '/search') navigate('/search');
          }}
          onBlur={() => setFocused(false)}
          placeholder="What do you want to play?"
          className="w-full pl-9 pr-8 py-2 text-sm text-white rounded-full
            bg-white/10 border border-white/8
            focus:bg-white/14 focus:border-white/20 focus:outline-none
            placeholder:text-[#535353] transition-all duration-200"
        />

        {/* Clear (X) button — only shown when there's text in the input */}
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a7a7a7] hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Right side: notification bell + profile button */}
      <div className="flex items-center gap-2">
        <button
          className="w-8 h-8 rounded-full bg-black/40 border border-white/5 flex items-center justify-center
            text-[#a7a7a7] hover:text-white transition-colors active:scale-90"
          aria-label="Notifications"
        >
          <Bell size={15} />
        </button>
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/8
            hover:border-white/15 transition-colors active:scale-95"
          aria-label="User profile"
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#1db954] to-[#7c3aed] flex items-center justify-center">
            <User size={11} className="text-white" />
          </div>
          <span className="text-white text-xs font-semibold">Profile</span>
        </button>
      </div>
    </header>
  );
}
