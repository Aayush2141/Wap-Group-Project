import { useRef } from 'react';
import { motion } from 'framer-motion';
import SongCard, { SongCardSkeleton } from './SongCard';
import { ChevronRight, ChevronLeft } from 'lucide-react';

// Grid layout 
export default function SongGrid({ songs = [], loading = false, skeletonCount = 10, title }) {
  return (
    <section>
      {title && <h2 className="text-xl font-bold text-white mb-4">{title}</h2>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {loading
          ? Array.from({ length: skeletonCount }).map((_, i) => <SongCardSkeleton key={i} />)
          : songs.map((s, i) => <SongCard key={s.id} song={s} queue={songs} index={i} />)
        }
      </div>
      {!loading && songs.length === 0 && (
        <div className="py-16 text-center text-[#535353]">No songs found.</div>
      )}
    </section>
  );
}
//  / Horizontal scroll carousel 
export function SongCarousel({ songs = [], loading = false, skeletonCount = 8, title, onShowAll }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  return (
    <section className="relative group/carousel">
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <div className="flex items-center gap-2">
            {onShowAll && (
              <button
                onClick={onShowAll}
                className="text-xs text-[#a7a7a7] hover:text-white font-semibold uppercase tracking-wider transition-colors"
              >
                Show all
              </button>
            )}
            {/* Arrow controls */}
            <div className="flex gap-1 opacity-0 group-hover/carousel:opacity-100 transition-opacity">
              {[
                { icon: ChevronLeft,  dir: -1, label: 'Scroll left'  },
                { icon: ChevronRight, dir:  1, label: 'Scroll right' },
              ].map(({ icon: Icon, dir, label }) => (
                <button
                  key={label}
                  onClick={() => scroll(dir)}
                  aria-label={label}
                  className="w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center
                    text-white hover:bg-white/20 transition-colors"
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="snap-container"
      >
        {loading
          ? Array.from({ length: skeletonCount }).map((_, i) => (
              <div key={i} className="snap-item w-44">
                <SongCardSkeleton />
              </div>
            ))
          : songs.map((s, i) => (
              <motion.div
                key={s.id}
                className="snap-item w-44"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.5) }}
              >
                <SongCard song={s} queue={songs} index={i} />
              </motion.div>
            ))
        }
      </div>
    </section>
  );
}
