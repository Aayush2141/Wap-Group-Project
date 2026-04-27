import { useState, useEffect } from 'react';
import { fetchSongs, fetchArtist, fetchChart } from '../utils/api';

export function useFetchSongs(query, limit = 20) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query?.trim()) {
      setSongs([]);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchSongs(query.trim(), limit);
        setSongs(data);
      } catch (err) {
        setError(err.message);
        setSongs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query, limit]);

  return { songs, loading, error };
}

export function useFetchArtist(artistId) {
  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!artistId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchArtist(artistId);
        setArtist(result.artist);
        setSongs(result.songs);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [artistId]);

  return { artist, songs, loading, error };
}

export function useFetchChart(limit = 20) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchChart(limit);
        setSongs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [limit]);

  return { songs, loading, error };
}