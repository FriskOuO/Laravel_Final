import { STORAGE_KEYS } from '../constants.js';

const listeners = new Set();

function readJson(key) {
    if (typeof window === 'undefined') {
        return null;
    }

    const raw = window.localStorage.getItem(key);
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch {
        return raw;
    }
}

const state = {
    token: readJson(STORAGE_KEYS.token),
    currentUser: readJson(STORAGE_KEYS.user),
};

function persist() {
    if (typeof window === 'undefined') {
        return;
    }

    if (state.token) {
        window.localStorage.setItem(STORAGE_KEYS.token, JSON.stringify(state.token));
    } else {
        window.localStorage.removeItem(STORAGE_KEYS.token);
    }

    if (state.currentUser) {
        window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(state.currentUser));
    } else {
        window.localStorage.removeItem(STORAGE_KEYS.user);
    }
}

function notify() {
    const snapshot = authStore.getState();
    listeners.forEach((listener) => listener(snapshot));
}

export const authStore = {
    hydrate() {
        state.token = readJson(STORAGE_KEYS.token);
        state.currentUser = readJson(STORAGE_KEYS.user);
        notify();
        return this.getState();
    },

    getState() {
        return {
            token: state.token,
            currentUser: state.currentUser,
            isAuthenticated: Boolean(state.token),
        };
    },

    getToken() {
        return state.token;
    },

    subscribe(listener) {
        listeners.add(listener);
        listener(this.getState());
        return () => listeners.delete(listener);
    },

    setSession({ token, currentUser }) {
        state.token = token;
        state.currentUser = currentUser ?? null;
        persist();
        notify();
    },

    clearSession() {
        state.token = null;
        state.currentUser = null;
        persist();
        notify();
    },
};
