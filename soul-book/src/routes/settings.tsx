import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Sprout, Palette, Lock, Bell, User, Info, Globe, Moon, Sun } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="flex h-7 w-7 items-center justify-center text-muted-foreground">{icon}</div>
      <div className="flex-1 text-[15px] text-foreground">{label}</div>
      {value && <div className="text-sm text-muted-foreground">{value}</div>}
      <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
    </div>
  );
}

function SettingsPage() {
  const { t, lang, setLang, theme, toggleTheme, user, displayName } = useApp();
  const isGuest = user?.role === "guest";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-5 py-6">
        <div className="relative flex items-center justify-center py-2">
          <Link to="/" className="absolute left-0 rounded-full p-2 text-muted-foreground hover:bg-muted">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-display text-lg font-semibold">{t("settings")}</h1>
        </div>

        {/* Account card */}
        {user && (
          <div className="mt-8 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border/40">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-foreground">{displayName}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {isGuest ? t("guestUser") : user.email}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Language */}
        <div className="mt-6 rounded-3xl bg-card shadow-sm ring-1 ring-border/40">
          <button onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            className="flex w-full items-center gap-3 px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Globe className="h-4 w-4" />
            </div>
            <div className="flex-1 text-left text-[15px]">{t("appLanguage")}</div>
            <div className="text-sm text-muted-foreground">{lang === "zh" ? "繁體中文" : "English"}</div>
          </button>
        </div>

        <div className="mt-8 px-2 text-sm text-muted-foreground/80">{t("personalization")}</div>
        <div className="mt-3 divide-y divide-border/60 rounded-3xl bg-card shadow-sm ring-1 ring-border/40">
          <Row icon={<Sprout className="h-4 w-4 text-accent" />} label={t("diaryHeart")} />
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="flex h-7 w-7 items-center justify-center text-muted-foreground">
              {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </div>
            <div className="flex-1 text-[15px]">{t("theme")}</div>
            <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
          </div>
          <Row icon={<Lock className="h-4 w-4" />} label={t("lockScreen")} />
          <Row icon={<Bell className="h-4 w-4" />} label={t("notifications")} />
        </div>

        <div className="mt-8 px-2 text-sm text-muted-foreground/80">{t("other")}</div>
        <div className="mt-3 divide-y divide-border/60 rounded-3xl bg-card shadow-sm ring-1 ring-border/40">
          <Row icon={<Palette className="h-4 w-4" />} label={t("display")} />
          <Row icon={<Info className="h-4 w-4" />} label={t("appInfo")} />
        </div>
      </div>
    </div>
  );
}
