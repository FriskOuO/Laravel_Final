import { Link } from "@tanstack/react-router";
import { LogOut, MoonStar, SunMedium, Sprout } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AuthDialog } from "@/components/AuthDialog";

export function Header() {
  const { lang, setLang, t, user, logoutWithApi, theme, toggleTheme } = useApp();
  const [authOpen, setAuthOpen] = useState(false);

  const handleLogout = async () => {
    await logoutWithApi();
    toast.success(lang === "zh" ? "已登出" : "Signed out");
  };

  return (
    <header className="sticky top-0 z-30 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2">
          <Sprout className="h-5 w-5 text-accent" />
          <span className="font-display text-lg font-semibold tracking-tight">{t("appName")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={theme === "dark" ? t("light") : t("dark")}
          >
            {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Language"
          >
            {lang === "zh" ? "EN" : "中"}
          </button>
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-full">
              <LogOut className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">{t("logout")}</span>
            </Button>
          ) : (
            <Button size="sm" onClick={() => setAuthOpen(true)} className="rounded-full px-4">
              {t("login")}
            </Button>
          )}
        </div>
      </div>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </header>
  );
}
