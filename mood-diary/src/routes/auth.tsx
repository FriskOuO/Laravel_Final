import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookHeart } from "lucide-react";
import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const { t, user, loginWithApi, registerWithApi } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) navigate({ to: "/" }); }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "login") {
      try {
        await loginWithApi(email, password);
        toast.success(t("loginSuccess"));
        navigate({ to: "/" });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("error"));
      }
    } else {
      try {
        await registerWithApi(email.split("@")[0], email, password);
        toast.success(t("signupSuccess"));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("error"));
      }
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-12">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 rounded-2xl bg-primary/10 p-3">
            <BookHeart className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-semibold">
            {mode === "login" ? t("welcome") : t("createAccount")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("tagline")}</p>
        </div>

        <form onSubmit={submit} className="w-full space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
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
        </form>
      </main>
    </div>
  );
}
