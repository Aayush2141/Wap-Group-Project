import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { PlayerProvider } from './context/PlayerContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import PlayerBar from './components/PlayerBar';
import MoodChatBubble from './components/MoodChatBubble';
import Home from './pages/Home';
import Search from './pages/Search';
import ArtistPage from './pages/ArtistPage';
import LikedSongs from './pages/LikedSongs';
import MoodPage from './pages/MoodPage';

function AppRoutes() {
  const location = useLocation();
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<Search />} />
      <Route path="/artist/:artistId" element={<ArtistPage />} />
      <Route path="/liked" element={<LikedSongs />} />
      <Route path="/mood" element={<MoodPage />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <PlayerProvider>
        <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0a]">
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <Navbar />
            <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
              <AppRoutes />
            </main>
            <PlayerBar />
          </div>
          <MoodChatBubble />
        </div>
      </PlayerProvider>
    </BrowserRouter>
  );
}
