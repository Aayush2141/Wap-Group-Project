// App.jsx
// The root component of the entire Moodify app.
// Sets up: routing (BrowserRouter), global player state (PlayerProvider),
// and the overall 3-panel layout: Sidebar | Main Content | PlayerBar.

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { PlayerProvider } from './context/PlayerContext';

// Layout components — always visible regardless of current page
import Sidebar   from './components/Sidebar';
import Navbar    from './components/Navbar';
import PlayerBar from './components/PlayerBar';

// Page components — swapped in/out based on the URL route
import Home       from './pages/Home';
import Search     from './pages/Search';
import ArtistPage from './pages/ArtistPage';
import LikedSongs from './pages/LikedSongs';
import MoodPage        from './pages/MoodPage';
import MoodChatBubble from './components/MoodChatBubble';

// ── AppRoutes ──────────────────────────────────────────────────────────────────
// Renders the correct page based on the URL.
// Each page gets the .page-enter CSS class via its own root element — this
// replaces the old AnimatePresence / PageWrapper / motion.div approach.
// The page-enter CSS animation (in index.css) handles the fade-in transition.
function AppRoutes() {
  // useLocation is needed here to force a re-render on route change
  // (which triggers the page-enter CSS animation on each new page)
  const location = useLocation();

  return (
    // key={location.pathname} causes React to remount the Routes on each navigation,
    // which re-triggers the page-enter fade-in CSS animation on every page change.
    <Routes location={location} key={location.pathname}>
      {/* Home page — shown at "/" */}
      <Route path="/"                element={<Home />} />

      {/* Search page — shown at "/search" and optionally "/search?q=query" */}
      <Route path="/search"          element={<Search />} />

      {/* Artist page — :artistId is a dynamic segment read by useParams() */}
      <Route path="/artist/:artistId" element={<ArtistPage />} />

      {/* Liked songs page */}
      <Route path="/liked"           element={<LikedSongs />} />

      {/* Mood Chat page */}
      <Route path="/mood"            element={<MoodPage />} />

      {/* Catch-all: any unknown URL shows the Home page */}
      <Route path="*"                element={<Home />} />
    </Routes>
  );
}

// ── App (root) ─────────────────────────────────────────────────────────────────
// BrowserRouter provides URL-based routing to every component below it.
// PlayerProvider provides the shared music state to every component below it.
export default function App() {
  return (
    <BrowserRouter>
      {/*
        PlayerProvider wraps everything so ANY component can call usePlayer()
        to access: currentSong, playSong, likedSongs, recentlyPlayed, etc.
      */}
      <PlayerProvider>
        {/*
          Layout grid:
          ┌──────────┬──────────────────────────────┐
          │          │  Navbar (sticky top)          │
          │  Sidebar │  ────────────────────────     │
          │          │  Page content (scrollable)    │
          │          │                               │
          ├──────────┴──────────────────────────────┤
          │  PlayerBar (fixed bottom)                │
          └─────────────────────────────────────────┘
        */}
        <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0a]">

          {/* ── Left: Sidebar (always visible) ────────────────────────── */}
          <Sidebar />

          {/* ── Right: Main column (Navbar + scrollable content + PlayerBar) */}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

            {/* Navbar — sticky top, shown on every page */}
            <Navbar />

            {/* Scrollable main content area — renders whichever page matches the URL */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
              <AppRoutes />
            </main>

            {/* PlayerBar — sticky bottom, always visible */}
            <PlayerBar />
          </div>

          {/* ── Floating Mood DJ bubble — sits above the PlayerBar ───── */}
          <MoodChatBubble />
        </div>
      </PlayerProvider>
    </BrowserRouter>
  );
}
