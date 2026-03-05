import { useState, useEffect, useRef } from 'react';
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import { FiArrowRight } from 'react-icons/fi';
import ContentCard from './ContentCard';

const API_KEY  = import.meta.env.VITE_TMDB_API;
const BASE_URL = import.meta.env.VITE_BASE_URL;
const POSTER   = 'https://image.tmdb.org/t/p/w500';

/* variant → TMDB endpoint path */
const endpointFor = (type, variant) => {
  if (variant === 'popular')      return `/${type}/popular`;
  if (variant === 'top_rated')    return `/${type}/top_rated`;
  if (variant === 'now_playing')  return '/movie/now_playing';
  if (variant === 'airing_today') return '/tv/airing_today';
  if (variant === 'on_the_air')   return '/tv/on_the_air';
  return `/trending/${type}/week`; /* default: trending */
};

function useRow(type, variant = 'trending', minRating = 0, minVotes = 0, originalLanguage = null) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  // normalise to array for multi-language support
  const langs = originalLanguage
    ? (Array.isArray(originalLanguage) ? originalLanguage : [originalLanguage])
    : null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = new URL(`${BASE_URL}${endpointFor(type, variant)}`);
        url.searchParams.append('api_key', API_KEY);
        url.searchParams.append('language', 'en-US');
        const res  = await fetch(url);
        const data = await res.json();
        if (!cancelled) {
          setItems(
            (data.results ?? [])
              .filter(i =>
                i.poster_path &&
                (minRating === 0 || i.vote_average >= minRating) &&
                (minVotes  === 0 || i.vote_count   >= minVotes) &&
                (langs === null || langs.includes(i.original_language))
              )
              .slice(0, 20)
          );
        }
      } catch { /* ignore */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, variant, minRating, minVotes, JSON.stringify(langs)]);

  return { items, loading };
}

export default function TrendingRow({
  title,
  type,
  variant          = 'trending',
  showRank         = false,
  minRating        = 0,
  minVotes         = 0,
  originalLanguage = null,
  onSelect,
  onSeeAll,
  accent,
}) {
  const { items, loading } = useRow(type, variant, minRating, minVotes, originalLanguage);
  const rowRef = useRef(null);

  const scroll = (dir) => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 580, behavior: 'smooth' });
  };

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
    <section className="mb-12 group/row">
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
        className="flex gap-3 overflow-x-auto hide-scrollbar px-4 sm:px-6 pb-2"
      >
        {items.map((item, index) => {
          const releaseDate = item.release_date || item.first_air_date || '';
          const mediaType   = item.media_type ?? type;
          return (
            <div
              key={item.id}
              className={`shrink-0 relative ${showRank ? 'pt-6 pl-2' : ''}`}
              style={{ width: showRank ? 185 : 160 }}
            >
              {/* Rank number */}
              {showRank && (
                <span
                  className="absolute top-0 left-0 z-10 font-black select-none pointer-events-none"
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
                onClick={() => onSelect(item, mediaType)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
