// WHAT THIS FILE DOES:
// The root component of the entire Tuneify app.
// Sets up routing (BrowserRouter), global player state (PlayerProvider),
// and the 3-panel layout: Sidebar | Main Content | PlayerBar.

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { PlayerProvider } from './context/PlayerContext';

// Layout components — always visible on every page
import Sidebar       from './components/Sidebar';
import Navbar        from './components/Navbar';
import PlayerBar     from './components/PlayerBar';
import MoodChatBubble from './components/MoodChatBubble';

// Pages — swapped in/out based on the current URL
import Home       from './pages/Home';
import Search     from './pages/Search';
import ArtistPage from './pages/ArtistPage';
import LikedSongs from './pages/LikedSongs';
import MoodPage   from './pages/MoodPage';

// Renders the correct page based on the URL
// key={location.pathname} causes React to remount on each navigation,
// which re-triggers the page-enter CSS fade-in animation on every route change
function AppRoutes() {
  const location = useLocation();

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/"                element={<Home />} />
      <Route path="/search"          element={<Search />} />
      <Route path="/artist/:artistId" element={<ArtistPage />} />
      <Route path="/liked"           element={<LikedSongs />} />
      <Route path="/mood"            element={<MoodPage />} />
      {/* Catch-all: redirect any unknown URL to Home */}
      <Route path="*"                element={<Home />} />
    </Routes>
  );
}

// The root App component
export default function App() {
  return (
    <BrowserRouter>
      {/* PlayerProvider shares music state with every component in the app */}
      <PlayerProvider>
        {/*
          Layout:
          ┌──────────┬──────────────────────────────┐
          │          │  Navbar (sticky top)          │
          │  Sidebar │  ────────────────────────     │
          │          │  Page content (scrollable)    │
          ├──────────┴──────────────────────────────┤
          │  PlayerBar (fixed bottom)                │
          └─────────────────────────────────────────┘
        */}
        <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0a]">

          {/* Left sidebar — always visible */}
          <Sidebar />

          {/* Right column: Navbar + scrollable page content + PlayerBar */}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <Navbar />

            <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
              <AppRoutes />
            </main>

            <PlayerBar />
          </div>

          {/* Floating Mood DJ bubble — sits above the PlayerBar */}
          <MoodChatBubble />
        </div>
      </PlayerProvider>
    </BrowserRouter>
  );
}
