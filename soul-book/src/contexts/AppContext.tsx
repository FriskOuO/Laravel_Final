import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from "react";
import { api, getStoredUser, setStoredUser, setToken, type BackendUser } from "@/lib/api";
import { translations, type Lang, type TKey } from "@/lib/i18n";

type Theme = "light" | "dark";

interface AppContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: TKey) => string;
  theme: Theme;
  toggleTheme: () => void;
  user: BackendUser | null;
  loading: boolean;
  displayName: string;
  loginWithApi: (email: string, password: string) => Promise<void>;
  registerWithApi: (username: string, email: string, password: string) => Promise<void>;
  guestLoginWithApi: () => Promise<void>;
  logoutWithApi: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("zh");
  const [theme, setTheme] = useState<Theme>("light");
  const [user, setUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedLang = (localStorage.getItem("lang") as Lang) || "zh";
    const savedTheme = (localStorage.getItem("theme") as Theme) ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setLangState(savedLang);
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => { localStorage.setItem("lang", lang); }, [lang]);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setLoading(false);
  }, []);

  const t = (k: TKey) => translations[lang][k];

  const isGuest = user?.role === "guest";
  const displayName = isGuest
    ? translations[lang].guestUser
    : (user?.name || user?.email?.split("@")[0] || "");

  const handleSession = useCallback((token: string, backendUser: BackendUser) => {
    setToken(token);
    setStoredUser(backendUser);
    setUser(backendUser);
  }, []);

  const loginWithApi = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    handleSession(res.access_token, res.user);
  }, [handleSession]);

  const registerWithApi = useCallback(async (nextUsername: string, email: string, password: string) => {
    const res = await api.register(nextUsername, email, password);
    handleSession(res.access_token, res.user);
  }, [handleSession]);

  const guestLoginWithApi = useCallback(async () => {
    const res = await api.guestLogin();
    handleSession(res.access_token, res.user);
  }, [handleSession]);

  const logoutWithApi = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setToken(null);
      setStoredUser(null);
      setUser(null);
    }
  }, []);

  return (
    <AppContext.Provider value={{
      lang, setLang: setLangState, t,
      theme, toggleTheme: () => setTheme((p) => (p === "light" ? "dark" : "light")),
      user, loading,
      displayName,
      loginWithApi, registerWithApi, guestLoginWithApi, logoutWithApi,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const c = useContext(AppContext);
  if (!c) throw new Error("useApp must be inside AppProvider");
  return c;
}
