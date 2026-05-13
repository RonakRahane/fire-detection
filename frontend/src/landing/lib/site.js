import { defaultApiUrl } from '@/utils/helpers';

export const site = {
  name: 'FireCatch',
  tagline: 'Real-Time Fire & Smoke Detection',
  description:
    'FireCatch detects flames and smoke in real time from standard camera feeds. Multi-layer filtering significantly reduces false alarms, and instant photo and video evidence is saved automatically.',
  summary:
    'Turn standard cameras into 24/7 automated fire monitors. Spot flames and smoke in milliseconds, filter out false alarms, and record instant visual proof.',
  apiUrl: defaultApiUrl(),
  repoUrl: 'https://github.com/RonakRahane/fire-detection',
};

export const consoleLink = (view) => `/?view=${view}`;

export const chapters = [
  { id: 'introduction', title: 'Overview', index: 'Overview' },
  { id: 'detect', title: 'Live Detection', index: '01 / Detection' },
  { id: 'verify', title: 'Smart Filtering', index: '02 / Filtering' },
  { id: 'capture', title: 'Incident Evidence', index: '03 / Evidence' },
];
