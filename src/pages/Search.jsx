import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, X, TrendingUp } from 'lucide-react';
import SongGrid from '../components/SongGrid';
import { useFetchSongs } from '../hooks/useFetchSongs';

/* ── Highlight matching text ─────────────────────────────────────────────────── */
function Highlight({ text = '', query = '' }) {
  if (!query.trim()) return <span>{text}</span>;
  const regex  = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts  = text.split(regex);
  return (

    <span>
      {parts.map((p, i) =>
        regex.test(p)
          ? <mark key={i} className="bg-[#1db954]/25 text-[#1ed760] rounded px-0.5">{p}</mark>
          : <span key={i}>{p}</span>
      )}
    </span>

  );
}
/* ── Browse categories ───────────────────────────────────────────────────────── */
const CATEGORIES = [
  { label: 'Pop',         query: 'pop hits',          from: '#e63946', to: '#c1121f' },
  { label: 'Hip Hop',     query: 'hip hop rap',        from: '#f77f00', to: '#d62828' },
  { label: 'Lo-fi',       query: 'lofi chill beats',   from: '#4cc9f0', to: '#4361ee' },
  { label: 'Rock',        query: 'rock classic',        from: '#7209b7', to: '#560bad' },
  { label: 'EDM',         query: 'edm dance',           from: '#9b5de5', to: '#7c3aed' },
  { label: 'R&B',         query: 'rnb soul',            from: '#f72585', to: '#b5179e' },
  { label: 'Jazz',        query: 'jazz smooth',          from: '#06d6a0', to: '#40916c' },
  { label: 'Classical',   query: 'classical piano',      from: '#3a86ff', to: '#1d4e89' },
  { label: 'Country',     query: 'country music',        from: '#fb8500', to: '#e76f51' },
  { label: 'Metal',       query: 'metal heavy',          from: '#ef233c', to: '#6b0000' },
  { label: 'Indie',       query: 'indie alternative',    from: '#1db954', to: '#0a6b30' },
  { label: 'K-Pop',       query: 'kpop',                 from: '#ff6b9d', to: '#c9184a' },
  { label: 'Latin',       query: 'latin reggaeton',       from: '#ffbe0b', to: '#fb5607' },
  { label: 'Afrobeats',   query: 'afrobeats',             from: '#e9c46a', to: '#264653' },
  { label: 'Workout',     query: 'workout gym music',     from: '#ef476f', to: '#b5179e' },
  { label: 'Sleep',       query: 'sleep calm ambient',    from: '#48cae4', to: '#023e8a' },
];

function CategoryCard({ cat, onSelect }) {
  return (
    <motion.button
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(cat.query, cat.label)}
      className="relative w-full h-20 rounded-xl overflow-hidden flex items-end p-3 text-left"
      style={{ background: `linear-gradient(135deg, ${cat.from}, ${cat.to})` }}

    >
      {/* Decorative circles */}
      <div className="absolute -bottom-3 -right-3 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-white/10 pointer-events-none" />
      <span className="relative z-10 text-white font-bold text-sm drop-shadow-lg leading-tight">
        {cat.label}
      </span>
    </motion.button>
  );
}

/* ── Search results with artist grouping ─────────────────────────────────────── */
function SearchResults({ query }) {
  const { songs, loading, error } = useFetchSongs(query, 30, 0);

  const navigate = useNavigate();

  // Group unique artists from results
  const artists = songs.reduce((acc, s) => {
    if (s.artist?.id && !acc.find(a => a.id === s.artist.id)) {
      acc.push({ id: s.artist.id, name: s.artist.name, picture: s.artist.picture });
    }
    return acc;
  }, []).slice(0, 6);

  if (error) return (
    <div className="py-16 text-center">
      <p className="text-red-400 text-lg font-semibold mb-1">⚠️ Couldn't load results</p>
      <p className="text-[#535353] text-sm">Check your internet connection and try again.</p>
    </div>
  );

  return (
    <div className="space-y-8 page-enter">
      {/* Results count */}
      {!loading && songs.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[#a7a7a7] text-sm"
        >
          Found{' '}
          <span className="text-white font-bold">{songs.length}</span> results for{' '}
          <span className="text-[#1db954] font-bold">"{query}"</span>
        </motion.p>
      )}

      {/* Artists row */}
      {!loading && artists.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-white mb-3">Artists</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            {artists.map((artist, i) => (
              <motion.button
                key={artist.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.06, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/artist/${artist.id}`)}
                className="flex flex-col items-center gap-2 flex-shrink-0"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden bg-[#1a1a1a] border-2 border-white/5">
                  {artist.picture
                    ? <img src={artist.picture} alt={artist.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl">🎤</div>
                  }
                </div>
                <p className="text-xs font-semibold text-white text-center max-w-[80px] truncate">
                  <Highlight text={artist.name} query={query} />
                </p>
                <p className="text-[10px] text-[#535353]">Artist</p>
              </motion.button>
            ))}
          </div>
        </section>
      )}
      {/* Songs section */}
      <section>
        {!loading && songs.length > 0 && (
          <h2 className="text-lg font-bold text-white mb-4">Songs</h2>
        )}
        <SongGrid songs={songs} loading={loading} skeletonCount={15} />
        
      </section>
    </div>
  );
}

/* ── Search page ─────────────────────────────────────────────────────────────── */
export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [localQ, setLocalQ]   = useState(searchParams.get('q') || '');
  const [activeQ, setActiveQ] = useState(searchParams.get('q') || '');
  const inputRef = useRef(null);

  /* Sync query <-> URL */
  useEffect(() => {
    const t = setTimeout(() => {
      if (localQ.trim()) {
        setActiveQ(localQ.trim());
        setSearchParams({ q: localQ.trim() }, { replace: true });
      } else {
        setActiveQ('');
        setSearchParams({}, { replace: true });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [localQ]); // eslint-disable-line

  /* Auto-focus */
  useEffect(() => {
    inputRef.current?.focus();
    const q = searchParams.get('q');
    if (q && q !== localQ) { setLocalQ(q); setActiveQ(q); }
  }, []); // eslint-disable-line

  const handleCategorySelect = (query, label) => {
    setLocalQ(query);
    setActiveQ(query);
    setSearchParams({ q: query }, { replace: true });
  };

  return (
    <div className="px-6 py-6 page-enter">
      {/* Search input */}
      <div className="relative max-w-2xl mb-8">
        <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a7a7a7] pointer-events-none" />
        <input
          ref={inputRef}
          id="search-page-input"
          type="text"
          value={localQ}
          onChange={e => setLocalQ(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && localQ.trim()) {
              setActiveQ(localQ.trim());
              setSearchParams({ q: localQ.trim() });
            }
          }}
          placeholder="Artists, songs, genres..."
          className="w-full pl-11 pr-10 py-3.5 bg-[#161616] border border-white/[0.08]
            focus:border-[#1db954]/50 focus:bg-[#1a1a1a] outline-none
            text-white rounded-2xl text-sm placeholder:text-[#535353] transition-all"
        />
        <AnimatePresence>
          {localQ && (
            <motion.button
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              onClick={() => { setLocalQ(''); setActiveQ(''); setSearchParams({}); inputRef.current?.focus(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a7a7a7] hover:text-white transition-colors"
            >
              <X size={16} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Results or browse */}
      {activeQ ? (
        <SearchResults query={activeQ} />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-[#a7a7a7]" /> Browse All
          </h2>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}
          >
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
              >
                <CategoryCard cat={cat} onSelect={handleCategorySelect} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
