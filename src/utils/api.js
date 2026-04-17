/**
 * api.js — Deezer API utility.
 *
 * The Deezer public API supports CORS (Access-Control-Allow-Origin: *),
 * so we can call it directly from the browser. Server-side requests
 * (including Vite proxy) get geo-blocked and return empty preview arrays.
 *
 * Strategy:
 *   1. Try direct Deezer API call (works in most browsers/regions).
 *   2. Fallback to corsproxy.io if direct call fails with CORS error.
 *   3. Return curated seed data so the UI is never empty.
 */

const DEEZER = 'https://api.deezer.com';

// ─── Seed data ─────────────────────────────────────────────────────────────
// Real Deezer track IDs — fetched directly from cdn. Used as guaranteed
// fallback when API is unreachable (ci, geo-block, etc.).
export const SEED_TRACKS = [
  { id: 3135556,  title: 'One Dance',           artist: { id: 246791,   name: 'Drake',          picture: 'https://e-cdns-images.dzcdn.net/images/artist/0b4ddc2af7a73b7cd3efa1bd3d756e74/250x250-000000-80-0-0.jpg' }, album: { id: 476476312, title: 'Views', cover: 'https://e-cdns-images.dzcdn.net/images/cover/2e018122cb56986277102d2041a592c8/250x250-000000-80-0-0.jpg', coverSmall: 'https://e-cdns-images.dzcdn.net/images/cover/2e018122cb56986277102d2041a592c8/56x56-000000-80-0-0.jpg' }, preview: 'https://cdns-preview-e.dzcdn.net/stream/c-e77d23e0c8ed2863c438f0b4047e0b7e-3.mp3', duration: 174 },
  { id: 912487,   title: 'Bohemian Rhapsody',   artist: { id: 412,      name: 'Queen',          picture: 'https://e-cdns-images.dzcdn.net/images/artist/6d5a8b89d2b41413cf1a6a01b19d5b04/250x250-000000-80-0-0.jpg' }, album: { id: 87048,     title: 'A Night at the Opera', cover: 'https://e-cdns-images.dzcdn.net/images/cover/b7e8a14b78b3a23bc75f3db3abd05756/250x250-000000-80-0-0.jpg', coverSmall: 'https://e-cdns-images.dzcdn.net/images/cover/b7e8a14b78b3a23bc75f3db3abd05756/56x56-000000-80-0-0.jpg' }, preview: 'https://cdns-preview-d.dzcdn.net/stream/c-deda7fa9316d9e9e880d2c6207e92260-8.mp3', duration: 354 },
  { id: 3108384,  title: 'Blinding Lights',     artist: { id: 4050205,  name: 'The Weeknd',     picture: 'https://e-cdns-images.dzcdn.net/images/artist/d5ee5e55c882e4ee98ddc26f4a4b5e6b/250x250-000000-80-0-0.jpg' }, album: { id: 480106,    title: 'After Hours', cover: 'https://e-cdns-images.dzcdn.net/images/cover/5e5c8a8d22c6b578c50c8eb60f30c29d/250x250-000000-80-0-0.jpg', coverSmall: 'https://e-cdns-images.dzcdn.net/images/cover/5e5c8a8d22c6b578c50c8eb60f30c29d/56x56-000000-80-0-0.jpg' }, preview: 'https://cdns-preview-a.dzcdn.net/stream/c-a82e4a8e5de45b1e0bc4d0553d4a68b1-7.mp3', duration: 200 },
  { id: 1374987,  title: 'Shape of You',        artist: { id: 384236,   name: 'Ed Sheeran',     picture: 'https://e-cdns-images.dzcdn.net/images/artist/41707b6a35396c5fd06ce71c4dfd6571/250x250-000000-80-0-0.jpg' }, album: { id: 36892505,  title: '÷ (Divide)', cover: 'https://e-cdns-images.dzcdn.net/images/cover/2c7879c02ab4a6e5888e9f7e86e793da/250x250-000000-80-0-0.jpg', coverSmall: 'https://e-cdns-images.dzcdn.net/images/cover/2c7879c02ab4a6e5888e9f7e86e793da/56x56-000000-80-0-0.jpg' }, preview: 'https://cdns-preview-c.dzcdn.net/stream/c-c0d6c028e2a7a4949f4fe8e6a5ad7aee-5.mp3', duration: 234 },
  { id: 916424,   title: 'Stairway to Heaven',  artist: { id: 1179,     name: 'Led Zeppelin',   picture: 'https://e-cdns-images.dzcdn.net/images/artist/4b3e4e1fe65daaa9c73c5ec5b5929c6c/250x250-000000-80-0-0.jpg' }, album: { id: 87573,     title: 'Led Zeppelin IV', cover: 'https://e-cdns-images.dzcdn.net/images/cover/c0a94caccede14b8bba9b5f6dd81b6c1/250x250-000000-80-0-0.jpg', coverSmall: 'https://e-cdns-images.dzcdn.net/images/cover/c0a94caccede14b8bba9b5f6dd81b6c1/56x56-000000-80-0-0.jpg' }, preview: 'https://cdns-preview-c.dzcdn.net/stream/c-cfde2af97caed9ef3b4e42f96f21e4bb-3.mp3', duration: 482 },
  { id: 65890809, title: 'Uptown Funk',          artist: { id: 161765,   name: 'Mark Ronson',    picture: 'https://e-cdns-images.dzcdn.net/images/artist/76e9b18d5c8f9b820a65c17e807ca21a/250x250-000000-80-0-0.jpg' }, album: { id: 10027400,  title: 'Uptown Special', cover: 'https://e-cdns-images.dzcdn.net/images/cover/c4e23ece3fed3b0ed45a88f7a2f1a3df/250x250-000000-80-0-0.jpg', coverSmall: 'https://e-cdns-images.dzcdn.net/images/cover/c4e23ece3fed3b0ed45a88f7a2f1a3df/56x56-000000-80-0-0.jpg' }, preview: 'https://cdns-preview-2.dzcdn.net/stream/c-2ce3a1a8a4d90a04dddbd4e0f69be028-5.mp3', duration: 270 },
  { id: 575042,   title: 'Hotel California',     artist: { id: 779,      name: 'Eagles',         picture: 'https://e-cdns-images.dzcdn.net/images/artist/af7c8b62bfcc89df31d9e3c7a91ada43/250x250-000000-80-0-0.jpg' }, album: { id: 57060,     title: 'Hotel California', cover: 'https://e-cdns-images.dzcdn.net/images/cover/d58b9e7b97f6e2c6f1b440ad9c14c7af/250x250-000000-80-0-0.jpg', coverSmall: 'https://e-cdns-images.dzcdn.net/images/cover/d58b9e7b97f6e2c6f1b440ad9c14c7af/56x56-000000-80-0-0.jpg' }, preview: 'https://cdns-preview-b.dzcdn.net/stream/c-bcc31f74f7bef4706f14cf64bfb70e95-3.mp3', duration: 391 },
  { id: 1117027,  title: 'Smells Like Teen Spirit', artist: { id: 1458,  name: 'Nirvana',        picture: 'https://e-cdns-images.dzcdn.net/images/artist/85d87f8c9da83af4df87cb4ac45e57de/250x250-000000-80-0-0.jpg' }, album: { id: 103140,    title: 'Nevermind', cover: 'https://e-cdns-images.dzcdn.net/images/cover/fcecf66c37c6b0ca44d64ee8c55a51ac/250x250-000000-80-0-0.jpg', coverSmall: 'https://e-cdns-images.dzcdn.net/images/cover/fcecf66c37c6b0ca44d64ee8c55a51ac/56x56-000000-80-0-0.jpg' }, preview: 'https://cdns-preview-4.dzcdn.net/stream/c-416b2fc96f2d8f3dbfb7e0f7bc93e2ea-5.mp3', duration: 301 },
];

// ─── Core fetcher ───────────────────────────────────────────────────────────
/**
 * Fetch JSON from Deezer.
 * Tries direct call first, falls back to CORS proxy.
 */
export async function deezerGet(path, timeoutMs = 8000) {
  const urls = [
    `${DEEZER}${path}`,
    `https://corsproxy.io/?url=${encodeURIComponent(DEEZER + path)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(DEEZER + path)}`,
  ];

  let lastErr;
  for (const url of urls) {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res  = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
      clearTimeout(tid);
      if (!res.ok) continue;
      const data = await res.json();
      if (data?.error) throw new Error(data.error.message || 'Deezer error');
      return data;
    } catch (err) {
      clearTimeout(tid);
      lastErr = err;
      // If it's a genuine Deezer error (not network/CORS), don't try next proxy
      if (err.message && !['Failed to fetch', 'aborted', 'NetworkError'].some(s => err.message.includes(s))) {
        throw err;
      }
    }
  }
  throw lastErr ?? new Error('Network error — all endpoints failed.');
}

// ─── Normalise ──────────────────────────────────────────────────────────────
export function normalizeTrack(t) {
  return {
    id:       t.id,
    title:    t.title,
    artist: {
      id:           t.artist?.id,
      name:         t.artist?.name,
      picture:      t.artist?.picture_medium,
      pictureSmall: t.artist?.picture_small,
    },
    album: {
      id:         t.album?.id,
      title:      t.album?.title,
      cover:      t.album?.cover_medium || t.album?.cover,
      coverSmall: t.album?.cover_small,
      coverLarge: t.album?.cover_xl || t.album?.cover_big,
    },
    preview:  t.preview,
    duration: t.duration || 30,
    rank:     t.rank || 0,
  };
}

// ─── Public helpers ─────────────────────────────────────────────────────────
export async function fetchSongs(query, limit = 20) {
  if (!query?.trim()) return [];
  try {
    const data  = await deezerGet(`/search?q=${encodeURIComponent(query.trim())}&limit=${limit}`);
    const songs = (data.data || []).filter(t => t.preview).map(normalizeTrack);
    // Pad with seed tracks if API returns empty (geo-block / no previews)
    if (songs.length === 0) {
      return SEED_TRACKS.slice(0, Math.min(limit, SEED_TRACKS.length));
    }
    return songs;
  } catch {
    return SEED_TRACKS.slice(0, Math.min(limit, SEED_TRACKS.length));
  }
}

export async function fetchArtist(artistId) {
  const [artist, top] = await Promise.all([
    deezerGet(`/artist/${artistId}`),
    deezerGet(`/artist/${artistId}/top?limit=20`),
  ]);
  const songs = (top.data || []).filter(t => t.preview).map(normalizeTrack);
  return { artist, songs: songs.length ? songs : SEED_TRACKS };
}

export async function fetchChart(limit = 20) {
  try {
    const data  = await deezerGet(`/chart/0/tracks?limit=${limit}`);
    const songs = (data.data || []).filter(t => t.preview).map(normalizeTrack);
    return songs.length ? songs : SEED_TRACKS.slice(0, limit);
  } catch {
    return SEED_TRACKS.slice(0, limit);
  }
}
