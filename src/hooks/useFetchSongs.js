// WHAT THIS FILE DOES:
// Custom hooks that fetch song/artist/chart data from iTunes.
// Each hook uses only useState + useEffect + fetch — no extra libraries.

import { useState, useEffect } from 'react';
import { fetchSongs, fetchArtist, fetchChart } from '../utils/api';

// Fetches songs from iTunes whenever the query string changes
export function useFetchSongs(query, limit = 20) {
  const [songs,   setSongs]   = useState([]);       // stores the list of songs
  const [loading, setLoading] = useState(false);    // true while the request is running
  const [error,   setError]   = useState(null);     // stores any error message

  // This useEffect runs every time the query or limit changes
  useEffect(() => {
    // If there's no query, clear results and stop
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
  }, [query, limit]); // re-run whenever query or limit changes

  return { songs, loading, error };
}

// Fetches a specific artist's info and top tracks by their iTunes artist ID
export function useFetchArtist(artistId) {
  const [artist,  setArtist]  = useState(null);
  const [songs,   setSongs]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // This useEffect runs when the artistId in the URL changes
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
  }, [artistId]); // re-run whenever the artist ID changes

  return { artist, songs, loading, error };
}

// Fetches the current iTunes top chart
export function useFetchChart(limit = 20) {
  const [songs,   setSongs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // This useEffect runs once when the component first mounts
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
  }, [limit]); // only re-runs if limit changes (almost never)

  return { songs, loading, error };
}