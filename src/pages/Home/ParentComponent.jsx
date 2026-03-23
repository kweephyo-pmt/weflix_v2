import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BiUpArrowAlt, BiHomeAlt, BiMoviePlay, BiTv, BiSearch, BiBookmark } from 'react-icons/bi';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import Sidebar from './Sidebar';
import { buildBrowsePath, getCategoryBySlug } from './urlFilters';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebase";
import AuthModal from "../../components/AuthModal";

function ParentComponent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const activePage =
    location.pathname === '/'                  ? 'home'
    : location.pathname.startsWith('/movies')  ? 'movies'
    : location.pathname.startsWith('/series')  ? 'series'
    : location.pathname.startsWith('/search')  ? 'search'
    : location.pathname.startsWith('/watchlist') ? 'watchlist'
    : location.pathname.startsWith('/movie/')  ? 'movies'
    : location.pathname.startsWith('/tv/')     ? 'series'
    : 'home';

  const handleScroll = useCallback(() => {
    setScrollPosition(window.scrollY);
  }, []);
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const selectedGenreId = (() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts[0] === 'movies' && pathParts[1]) {
      return getCategoryBySlug('movie', pathParts[1])?.id ?? null;
    }
    if (pathParts[0] === 'series' && pathParts[1]) {
      return getCategoryBySlug('tv', pathParts[1])?.id ?? null;
    }
    return searchParams.get('genre') ? Number(searchParams.get('genre')) : null;
  })();

  const handleNavigation = (page) => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (page === 'home')        navigate('/');
    else if (page === 'movies') navigate('/movies');
    else if (page === 'series') navigate('/series');
    else                        navigate(`/${page}`);
  };

  const handleGenreSelect = (genreId) => {
    const type = activePage === 'series' ? 'tv' : 'movie';
    window.scrollTo({ top: 0, behavior: 'auto' });
    navigate(buildBrowsePath(type, genreId, 'popularity.desc'));
  };

  return (
    <div className="min-h-screen relative text-white">
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigation}
        selectedGenreId={selectedGenreId}
        onGenreSelect={handleGenreSelect}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {scrollPosition > 300 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-4 right-4 z-50 text-white p-3 rounded-full bg-white/10 hover:bg-white/20 shadow-lg hover:scale-110 transition-all duration-300"
          aria-label="Scroll to Top"
        >
          <BiUpArrowAlt className="text-2xl" />
        </button>
      )}

      {/* Page content */}
      <div className="md:pl-[84px] pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <Outlet />

        {/* Footer — home page only */}
        {location.pathname === '/' && <footer className="bg-[#0a0c12]">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-600">
            <div className="flex items-center gap-3">
              <span className="text-white font-black text-sm">We<span className="text-red-500">Flix</span></span>
              <span>·</span>
              <span>Developed by <span className="text-gray-400 font-semibold">Phyo Min Thein</span></span>
            </div>
            <div className="flex items-center gap-3">
              <span>© {new Date().getFullYear()} WeFlix</span>
              <span>·</span>
              <span>
                Data by{' '}
                <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white underline underline-offset-2 transition-colors">
                  TMDB
                </a>
              </span>
            </div>
          </div>
        </footer>}
      </div>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#070b14] border-t border-white/[0.08] shadow-[0_-10px_30px_rgba(0,0,0,0.55)] flex items-center justify-around px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.45rem)]">
        {[
          { id: 'home',   icon: BiHomeAlt,   label: 'Home'    },
          { id: 'movies', icon: BiMoviePlay, label: 'Movies'  },
          { id: 'series', icon: BiTv,        label: 'TV'      },
          { id: 'search', icon: BiSearch,    label: 'Search'  },
          { id: 'watchlist', icon: BiBookmark, label: 'Watchlist' },
        ].map(({ id, icon: Icon, label }) => {
          const isActive = activePage === id;
          return (
            <button
              key={id}
              onClick={() => handleNavigation(id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                isActive ? 'text-red-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="text-2xl" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
        {/* Mobile Profile/Auth Button */}
        {user ? (
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors text-red-500/80 hover:text-red-400"
          >
            <FaSignOutAlt className="text-2xl" />
            <span className="text-[10px] font-medium font-bold uppercase tracking-wider">Log Out</span>
          </button>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors text-gray-500 hover:text-gray-300"
          >
            <FaUserCircle className="text-2xl" />
            <span className="text-[10px] font-medium">Log In</span>
          </button>
        )}
      </nav>

      {/* Auth Modal Form */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}

export default ParentComponent;
