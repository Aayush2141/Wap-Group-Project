import { useState, useEffect } from 'react';
import { fetchSongs, fetchArtist, fetchChart } from '../utils/api';

// Searches songs by query with a debounce delay
export function useFetchSongs(query, limit = 20, debounceMs = 400) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

useEffect(() => {
  if (!query?.trim()) {
    setSongs([]);
    setLoading(false);
    return;
  }
    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const songs = await fetchSongs(query.trim(), limit);
        if (!cancelled) setSongs(songs);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setSongs([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
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
      .then(({ artist, songs }) => {
        if (!cancelled) {
          setArtist(artist);
          setSongs(songs);
        }
      })
      .catch(err => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [artistId]);

  return { artist, songs, loading, error };
}

// Fetches the top chart songs
export function useFetchChart(limit = 20) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetchChart(limit)
      .then(songs => {
        if (!cancelled) setSongs(songs);
      })
      .catch(err => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [limit]);

  return { songs, loading, error };
}
