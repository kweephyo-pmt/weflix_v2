import { useNavigate, useSearchParams } from 'react-router-dom';
import { toDetailPath } from '../urlUtils';
import ContentGrid from '../ContentGrid';
import { GENRES, SPECIAL_CATEGORIES } from '../tmdb';
import { BiMoviePlay, BiSortAlt2 } from 'react-icons/bi';

const SORT_OPTIONS = [
  { value: 'popularity.desc',          label: 'Most Popular' },
  { value: 'vote_average.desc',         label: 'Top Rated' },
  { value: 'primary_release_date.desc', label: 'Newest' },
  { value: 'primary_release_date.asc',  label: 'Oldest' },
  { value: 'revenue.desc',              label: 'Highest Grossing' },
];

function Movie() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const genreId = searchParams.get('genre') ? Number(searchParams.get('genre')) : null;
  const sortBy  = searchParams.get('sort') || 'popularity.desc';

  const allCategories = [
    { id: null, name: 'Trending' },
    ...GENRES.movie,
    ...SPECIAL_CATEGORIES.movie,
  ];

  const genre =
    GENRES.movie.find(g => g.id === genreId) ||
    SPECIAL_CATEGORIES.movie.find(g => g.id === genreId);

  const handleSelect = (item) => navigate(toDetailPath('movie', item.id, item.title || item.name));

  const handleSort = (value) => {
    setSearchParams({ genre: genreId, sort: value });
  };

  const handleGenreChip = (id) => {
    if (id === null) setSearchParams({});
    else setSearchParams({ genre: id });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <div className="px-4 sm:px-6 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center">
              <BiMoviePlay className="text-red-400 text-lg" />
            </div>
            <div>
              <h1 className="text-white text-2xl font-black tracking-tight">Movies</h1>
              {genre ? (
                <p className="text-gray-500 text-sm">
                  Browsing <span className="text-red-400 font-semibold">{genre.name}</span>
                </p>
              ) : (
                <p className="text-gray-500 text-sm">
                  <span className="text-red-400 font-semibold">Trending</span> this week
                </p>
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
      </div>

      {/* Mobile genre chips — hidden on md+ (sidebar handles it there) */}
      <div className="md:hidden overflow-x-auto hide-scrollbar px-4 pb-3">
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

      <main className="flex-grow">
        <ContentGrid
          genreId={genreId}
          type="movie"
          onSelect={handleSelect}
          sortBy={sortBy}
        />
      </main>
    </div>
  );
}

export default Movie;
