import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchSongs, fetchArtist, fetchChart } from '../utils/api';

// ─── useFetchSongs ─────────────────────────────────────────────────────────────
/**
 * Fetch and debounce song searches.
 *
 * @param {string}  query        - Search term
 * @param {number}  limit        - Max results
 * @param {number}  debounceMs   - Debounce delay
 * @returns {{ songs, loading, error, refetch }}
 */
export function useFetchSongs(query, limit = 20, debounceMs = 400) {
  const [songs,   setSongs]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const timerRef = useRef(null);
  const abortRef = useRef(null);

  const load = useCallback(async (q) => {
    if (abortRef.current) abortRef.current = false;
    const token = {};
    abortRef.current = token;

    setLoading(true);
    setError(null);
    try {
      const data = await fetchSongs(q, limit);
      if (abortRef.current === token) {
        setSongs(data);
      }
    } catch (err) {
      if (abortRef.current === token) {
        setError(err.message);
        setSongs([]);
      }
    } finally {
      if (abortRef.current === token) setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (!query?.trim()) {
      setSongs([]);
      setLoading(false);
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => load(query.trim()), debounceMs);
    return () => clearTimeout(timerRef.current);
  }, [query, load, debounceMs]);

  const refetch = useCallback(() => {
    if (query?.trim()) load(query.trim());
  }, [query, load]);

  return { songs, loading, error, refetch };
}

// ─── useFetchArtist ───────────────────────────────────────────────────────────
export function useFetchArtist(artistId) {
  const [artist,  setArtist]  = useState(null);
  const [songs,   setSongs]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!artistId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchArtist(artistId)
      .then(({ artist, songs }) => {
        if (!cancelled) { setArtist(artist); setSongs(songs); }
      })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [artistId]);

  return { artist, songs, loading, error };
}

// ─── useFetchChart ────────────────────────────────────────────────────────────
export function useFetchChart(limit = 20) {
  const [songs,   setSongs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchChart(limit)
      .then(data => { if (!cancelled) setSongs(data); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [limit]);

  return { songs, loading, error };
}
