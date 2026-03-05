import React, {
  useEffect,
  useState,
  useCallback,
  memo,
  useRef,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { fetchSeriesDetails, fetchAllEpisodes } from "../Fetcher";
import { FaRedo, FaStar, FaArrowLeft, FaTv } from "react-icons/fa";
import { BiCalendar, BiGlobe, BiTv } from "react-icons/bi";
import Loadingspinner from "../resused/Loadingspinner";
import VideoPlayer from "./VideoPlayer";

const MemoizedVideoPlayer = memo(VideoPlayer);

const BACKDROP = "https://image.tmdb.org/t/p/original";
const POSTER   = "https://image.tmdb.org/t/p/w342";
const STILL    = "https://image.tmdb.org/t/p/w300";

const GENRE_COLORS = [
  "bg-red-500/15 border-red-500/30 text-red-300",
  "bg-violet-500/15 border-violet-500/30 text-violet-300",
  "bg-sky-500/15 border-sky-500/30 text-sky-300",
  "bg-amber-500/15 border-amber-500/30 text-amber-300",
];

const MetaBadge = ({ icon: Icon, children }) => (
  <span className="flex items-center gap-1.5 text-gray-400 text-sm">
    {Icon && <Icon className="text-gray-500 shrink-0 text-[13px]" />}
    {children}
  </span>
);

const MetaCard = ({ label, value }) => (
  <div className="flex flex-col gap-1.5 bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-3.5 min-w-[120px]">
    <p className="text-gray-500 text-[10px] uppercase tracking-[0.18em] font-semibold">{label}</p>
    <p className="text-gray-100 text-sm font-semibold leading-snug">{value}</p>
  </div>
);

const TvDetails = ({ tvId: tvIdProp }) => {
  const { slug } = useParams();
  const tvId = tvIdProp ?? parseInt(slug);
  const navigate = useNavigate();
  const [tv,             setTv]             = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [retrying,       setRetrying]       = useState(false);
  const [allSeasons,     setAllSeasons]     = useState([]);
  const [viewingSeason,  setViewingSeason]  = useState(null);
  const [playingSeason,  setPlayingSeason]  = useState(null);
  const [playingEpisode, setPlayingEpisode] = useState(null);
  const [showOverview,   setShowOverview]   = useState(false);

  const activeEpisodeRef = useRef(null);
  const episodeListRef   = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRetrying(true);
    try {
      const [seriesData, seasonsData] = await Promise.all([
        fetchSeriesDetails(tvId),
        fetchAllEpisodes(tvId),
      ]);
      setTv(seriesData);
      const filtered = (seasonsData ?? [])
        .filter(s => s.season_number > 0)
        .sort((a, b) => a.season_number - b.season_number);
      setAllSeasons(filtered);
      if (filtered.length > 0) {
        const first = filtered[0];
        const firstEp = first.episodes?.find(e => e.episode_number)?.episode_number ?? 1;
        setViewingSeason(first.season_number);
        setPlayingSeason(first.season_number);
        setPlayingEpisode(firstEp);
      }
    } catch {
      setError("Failed to load TV show details. Please try again.");
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, [tvId]);

  useEffect(() => {
    load();
    return () => {
      setTv(null); setAllSeasons([]);
      setViewingSeason(null); setPlayingSeason(null); setPlayingEpisode(null);
    };
  }, [load]);

  useEffect(() => {
    if (activeEpisodeRef.current && episodeListRef.current && viewingSeason === playingSeason) {
      activeEpisodeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [viewingSeason, playingSeason, playingEpisode]);

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

  if (!tv) return null;

  const rating   = tv.vote_average > 0 ? tv.vote_average.toFixed(1) : null;
  const year     = (tv.first_air_date ?? "").slice(0, 4);
  const genres   = (tv.genres ?? []).slice(0, 3).map(g => g.name).join(" · ");
  const overview = tv.overview ?? "";
  const truncated = overview.length > 240 && !showOverview
    ? overview.slice(0, 240) + "…"
    : overview;

  const currentSeasonData = allSeasons.find(s => s.season_number === viewingSeason);

  return (
    <div className="min-h-screen bg-[#0a0c12] text-white">

      {/* ── Back button ───────────────────────────── */}
      <div className="px-4 pt-5 md:px-12">
        <button
          onClick={() => navigate(-1)}
          className="group inline-flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.11] backdrop-blur-sm border border-white/[0.09] text-gray-400 hover:text-white text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200"
        >
          <FaArrowLeft className="text-xs group-hover:-translate-x-0.5 transition-transform duration-200" />
          <span>Back</span>
        </button>
      </div>

      {/* ── Video Player ──────────────────────────── */}
      <div className="px-3 sm:px-5 md:px-10 lg:px-16 pt-5 mb-6 md:mb-10">
        {/* Player header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30">
            <FaTv className="text-red-400 text-[11px]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-semibold mb-0.5">Now Playing</p>
            <h2 className="text-sm md:text-base font-bold text-white truncate leading-tight">
              {tv.name}
              {playingSeason !== null && playingEpisode !== null && (
                <span className="text-gray-500 font-normal"> · S{String(playingSeason).padStart(2,'0')}E{String(playingEpisode).padStart(2,'0')}</span>
              )}
            </h2>
          </div>
          {rating && (
            <div className="ml-auto flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-xl px-3 py-1.5 shrink-0">
              <FaStar className="text-yellow-400 text-[11px]" />
              <span className="text-yellow-300 font-bold text-sm">{rating}</span>
              <span className="text-gray-500 text-xs">/10</span>
            </div>
          )}
        </div>

        {/* Player frame */}
        <div className="w-full rounded-2xl overflow-hidden ring-1 ring-white/[0.08] shadow-[0_20px_80px_rgba(0,0,0,0.8)] bg-black relative">
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.05] pointer-events-none z-10" />
          <div className="w-full aspect-video bg-black">
            {playingSeason !== null && playingEpisode !== null ? (
              <MemoizedVideoPlayer
                tvId={tvId}
                season={playingSeason}
                episode={playingEpisode}
                title={tv.name}
                key={`${tvId}-${playingSeason}-${playingEpisode}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">
                Select an episode to start watching
              </div>
            )}
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

      {/* ── Episode Selector ─────────────────────── */}
      {allSeasons.length > 0 && (
        <div className="px-3 sm:px-5 md:px-10 lg:px-16 pb-8 md:pb-12">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.09]">
              <BiTv className="text-gray-400 text-sm" />
            </div>
            <h2 className="text-base md:text-lg font-bold">Episodes</h2>
          </div>

          {/* Season tabs */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-6">
            {allSeasons.map(season => (
              <button
                key={season.id ?? season.season_number}
                onClick={() => setViewingSeason(season.season_number)}
                className={`
                  relative shrink-0 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap
                  transition-all duration-150 focus:outline-none
                  ${viewingSeason === season.season_number
                    ? "bg-red-600/20 text-white ring-1 ring-red-500/50"
                    : "bg-white/[0.05] text-gray-400 hover:text-white hover:bg-white/[0.09]"
                  }
                `}
              >
                {playingSeason === season.season_number && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                )}
                Season {season.season_number}
              </button>
            ))}
          </div>

          {/* Episode cards */}
          {currentSeasonData?.episodes?.length > 0 ? (
            <div
              ref={episodeListRef}
              className="grid grid-flow-col auto-cols-[150px] sm:auto-cols-[168px] gap-3 overflow-x-auto hide-scrollbar pb-2"
            >
              {[...currentSeasonData.episodes]
                .sort((a, b) => a.episode_number - b.episode_number)
                .map(ep => {
                  const isPlaying = playingSeason === viewingSeason && playingEpisode === ep.episode_number;
                  return (
                    <button
                      ref={isPlaying ? activeEpisodeRef : null}
                      key={ep.id ?? ep.episode_number}
                      onClick={() => {
                        setPlayingSeason(currentSeasonData.season_number);
                        setPlayingEpisode(ep.episode_number);
                      }}
                      className={`
                        group relative flex flex-col rounded-xl overflow-hidden text-left
                        ring-1 transition-all duration-150 focus:outline-none shrink-0
                        ${isPlaying
                          ? "ring-red-500 bg-red-600/10"
                          : "ring-white/[0.07] bg-white/[0.03] hover:ring-white/20 hover:bg-white/[0.06]"
                        }
                      `}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-full aspect-video bg-[#111827]">
                        {ep.still_path ? (
                          <img
                            src={`${STILL}${ep.still_path}`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BiTv className="text-gray-700 text-2xl" />
                          </div>
                        )}
                        {/* Episode number badge */}
                        <span className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                          E{ep.episode_number}
                        </span>
                        {/* Playing indicator */}
                        {isPlaying && (
                          <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center">
                            <div className="w-7 h-7 rounded-full bg-red-600/80 flex items-center justify-center">
                              <span className="text-white text-[10px] ml-0.5">▶</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Episode info */}
                      <div className="px-2.5 py-2">
                        <p className={`text-xs font-semibold line-clamp-1 ${isPlaying ? "text-red-400" : "text-gray-200"}`}>
                          {ep.name || `Episode ${ep.episode_number}`}
                        </p>
                        {ep.runtime && (
                          <p className="text-gray-600 text-[10px] mt-0.5">{ep.runtime}m</p>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          ) : (
            <p className="text-gray-600 text-sm italic">No episodes available for this season.</p>
          )}
        </div>
      )}

      {/* ── Show details ─────────────────────────── */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: 460 }}>
        {/* Backdrop */}
        {tv.backdrop_path ? (
          <img
            src={`${BACKDROP}${tv.backdrop_path}`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-top scale-105"
            style={{ filter: "brightness(0.35) saturate(1.1)" }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#111827] to-[#0a0c12]" />
        )}
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c12] via-[#0a0c12]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c12] via-[#0a0c12]/50 to-transparent" />
        {/* Top fade from episode section */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#0a0c12] to-transparent" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end gap-6 md:gap-10 px-4 sm:px-6 md:px-12 pt-10 pb-12 md:pb-16 max-w-6xl">

          {/* Poster */}
          {tv.poster_path && (
            <div className="shrink-0 hidden md:block self-end">
              <div className="relative">
                <div className="absolute -inset-4 bg-red-600/10 blur-2xl rounded-3xl" />
                <img
                  src={`${POSTER}${tv.poster_path}`}
                  alt={tv.name}
                  className="relative w-44 lg:w-56 rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.9)] ring-1 ring-white/[0.12]"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 w-full max-w-2xl pb-2">
            {/* Tagline */}
            {tv.tagline && (
              <p className="text-red-400/75 text-xs sm:text-sm font-medium italic tracking-wide border-l-2 border-red-500/40 pl-3">
                {tv.tagline}
              </p>
            )}

            {/* Title */}
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-black tracking-tight leading-[1.0] mb-1">
                {tv.name}
              </h1>
              {tv.original_name && tv.original_name !== tv.name && (
                <p className="text-gray-500 text-sm font-medium">{tv.original_name}</p>
              )}
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {year && <MetaBadge icon={BiCalendar}>{year}</MetaBadge>}
              {allSeasons.length > 0 && (
                <MetaBadge icon={BiTv}>{allSeasons.length} Season{allSeasons.length !== 1 ? "s" : ""}</MetaBadge>
              )}
              {tv.original_language && (
                <MetaBadge icon={BiGlobe}>{tv.original_language.toUpperCase()}</MetaBadge>
              )}
            </div>

            {/* Genre chips */}
            {(tv.genres ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(tv.genres ?? []).slice(0, 4).map((g, i) => (
                  <span
                    key={g.id}
                    className={`border text-xs font-semibold px-3.5 py-1 rounded-full whitespace-nowrap ${
                      ["bg-red-500/15 border-red-500/30 text-red-300",
                       "bg-violet-500/15 border-violet-500/30 text-violet-300",
                       "bg-sky-500/15 border-sky-500/30 text-sky-300",
                       "bg-amber-500/15 border-amber-500/30 text-amber-300"][i % 4]
                    }`}
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Overview */}
            {overview && (
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3.5">
                <p className="text-gray-300 text-sm leading-relaxed">{truncated}</p>
                {overview.length > 240 && (
                  <button
                    onClick={() => setShowOverview(p => !p)}
                    className="mt-2 text-red-400 hover:text-red-300 text-xs font-semibold transition-colors"
                  >
                    {showOverview ? "Show less ↑" : "Show more ↓"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Details cards ────────────────────────── */}
      {(tv.networks?.length > 0 || tv.status) && (
        <div className="px-3 sm:px-5 md:px-10 lg:px-16 pb-20">
          <div className="border-t border-white/[0.05] pt-7 mb-5">
            <h3 className="text-xs uppercase tracking-[0.2em] text-gray-500 font-semibold">Details</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {tv.networks?.length > 0 && (
              <MetaCard label="Network" value={tv.networks.slice(0, 2).map(n => n.name).join(", ")} />
            )}
            {tv.status && <MetaCard label="Status" value={tv.status} />}
            {tv.type && <MetaCard label="Type" value={tv.type} />}
            {tv.production_countries?.length > 0 && (
              <MetaCard label="Country" value={tv.production_countries.map(c => c.name).join(", ")} />
            )}
          </div>
        </div>
      )}

    </div>
  );
};

TvDetails.propTypes = {
  tvId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default memo(TvDetails);
