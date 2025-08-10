// Utility helper module providing shared formatting and media URL resolution functions.
// Exported functions handle media path qualification and percentage formatting across components.

export const FIRE_CLASSES = ['fire', 'flame', 'smoke'];

export const mediaUrl = (baseApi, path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${baseApi}${path}`;
};

export const formatPercent = (value = 0) => `${Math.round(value * 100)}%`;
