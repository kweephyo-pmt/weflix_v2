import { GENRES, SPECIAL_CATEGORIES } from './tmdb';

const SORT_SLUGS = {
  movie: {
    'popularity.desc': 'most-popular',
    'vote_average.desc': 'top-rated',
    'primary_release_date.desc': 'newest',
    'primary_release_date.asc': 'oldest',
    'revenue.desc': 'highest-grossing',
  },
  tv: {
    'popularity.desc': 'most-popular',
    'vote_average.desc': 'top-rated',
    'first_air_date.desc': 'newest',
    'first_air_date.asc': 'oldest',
  },
};

const DEFAULT_SORT = {
  movie: 'popularity.desc',
  tv: 'popularity.desc',
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const allByType = (type) => [...GENRES[type], ...SPECIAL_CATEGORIES[type]];

export const getCategoryById = (type, genreId) => {
  if (genreId == null) return null;
  return allByType(type).find((g) => g.id === genreId) || null;
};

export const getCategoryBySlug = (type, genreSlug) => {
  if (!genreSlug) return null;
  return allByType(type).find((g) => slugify(g.name) === genreSlug) || null;
};

export const getSortByFromSlug = (type, sortSlug) => {
  if (!sortSlug) return DEFAULT_SORT[type];
  const entries = Object.entries(SORT_SLUGS[type]);
  const found = entries.find(([, slug]) => slug === sortSlug);
  return found ? found[0] : DEFAULT_SORT[type];
};

export const getSortSlug = (type, sortBy) => SORT_SLUGS[type][sortBy] || SORT_SLUGS[type][DEFAULT_SORT[type]];

export const buildBrowsePath = (type, genreId = null, sortBy = DEFAULT_SORT[type]) => {
  const base = type === 'movie' ? '/movies' : '/series';
  const category = getCategoryById(type, genreId);

  if (!category) return base;

  const genreSlug = slugify(category.name);
  const isDefaultSort = sortBy === DEFAULT_SORT[type];

  if (isDefaultSort) return `${base}/${genreSlug}`;
  return `${base}/${genreSlug}/${getSortSlug(type, sortBy)}`;
};
