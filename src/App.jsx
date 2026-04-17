import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PlayerProvider } from './context/PlayerContext';

// Layout components
import Sidebar    from './components/Sidebar';
import Navbar     from './components/Navbar';
import PlayerBar  from './components/PlayerBar';

// Pages
import Home       from './pages/Home';
import Search     from './pages/Search';
import ArtistPage from './pages/ArtistPage';
import LikedSongs from './pages/LikedSongs';
import MoodPage   from './pages/MoodPage';

/* ── Page transition wrapper ──────────────────────────────────────────────────
   Wraps every route in a consistent fade + slight upward slide.
   AnimatePresence in the parent detects route changes automatically.
─────────────────────────────────────────────────────────────────────────────── */
const pageVariants = {
  initial: { opacity: 0, y: 14 },
  enter:   { opacity: 1, y: 0,  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.18, ease: [0.4, 0, 1, 1]  } },
};

function PageWrapper({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

/* ── Animated routes ─────────────────────────────────────────────────────────── */
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/"                element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/search"          element={<PageWrapper><Search /></PageWrapper>} />
        <Route path="/artist/:artistId" element={<PageWrapper><ArtistPage /></PageWrapper>} />
        <Route path="/liked"           element={<PageWrapper><LikedSongs /></PageWrapper>} />
        <Route path="/mood"            element={<PageWrapper><MoodPage /></PageWrapper>} />
        {/* Catch-all */}
        <Route path="*"                element={<PageWrapper><Home /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}

/* ── Root app ────────────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <PlayerProvider>
        {/*
          Layout grid:
          ┌──────────┬──────────────────────────────┐
          │          │  Navbar (sticky)              │
          │  Sidebar │  ────────────────────────     │
          │          │  Page content (scrollable)    │
          │          │                               │
          ├──────────┴──────────────────────────────┤
          │  PlayerBar (sticky bottom)               │
          └─────────────────────────────────────────┘
        */}
        <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0a]">
          {/* Sidebar */}
          <Sidebar />

          {/* Main column */}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <Navbar />

            {/* Scrollable content area */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
              <AnimatedRoutes />
            </main>

            {/* Persistent player */}
            <PlayerBar />
          </div>
        </div>
      </PlayerProvider>
    </BrowserRouter>
  );
}
