import { STORAGE_KEYS } from '../constants.js';

const listeners = new Set();

function read(key, fallback) {
    if (typeof window === 'undefined') return fallback;
    const raw = window.localStorage.getItem(key);
    return raw ?? fallback;
}

function write(key, value) {
    if (typeof window === 'undefined') return;
    if (value == null) {
        window.localStorage.removeItem(key);
    } else {
        window.localStorage.setItem(key, String(value));
    }
}

const state = {
    theme: read(STORAGE_KEYS.theme, 'light'), // 'light' | 'dark'
    lang: read(STORAGE_KEYS.lang, 'zh-TW'), // 'zh-TW' | 'en'
};

function notify() {
    const snapshot = settingsStore.getState();
    listeners.forEach((l) => l(snapshot));
}

export const settingsStore = {
    getState() {
        return { ...state };
    },
    subscribe(listener) {
        listeners.add(listener);
        listener(this.getState());
        return () => listeners.delete(listener);
    },
    setTheme(theme) {
        state.theme = theme;
        write(STORAGE_KEYS.theme, theme);
        notify();
    },
    toggleTheme() {
        const next = state.theme === 'dark' ? 'light' : 'dark';
        this.setTheme(next);
    },
    setLang(lang) {
        state.lang = lang;
        write(STORAGE_KEYS.lang, lang);
        notify();
    },
};
