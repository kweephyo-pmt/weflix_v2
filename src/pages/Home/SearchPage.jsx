import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toDetailPath } from './urlUtils';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { BiMoviePlay, BiTv } from 'react-icons/bi';
import ContentCard from './ContentCard';
import { GENRES, SPECIAL_CATEGORIES } from './tmdb';
import { buildBrowsePath } from './urlFilters';
import SEO from './SEO';

const CONFIG = {
  API_KEY: import.meta.env.VITE_TMDB_API,
  BASE_URL: import.meta.env.VITE_BASE_URL,
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p/w500',
  DEBOUNCE_DELAY: 350,
};

const GRID_CLASSES = 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4 mt-4';

const ALL_CATEGORIES = [
  ...GENRES.movie.map(g => ({ ...g, mediaType: 'movie', path: buildBrowsePath('movie', g.id, 'popularity.desc') })),
  ...GENRES.tv.map(g => ({ ...g, mediaType: 'tv', path: buildBrowsePath('tv', g.id, 'popularity.desc') })),
  ...SPECIAL_CATEGORIES.movie.map(g => ({ ...g, mediaType: 'movie', path: buildBrowsePath('movie', g.id, 'popularity.desc') })),
  ...SPECIAL_CATEGORIES.tv.map(g => ({ ...g, mediaType: 'tv', path: buildBrowsePath('tv', g.id, 'popularity.desc') })),
];

const UNIQUE_CATEGORIES = ALL_CATEGORIES.filter(
  (cat, idx, arr) => arr.findIndex(c => c.name === cat.name && c.mediaType === cat.mediaType) === idx
);

const SkeletonGrid = ({ count = 14 }) => (
  <div className={GRID_CLASSES}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
    ))}
  </div>
);

const normalizeItems = (pages) => {
  const seen = new Set();
  const merged = [];

  for (const page of pages) {
    for (const item of page.results ?? []) {
      const mediaType = item.media_type === 'tv' ? 'tv' : 'movie';
      const key = `${mediaType}_${item.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }

  return merged;
};

const getNextPageParam = (lastPage, allPages) => {
  const maxPages = Math.min(lastPage.totalPages ?? 1, 500);
  const nextPage = allPages.length + 1;
  return nextPage <= maxPages ? nextPage : undefined;
};

function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef(null);
  const sentinelRef = useRef(null);

  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  useEffect(() => {
    // Only auto-focus on desktop to prevent the iOS Safari software keyboard from 
    // automatically appearing and displacing the fixed bottom navbar.
    if (window.matchMedia('(min-width: 768px)').matches) {
      inputRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), CONFIG.DEBOUNCE_DELAY);
    return () => clearTimeout(id);
  }, [query]);

  // Keep search query in the URL so browser back restores the same results.
  useEffect(() => {
    const next = debouncedQuery.trim();
    const current = searchParams.get('q') || '';
    if (next === current) return;

    const params = new URLSearchParams(searchParams);
    if (next) params.set('q', next);
    else params.delete('q');

    setSearchParams(params, { replace: true });
  }, [debouncedQuery, searchParams, setSearchParams]);

  const searchQuery = useInfiniteQuery({
    queryKey: ['search-multi', debouncedQuery],
    enabled: debouncedQuery.trim().length > 0,
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const url = new URL(`${CONFIG.BASE_URL}/search/multi`);
      url.searchParams.append('api_key', CONFIG.API_KEY);
      url.searchParams.append('query', debouncedQuery);
      url.searchParams.append('page', pageParam);
      url.searchParams.append('include_adult', 'false');

      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();

      return {
        results: (data.results ?? []).filter(i => ['movie', 'tv'].includes(i.media_type)),
        totalPages: data.total_pages,
      };
    },
    getNextPageParam,
  });

  const suggestedQuery = useInfiniteQuery({
    queryKey: ['search-suggested-trending'],
    enabled: debouncedQuery.trim().length === 0,
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const url = new URL(`${CONFIG.BASE_URL}/trending/all/week`);
      url.searchParams.append('api_key', CONFIG.API_KEY);
      url.searchParams.append('page', pageParam);

      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();

      return {
        results: (data.results ?? []).filter(i => ['movie', 'tv'].includes(i.media_type)),
        totalPages: data.total_pages,
      };
    },
    getNextPageParam,
  });

  const isSearching = debouncedQuery.trim().length > 0;
  const activeQuery = isSearching ? searchQuery : suggestedQuery;

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = activeQuery;

  const items = useMemo(() => normalizeItems(data?.pages ?? []), [data]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '220px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, items.length]);

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

  const showInitialLoading = isLoading && items.length === 0;
  const showLoadingMore = isFetchingNextPage && items.length > 0;
  const gridAnimationKey = isSearching ? debouncedQuery.trim().toLowerCase() : 'trending';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-black text-white px-4 sm:px-8 pt-6 sm:pt-10 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-16"
    >
      <SEO
        title={debouncedQuery ? `"${debouncedQuery}" - Search Results` : 'Search Movies & TV Shows'}
        description={
          debouncedQuery
            ? `Search results for "${debouncedQuery}" on WeFlix. Find movies, TV shows, and series to stream for free.`
            : 'Search for movies, TV shows, and series on WeFlix. Find your favorites or discover something new to stream for free.'
        }
      />
      <h1 className="text-3xl font-bold mb-6">Search</h1>

      <div className="relative max-w-2xl">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search movies, TV shows, genres..."
          className="w-full bg-gray-800/60 border border-gray-700/50 text-white pl-11 pr-10 py-3.5 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent placeholder-gray-500 transition-all duration-200"
        />
        {showInitialLoading && (
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

      {error && <p className="mt-3 text-red-500 text-sm">{error.message}</p>}

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

      <section className="mt-6">
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

        {items.length === 0 && showInitialLoading && <SkeletonGrid />}

        {items.length === 0 && !showInitialLoading && isSearching && (
          <p className="text-gray-500 mt-8 text-sm">No results found for "{debouncedQuery}"</p>
        )}

        {items.length > 0 && (
          <div className={GRID_CLASSES}>
            {items.map((item, index) => (
              <motion.div
                key={`${gridAnimationKey}-${item.media_type || 'movie'}-${item.id}`}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.26,
                  ease: 'easeOut',
                  delay: Math.min(index, 14) * 0.018,
                }}
              >
                <ContentCard
                  title={item.title || item.name}
                  poster={item.poster_path ? `${CONFIG.IMAGE_BASE_URL}${item.poster_path}` : ''}
                  rating={item.vote_average}
                  releaseDate={item.release_date || item.first_air_date}
                  onClick={() => {
                    const type = item.media_type === 'tv' ? 'tv' : 'movie';
                    const from = debouncedQuery.trim()
                      ? `/search?q=${encodeURIComponent(debouncedQuery.trim())}`
                      : '/search';
                    navigate(toDetailPath(type, item.id, item.title || item.name), { state: { from } });
                  }}
                  mediaId={item.id}
                  mediaType={item.media_type === 'tv' ? 'tv' : 'movie'}
                  posterPath={item.poster_path}
                  voteAverage={item.vote_average}
                />
              </motion.div>
            ))}
          </div>
        )}

        <div ref={sentinelRef} />

        {showLoadingMore && (
          <div className="flex justify-center py-8">
            <div className="w-9 h-9 border-[3px] border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </section>
    </motion.div>
  );
}

export default SearchPage;
