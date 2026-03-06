import React, { useEffect, useState, useCallback, memo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { fetchMovieDetails } from "../Fetcher";
import { getIdFromDetailSlug, toDetailPath } from "../urlUtils";
import { FaRedo, FaStar, FaArrowLeft, FaFilm } from "react-icons/fa";
import { BiCalendar, BiTime, BiGlobe } from "react-icons/bi";
import Loadingspinner from "../resused/Loadingspinner";
import VideoPlayer from "./VideoPlayer";
import SEO from "../SEO";

const MemoizedVideoPlayer = memo(VideoPlayer);

const BACKDROP = "https://image.tmdb.org/t/p/original";
const POSTER   = "https://image.tmdb.org/t/p/w500";

const GENRE_COLORS = [
  "bg-red-500/15 border-red-500/30 text-red-300",
  "bg-violet-500/15 border-violet-500/30 text-violet-300",
  "bg-sky-500/15 border-sky-500/30 text-sky-300",
  "bg-amber-500/15 border-amber-500/30 text-amber-300",
];

const GenreTag = ({ children, index }) => (
  <span className={`border text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap tracking-wide ${GENRE_COLORS[index % GENRE_COLORS.length]}`}>
    {children}
  </span>
);

const MetaBadge = ({ icon: Icon, children }) => (
  <span className="flex items-center gap-1.5 bg-white/[0.07] border border-white/[0.1] text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-full">
    {Icon && <Icon className="text-gray-400 shrink-0 text-[12px]" />}
    {children}
  </span>
);

const MetaCard = ({ label, value, icon: Icon }) => (
  <div className="flex flex-col gap-1.5 bg-white/[0.05] border border-white/[0.09] hover:bg-white/[0.09] hover:border-white/[0.16] rounded-2xl px-5 py-4 min-w-[120px] transition-colors duration-200">
    <p className="flex items-center gap-1.5 text-gray-500 text-[10px] uppercase tracking-[0.18em] font-bold">
      {Icon && <Icon className="text-[11px]" />}
      {label}
    </p>
    <p className="text-white text-sm font-bold leading-snug">{value}</p>
  </div>
);

const MovieDetails = ({ movieId: movieIdProp }) => {
  const { slug } = useParams();
  const location = useLocation();
  const movieId = movieIdProp ?? getIdFromDetailSlug(slug);
  const navigate = useNavigate();
  const [movie,        setMovie]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [retrying,     setRetrying]     = useState(false);
  const [showOverview, setShowOverview] = useState(false);

  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
      return;
    }
    navigate(-1);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRetrying(true);
    try {
      const data = await fetchMovieDetails(movieId);
      setMovie(data);
    } catch {
      setError("Failed to load movie. Please try again.");
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, [movieId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!movie?.id) return;
    const canonicalPath = toDetailPath('movie', movie.id, movie.title);
    if (location.pathname !== canonicalPath) {
      navigate(canonicalPath, { replace: true, state: location.state });
    }
  }, [movie, location.pathname, location.state, navigate]);

  const formatRuntime = (m) => {
    if (!m) return null;
    const h = Math.floor(m / 60), min = m % 60;
    return h > 0 ? `${h}h ${min}m` : `${min}m`;
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loadingspinner size="large" />
    </div>
  );

  if (error) return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="bg-red-900/20 border border-red-700/50 rounded-2xl p-8 max-w-sm w-full text-center">
        <p className="text-red-300 mb-6">{error}</p>
        <button
          onClick={load}
          disabled={retrying}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          <FaRedo className={retrying ? "animate-spin" : ""} />
          {retrying ? "Retrying…" : "Retry"}
        </button>
      </div>
    </div>
  );

  if (!movie) return null;

  const year     = movie.release_date?.slice(0, 4);
  const runtime  = formatRuntime(movie.runtime);
  const rating   = movie.vote_average > 0 ? movie.vote_average.toFixed(1) : null;
  const genres   = (movie.genres ?? []).slice(0, 4);
  const overview = movie.overview ?? "";
  const truncated = overview.length > 280 && !showOverview
    ? overview.slice(0, 280) + "…"
    : overview;

  return (
    <div className="min-h-screen bg-[#0a0c12] text-white">
      <SEO
        title={`${movie.title}${year ? ` (${year})` : ''} — Watch Free on WeFlix`}
        description={
          movie.overview
            ? `${movie.overview.slice(0, 150).trim()}… Watch ${movie.title} free on WeFlix.`
            : `Watch ${movie.title} free on WeFlix.`
        }
        image={
          movie.backdrop_path
            ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
            : movie.poster_path
            ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
            : undefined
        }
        type="video.movie"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Movie',
          name: movie.title,
          description: movie.overview,
          image: movie.poster_path ? `https://image.tmdb.org/t/p/w780${movie.poster_path}` : undefined,
          dateCreated: movie.release_date,
          ...(movie.vote_average > 0 && {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: movie.vote_average.toFixed(1),
              bestRating: 10,
              ratingCount: movie.vote_count,
            },
          }),
          genre: (movie.genres ?? []).map(g => g.name),
        }}
      />

      {/* ══════ BACK BUTTON ══════ */}
      <div className="px-4 pt-5 md:px-12">
        <button
          onClick={handleBack}
          className="group inline-flex items-center gap-2 bg-white/[0.07] hover:bg-white/[0.14] backdrop-blur-sm border border-white/[0.12] text-gray-300 hover:text-white text-sm font-semibold px-4 py-2 rounded-full transition-all duration-200"
        >
          <FaArrowLeft className="text-xs group-hover:-translate-x-1 transition-transform duration-200" />
          <span>Back</span>
        </button>
      </div>

      {/* ══════ PLAYER ══════ */}
      <div className="px-3 sm:px-5 md:px-10 lg:px-16 pt-5 pb-6 md:pb-10">
        <div className="w-full max-w-[1100px] mx-auto">
        {/* Player header */}
        <div className="flex items-center gap-3 mb-4 bg-white/[0.03] border border-white/[0.07] rounded-2xl px-4 py-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-600/25 border border-red-500/40 shrink-0">
            <FaFilm className="text-red-400 text-sm" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.2em] text-red-500/60 font-semibold mb-0.5">Now Playing</p>
            <h2 className="text-sm md:text-base font-bold text-white truncate leading-tight">{movie.title}</h2>
          </div>
          {rating && (
            <div className="ml-auto flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/25 rounded-xl px-3 py-1.5 shrink-0 shadow-[0_0_20px_rgba(250,204,21,0.07)]">
              <FaStar className="text-yellow-400 text-[11px]" />
              <span className="text-yellow-300 font-bold text-sm">{rating}</span>
              <span className="text-gray-500 text-xs">/10</span>
            </div>
          )}
        </div>

        {/* Player frame */}
        <div className="w-full rounded-2xl overflow-hidden ring-1 ring-white/[0.09] shadow-[0_24px_80px_rgba(0,0,0,0.85),0_0_50px_rgba(220,38,38,0.07)] bg-black relative">
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.05] pointer-events-none z-10" />
          <div className="w-full aspect-video">
            <MemoizedVideoPlayer movieId={movieId} title={movie.title} />
          </div>
        </div>

        {/* uBlock notice */}
        <div className="mt-3.5 flex items-start gap-3 bg-yellow-500/[0.06] border border-yellow-500/[0.18] rounded-xl px-4 py-3">
          <span className="text-yellow-400 text-base shrink-0 mt-0.5">🛡️</span>
          <p className="text-yellow-200/60 text-xs leading-relaxed">
            For a better experience with fewer ads, install{" "}
            <a
              href="https://ublockorigin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-400 font-semibold underline underline-offset-2 hover:text-yellow-300 transition-colors"
            >
              uBlock Origin
            </a>
            {" "}in your browser.
          </p>
        </div>
        </div>
      </div>

      {/* ══════ HERO / DETAILS ══════ */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: 460 }}>
        {/* Backdrop */}
        {movie.backdrop_path ? (
          <img
            src={`${BACKDROP}${movie.backdrop_path}`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-top scale-105"
            style={{ filter: "brightness(0.55) saturate(1.2)" }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#111827] to-[#0a0c12]" />
        )}
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c12] via-[#0a0c12]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c12] via-[#0a0c12]/60 to-transparent" />
        {/* Top fade from player section */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#0a0c12] to-transparent" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end gap-6 md:gap-10 px-4 sm:px-6 md:px-12 pt-10 pb-12 md:pb-16 max-w-6xl">

          {/* Poster */}
          {movie.poster_path && (
            <div className="shrink-0 hidden md:block self-end">
              <div className="relative">
                <div className="absolute -inset-4 bg-red-600/20 blur-3xl rounded-3xl" />
                <img
                  src={`${POSTER}${movie.poster_path}`}
                  alt={movie.title}
                  className="relative w-44 lg:w-56 rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.9)] ring-1 ring-white/[0.18]"
                />
              </div>
            </div>
          )}

          {/* Info */}
          <div className="flex flex-col gap-4 w-full max-w-2xl pb-2">
            {/* Tagline */}
            {movie.tagline && (
              <p className="text-red-400/75 text-xs sm:text-sm font-medium italic tracking-wide border-l-2 border-red-500/40 pl-3">
                {movie.tagline}
              </p>
            )}

            {/* Title */}
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-black tracking-tight leading-[1.0] mb-1" style={{ textShadow: '0 2px 30px rgba(0,0,0,0.9)' }}>
                {movie.title}
              </h1>
              {movie.original_title && movie.original_title !== movie.title && (
                <p className="text-gray-400 text-sm font-medium">{movie.original_title}</p>
              )}
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2">
              {year    && <MetaBadge icon={BiCalendar}>{year}</MetaBadge>}
              {runtime && <MetaBadge icon={BiTime}>{runtime}</MetaBadge>}
              {movie.original_language && (
                <MetaBadge icon={BiGlobe}>{movie.original_language.toUpperCase()}</MetaBadge>
              )}
            </div>

            {/* Genre tags */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {genres.map((g, i) => <GenreTag key={g.id} index={i}>{g.name}</GenreTag>)}
              </div>
            )}

            {/* Overview */}
            {overview && (
              <div className="border-l-2 border-red-500/50 pl-4">
                <p className="text-gray-300 text-sm leading-7">{truncated}</p>
                {overview.length > 280 && (
                  <button
                    onClick={() => setShowOverview(p => !p)}
                    className="mt-2.5 text-red-400 hover:text-red-300 text-xs font-bold transition-colors"
                  >
                    {showOverview ? "Show less ↑" : "Read more ↓"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════ PRODUCTION META ══════ */}
      {(movie.production_companies?.length > 0 || movie.production_countries?.length > 0 || movie.status) && (
        <div className="px-3 sm:px-5 md:px-10 lg:px-16 pb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/[0.07]" />
            <h3 className="text-[11px] uppercase tracking-[0.22em] text-gray-500 font-bold">Details</h3>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>
          <div className="flex flex-wrap gap-3">
            {movie.production_companies?.length > 0 && (
              <MetaCard label="Studio" value={movie.production_companies.slice(0, 2).map(c => c.name).join(", ")} />
            )}
            {movie.production_countries?.length > 0 && (
              <MetaCard label="Country" value={movie.production_countries.map(c => c.name).join(", ")} />
            )}
            {movie.status && <MetaCard label="Status" value={movie.status} />}
            {movie.budget > 0 && (
              <MetaCard label="Budget" value={`$${(movie.budget / 1e6).toFixed(0)}M`} />
            )}
            {movie.revenue > 0 && (
              <MetaCard label="Box Office" value={`$${(movie.revenue / 1e6).toFixed(0)}M`} />
            )}
          </div>
        </div>
      )}

    </div>
  );
};

MovieDetails.propTypes = {
  movieId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default memo(MovieDetails);

