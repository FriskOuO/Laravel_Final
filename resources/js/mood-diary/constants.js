export const API_BASE_URL = 'http://localhost:8000/api';

export const STORAGE_KEYS = {
    token: 'mood-diary-token',
    user: 'mood-diary-user',
    theme: 'mood-diary-theme',
    lang: 'mood-diary-lang',
};

export const MOOD_META = {
    happy: {
        emoji: '🙂',
        label: 'Happy',
        chip: 'bg-amber-100 text-amber-900',
        gradient: 'from-amber-100 to-orange-100',
    },
    neutral: {
        emoji: '😐',
        label: 'Neutral',
        chip: 'bg-slate-100 text-slate-700',
        gradient: 'from-sky-100 to-cyan-100',
    },
    sad: {
        emoji: '😢',
        label: 'Sad',
        chip: 'bg-rose-100 text-rose-800',
        gradient: 'from-rose-100 to-pink-100',
    },
};
