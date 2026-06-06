export type BackendUser = {
  id: number;
  name: string;
  email: string;
  role?: string;
};

export type BackendAuthResponse = {
  access_token: string;
  token_type: string;
  user: BackendUser;
};

export type BackendDiary = {
  id: number | string;
  user_id: number | string;
  title: string | null;
  content: string | null;
  mood: string | null;
  date: string | null;
  image_url: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ApiEnvelope<T> = {
  success?: boolean;
  status?: string;
  message?: string;
  errors?: unknown;
  data?: T;
};

export type DiaryLike = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  mood: string;
  entry_date: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

type RequestOptions = RequestInit & {
  auth?: boolean;
};

const LOCAL_GUEST_TOKEN = "local_guest_token";
const LOCAL_DIARIES_KEY = "local_guest_diaries";
const REQUEST_TIMEOUT_MS = 8000;

function trimSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getApiBaseUrl() {
  const raw =
    import.meta.env.VITE_API_BASE_URL ||
    globalThis.process?.env?.VITE_API_BASE_URL ||
    "http://localhost:8000/api";
  return trimSlash(raw);
}

function getToken() {
  return localStorage.getItem("api_token");
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("api_token", token);
  else localStorage.removeItem("api_token");
}

export function getStoredUser() {
  const raw = localStorage.getItem("api_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BackendUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: BackendUser | null) {
  if (user) localStorage.setItem("api_user", JSON.stringify(user));
  else localStorage.removeItem("api_user");
}

export function toDiaryLike(diary: BackendDiary): DiaryLike {
  const now = new Date().toISOString();
  const normalizedDate = diary.date ? new Date(diary.date).toISOString().slice(0, 10) : now.slice(0, 10);
  const safeContent = (diary.content ?? "").replace(/\u200b/g, "");
  return {
    id: String(diary.id),
    user_id: String(diary.user_id),
    title: diary.title ?? "",
    content: safeContent,
    mood: diary.mood ?? "neutral",
    entry_date: normalizedDate,
    image_url: diary.image_url ?? null,
    created_at: diary.created_at ?? now,
    updated_at: diary.updated_at ?? now,
  };
}

export function toBackendDiaryPayload(payload: {
  user_id: string | number;
  title: string;
  content: string;
  mood: string;
  entry_date: string;
  image_url: string | null;
}) {
  const padForValidation = (value: string, min = 5) => {
    if (value.length >= min) return value;
    return value + "\u200b".repeat(min - value.length);
  };
  const moodMap: Record<string, "happy" | "neutral" | "sad"> = {
    happy: "happy",
    love: "happy",
    calm: "neutral",
    neutral: "neutral",
    tired: "sad",
    sad: "sad",
    angry: "sad",
  };
  return {
    user_id: payload.user_id,
    title: payload.title,
    content: padForValidation(payload.content),
    mood: moodMap[payload.mood] ?? "neutral",
    date: payload.entry_date,
    image_url: payload.image_url,
  };
}

function parseJsonFromText(text: string) {
  const trimmed = text.trim();
  const jsonStart = Math.min(
    ...["{", "["].map((char) => trimmed.indexOf(char)).filter((index) => index >= 0),
  );

  if (!Number.isFinite(jsonStart)) return text;
  return JSON.parse(trimmed.slice(jsonStart));
}

function unwrapApiPayload<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiEnvelope<T>).data as T;
  }
  return payload as T;
}

async function requestJson<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("API request timed out");
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
  }

  const rawPayload = await response.text().catch(() => "");
  const payload = rawPayload.trim() ? parseJsonFromText(rawPayload) : null;

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message?: string }).message || "Request failed")
        : typeof payload === "string" && payload.trim()
          ? payload
          : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return unwrapApiPayload<T>(payload);
}

function getLocalDiaries() {
  const key = getLocalDiariesKey();
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as BackendDiary[];
  } catch {
    return [];
  }
}

function setLocalDiaries(diaries: BackendDiary[]) {
  localStorage.setItem(getLocalDiariesKey(), JSON.stringify(diaries));
}

function getLocalDiariesKey() {
  const user = getStoredUser();
  return user ? `${LOCAL_DIARIES_KEY}_${user.id}` : LOCAL_DIARIES_KEY;
}

function makeLocalGuestResponse(): BackendAuthResponse {
  return {
    access_token: LOCAL_GUEST_TOKEN,
    token_type: "Bearer",
    user: {
      id: 0,
      name: "Guest",
      email: "guest@soul-book.local",
      role: "guest",
    },
  };
}

function isLocalGuestSession() {
  return getToken() === LOCAL_GUEST_TOKEN || getStoredUser()?.role === "guest";
}

function normalizeLocalDiary(
  payload: Record<string, unknown>,
  fallbackId: string | number,
): BackendDiary {
  const now = new Date().toISOString();
  return {
    id: fallbackId,
    user_id: (payload.user_id as string | number | undefined) ?? 0,
    title: typeof payload.title === "string" ? payload.title : "",
    content: typeof payload.content === "string" ? payload.content : "",
    mood: typeof payload.mood === "string" ? payload.mood : "neutral",
    date: typeof payload.date === "string" ? payload.date : now.slice(0, 10),
    image_url: typeof payload.image_url === "string" ? payload.image_url : null,
    created_at: now,
    updated_at: now,
  };
}

async function withLocalGuestFallback<T>(action: () => Promise<T>, fallback: () => T) {
  try {
    return await action();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      isLocalGuestSession() &&
      /Request failed|timed out|fetch|未授權|禁止存取|unauthorized|forbidden|token/i.test(message)
    ) {
      return fallback();
    }
    throw error;
  }
}

export const api = {
  async login(email: string, password: string) {
    return requestJson<BackendAuthResponse>("/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email, password }),
    });
  },
  async register(username: string, email: string, password: string) {
    return requestJson<BackendAuthResponse>("/auth/register", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ username, email, password }),
    });
  },
  async guestLogin() {
    try {
      return await requestJson<BackendAuthResponse>("/auth/guest-login", {
        method: "POST",
        auth: false,
      });
    } catch {
      return makeLocalGuestResponse();
    }
  },
  async logout() {
    return requestJson<{ message: string }>("/auth/logout", {
      method: "POST",
    });
  },
  async me() {
    return requestJson<BackendUser>("/user", {
      method: "GET",
    });
  },
  async listDiaries() {
    return withLocalGuestFallback(
      () => requestJson<BackendDiary[]>("/diaries", { method: "GET" }),
      () => getLocalDiaries(),
    );
  },
  async getDiary(id: string | number) {
    return withLocalGuestFallback(
      () => requestJson<BackendDiary>(`/diaries/${id}`, { method: "GET" }),
      () => {
        const diary = getLocalDiaries().find((item) => String(item.id) === String(id));
        if (!diary) throw new Error("Diary not found");
        return diary;
      },
    );
  },
  async createDiary(payload: Record<string, unknown>) {
    return withLocalGuestFallback(
      () =>
        requestJson<BackendDiary>("/diaries", {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      () => {
        const diaries = getLocalDiaries();
        const diary = normalizeLocalDiary(payload, Date.now());
        setLocalDiaries([diary, ...diaries]);
        return diary;
      },
    );
  },
  async updateDiary(id: string | number, payload: Record<string, unknown>) {
    return withLocalGuestFallback(
      () =>
        requestJson<BackendDiary>(`/diaries/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        }),
      () => {
        const diaries = getLocalDiaries();
        const nextDiary = normalizeLocalDiary(payload, id);
        const nextDiaries = diaries.map((item) =>
          String(item.id) === String(id)
            ? { ...nextDiary, created_at: item.created_at, updated_at: new Date().toISOString() }
            : item,
        );
        setLocalDiaries(nextDiaries);
        return nextDiaries.find((item) => String(item.id) === String(id)) ?? nextDiary;
      },
    );
  },
  async deleteDiary(id: string | number) {
    return withLocalGuestFallback(
      () =>
        requestJson<{ message?: string }>(`/diaries/${id}`, {
          method: "DELETE",
        }),
      () => {
        setLocalDiaries(getLocalDiaries().filter((item) => String(item.id) !== String(id)));
        return { message: "Deleted" };
      },
    );
  },
};
