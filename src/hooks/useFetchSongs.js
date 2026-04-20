import { useState, useEffect } from 'react';
import { fetchSongs, fetchArtist, fetchChart } from '../utils/api';

export function useFetchSongs(query, limit = 20, debounceMs = 400) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query || !query.trim()) {
      setSongs([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSongs(query.trim(), limit);
        if (!cancelled) setSongs(data);
      } catch (err) {
        if (!cancelled) { setError(err.message); setSongs([]); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, debounceMs);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, limit, debounceMs]);

  return { songs, loading, error };
}

export function useFetchArtist(artistId) {
  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!artistId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchArtist(artistId)
      .then(({ artist, songs }) => { if (!cancelled) { setArtist(artist); setSongs(songs); } })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [artistId]);

  return { artist, songs, loading, error };
}

export function useFetchChart(limit = 20) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
