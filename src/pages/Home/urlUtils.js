/**
 * Convert a title string into a URL-safe slug.
 * e.g. "Fight Club" -> "fight-club"
 */
export function toSlug(title = '') {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // remove special chars
    .trim()
    .replace(/\s+/g, '-')           // spaces → hyphens
    .replace(/-+/g, '-');           // collapse multiple hyphens
}

/**
 * Build a detail page path with a human-readable slug.
 * e.g. toDetailPath('movie', 550, 'Fight Club') -> '/movies/watch/fight-club-550'
 */
export function toDetailPath(type, id, title) {
  const section = type === 'tv' ? 'series' : 'movies';
  const slug = toSlug(title);
  return slug ? `/${section}/watch/${slug}-${id}` : `/${section}/watch/${id}`;
}

/**
 * Extract numeric TMDB ID from either slug style:
 * - legacy: '550-fight-club'
 * - canonical: 'fight-club-550'
 * - bare id: '550'
 */
export function getIdFromDetailSlug(slug = '') {
  if (!slug) return null;
  if (/^\d+$/.test(slug)) return Number(slug);

  const startsWithId = slug.match(/^(\d+)-/);
  if (startsWithId) return Number(startsWithId[1]);

  const endsWithId = slug.match(/-(\d+)$/);
  if (endsWithId) return Number(endsWithId[1]);

  return null;
}
