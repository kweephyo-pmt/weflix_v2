import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toDetailPath } from './urlUtils';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { BiMoviePlay, BiTv } from 'react-icons/bi';
import ContentCard from './ContentCard';
import { GENRES, SPECIAL_CATEGORIES } from './tmdb';
import SEO from './SEO';

const CONFIG = {
  API_KEY: import.meta.env.VITE_TMDB_API,
  BASE_URL: import.meta.env.VITE_BASE_URL,
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p/w500',
  DEBOUNCE_DELAY: 350,
};

const GRID_CLASSES = 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-1 mt-4';

const ALL_CATEGORIES = [
  ...GENRES.movie.map(g => ({ ...g, mediaType: 'movie', path: `/movies?genre=${g.id}` })),
  ...GENRES.tv.map(g => ({ ...g, mediaType: 'tv', path: `/series?genre=${g.id}` })),
  ...SPECIAL_CATEGORIES.movie.map(g => ({ ...g, mediaType: 'movie', path: `/movies?genre=${g.id}` })),
  ...SPECIAL_CATEGORIES.tv.map(g => ({ ...g, mediaType: 'tv', path: `/series?genre=${g.id}` })),
];

const UNIQUE_CATEGORIES = ALL_CATEGORIES.filter(
  (cat, idx, arr) => arr.findIndex(c => c.name === cat.name && c.mediaType === cat.mediaType) === idx
);

// ─── Skeleton row ─────────────────────────────────────────────────────────────
const SkeletonGrid = ({ count = 14 }) => (
  <div className={GRID_CLASSES}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse" />
    ))}
  </div>
);

// ─── Infinite scroll hook ─────────────────────────────────────────────────────
function useInfiniteResults(fetchFn, resetKey) {
  const [items,   setItems]   = useState([]);
  const [page,    setPage]    = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const loadingRef  = useRef(false);
  const seenIds     = useRef(new Set());
  const sentinelRef = useRef(null);

  // Reset when resetKey changes
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    seenIds.current = new Set();
  }, [resetKey]);

  // Fetch page
  useEffect(() => {
    if (!hasMore || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    fetchFn(page).then(({ results, totalPages }) => {
      const fresh = (results ?? []).filter(i => {
        if (seenIds.current.has(i.id)) return false;
        seenIds.current.add(i.id);
        return true;
      });
      setItems(prev => [...prev, ...fresh]);
      setHasMore(page < Math.min(totalPages ?? 1, 500) && (results?.length ?? 0) > 0);
    }).catch(e => {
      setError(e.message);
    }).finally(() => {
      setLoading(false);
      loadingRef.current = false;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, resetKey]);

  // IntersectionObserver on sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !loadingRef.current && hasMore) {
        setPage(p => p + 1);
      }
    }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, items]);

  return { items, loading, error, hasMore, sentinelRef };
}

// ─── Main SearchPage ──────────────────────────────────────────────────────────

function SearchPage() {
  const navigate  = useNavigate();
  const inputRef  = useRef(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Debounce
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), CONFIG.DEBOUNCE_DELAY);
    return () => clearTimeout(id);
  }, [query]);

  // ── Search fetch fn ──
  const searchFetch = useCallback(async (page) => {
    const url = new URL(`${CONFIG.BASE_URL}/search/multi`);
    url.searchParams.append('api_key', CONFIG.API_KEY);
    url.searchParams.append('query', debouncedQuery);
    url.searchParams.append('page', page);
    url.searchParams.append('include_adult', 'false');
    const res = await fetch(url);
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();
    return {
      results: (data.results ?? []).filter(i => ['movie', 'tv'].includes(i.media_type)),
      totalPages: data.total_pages,
    };
  }, [debouncedQuery]);

  // ── Suggested fetch fn ──
  const suggestedFetch = useCallback(async (page) => {
    const url = new URL(`${CONFIG.BASE_URL}/trending/all/week`);
    url.searchParams.append('api_key', CONFIG.API_KEY);
    url.searchParams.append('page', page);
    const res = await fetch(url);
    if (!res.ok) throw new Error('Fetch failed');
    const data = await res.json();
    return {
      results: (data.results ?? []).filter(i => ['movie', 'tv'].includes(i.media_type)),
      totalPages: data.total_pages,
    };
  }, []);

  const isSearching = debouncedQuery.trim().length > 0;

  const search   = useInfiniteResults(searchFetch,   debouncedQuery);
  const suggested = useInfiniteResults(suggestedFetch, 'suggested');

  const { items, loading, error, hasMore, sentinelRef } = isSearching ? search : suggested;

  const handleSelect = useCallback((item) => {
    const type = item.media_type === 'tv' ? 'tv' : 'movie';
    navigate(toDetailPath(type, item.id, item.title || item.name));
  }, [navigate]);

  const matchedCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return UNIQUE_CATEGORIES.filter(cat => cat.name.toLowerCase().includes(q));
  }, [query]);

  const clearQuery = () => {
    setQuery('');
    setDebouncedQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-8 pt-6 sm:pt-10 pb-16">
      <SEO
        title={debouncedQuery ? `"${debouncedQuery}" — Search Results` : 'Search Movies & TV Shows'}
        description={
          debouncedQuery
            ? `Search results for "${debouncedQuery}" on WeFlix. Find movies, TV shows, and series to stream for free.`
            : 'Search for movies, TV shows, and series on WeFlix. Find your favorites or discover something new to stream for free.'
        }
      />
      <h1 className="text-3xl font-bold mb-6">Search</h1>

      {/* Search bar */}
      <div className="relative max-w-2xl">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search movies, TV shows, genres…"
          className="w-full bg-gray-800/60 border border-gray-700/50 text-white pl-11 pr-10 py-3.5 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent placeholder-gray-500 transition-all duration-200"
        />
        {loading && items.length === 0 && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {query && (
          <button
            onClick={clearQuery}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            aria-label="Clear"
          >
            <FaTimes />
          </button>
        )}
      </div>

      {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}

      {/* Category chips */}
      {matchedCategories.length > 0 && (
        <section className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-5 bg-red-600 rounded-full inline-block" />
            <h2 className="text-sm font-semibold text-gray-300">Browse by Category</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {matchedCategories.map(cat => (
              <button
                key={`${cat.mediaType}-${cat.id}`}
                onClick={() => navigate(cat.path)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/[0.07] border border-white/10 text-gray-300 hover:bg-red-600/20 hover:border-red-500/40 hover:text-white transition-all duration-150"
              >
                {cat.mediaType === 'movie'
                  ? <BiMoviePlay className="text-red-400 shrink-0" />
                  : <BiTv className="text-red-400 shrink-0" />}
                {cat.name}
                <span className="text-[10px] text-gray-600 ml-0.5">
                  {cat.mediaType === 'movie' ? 'Movies' : 'TV'}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Results / Suggested */}
      <section className="mt-6">
        {/* Section label */}
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1 h-5 bg-red-600 rounded-full inline-block" />
          {isSearching ? (
            <h2 className="text-sm text-gray-400">
              Results for <span className="text-white font-semibold">"{debouncedQuery}"</span>
            </h2>
          ) : (
            <h2 className="text-lg font-semibold">Trending this week</h2>
          )}
        </div>

        {/* Initial skeleton */}
        {items.length === 0 && loading && <SkeletonGrid />}

        {/* No results */}
        {items.length === 0 && !loading && isSearching && (
          <p className="text-gray-500 mt-8 text-sm">No results found for "{debouncedQuery}"</p>
        )}

        {/* Grid */}
        {items.length > 0 && (
          <div className={GRID_CLASSES}>
            {items.map(item => (
              <ContentCard
                key={item.id}
                title={item.title || item.name}
                poster={item.poster_path ? `${CONFIG.IMAGE_BASE_URL}${item.poster_path}` : ''}
                rating={item.vote_average}
                releaseDate={item.release_date || item.first_air_date}
                onClick={() => handleSelect(item)}
              />
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} />

        {/* Loading more spinner */}
        {items.length > 0 && loading && (
          <div className="flex justify-center py-8">
            <div className="w-9 h-9 border-[3px] border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </section>
    </div>
  );
}

export default SearchPage;
