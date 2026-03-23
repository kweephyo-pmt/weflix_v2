import React, { useState, memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { FaPlay, FaStar, FaPlus, FaCheck, FaTrash } from 'react-icons/fa';
import { useWatchlist } from '../../context/WatchlistContext';

const ContentCard = memo(({
  title,
  poster,
  rating,
  onClick = () => { },
  className = '',
  placeholderImage = '/placeholder.svg',
  releaseDate,
  // Watchlist props — optional
  mediaId,
  mediaType, // 'movie' | 'tv'
  posterPath,
  voteAverage,
  onNeedAuth,
  isWatchlistPage = false,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [wlLoading, setWlLoading] = useState(false);

  const { watchlistIds, toggleWatchlist, ready, user } = useWatchlist();

  // Instantly read from shared in-memory Set — no async, no flash
  const inWatchlist = ready && !!mediaId && watchlistIds.has(String(mediaId));

  const handleWatchlist = useCallback(async (e) => {
    e.stopPropagation();
    if (!user) {
      onNeedAuth?.();
      return;
    }
    if (!mediaId) return;
    setWlLoading(true);
    try {
      await toggleWatchlist({
        mediaId,
        type: mediaType || 'movie',
        title,
        poster_path: posterPath || null,
        vote_average: voteAverage || rating || 0,
        release_date: releaseDate || null,
      }, onNeedAuth);
    } finally {
      setWlLoading(false);
    }
  }, [user, mediaId, mediaType, title, posterPath, voteAverage, rating, releaseDate, onNeedAuth, toggleWatchlist]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  }, [onClick]);

  const src = imageError ? placeholderImage : poster;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const ratingNum = rating ? Math.round(rating * 10) : null;
  const ratingColor = rating >= 7 ? 'text-green-400' : rating >= 5 ? 'text-yellow-400' : 'text-red-400';
  const showWatchlistBtn = !!mediaId;

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`group relative w-full cursor-pointer rounded-xl overflow-hidden
        ring-1 ring-white/5 hover:ring-white/20 hover:shadow-2xl hover:shadow-black/60
        transition-shadow duration-200 ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={handleKeyPress}
      aria-label={`${title}${year ? ` (${year})` : ''}`}
    >
      {/* Poster */}
      <div className="relative w-full aspect-[2/3] bg-[#111827]">
        {/* Skeleton */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-white/5 to-white/[0.02]" />
        )}

        <img
          src={src}
          alt={title}
          loading="lazy"
          className={`w-full h-full object-cover transition-all duration-700 ease-out ${
            imageLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-md scale-105'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => { setImageError(true); setImageLoaded(true); }}
        />

        {/* Always-visible bottom gradient */}
        <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

        {/* Rating badge — top right */}
        {ratingNum && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm
            text-[11px] font-bold px-1.5 py-0.5 rounded-md">
            <FaStar className={`text-[9px] ${ratingColor}`} />
            <span className={ratingColor}>{ratingNum}%</span>
          </div>
        )}

        {/* Media-type badge — top left */}
        {mediaType && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm pointer-events-none">
            {mediaType === 'tv' ? 'SERIES' : 'MOVIE'}
          </div>
        )}

        {/* Hover overlay — Play + Watchlist */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
          {/* Play */}
          <div className="w-12 h-12 rounded-full bg-red-600 shadow-lg shadow-red-700/50 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-200">
            <FaPlay className="text-white text-sm ml-0.5" />
          </div>

          {/* Watchlist toggle */}
          {showWatchlistBtn && (
            <button
              onClick={handleWatchlist}
              title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              className={`w-12 h-12 rounded-full flex items-center justify-center
                transform scale-75 group-hover:scale-100 transition-all duration-200
                shadow-lg
                ${inWatchlist
                  ? (isWatchlistPage ? 'bg-black/60 hover:bg-red-600/90 border border-white/20 hover:border-red-500' : 'bg-red-600 shadow-red-700/50')
                  : 'bg-white/25 backdrop-blur-sm border border-white/30 hover:bg-white/35'
                }`}
            >
              {inWatchlist
                ? (isWatchlistPage ? <FaTrash className="text-white text-sm" /> : <FaCheck className="text-white text-sm" />)
                : <FaPlus className="text-white text-sm" />
              }
            </button>
          )}
        </div>
      </div>

      {/* Info below poster */}
      <div className="px-2.5 pt-2 pb-2.5 bg-[#0d1117]">
        <p className="text-white text-[13px] font-semibold leading-tight line-clamp-1">{title}</p>
        {(year || mediaType) && (
          <p className="text-gray-500 text-[11px] mt-0.5">
            {year}{year && mediaType && ' • '}{mediaType === 'tv' ? 'TV Show' : mediaType === 'movie' ? 'Movie' : ''}
          </p>
        )}
      </div>
    </motion.div>
  );
});

ContentCard.propTypes = {
  title: PropTypes.string.isRequired,
  poster: PropTypes.string,
  rating: PropTypes.number,
  onClick: PropTypes.func,
  className: PropTypes.string,
  placeholderImage: PropTypes.string,
  releaseDate: PropTypes.string,
  mediaId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  mediaType: PropTypes.oneOf(['movie', 'tv']),
  posterPath: PropTypes.string,
  voteAverage: PropTypes.number,
  onNeedAuth: PropTypes.func,
  isWatchlistPage: PropTypes.bool,
};

ContentCard.displayName = 'ContentCard';
export default ContentCard;
