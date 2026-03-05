import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BiUpArrowAlt, BiHomeAlt, BiMoviePlay, BiTv, BiSearch } from 'react-icons/bi';
import Sidebar from './Sidebar';

function ParentComponent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleScroll = useCallback(() => setScrollPosition(window.scrollY), []);
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const activePage =
    location.pathname === '/'                  ? 'home'
    : location.pathname.startsWith('/movies')  ? 'movies'
    : location.pathname.startsWith('/series')  ? 'series'
    : location.pathname.startsWith('/search')  ? 'search'
    : location.pathname.startsWith('/movie/')  ? 'movies'
    : location.pathname.startsWith('/tv/')     ? 'series'
    : 'home';

  const selectedGenreId = searchParams.get('genre')
    ? Number(searchParams.get('genre'))
    : null;

  const handleNavigation = (page) => {
    if (page === 'home')        navigate('/');
    else if (page === 'movies') navigate('/movies');
    else if (page === 'series') navigate('/series');
    else                        navigate(`/${page}`);
  };

  const handleGenreSelect = (genreId) => {
    setSearchParams({ genre: genreId });
  };

  return (
    <div className="min-h-screen relative text-white">
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigation}
        selectedGenreId={selectedGenreId}
        onGenreSelect={handleGenreSelect}
      />

      {scrollPosition > 300 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 md:bottom-4 right-4 z-50 text-white p-3 rounded-full bg-white/10 hover:bg-white/20 shadow-lg hover:scale-110 transition-all duration-300"
          aria-label="Scroll to Top"
        >
          <BiUpArrowAlt className="text-2xl" />
        </button>
      )}

      {/* Page content */}
      <div className="md:pl-[84px] pb-16 md:pb-0">
        <Outlet />
      </div>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0b0f18]/95 backdrop-blur-md border-t border-white/[0.07] flex items-center justify-around px-2 py-2">
        {[
          { id: 'home',   icon: BiHomeAlt,   label: 'Home'    },
          { id: 'movies', icon: BiMoviePlay, label: 'Movies'  },
          { id: 'series', icon: BiTv,        label: 'TV'      },
          { id: 'search', icon: BiSearch,    label: 'Search'  },
        ].map(({ id, icon: Icon, label }) => {
          const isActive = activePage === id;
          return (
            <button
              key={id}
              onClick={() => handleNavigation(id)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
                isActive ? 'text-red-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="text-2xl" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default ParentComponent;
