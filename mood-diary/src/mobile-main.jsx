import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BookHeart,
  CalendarDays,
  LayoutGrid,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { api, toBackendDiaryPayload, toDiaryLike } from "@/lib/api";
import { MOODS, MOOD_EMOJI } from "@/lib/diary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import "./styles.css";

function AuthScreen() {
  const { t, lang, loginWithApi, registerWithApi, guestLoginWithApi } = useApp();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        await loginWithApi(email, password);
        toast.success(t("loginSuccess"));
      } else {
        await registerWithApi(name.trim() || email.split("@")[0], email, password);
        toast.success(t("signupSuccess"));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("error"));
    } finally {
      setBusy(false);
    }
  };

  const guestLogin = async () => {
    setBusy(true);
    try {
      await guestLoginWithApi();
      toast.success(lang === "zh" ? "訪客登入成功" : "Guest login success");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-dvh flex-col justify-center bg-background px-5 py-8">
      <section className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <BookHeart className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-semibold text-foreground">Mood Diary</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("tagline")}</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label>{t("username")}</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={32} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>{t("email")}</Label>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>{t("password")}</Label>
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            <LogIn className="h-4 w-4" />
            <span className="ml-1">{mode === "login" ? t("login") : t("signup")}</span>
          </Button>
          <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={guestLogin}>
            <UserRound className="h-4 w-4" />
            <span className="ml-1">{t("guestLogin")}</span>
          </Button>
          <button
            type="button"
            className="w-full text-center text-sm text-muted-foreground"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? t("noAccount") : t("haveAccount")}{" "}
            <span className="font-medium text-primary">{mode === "login" ? t("signup") : t("login")}</span>
          </button>
        </form>
      </section>
    </main>
  );
}

function DiaryForm({ existing, onCancel, onSaved }) {
  const { t, user } = useApp();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [content, setContent] = useState(existing?.content ?? "");
  const [mood, setMood] = useState(existing?.mood ?? "neutral");
  const [date, setDate] = useState(existing?.entry_date ?? new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user || saving) return;
    if (!title.trim()) {
      toast.error(t("title"));
      return;
    }

    setSaving(true);
    try {
      const payload = toBackendDiaryPayload({
        user_id: user.id,
        title: title.trim(),
        content,
        mood,
        entry_date: date,
        image_url: existing?.image_url ?? null,
      });
      const saved = existing ? await api.updateDiary(existing.id, payload) : await api.createDiary(payload);
      toast.success(t("saved"));
      onSaved(toDiaryLike(saved));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-background">
      <div className="mx-auto flex h-full max-w-2xl flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-display text-2xl font-semibold">{existing ? t("edit") : t("newEntry")}</h2>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-muted" onClick={onCancel} aria-label="close">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
          <div className="space-y-1.5">
            <Label>{t("title")}</Label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("mood")}</Label>
            <div className="grid grid-cols-7 gap-2">
              {MOODS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-xl border text-2xl",
                    mood === item ? "border-primary bg-primary/10" : "border-border bg-muted/40",
                  )}
                  onClick={() => setMood(item)}
                >
                  {MOOD_EMOJI[item]}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("date")}</Label>
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("content")}</Label>
            <Textarea rows={9} value={content} onChange={(event) => setContent(event.target.value)} />
          </div>
        </div>
        <footer className="flex gap-2 border-t border-border p-4">
          <Button variant="outline" className="flex-1" onClick={onCancel}>{t("cancel")}</Button>
          <Button className="flex-1" onClick={save} disabled={saving}>{t("save")}</Button>
        </footer>
      </div>
    </div>
  );
}

function DiaryDetail({ diary, onBack, onEdit, onDelete }) {
  const { t } = useApp();

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto max-w-2xl px-4 py-4 pb-24">
        <Button variant="ghost" size="sm" onClick={onBack}>{t("back")}</Button>
        <article className="mt-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>{diary.entry_date}</span>
            <span className="text-4xl leading-none">{MOOD_EMOJI[diary.mood] ?? MOOD_EMOJI.neutral}</span>
          </div>
          <h1 className="font-display text-3xl font-semibold text-foreground">{diary.title}</h1>
          <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-foreground/90">{diary.content || "-"}</p>
        </article>
      </div>
      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-2xl gap-2">
          <Button variant="outline" className="flex-1" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            <span className="ml-1">{t("edit")}</span>
          </Button>
          <Button variant="destructive" className="flex-1" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            <span className="ml-1">{t("delete")}</span>
          </Button>
        </div>
      </footer>
    </main>
  );
}

function DiaryList() {
  const { t, user, displayName, logoutWithApi } = useApp();
  const [diaries, setDiaries] = useState([]);
  const [query, setQuery] = useState("");
  const [view, setView] = useState("cards");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.listDiaries();
      setDiaries(data.map(toDiaryLike));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sorted = useMemo(
    () => [...diaries].sort((a, b) => b.entry_date.localeCompare(a.entry_date)),
    [diaries],
  );

  const filtered = useMemo(() => {
    const key = query.trim().toLowerCase();
    if (!key) return sorted;
    return sorted.filter((item) =>
      `${item.title} ${item.content} ${item.entry_date}`.toLowerCase().includes(key),
    );
  }, [query, sorted]);

  const saveLocalState = (savedDiary) => {
    setEditing(null);
    setSelected(savedDiary);
    load();
  };

  const deleteSelected = async () => {
    if (!selected || !confirm(t("confirmDelete"))) return;
    try {
      await api.deleteDiary(selected.id);
      toast.success(t("deleted"));
      setSelected(null);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("error"));
    }
  };

  if (selected) {
    return (
      <>
        <DiaryDetail
          diary={selected}
          onBack={() => setSelected(null)}
          onEdit={() => setEditing(selected)}
          onDelete={deleteSelected}
        />
        {editing && <DiaryForm existing={editing} onCancel={() => setEditing(null)} onSaved={saveLocalState} />}
      </>
    );
  }

  return (
    <main className="min-h-dvh bg-background pb-28">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{user?.role === "guest" ? t("guestUser") : displayName}</p>
            <h1 className="truncate font-display text-2xl font-semibold">Mood Diary</h1>
          </div>
          <Button variant="outline" size="icon" onClick={logoutWithApi} aria-label="logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-2xl space-y-4 px-4 py-4">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("search")}
          />
        </div>

        <div className="inline-flex overflow-hidden rounded-full bg-card shadow-sm ring-1 ring-border">
          <button onClick={() => setView("cards")} className={cn("flex items-center gap-1 px-4 py-2 text-xs", view === "cards" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
            <LayoutGrid className="h-4 w-4" />{t("cardView")}
          </button>
          <button onClick={() => setView("compact")} className={cn("flex items-center gap-1 px-4 py-2 text-xs", view === "compact" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
            <CalendarDays className="h-4 w-4" />{t("calendarView")}
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-border bg-card py-12 text-center text-sm text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card py-12 text-center text-sm text-muted-foreground">{t("noEntries")}</div>
        ) : (
          <div className={view === "compact" ? "space-y-2" : "space-y-3"}>
            {filtered.map((diary) => (
              <button
                key={diary.id}
                className={cn(
                  "w-full rounded-2xl border border-border bg-card p-4 text-left shadow-sm",
                  view === "compact" ? "flex items-center gap-3" : "block",
                )}
                onClick={() => setSelected(diary)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{MOOD_EMOJI[diary.mood] ?? MOOD_EMOJI.neutral}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="truncate text-base font-semibold text-foreground">{diary.title}</h2>
                      <span className="shrink-0 text-xs text-muted-foreground">{diary.entry_date}</span>
                    </div>
                    {view !== "compact" && (
                      <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm text-muted-foreground">{diary.content || "-"}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <button
        className="fixed bottom-5 right-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg"
        onClick={() => setEditing({})}
        aria-label="new entry"
      >
        <Plus className="h-7 w-7" />
      </button>

      {editing && !editing.id && <DiaryForm onCancel={() => setEditing(null)} onSaved={saveLocalState} />}
    </main>
  );
}

function MobileApp() {
  const { user, loading } = useApp();

  if (loading) {
    return <div className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground">Loading...</div>;
  }

  return user ? <DiaryList /> : <AuthScreen />;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProvider>
      <MobileApp />
      <Toaster richColors position="top-center" />
    </AppProvider>
  </React.StrictMode>,
);
