import { useNavigate } from 'react-router-dom';
import { toDetailPath } from './urlUtils';
import HeroBanner from './HeroBanner';
import TrendingRow from './TrendingRow';

const SectionDivider = ({ label }) => (
  <div className="flex items-center gap-4 px-4 sm:px-6 mb-8 mt-4">
    <div className="flex-1 h-px bg-white/[0.05]" />
    <span className="text-gray-600 text-[11px] font-bold uppercase tracking-[0.25em]">{label}</span>
    <div className="flex-1 h-px bg-white/[0.05]" />
  </div>
);

export default function HomePage() {
  const navigate = useNavigate();

  const handleSelect = (item, type) => {
    const mediaType = item.media_type ?? type;
    navigate(toDetailPath(mediaType === 'tv' ? 'tv' : 'movie', item.id, item.title || item.name));
  };

  const goMovies = () => navigate('/movies');
  const goSeries = () => navigate('/series');

  return (
    <div className="bg-[#0a0c12] min-h-screen">
      <HeroBanner />

      <div className="pt-10 pb-8">
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
    </div>
  );
}
