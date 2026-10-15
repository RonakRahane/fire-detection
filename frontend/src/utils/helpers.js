export const FIRE_CLASSES = ['fire', 'flame', 'smoke'];

export const CONSOLE_VIEWS = ['live', 'upload', 'history'];

export const consoleViewFromUrl = () => {
  const view = new URLSearchParams(window.location.search).get('view');
  return CONSOLE_VIEWS.includes(view) ? view : null;
};

export const defaultApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  }
  return window.location.hostname.includes('ngrok') || window.location.port === '8000'
    ? window.location.origin
    : 'http://localhost:8000';
};

export const mediaUrl = (baseApi, path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${baseApi}${path}`;
};

export const formatPercent = (value = 0) => `${Math.round(value * 100)}%`;
