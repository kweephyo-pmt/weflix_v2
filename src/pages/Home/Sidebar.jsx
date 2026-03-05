import React from 'react';
import PropTypes from 'prop-types';
import {
  BiSearch,
  BiHomeAlt,
  BiMoviePlay,
  BiTv,
} from 'react-icons/bi';
import { FaPlay } from 'react-icons/fa';
import { GENRES, SPECIAL_CATEGORIES } from './tmdb';

const NAV_ITEMS = [
  { id: 'search',  icon: BiSearch,    action: 'navigate', label: 'Search'   },
  { id: 'home',    icon: BiHomeAlt,   action: 'navigate', label: 'Home'     },
  { id: 'movies',  icon: BiMoviePlay, action: 'navigate', label: 'Movies'   },
  { id: 'series',  icon: BiTv,        action: 'navigate', label: 'TV Shows' },
];

function Sidebar({ activePage, onNavigate, selectedGenreId, onGenreSelect }) {
  const activeId =
    activePage === 'search'  ? 'search'
    : activePage === 'movies'  ? 'movies'
    : activePage === 'series'  ? 'series'
    : 'home';

  const showCategories = activePage === 'movies' || activePage === 'series';
  const genreType = activePage === 'movies' ? 'movie' : 'tv';
  const genres = showCategories ? GENRES[genreType] : [];
  const specials = showCategories ? SPECIAL_CATEGORIES[genreType] : [];
  const adultIds = genreType === 'movie' ? [-3] : [-6];
  const adultSpecials = specials.filter((cat) => adultIds.includes(cat.id));
  const regularSpecials = specials.filter((cat) => !adultIds.includes(cat.id));

  return (
    <aside className="
      group fixed top-0 left-0 h-full z-50
      hidden md:flex flex-col
      w-[84px] hover:w-[260px]
      bg-[#0b0f18]
      border-r border-white/[0.05]
      overflow-hidden
      transition-[width] duration-300 ease-in-out
      select-none
    ">

      {/* Logo */}
      <button onClick={() => onNavigate('home')} className="flex items-center gap-4 px-[18px] pt-8 pb-9 shrink-0 text-left hover:opacity-80 transition-opacity">
        <div className="flex items-center justify-center w-[48px] h-[48px] rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-900/40 shrink-0">
          <FaPlay className="text-white text-[15px] ml-0.5" />
        </div>
        <div className="flex flex-col leading-tight whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100">
          <span className="text-white font-black text-[20px] tracking-tight">WeFlix</span>
          <span className="text-red-500/60 text-[10px] font-semibold tracking-[0.22em] uppercase mt-0.5">Streaming</span>
        </div>
      </button>

      {/* Nav section label */}
      <div className="px-[18px] mb-1 shrink-0">
        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75 text-[11px] font-bold tracking-[0.22em] uppercase text-gray-600 whitespace-nowrap">
          Menu
        </span>
      </div>

      {/* Nav items */}
      <nav className={`flex flex-col gap-1 px-[10px] ${showCategories ? 'shrink-0 pb-3' : 'flex-1 pb-6'}`}>
        {NAV_ITEMS.map(({ id, icon: Icon, action, label }) => {
          const isActive = activeId === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              title={label}
              className={`
                relative flex items-center gap-4 px-4 py-4 rounded-xl
                w-full text-[14px] font-medium whitespace-nowrap
                transition-all duration-150 focus:outline-none
                ${isActive
                  ? 'bg-red-600/15 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                }
              `}
            >
              {/* Active left-bar indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full bg-red-500" />
              )}
              <Icon className={`text-[26px] shrink-0 transition-colors duration-150 ${isActive ? 'text-red-400' : ''}`} />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75">
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Categories section — only on movies / series */}
      {showCategories && (
        <>
          <div className="mx-[18px] h-px bg-white/[0.07] shrink-0" />
          <div className="flex-1 flex flex-col min-h-0 pt-4 pb-4">
            {/* Section label */}
            <div className="px-[18px] mb-2 shrink-0">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75 text-[11px] font-bold tracking-[0.22em] uppercase text-gray-600 whitespace-nowrap">
                Genres
              </span>
            </div>
            {/* Scrollable genre list */}
            <div className="flex-1 overflow-y-auto hide-scrollbar px-[10px] flex flex-col gap-0.5">
              {genres.map((genre) => {
                const isActiveGenre = selectedGenreId === genre.id;
                return (
                  <button
                    key={genre.id}
                    onClick={() => onGenreSelect && onGenreSelect(genre.id)}
                    title={genre.name}
                    className={`
                      relative flex items-center gap-4 px-4 py-3 rounded-xl
                      w-full text-[13px] font-medium whitespace-nowrap
                      transition-all duration-150 focus:outline-none text-left
                      ${isActiveGenre
                        ? 'bg-red-600/15 text-white'
                        : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.05]'
                      }
                    `}
                  >
                    {isActiveGenre && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-red-500" />
                    )}
                    <span className={`
                      w-2 h-2 rounded-full shrink-0 transition-all duration-150
                      ${isActiveGenre ? 'bg-red-400' : 'bg-gray-700 group-hover:bg-gray-600'}
                    `} />
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75">
                      {genre.name}
                    </span>
                  </button>
                );
              })}

              {/* Special categories: Anime, K-Drama, etc. */}
              {regularSpecials.length > 0 && (
                <>
                  <div className="mx-1 my-2 h-px bg-white/[0.06] shrink-0" />
                  <div className="px-4 mb-1 shrink-0">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75 text-[10px] font-bold tracking-[0.22em] uppercase text-gray-700 whitespace-nowrap">
                      Special
                    </span>
                  </div>
                  {regularSpecials.map((cat) => {
                    const isActive = selectedGenreId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => onGenreSelect && onGenreSelect(cat.id)}
                        title={cat.name}
                        className={`
                          relative flex items-center gap-4 px-4 py-3 rounded-xl
                          w-full text-[13px] font-medium whitespace-nowrap
                          transition-all duration-150 focus:outline-none text-left
                          ${isActive
                            ? 'bg-red-600/15 text-white'
                            : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.05]'
                          }
                        `}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-red-500" />
                        )}
                        <span className={`
                          w-2 h-2 rounded-full shrink-0 transition-all duration-150
                          ${isActive ? 'bg-red-400' : 'bg-gray-700'}
                        `} />
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75">
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </>
              )}

              {/* 18+ categories (not in Special section) */}
              {adultSpecials.length > 0 && (
                <>
                  <div className="mx-1 my-2 h-px bg-white/[0.06] shrink-0" />
                  <div className="px-4 mb-1 shrink-0">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75 text-[10px] font-bold tracking-[0.22em] uppercase text-gray-700 whitespace-nowrap">
                      18+
                    </span>
                  </div>
                  {adultSpecials.map((cat) => {
                    const isActive = selectedGenreId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => onGenreSelect && onGenreSelect(cat.id)}
                        title={cat.name}
                        className={`
                          relative flex items-center gap-4 px-4 py-3 rounded-xl
                          w-full text-[13px] font-medium whitespace-nowrap
                          transition-all duration-150 focus:outline-none text-left
                          ${isActive
                            ? 'bg-red-600/15 text-white'
                            : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.05]'
                          }
                        `}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-red-500" />
                        )}
                        <span className={`
                          w-2 h-2 rounded-full shrink-0 transition-all duration-150
                          ${isActive ? 'bg-red-400' : 'bg-gray-700'}
                        `} />
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75">
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Bottom spacer */}
      {!showCategories && <div className="h-6 shrink-0" />}
    </aside>
  );
}

Sidebar.propTypes = {
  activePage:     PropTypes.string.isRequired,
  onNavigate:     PropTypes.func.isRequired,
  selectedGenreId: PropTypes.number,
  onGenreSelect:  PropTypes.func,
};

export default React.memo(Sidebar);
