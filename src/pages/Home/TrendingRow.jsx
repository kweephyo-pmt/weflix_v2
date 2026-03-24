import { useState, useEffect, useRef, useCallback } from 'react';
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import { FiArrowRight } from 'react-icons/fi';
import ContentCard from './ContentCard';

const API_KEY = import.meta.env.VITE_TMDB_API;
const BASE_URL = import.meta.env.VITE_BASE_URL;
const POSTER = 'https://image.tmdb.org/t/p/w500';

/* variant → TMDB endpoint path */
const endpointFor = (type, variant) => {
  if (variant === 'popular') return `/${type}/popular`;
  if (variant === 'top_rated') return `/${type}/top_rated`;
  if (variant === 'now_playing') return '/movie/now_playing';
  if (variant === 'airing_today') return '/tv/airing_today';
  if (variant === 'on_the_air') return '/tv/on_the_air';
  return `/trending/${type}/week`; /* default: trending */
};

/* Build a discover URL when we need real multi-language support */
const buildDiscoverUrl = (type, variant, langs, minRating, minVotes, sinceYear) => {
  const url = new URL(`${BASE_URL}/discover/${type}`);
  url.searchParams.append('api_key', API_KEY);
  url.searchParams.append('language', 'en-US');
  url.searchParams.append('with_original_language', langs.join('|'));
  url.searchParams.append('sort_by', 'popularity.desc');
  url.searchParams.append('include_adult', 'false');
  if (minRating > 0) url.searchParams.append('vote_average.gte', minRating);
  if (minVotes > 0) url.searchParams.append('vote_count.gte', minVotes);
  if (sinceYear > 0) {
    const dateKey = type === 'tv' ? 'first_air_date.gte' : 'primary_release_date.gte';
    url.searchParams.append(dateKey, `${sinceYear}-01-01`);
  }
  if (variant === 'now_playing') {
    const today = new Date().toISOString().slice(0, 10);
    const month = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    url.searchParams.append('primary_release_date.gte', month);
    url.searchParams.append('primary_release_date.lte', today);
  }
  if (variant === 'airing_today') {
    const today = new Date().toISOString().slice(0, 10);
    url.searchParams.append('air_date.gte', today);
    url.searchParams.append('air_date.lte', today);
  }
  return url;
};

function useRow(type, variant = 'trending', minRating = 0, minVotes = 0, originalLanguage = null, sinceYear = 0) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // normalise to array for multi-language support
  const langs = originalLanguage
    ? (Array.isArray(originalLanguage) ? originalLanguage : [originalLanguage])
    : null;

  const langsKey = JSON.stringify(langs);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let results = [];

        if (variant === 'trending' && langs) {
          // Trending endpoint doesn't support language param — fetch 3 pages and filter client-side
          const pages = await Promise.all([1, 2, 3].map(page => {
            const url = new URL(`${BASE_URL}/trending/${type}/week`);
            url.searchParams.append('api_key', API_KEY);
            url.searchParams.append('language', 'en-US');
            url.searchParams.append('page', page);
            return fetch(url).then(r => r.json());
          }));
          results = pages.flatMap(d => d.results ?? []);
          results = results.filter(i => langs.includes(i.original_language));
        } else if (langs && langs.length > 1) {
          // Use discover endpoint — it supports with_original_language natively
          const url = buildDiscoverUrl(type, variant, langs, minRating, minVotes, sinceYear);
          // Fetch 2 pages for ranked rows so we have enough cards
          const [r1, r2] = await Promise.all([
            fetch(url).then(r => r.json()),
            (() => { const u2 = new URL(url); u2.searchParams.set('page', '2'); return fetch(u2).then(r => r.json()); })(),
          ]);
          results = [...(r1.results ?? []), ...(r2.results ?? [])];
        } else {
          const url = new URL(`${BASE_URL}${endpointFor(type, variant)}`);
          url.searchParams.append('api_key', API_KEY);
          url.searchParams.append('language', 'en-US');
          if (langs) url.searchParams.append('with_original_language', langs[0]);
          const res = await fetch(url);
          const data = await res.json();
          results = data.results ?? [];
        }

        if (!cancelled) {
          // Deduplicate by id
          const seen = new Set();
          setItems(
            results
              .filter(i => {
                if (!i.poster_path) return false;
                if (seen.has(i.id)) return false;
                seen.add(i.id);
                return (
                  (minRating === 0 || i.vote_average >= minRating) &&
                  (minVotes === 0 || i.vote_count >= minVotes)
                );
              })
              .slice(0, 20)
          );
        }
      } catch { /* ignore */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, variant, minRating, minVotes, sinceYear, langsKey]);

  return { items, loading };
}

export default function TrendingRow({
  title,
  type,
  variant = 'trending',
  showRank = false,
  minRating = 0,
  minVotes = 0,
  sinceYear = 0,
  originalLanguage = null,
  onSelect,
  onSeeAll,
  accent,
}) {
  const { items, loading } = useRow(type, variant, minRating, minVotes, originalLanguage, sinceYear);
  const rowRef = useRef(null);
  const dragStateRef = useRef({ active: false, startX: 0, startScrollLeft: 0, moved: false });
  const suppressClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const scroll = (dir) => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 580, behavior: 'smooth' });
  };

  const onRowMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    const el = rowRef.current;
    if (!el) return;

    dragStateRef.current = {
      active: true,
      startX: e.pageX,
      startScrollLeft: el.scrollLeft,
      moved: false,
    };
    setIsDragging(true);
  }, []);

  const onRowMouseMove = useCallback((e) => {
    const el = rowRef.current;
    const drag = dragStateRef.current;
    if (!el || !drag.active) return;

    const delta = e.pageX - drag.startX;
    if (Math.abs(delta) > 4) drag.moved = true;
    el.scrollLeft = drag.startScrollLeft - delta;
  }, []);

  const endRowDrag = useCallback(() => {
    const drag = dragStateRef.current;
    if (!drag.active) return;

    drag.active = false;
    suppressClickRef.current = drag.moved;
    setIsDragging(false);

    setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', endRowDrag);
    return () => window.removeEventListener('mouseup', endRowDrag);
  }, [endRowDrag]);

  if (loading) {
    return (
      <section className="mb-10">
        <div className="flex items-center gap-3 px-4 sm:px-6 mb-5">
          <div className="w-24 h-5 rounded-md bg-white/[0.06] animate-pulse" />
        </div>
        <div className="flex gap-3 px-4 sm:px-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="shrink-0 w-[155px] md:w-[175px] h-[235px] md:h-[265px] rounded-xl bg-white/[0.05] animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  return (
    <section className="mb-12 group/row" style={{ overflow: 'visible' }}>
      {/* ── Section header ── */}
      <div className="flex items-center justify-between px-4 sm:px-6 mb-5">
        <div className="flex items-center gap-3">
          {accent && (
            <div className="w-1 h-6 rounded-full" style={{ background: accent }} />
          )}
          <h2 className="text-white font-bold text-lg md:text-xl tracking-tight">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {onSeeAll && (
            <button
              onClick={onSeeAll}
              className="flex items-center gap-1 text-gray-500 hover:text-red-400 text-xs font-semibold uppercase tracking-wider transition-colors duration-200 mr-1"
            >
              See All <FiArrowRight className="text-sm" />
            </button>
          )}
          {/* Nav arrows: always visible, brighter on hover */}
          <div className="flex items-center gap-1 opacity-40 group-hover/row:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => scroll(-1)}
              className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <BiChevronLeft className="text-xl" />
            </button>
            <button
              onClick={() => scroll(1)}
              className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <BiChevronRight className="text-xl" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Card row ── */}
      <div
        ref={rowRef}
        onMouseDown={onRowMouseDown}
        onMouseMove={onRowMouseMove}
        onMouseLeave={endRowDrag}
        className={`flex gap-3 overflow-x-auto hide-scrollbar px-4 sm:px-6 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ paddingTop: 24, paddingBottom: 24, marginTop: -16, marginBottom: -16 }}
      >
        {items.map((item, index) => {
          const releaseDate = item.release_date || item.first_air_date || '';
          const mediaType = item.media_type ?? type;
          return (
            <div
              key={item.id}
              className={`shrink-0 relative ${showRank ? 'pt-6 pl-2' : ''}`}
              style={{ width: showRank ? 185 : 160 }}
            >
              {/* Rank number */}
              {showRank && (
                <span
                  className="absolute top-0 left-0 z-20 font-black select-none pointer-events-none"
                  style={{
                    fontSize: 72,
                    lineHeight: 1,
                    color: 'rgba(255,255,255,0.08)',
                    WebkitTextStroke: '2.5px rgba(255,255,255,0.70)',
                    textShadow: '0 4px 18px rgba(0,0,0,0.9), 0 1px 0 rgba(0,0,0,0.6)',
                    letterSpacing: '-2px',
                  }}
                >
                  {index + 1}
                </span>
              )}
              <ContentCard
                title={item.title || item.name}
                poster={item.poster_path ? `${POSTER}${item.poster_path}` : null}
                rating={item.vote_average}
                releaseDate={releaseDate.slice(0, 4)}
                onClick={() => {
                  if (suppressClickRef.current) return;
                  onSelect(item, mediaType);
                }}
                mediaId={item.id}
                mediaType={mediaType === 'tv' ? 'tv' : 'movie'}
                posterPath={item.poster_path}
                voteAverage={item.vote_average}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
