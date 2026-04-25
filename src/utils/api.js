// WHAT THIS FILE DOES:
// All API calls to the iTunes Search API live here.
// Every other file imports from this file — no API logic scattered elsewhere.

const ITUNES = 'https://itunes.apple.com';

// Takes a raw iTunes track object and returns a consistent shape used everywhere in the app
export function normalizeTrack(t) {
  // iTunes gives 100x100 artwork — swap to get 500x500 for better quality
  const cover = (t.artworkUrl100 || t.artworkUrl60 || '')
    .replace('100x100bb', '500x500bb')
    .replace('100x100', '500x500') || null;

  const coverSmall = t.artworkUrl60 || t.artworkUrl100 || null;

  return {
    id:       t.trackId,
    title:    t.trackName,
    cover,                             // used directly by SongCard
    preview:  t.previewUrl || null,    // 30-second Apple CDN MP3
    duration: Math.round((t.trackTimeMillis || 30000) / 1000),
    artistId: t.artistId || null,
    artist: {
      id:   t.artistId  || null,
      name: t.artistName || 'Unknown Artist',
    },
    album: {
      id:         t.collectionId   || null,
      title:      t.collectionName || '',
      cover,
      coverSmall,
      coverLarge: cover,
    },
  };
}

// Search iTunes for songs matching a query string
export async function fetchSongs(query, limit = 20) {
  if (!query?.trim()) return [];

  const url = `${ITUNES}/search?term=${encodeURIComponent(query.trim())}&media=music&entity=song&limit=${limit}`;

  const response = await fetch(url);
  const data = await response.json();

  // Filter: only return tracks that have a preview URL and a valid track ID
  return (data.results || [])
    .filter(t => t.previewUrl && t.trackId && t.wrapperType === 'track')
    .map(normalizeTrack);
}

// Fetch the current iTunes top chart songs
export async function fetchChart(limit = 20) {
  try {
    // iTunes RSS feed — returns top songs as JSON, no auth needed
    const response = await fetch(
      `https://rss.applemarketingtools.com/api/v2/us/music/most-played/${limit}/songs.json`
    );
    const data = await response.json();
    const ids = (data.feed?.results || []).map(r => r.id).join(',');

    if (!ids) throw new Error('No chart IDs');

    // Look up the full track details for each chart entry
    const lookup = await fetch(`${ITUNES}/lookup?id=${ids}&entity=song`);
    const lookupData = await lookup.json();
    const tracks = (lookupData.results || [])
      .filter(t => t.previewUrl && t.trackId)
      .map(normalizeTrack);

    if (tracks.length > 0) return tracks;
    throw new Error('Empty chart');
  } catch {
    // Fallback: search "top hits" if chart feed fails
    return fetchSongs('top hits', limit);
  }
}

// Fetch an artist's info and their top tracks by artist ID
export async function fetchArtist(artistId) {
  // Run both requests at the same time with Promise.all to save time
  const [artistResponse, tracksResponse] = await Promise.all([
    fetch(`${ITUNES}/lookup?id=${artistId}`),
    fetch(`${ITUNES}/lookup?id=${artistId}&entity=song&limit=20`),
  ]);

  const [artistData, tracksData] = await Promise.all([
    artistResponse.json(),
    tracksResponse.json(),
  ]);

  const rawArtist = artistData.results?.[0] || {};

  // Only keep songs that have a preview URL
  const songs = (tracksData.results || [])
    .filter(t => t.wrapperType === 'track' && t.previewUrl)
    .map(normalizeTrack);

  return {
    artist: {
      id:   rawArtist.artistId,
      name: rawArtist.artistName || 'Unknown Artist',
    },
    songs,
  };
}
