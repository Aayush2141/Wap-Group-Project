const ITUNES = 'https://itunes.apple.com';

export function normalizeTrack(t) {
  const cover = (t.artworkUrl100 || t.artworkUrl60 || '')
    .replace('100x100bb', '500x500bb')
    .replace('100x100', '500x500') || null;

  const coverSmall = t.artworkUrl60 || t.artworkUrl100 || null;

  return {
    id: t.trackId,
    title: t.trackName,
    cover,
    preview: t.previewUrl || null,
    duration: Math.round((t.trackTimeMillis || 30000) / 1000),
    artistId: t.artistId || null,
    artist: {
      id: t.artistId || null,
      name: t.artistName || 'Unknown Artist',
    },
    album: {
      id: t.collectionId || null,
      title: t.collectionName || '',
      cover,
      coverSmall,
      coverLarge: cover,
    },
  };
}

export async function fetchSongs(query, limit = 20) {
  if (!query?.trim()) return [];
  const url = `${ITUNES}/search?term=${encodeURIComponent(query.trim())}&media=music&entity=song&limit=${limit}`;
  const response = await fetch(url);
  const data = await response.json();
  return (data.results || [])
    .filter(t => t.previewUrl && t.trackId && t.wrapperType === 'track')
    .map(normalizeTrack);
}

export async function fetchChart(limit = 20) {
  try {
    const response = await fetch(`https://rss.applemarketingtools.com/api/v2/us/music/most-played/${limit}/songs.json`);
    const data = await response.json();
    const ids = (data.feed?.results || []).map(r => r.id).join(',');

    if (!ids) throw new Error('No chart IDs');

    const lookup = await fetch(`${ITUNES}/lookup?id=${ids}&entity=song`);
    const lookupData = await lookup.json();
    const tracks = (lookupData.results || [])
      .filter(t => t.previewUrl && t.trackId)
      .map(normalizeTrack);

    if (tracks.length > 0) return tracks;
    throw new Error('Empty chart');
  } catch {
    return fetchSongs('top hits', limit);
  }
}

export async function fetchArtist(artistId) {
  const [artistResponse, tracksResponse] = await Promise.all([
    fetch(`${ITUNES}/lookup?id=${artistId}`),
    fetch(`${ITUNES}/lookup?id=${artistId}&entity=song&limit=20`),
  ]);

  const [artistData, tracksData] = await Promise.all([
    artistResponse.json(),
    tracksResponse.json(),
  ]);

  const rawArtist = artistData.results?.[0] || {};

  const songs = (tracksData.results || [])
    .filter(t => t.wrapperType === 'track' && t.previewUrl)
    .map(normalizeTrack);

  return {
    artist: {
      id: rawArtist.artistId,
      name: rawArtist.artistName || 'Unknown Artist',
    },
    songs,
  };
}
