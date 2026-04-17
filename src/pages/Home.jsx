import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Clock, Sparkles, TrendingUp, ChevronRight } from 'lucide-react';
import { SongCarousel } from '../components/SongGrid';
import { useFetchSongs, useFetchChart } from '../hooks/useFetchSongs';
import { usePlayer } from '../context/PlayerContext';

/* ── Greeting helper ─────────────────────────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', emoji: '☀️' };
  if (h < 18) return { text: 'Good afternoon', emoji: '🌤️' };
  return { text: 'Good evening', emoji: '🌙' };
}

/* ── Hero banner ─────────────────────────────────────────────────────────────── */
function HeroBanner() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative rounded-3xl overflow-hidden mb-8 p-8 min-h-[220px] flex flex-col justify-end noise"
      style={{
        background: 'linear-gradient(135deg, rgba(29,185,84,0.3) 0%, rgba(124,58,237,0.3) 60%, rgba(10,10,10,0) 100%)',
        borderBottom: '1px solid rgba(29,185,84,0.15)',
      }}
    >
      {/* Animated orbs */}
      {[
        { size: 280, top: '-60px', left: '-40px', color: '#1db954', delay: 0 },
        { size: 200, top: '20px',  right: '60px', color: '#7c3aed', delay: 0.5 },
        { size: 150, bottom: '-30px', right: '20%', color: '#1db954', delay: 1 },
      ].map(({ size, color, delay, ...pos }, i) => (
        <motion.div
          key={i}
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 4 + i, repeat: Infinity, delay }}
          className="absolute rounded-full blur-3xl pointer-events-none"
          style={{ width: size, height: size, background: color, ...pos }}
        />
      ))}

      <div className="relative z-10">
        <motion.p
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[#1db954] text-sm font-bold flex items-center gap-2 mb-3"
        >
          <Sparkles size={14} /> AI-Powered Music Discovery
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight"
        >
          Music that{' '}
          <span className="text-gradient-green">feels you</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-[#a7a7a7] text-sm mb-5 max-w-md"
        >
          Tell our AI how you feel and get a perfect playlist in seconds. No algorithms — just vibes.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/mood')}
            className="px-6 py-2.5 bg-[#1db954] hover:bg-[#1ed760] text-black font-bold text-sm rounded-full transition-colors"
            style={{ boxShadow: 'var(--shadow-green)' }}
          >
            ✨ Try Mood Chat
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/search')}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm rounded-full border border-white/10 transition-colors"
          >
            Browse Music
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ── Recently played quick row ───────────────────────────────────────────────── */
function RecentRow({ songs }) {
  const { playSong, currentSong, isPlaying } = usePlayer();
  if (!songs.length) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <Clock size={16} className="text-[#a7a7a7]" /> Recently Played
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {songs.slice(0, 6).map((song, i) => {
          const active = currentSong?.id === song.id;
          return (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => playSong(song)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-colors
                ${active ? 'bg-white/10' : 'bg-[#161616] hover:bg-[#1e1e1e]'} 
                border border-transparent hover:border-white/[0.06]`}
            >
              <div className="relative w-11 h-11 flex-shrink-0">
                <img
                  src={song.album?.coverSmall || song.album?.cover}
                  alt={song.title}
                  className="w-11 h-11 rounded-lg object-cover"
                />
                {active && isPlaying && (
                  <div className="absolute inset-0 rounded-lg bg-black/50 flex items-end justify-center gap-0.5 pb-1">
                    <span className="eq-bar" style={{ height: 5  }} />
                    <span className="eq-bar" style={{ height: 10 }} />
                    <span className="eq-bar" style={{ height: 5  }} />
                  </div>
                )}
              </div>
              <div className="overflow-hidden">
                <p className={`text-xs font-semibold truncate ${active ? 'text-[#1db954]' : 'text-white'}`}>
                  {song.title}
                </p>
                <p className="text-[11px] text-[#a7a7a7] truncate">{song.artist?.name}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* ── Carousel section ────────────────────────────────────────────────────────── */
function CarouselSection({ title, query, icon: Icon, delay = 0 }) {
  const navigate   = useNavigate();
  const { songs, loading } = useFetchSongs(query, 16, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="mb-10"
    >
      <SongCarousel
        songs={songs}
        loading={loading}
        title={
          <span className="flex items-center gap-2">
            {Icon && <Icon size={16} className="text-[#a7a7a7]" />}
            {title}
          </span>
        }
        onShowAll={() => navigate(`/search?q=${encodeURIComponent(query)}`)}
        skeletonCount={8}
      />
    </motion.div>
  );
}

/* ── Home page ────────────────────────────────────────────────────────────────── */
export default function Home() {
  const { recentlyPlayed } = usePlayer();
  const { songs: chartSongs, loading: chartLoading } = useFetchChart(16);
  const navigate  = useNavigate();
  const greeting  = getGreeting();

  return (
    <div className="px-6 py-6 page-enter">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <h1 className="text-3xl font-black text-white">
          {greeting.emoji} {greeting.text}
        </h1>
        <button
          onClick={() => navigate('/mood')}
          className="flex items-center gap-1.5 text-[#1db954] hover:text-[#1ed760] text-sm font-semibold transition-colors"
        >
          <Sparkles size={14} /> Mood DJ
        </button>
      </motion.div>

      {/* Hero */}
      <HeroBanner />

      {/* Recently Played */}
      <RecentRow songs={recentlyPlayed} />

      {/* Global chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-10"
      >
        <SongCarousel
          songs={chartSongs}
          loading={chartLoading}
          title={<span className="flex items-center gap-2"><TrendingUp size={16} className="text-[#a7a7a7]" /> Global Top Charts</span>}
          onShowAll={() => navigate('/search?q=top hits 2024')}
        />
      </motion.div>

      {/* Genre carousels */}
      <CarouselSection title="🎤 Hip Hop & Rap"     query="hip hop rap"         delay={0.15} />
      <CarouselSection title="🎵 Pop Hits"           query="pop hits"            delay={0.2}  />
      <CarouselSection title="☕ Lo-Fi & Chill"      query="lofi chill beats"    delay={0.25} />
      <CarouselSection title="🕺 Dance & EDM"        query="edm dance"           delay={0.3}  />
      <CarouselSection title="🌿 Indie & Alternative" query="indie alternative"  delay={0.35} />
      <CarouselSection title="💎 R&B & Soul"         query="rnb soul"            delay={0.4}  />
    </div>
  );
}
