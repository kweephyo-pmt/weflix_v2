import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const STORAGE_KEY = (uid) => `wf_watchlist_${uid}`;

const WatchlistContext = createContext(null);

// Read cached auth user written by Sidebar (same key)
const getCachedAuthUser = () => {
  try { return JSON.parse(localStorage.getItem('weflix_user')) ?? null; } catch { return null; }
};

export function WatchlistProvider({ children }) {
  // Seed user from localStorage so we can load watchlist cache before Firebase resolves
  const [user, setUser] = useState(getCachedAuthUser);
  const [watchlistIds, setWatchlistIds] = useState(() => {
    const cached = getCachedAuthUser();
    if (!cached) return new Set();
    try {
      const stored = localStorage.getItem(STORAGE_KEY(cached.uid));
      if (stored) return new Set(JSON.parse(stored).ids || []);
    } catch { /* ignore */ }
    return new Set();
  });
  const [watchlistItems, setWatchlistItems] = useState(() => {
    const cached = getCachedAuthUser();
    if (!cached) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY(cached.uid));
      if (stored) return JSON.parse(stored).items || [];
    } catch { /* ignore */ }
    return [];
  });
  // If we already have a cached user+items, start as ready
  const [ready, setReady] = useState(() => {
    const cached = getCachedAuthUser();
    if (!cached) return false;
    try {
      return !!localStorage.getItem(STORAGE_KEY(cached.uid));
    } catch { return false; }
  });

  // Track auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setWatchlistIds(new Set());
        setWatchlistItems([]);
        setReady(true);
        return;
      }

      // ── Load from localStorage cache immediately so buttons show right away ──
      try {
        const cached = localStorage.getItem(STORAGE_KEY(u.uid));
        if (cached) {
          const { ids, items } = JSON.parse(cached);
          setWatchlistIds(new Set(ids));
          setWatchlistItems(items || []);
          setReady(true); // already ready from cache
        }
      } catch { /* ignore malformed cache */ }
    });
    return () => unsub();
  }, []);

  // Subscribe to Firestore — confirms / corrects the localStorage cache
  useEffect(() => {
    if (!user) return;

    const ref = collection(db, 'users', user.uid, 'watchlist');
    const unsub = onSnapshot(ref, (snapshot) => {
      const ids = new Set();
      const items = [];
      snapshot.forEach((d) => {
        ids.add(String(d.data().mediaId));
        items.push({ id: d.id, ...d.data() });
      });

      const sorted = items.sort((a, b) => (b.addedAt || '').localeCompare(a.addedAt || ''));
      setWatchlistIds(ids);
      setWatchlistItems(sorted);
      setReady(true);

      // Persist to localStorage so next refresh is instant
      try {
        localStorage.setItem(STORAGE_KEY(user.uid), JSON.stringify({ ids: [...ids], items: sorted }));
      } catch { /* quota exceeded — ignore */ }
    });

    return () => unsub();
  }, [user]);

  const toggleWatchlist = useCallback(async (item, onNeedAuth) => {
    if (!user) {
      onNeedAuth?.();
      return;
    }
    const id = String(item.mediaId);
    const ref = doc(db, 'users', user.uid, 'watchlist', id);
    if (watchlistIds.has(id)) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, {
        ...item,
        addedAt: new Date().toISOString(),
      });
    }
  }, [user, watchlistIds]);

  return (
    <WatchlistContext.Provider value={{ watchlistIds, watchlistItems, toggleWatchlist, ready, user }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlist must be used inside WatchlistProvider');
  return ctx;
}
