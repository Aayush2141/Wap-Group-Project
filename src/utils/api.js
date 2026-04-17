/**
 * api.js — Music API using iTunes Search API as primary source.
 *
 * WHY iTunes instead of Deezer?
 *   - Zero authentication required
 *   - Full CORS support (no proxy needed)
 *   - No geo-restrictions — works globally
 *   - Guaranteed working 30-second preview URLs (Apple CDN)
 *   - Album artwork always available (replace 100x100 → bigger size)
 *
 * iTunes Search API: https://itunes.apple.com/search
 * iTunes Lookup API: https://itunes.apple.com/lookup
 */

const ITUNES = 'https://itunes.apple.com';

/* ── Normalise raw iTunes track ─────────────────────────────────────────────
   Returns a consistent shape used by every component in the app.
─────────────────────────────────────────────────────────────────────────────*/
export function normalizeTrack(t) {
  // Upgrade artwork from 100x100 to 500x500 by swapping the size token
  const cover = (t.artworkUrl100 || t.artworkUrl60 || '')
    .replace('100x100bb', '500x500bb')
    .replace('100x100', '500x500') || null;

  const coverSmall = t.artworkUrl60 || t.artworkUrl100 || null;

  return {
    id:       t.trackId,
    title:    t.trackName,
    cover,                               // top-level (used directly by SongCard)
    preview:  t.previewUrl || null,      // Apple CDN 30-sec MP3
    duration: Math.round((t.trackTimeMillis || 30000) / 1000),
    artistId: t.artistId || null,

    // Nested objects for PlayerBar, ArtistPage, etc.
    artist: {
      id:           t.artistId  || null,
      name:         t.artistName || 'Unknown Artist',
      picture:      null,  // iTunes doesn't expose artist photos
      pictureSmall: null,
    },
    album: {
      id:         t.collectionId   || null,
      title:      t.collectionName || '',
      cover,
      coverSmall,
      coverLarge: cover,
    },
    rank: 0,
  };
}

/* ── Core search ────────────────────────────────────────────────────────────*/
/**
 * Search songs by query string.
 * Returns an array of normalised tracks with preview URLs.
 */
export async function fetchSongs(query, limit = 20) {
  if (!query?.trim()) return [];

  const url =
    `${ITUNES}/search?` +
    `term=${encodeURIComponent(query.trim())}` +
    `&media=music&entity=song&limit=${limit}`;

  const res  = await fetch(url);
  const data = await res.json();

  return (data.results || [])
    .filter(t => t.previewUrl && t.trackId && t.wrapperType === 'track')
    .map(normalizeTrack);
}

/* ── Chart — uses iTunes "top songs" search ─────────────────────────────── */
export async function fetchChart(limit = 20) {
  // iTunes RSS feed for top songs (JSON, no auth, no CORS)
  try {
    const res  = await fetch(
      `https://rss.applemarketingtools.com/api/v2/us/music/most-played/${limit}/songs.json`
    );
    const data = await res.json();
    const ids  = (data.feed?.results || []).map(r => r.id).join(',');

    if (!ids) throw new Error('No chart IDs');

    const lookup = await fetch(`${ITUNES}/lookup?id=${ids}&entity=song`);
    const lData  = await lookup.json();
    const tracks = (lData.results || [])
      .filter(t => t.previewUrl && t.trackId)
      .map(normalizeTrack);

    if (tracks.length > 0) return tracks;
    throw new Error('Empty chart');
  } catch {
    // Fallback: search for "top hits" — always returns something
    return fetchSongs('top hits', limit);
  }
}

/* ── Artist lookup ──────────────────────────────────────────────────────────*/
export async function fetchArtist(artistId) {
  const [artistRes, tracksRes] = await Promise.all([
    fetch(`${ITUNES}/lookup?id=${artistId}`),
    fetch(`${ITUNES}/lookup?id=${artistId}&entity=song&limit=20`),
  ]);
  const [artistData, tracksData] = await Promise.all([
    artistRes.json(),
    tracksRes.json(),
  ]);

  const rawArtist = artistData.results?.[0] || {};
  const songs     = (tracksData.results || [])
    .filter(t => t.wrapperType === 'track' && t.previewUrl)
    .map(normalizeTrack);

  return {
    // Shape matches what ArtistPage expects
    artist: {
      id:             rawArtist.artistId,
      name:           rawArtist.artistName || 'Unknown Artist',
      nb_fan:         null,
      picture_medium: null,
      picture_xl:     null,
      picture_big:    null,
    },
    songs,
  };
}
