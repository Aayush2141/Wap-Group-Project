import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Clock, Sparkles, TrendingUp } from 'lucide-react';
import { SongCarousel } from '../components/SongGrid';
import { useFetchSongs, useFetchChart } from '../hooks/useFetchSongs';
import { usePlayer } from '../context/PlayerContext';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', emoji: '☀️' };
  if (hour < 18) return { text: 'Good afternoon', emoji: '🌤️' };
  return { text: 'Good evening', emoji: '🌙' };
}

function HeroBanner() {
  const navigate = useNavigate();
  return (
    <div
      className="relative rounded-3xl overflow-hidden mb-8 p-8 min-h-[220px] flex flex-col justify-end noise"
      style={{ background: 'linear-gradient(135deg, rgba(29,185,84,0.3) 0%, rgba(124,58,237,0.3) 60%, rgba(10,10,10,0) 100%)', borderBottom: '1px solid rgba(29,185,84,0.15)' }}
    >
      <div className="absolute rounded-full blur-3xl pointer-events-none opacity-20" style={{ width: 280, height: 280, top: '-60px', left: '-40px', background: '#1db954' }} />
      <div className="absolute rounded-full blur-3xl pointer-events-none opacity-15" style={{ width: 200, height: 200, top: '20px', right: '60px', background: '#7c3aed' }} />
      <div className="absolute rounded-full blur-3xl pointer-events-none opacity-15" style={{ width: 150, height: 150, bottom: '-30px', right: '20%', background: '#1db954' }} />

      <div className="relative z-10">
        <p className="text-[#1db954] text-sm font-bold flex items-center gap-2 mb-3">
          <Sparkles size={14} /> AI-Powered Music Discovery
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
          Music that{' '}
          <span className="text-gradient-green">feels you</span>
        </h1>
        <p className="text-[#a7a7a7] text-sm mb-5 max-w-md">
          Tell our Mood DJ how you feel and get a perfect playlist in seconds. No algorithms — just vibes.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/mood')}
            className="px-6 py-2.5 bg-[#1db954] hover:bg-[#1ed760] text-black font-bold text-sm rounded-full transition-colors hover:scale-105 active:scale-97"
            style={{ boxShadow: 'var(--shadow-green)' }}
          >
            ✨ Try Mood Chat
          </button>
          <button
            onClick={() => navigate('/search')}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm rounded-full border border-white/10 transition-colors hover:scale-105 active:scale-97"
          >
            Browse Music
          </button>
        </div>
      </div>
    </div>
  );
}

function RecentRow({ songs }) {
  const { playSong, currentSong, isPlaying } = usePlayer();
  if (!songs.length) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <Clock size={16} className="text-[#a7a7a7]" /> Recently Played
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {songs.slice(0, 6).map(song => {
          const active = currentSong?.id === song.id;
          return (
            <div
              key={song.id}
              onClick={() => playSong(song)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-all hover:scale-102 active:scale-98 ${active ? 'bg-white/10' : 'bg-[#161616] hover:bg-[#1e1e1e]'} border border-transparent hover:border-white/[0.06]`}
            >
              <div className="relative w-11 h-11 flex-shrink-0">
                <img src={song.album?.coverSmall || song.album?.cover} alt={song.title} className="w-11 h-11 rounded-lg object-cover" />
                {active && isPlaying && (
                  <div className="absolute inset-0 rounded-lg bg-black/50 flex items-end justify-center gap-0.5 pb-1">
                    <span className="eq-bar" style={{ height: 5 }} />
                    <span className="eq-bar" style={{ height: 10 }} />
                    <span className="eq-bar" style={{ height: 5 }} />
                  </div>
                )}
              </div>
              <div className="overflow-hidden">
                <p className={`text-xs font-semibold truncate ${active ? 'text-[#1db954]' : 'text-white'}`}>{song.title}</p>
                <p className="text-[11px] text-[#a7a7a7] truncate">{song.artist?.name}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CarouselSection({ title, query, icon: Icon }) {
  const navigate = useNavigate();
  const { songs, loading } = useFetchSongs(query, 16);

  return (
    <div className="mb-10">
      <SongCarousel
        songs={songs}
        loading={loading}
        title={<span className="flex items-center gap-2">{Icon && <Icon size={16} className="text-[#a7a7a7]" />}{title}</span>}
        onShowAll={() => navigate(`/search?q=${encodeURIComponent(query)}`)}
        skeletonCount={8}
      />
    </div>
  );
}

export default function Home() {
  const { recentlyPlayed } = usePlayer();
  const navigate = useNavigate();
  const greeting = getGreeting();
  const { songs: chartSongs, loading: chartLoading } = useFetchChart(16);

  return (
    <div className="px-6 py-6 page-enter">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black text-white">{greeting.emoji} {greeting.text}</h1>
        <button onClick={() => navigate('/mood')} className="flex items-center gap-1.5 text-[#1db954] hover:text-[#1ed760] text-sm font-semibold transition-colors">
          <Sparkles size={14} /> Mood DJ
        </button>
      </div>

      <HeroBanner />
      <RecentRow songs={recentlyPlayed} />

      <div className="mb-10">
        <SongCarousel
          songs={chartSongs}
          loading={chartLoading}
          title={<span className="flex items-center gap-2"><TrendingUp size={16} className="text-[#a7a7a7]" /> Global Top Charts</span>}
          onShowAll={() => navigate('/search?q=top hits 2024')}
        />
      </div>

      <CarouselSection title="🎤 Hip Hop & Rap" query="hip hop rap" />
      <CarouselSection title="🎵 Pop Hits" query="pop hits" />
      <CarouselSection title="☕ Lo-Fi & Chill" query="lofi chill beats" />
      <CarouselSection title="🕺 Dance & EDM" query="edm dance" />
      <CarouselSection title="🌿 Indie & Alternative" query="indie alternative" />
      <CarouselSection title="💎 R&B & Soul" query="rnb soul" />
    </div>
  );
}
