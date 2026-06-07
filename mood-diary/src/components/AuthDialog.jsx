import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";
import { BookHeart, UserRound } from "lucide-react";

export function AuthDialog({ open, onOpenChange, defaultMode = "login" }) {
  const { t, lang, loginWithApi, registerWithApi, guestLoginWithApi } = useApp();
  const [mode, setMode] = useState(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "login") {
      try {
        await loginWithApi(email, password);
        toast.success(t("loginSuccess"));
        onOpenChange(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("error"));
      }
    } else {
      try {
        await registerWithApi(username.trim() || email.split("@")[0], email, password);
        toast.success(t("signupSuccess"));
        onOpenChange(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("error"));
      }
    }
    setBusy(false);
  };

  const guestLogin = async () => {
    setBusy(true);
    try {
      await guestLoginWithApi();
    } catch {
    } finally {
      setBusy(false);
    }
    toast.success(lang === "zh" ? "歡迎訪客！" : "Welcome, guest!");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mb-2 rounded-2xl bg-primary/10 p-3">
            <BookHeart className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="font-display text-2xl">
            {mode === "login" ? t("welcome") : t("createAccount")}
          </DialogTitle>
          <DialogDescription>{t("tagline")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label>{t("username")}</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t("enterUsername")} maxLength={32} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>{t("email")}</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("password")}</Label>
            <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {mode === "login" ? t("login") : t("signup")}
          </Button>
        </form>

        <div className="relative my-1">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">or</span></div>
        </div>

        <Button type="button" variant="outline" className="w-full" onClick={guestLogin} disabled={busy}>
          <UserRound className="h-4 w-4" />
          <span className="ml-1">{t("guestLogin")}</span>
        </Button>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "login" ? t("noAccount") : t("haveAccount")}{" "}
          <span className="font-medium text-primary">
            {mode === "login" ? t("signup") : t("login")}
          </span>
        </button>
      </DialogContent>
    </Dialog>
  );
}
