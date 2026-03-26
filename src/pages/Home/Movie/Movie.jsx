import { useEffect } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toDetailPath } from '../urlUtils';
import ContentGrid from '../ContentGrid';
import { GENRES, SPECIAL_CATEGORIES } from '../tmdb';
import { BiMoviePlay, BiSortAlt2 } from 'react-icons/bi';
import { buildBrowsePath, getCategoryBySlug, getSortByFromSlug } from '../urlFilters';
import SEO from '../SEO';

const SORT_OPTIONS = [
  { value: 'popularity.desc',          label: 'Most Popular' },
  { value: 'vote_average.desc',         label: 'Top Rated' },
  { value: 'primary_release_date.desc', label: 'Newest' },
  { value: 'primary_release_date.asc',  label: 'Oldest' },
  { value: 'revenue.desc',              label: 'Highest Grossing' },
];

function Movie() {
  const navigate = useNavigate();
  const location = useLocation();
  const { genreSlug, sortSlug } = useParams();
  const [searchParams] = useSearchParams();

  const genreFromPath = getCategoryBySlug('movie', genreSlug);
  const queryGenreId = searchParams.get('genre') ? Number(searchParams.get('genre')) : null;
  const genreId = genreFromPath?.id ?? queryGenreId;

  const sortFromPath = getSortByFromSlug('movie', sortSlug);
  const querySortBy = searchParams.get('sort');
  const sortBy = sortSlug ? sortFromPath : (querySortBy || 'popularity.desc');

  const allCategories = [
    { id: null, name: 'Trending' },
    ...[...GENRES.movie, ...SPECIAL_CATEGORIES.movie].sort((a, b) => a.name.localeCompare(b.name)),
  ];

  const genre =
    GENRES.movie.find(g => g.id === genreId) ||
    SPECIAL_CATEGORIES.movie.find(g => g.id === genreId);

  const handleSelect = (item) => {
    navigate(toDetailPath('movie', item.id, item.title || item.name), {
      state: { from: location.pathname + location.search },
    });
  };

  useEffect(() => {
    const cleanPath = buildBrowsePath('movie', genreId, sortBy);
    const hasLegacyQuery = searchParams.has('genre') || searchParams.has('sort');
    const shouldReplace = hasLegacyQuery || location.pathname !== cleanPath;
    if (shouldReplace) {
      navigate(cleanPath, { replace: true });
    }
  }, [genreId, sortBy, searchParams, location.pathname, navigate]);

  const handleSort = (value) => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    navigate(buildBrowsePath('movie', genreId, value));
  };

  const handleGenreChip = (id) => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    navigate(buildBrowsePath('movie', id, 'popularity.desc'));
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [genreId, sortBy]);

  return (
    <div className="flex flex-col min-h-screen">
      <SEO
        title={genre ? `${genre.name} Movies` : 'Movies'}
        description={
          genre
            ? `Browse and stream ${genre.name} movies free on WeFlix. Discover the best ${genre.name.toLowerCase()} films, from classics to new releases.`
            : 'Browse and stream trending movies free on WeFlix. Discover the most popular, top-rated, and newest films across all genres.'
        }
        url={`https://www.weflix.app${buildBrowsePath('movie', genreId)}`}
      />
      {/* Sticky context header */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-[#0b0f18]/80 border-b border-white/[0.06]">
        <div className="px-4 sm:px-6 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] shadow-sm">
              <BiMoviePlay className="text-red-500 text-xl" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-none">
                Movies
              </h1>
              {genre ? (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-gray-400 text-[13px] font-medium leading-none">Browsing</span>
                  <span className="px-2 py-0.5 rounded shadow-sm bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold tracking-wider uppercase leading-none">
                    {genre.name}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="px-2 py-0.5 rounded shadow-sm bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold tracking-wider uppercase leading-none">
                    Trending
                  </span>
                  <span className="text-gray-400 text-[13px] font-medium leading-none">this week</span>
                </div>
              )}
            </div>
          </div>
          {/* Sort selector — hidden on trending (no genre selected) */}
          {genreId && (
            <div className="flex items-center gap-2">
              <BiSortAlt2 className="text-gray-500 text-lg shrink-0" />
              <select
                value={sortBy}
                onChange={e => handleSort(e.target.value)}
                className="bg-white/[0.07] border border-white/10 text-sm text-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-[#0b0f18]">{opt.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Mobile genre chips */}
        <div className="md:hidden overflow-x-auto hide-scrollbar mt-3 -mx-4 px-4 pb-1">
          <div className="flex gap-2 w-max">
            {allCategories.map(cat => {
              const isActive = cat.id === null ? genreId === null : genreId === cat.id;
              return (
                <button
                  key={cat.id ?? 'trending'}
                  onClick={() => handleGenreChip(cat.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-red-600 text-white'
                      : 'bg-white/[0.07] text-gray-400 border border-white/10'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
        </div>
      </div>

      <main className="flex-grow">
        <ContentGrid
          genreId={genreId}
          type="movie"
          onSelect={handleSelect}
          sortBy={sortBy}
          onReset={() => navigate('/movies')}
        />
      </main>
    </div>
  );
}

export default Movie;
