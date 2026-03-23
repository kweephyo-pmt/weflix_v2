import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toDetailPath } from './urlUtils';
import HeroBanner from './HeroBanner';
import TrendingRow from './TrendingRow';
import ContinueWatchingRow from './ContinueWatchingRow';
import SEO from './SEO';

const SectionDivider = ({ label }) => (
  <div className="flex items-center gap-4 px-4 sm:px-6 mb-8 mt-4">
    <div className="flex-1 h-px bg-white/[0.05]" />
    <span className="text-gray-600 text-[11px] font-bold uppercase tracking-[0.25em]">{label}</span>
    <div className="flex-1 h-px bg-white/[0.05]" />
  </div>
);

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSelect = (item, type) => {
    const mediaType = item.media_type ?? type;
    const pathname = toDetailPath(mediaType === 'tv' ? 'tv' : 'movie', item.id, item.title || item.name);
    
    let search = '';
    if (mediaType === 'tv' && item.season && item.episode) {
      search = `?season=${item.season}&episode=${item.episode}`;
    }

    navigate(
      { pathname, search },
      { state: { from: location.pathname + location.search } }
    );
  };

  const goMovies = () => navigate('/movies');
  const goSeries = () => navigate('/series');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[#0a0c12] min-h-screen"
    >
      <SEO
        title="WeFlix — Stream Movies & TV Shows"
        description="Watch trending movies and TV shows for free. Browse by genre, discover new releases, and stream instantly on WeFlix — powered by TMDB."
        noSuffix
      />
      <HeroBanner />

      <div className="pt-10 pb-8">
        <ContinueWatchingRow onSelect={handleSelect} />

        {/* ── Movies ── */}
        <TrendingRow
          title="Trending Movies"
          type="movie"
          variant="trending"
          accent="#ef4444"
          onSelect={handleSelect}
          onSeeAll={goMovies}
        />
        <TrendingRow
          title="Top 10 Movies This Week"
          type="movie"
          variant="popular"
          showRank
          originalLanguage={['en', 'zh', 'ko', 'ja']}
          accent="#ef4444"
          onSelect={handleSelect}
          onSeeAll={goMovies}
        />
        <TrendingRow
          title="Now Playing in Theaters"
          type="movie"
          variant="now_playing"
          accent="#f59e0b"
          onSelect={handleSelect}
          onSeeAll={goMovies}
        />

        <SectionDivider label="TV Shows" />

        {/* ── TV ── */}
        <TrendingRow
          title="Asian TV Shows"
          type="tv"
          variant="popular"
          originalLanguage={['ko', 'ja', 'zh']}
          sinceYear={2020}
          accent="#f97316"
          onSelect={handleSelect}
          onSeeAll={goSeries}
        />
        <TrendingRow
          title="Trending TV Shows"
          type="tv"
          variant="trending"
          accent="#8b5cf6"
          onSelect={handleSelect}
          onSeeAll={goSeries}
        />
        <TrendingRow
          title="Top 10 Series This Week"
          type="tv"
          variant="trending"
          showRank
          accent="#8b5cf6"
          onSelect={handleSelect}
          onSeeAll={goSeries}
        />
      </div>
    </motion.div>
  );
}
