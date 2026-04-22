# 🎵 Moodify

A Spotify-inspired music streaming web app powered by the **Deezer API** and **Google Gemini AI**. Search for songs, browse artist pages, like tracks, and let the AI Mood DJ recommend music based on how you're feeling.

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8?logo=tailwindcss&logoColor=white)
![Deezer API](https://img.shields.io/badge/Deezer-API-1a1a1a?logo=deezer&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285f4?logo=google&logoColor=white)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **Search** | Search any song or artist via the Deezer API |
| 🎵 **Playback** | Play 30-second previews with a full-featured player bar |
| ⏭️ **Queue** | Skip next/previous, auto-advance when a track ends |
| ❤️ **Liked Songs** | Like tracks and view them in a dedicated Liked Songs page |
| 🕐 **Recently Played** | Automatically tracks your last 10 played songs |
| 🎤 **Artist Pages** | Click any artist to see their profile and top tracks |
| 🧠 **Mood DJ** | Chat with a Gemini-powered AI that recommends songs based on your mood |
| 📊 **Top Charts** | Home page loads the current Deezer top songs chart |
| 💾 **Persistence** | Liked songs, recently played, and volume saved to `localStorage` |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A free [Google Gemini API key](https://aistudio.google.com) (for the Mood DJ feature)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/moodify.git
cd moodify

# 2. Install dependencies
npm install

# 3. Add your Gemini API key (see below)

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Adding Your Gemini API Key

Open `src/config.js` and paste your key:

```js
// src/config.js
export const GEMINI_API_KEY = 'YOUR_API_KEY_HERE';
```

> **Note:** The Deezer API requires no key — it works out of the box. Only the Mood DJ chat feature requires a Gemini key.

---

## 🗂️ Project Structure

```
src/
├── App.jsx                  # Root component — routing + layout
├── config.js                # Gemini API key config
├── index.css                # Global styles
│
├── components/
│   ├── Navbar.jsx           # Top navigation bar
│   ├── Sidebar.jsx          # Left sidebar with nav links & library
│   ├── PlayerBar.jsx        # Fixed bottom playback controls
│   ├── SongCard.jsx         # Reusable song card with artwork
│   ├── SongGrid.jsx         # Grid layout wrapper for song cards
│   ├── MoodChat.jsx         # Gemini AI chat panel
│   └── MoodChatBubble.jsx   # Floating Mood DJ bubble trigger
│
├── pages/
│   ├── Home.jsx             # Top charts + recently played
│   ├── Search.jsx           # Search results page
│   ├── ArtistPage.jsx       # Artist profile + top tracks
│   ├── LikedSongs.jsx       # Saved liked songs
│   └── MoodPage.jsx         # Mood DJ full page
│
├── context/
│   └── PlayerContext.jsx    # Global music player state (React Context)
│
├── hooks/
│   └── useFetchSongs.js     # Custom hooks: useFetchSongs, useFetchArtist, useFetchChart
│
└── utils/
    └── api.js               # All Deezer API calls (fetchSongs, fetchChart, fetchArtist)
```

---

## 🏗️ Architecture

Moodify uses a clean, beginner-friendly architecture with no complex state libraries.

```
┌──────────────────────────────────────────────────┐
│                   App.jsx                        │
│  BrowserRouter + PlayerProvider + 3-panel layout │
└───────────┬──────────────────────────────────────┘
            │
   ┌────────▼────────┐    ┌─────────────────────┐
   │  PlayerContext  │◄───│  All Components &   │
   │  (global state) │    │  Pages via usePlayer│
   └─────────────────┘    └─────────────────────┘
            │
   ┌────────▼────────┐    ┌─────────────────────┐
   │  useFetchSongs  │───►│     utils/api.js     │
   │  useFetchArtist │    │      Deezer API      │
   │  useFetchChart  │    │  (no auth required)  │
   └─────────────────┘    └─────────────────────┘
```

### Key Design Decisions

- **No external state library** — all state is managed with `useState`, `useEffect`, `useRef`, and React Context.
- **No Axios** — all network requests use the native `fetch()` API.
- **Deezer API** — provides free, reliable 30-second song previews and artwork with no API key needed.
- **`localStorage`** — persists liked songs, recently played, and volume across sessions without a backend.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| [React 19](https://react.dev) | UI framework |
| [Vite 8](https://vitejs.dev) | Build tool & dev server |
| [React Router v7](https://reactrouter.com) | Client-side routing |
| [Tailwind CSS v4](https://tailwindcss.com) | Utility-first styling |
| [Lucide React](https://lucide.dev) | Icon library |
| [Deezer API](https://developers.deezer.com/api) | Song search, charts, artist lookup |
| [Google Gemini API](https://aistudio.google.com) | AI-powered Mood DJ chat |

---

## 📜 Available Scripts

```bash
npm run dev      # Start development server (localhost:5173)
npm run build    # Build for production (output: /dist)
npm run preview  # Preview the production build locally
npm run lint     # Run ESLint checks
```

---

## 🌐 Deployment

The project includes a `vercel.json` for zero-config deployment on [Vercel](https://vercel.com).

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

> Make sure to add your `GEMINI_API_KEY` to your Vercel environment variables, or paste it directly in `src/config.js` before building.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to your branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is for educational purposes. Music previews are served via the Deezer API under their terms of service.
